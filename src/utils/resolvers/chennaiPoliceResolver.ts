import { booleanPointInPolygon, distance, centroid } from '@turf/turf';
import type { 
  GisFeature, 
  GisFeatureCollection, 
  Point, 
  Polygon, 
  MultiPolygon,
  PoliceBoundaryProperties, 
  PoliceStationProperties,
  ChennaiPoliceResolutionResult,
  Position
} from '../../types/gis';

/**
 * Extracts police station code (e.g. R1, K10, J3) from Chennai naming patterns
 * Pattern: 1-2 letters + 1-3 digits
 */
export const extractChennaiCode = (name: string | undefined | null): string | null => {
  if (!name) return null;
  // Match 1-2 letters, optional hyphen/dot/space, followed by 1-3 digits
  const match = name.match(/\b([A-Z]{1,2})[\s.\-]*(\d{1,3})\b/i);
  return match ? (match[1] + match[2]).toUpperCase() : null;
};

/**
 * Normalizes station names for fuzzy matching
 */
export const normalizeStationName = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toString()
    .toLowerCase()
    .replace(/[.\-_]/g, ' ') // dots, hyphens, underscores to space
    .replace(/[^a-z0-9\s]/g, '') // remove other punctuation
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
};

/**
 * Scores a potential match between a station point and a boundary feature
 */
export const scoreChennaiMatch = (
  pCoords: Position,
  pCode: string | null,
  pNameNorm: string,
  bFeature: GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>
): { score: number; matchType: string; isInside: boolean; distanceKm: number } => {
  const bProps = bFeature.properties;
  const bCode = (bProps.police_s_1 || '').toString().toUpperCase();
  const bNameNorm = normalizeStationName(bProps.police_s_2 || bProps.police_sta || '');
  
  // Turf expects Feature, but we often pass geometry. Wrap if needed.
  const isInside = bFeature.geometry ? booleanPointInPolygon(pCoords, bFeature as any) : false;
  const distKm = (isInside || !bFeature.geometry) ? 0 : distance(pCoords, centroid(bFeature as any));

  const codeMatch = pCode && bCode && pCode === bCode;
  const namesMatch = pNameNorm && bNameNorm && (pNameNorm.includes(bNameNorm) || bNameNorm.includes(pNameNorm));

  let score = 0;
  let matchType = 'Unresolved';

  if (codeMatch && namesMatch && isInside) {
    score = 100; matchType = 'Code+Name+Spatial';
  } else if (codeMatch && namesMatch) {
    score = 95; matchType = 'Code+Name';
  } else if (codeMatch && isInside) {
    score = 90; matchType = 'Code+Spatial';
  } else if (codeMatch) {
    score = 75; matchType = 'Code Only';
  } else if (namesMatch && isInside) {
    score = 70; matchType = 'Name+Spatial';
  } else if (isInside) {
    score = 60; matchType = 'Spatial Only';
  }

  return { score, matchType, isInside, distanceKm: distKm };
};

/**
 * Production-ready Chennai Police Resolver
 */
export const resolveChennaiPolice = (
  clickPoint: Position,
  stations: GisFeatureCollection<Point, PoliceStationProperties>,
  boundaries: GisFeatureCollection<Polygon | MultiPolygon, PoliceBoundaryProperties>,
  isDistrictChennai: boolean
): ChennaiPoliceResolutionResult | null => {
  if (!isDistrictChennai) return null;

  // 1. Find the boundary containing the click point
  const clickedBoundary = boundaries.features.find(b => {
    if (!b.geometry) return false;
    try {
      return booleanPointInPolygon(clickPoint, b as any);
    } catch (e) {
      console.warn('[ChennaiResolver] Failed to check spatial containment', e, b);
      return false;
    }
  });
  
  if (!clickedBoundary) {
    // 2. Nearest fallback if click is outside all known polygons
    let minDist = Infinity;
    let nearestB = null;
    for (const b of boundaries.features) {
      if (!b.geometry) continue;
      try {
        const d = distance(clickPoint, centroid(b as any));
        if (d < minDist) {
          minDist = d;
          nearestB = b;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (nearestB && minDist < 2) { // 2km tolerance for "near miss" clicks
       return resolveForBoundary(nearestB, stations, 50, 'Nearest Polygon Fallback (Clicked Outside)');
    }
    return null;
  }

  return resolveForBoundary(clickedBoundary, stations);
};

function resolveForBoundary(
  boundary: GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
  stations: GisFeatureCollection<Point, PoliceStationProperties>,
  initialScore: number = 0,
  initialType: string = ''
): ChennaiPoliceResolutionResult {
  const bProps = boundary.properties;
  const bCode = (bProps.police_s_1 || '').toString().toUpperCase();

  let primaryStation: GisFeature<Point, PoliceStationProperties> | null = null;
  let relatedStations: GisFeature<Point, PoliceStationProperties>[] = [];
  let maxScore = initialScore;
  let finalMatchType = initialType;
  let finalIsInside = false;
  let finalDist = 0;
  const warnings: string[] = [];

  for (const s of stations.features) {
    const sProps = s.properties;
    const sCoords = s.geometry.coordinates as Position;
    const sCode = extractChennaiCode(sProps.ps_name || sProps.name);
    const sNameNorm = normalizeStationName(sProps.ps_name || sProps.name);

    const { score, matchType, isInside, distanceKm } = scoreChennaiMatch(sCoords, sCode, sNameNorm, boundary);

    // Coordinate drift tolerance: exact code match but point outside up to 2km
    let currentScore = score;
    let currentType = matchType;
    if (sCode && bCode && sCode === bCode && !isInside && distanceKm < 2) {
      currentScore = 85; 
      currentType = 'Code Match (Drifted)';
      warnings.push(`Station ${sCode} coordinate drift detected: ${distanceKm.toFixed(2)}km`);
    }

    if (currentScore >= 60 || currentScore === 85) {
      if (currentScore > maxScore) {
        if (primaryStation) relatedStations.push(primaryStation);
        maxScore = currentScore;
        primaryStation = s;
        finalMatchType = currentType;
        finalIsInside = isInside;
        finalDist = distanceKm;
      } else if (currentScore >= 60) {
        relatedStations.push(s);
      }
    }
  }

  // Handle "swapped" code edge case (e.g. K10 point in K11 boundary)
  // If we have a Spatial Only match but it has a different code, we keep it but warn
  if (finalMatchType === 'Spatial Only' && primaryStation) {
    const sCode = extractChennaiCode(primaryStation.properties.ps_name || primaryStation.properties.name);
    if (sCode && bCode && sCode !== bCode) {
      warnings.push(`Station code mismatch: Point has ${sCode}, Boundary has ${bCode}. Association made via spatial overlap.`);
    }
  }

  // Unresolved logging
  if (maxScore < 70 && maxScore > 0) {
    console.debug(`[ChennaiResolver] Low confidence match: ${maxScore}`, { 
      boundary: bProps.police_sta, 
      matchType: finalMatchType,
      warnings
    });
  }

  return {
    stationCode: primaryStation ? extractChennaiCode(primaryStation.properties.ps_name) : bCode,
    stationName: primaryStation ? (primaryStation.properties.ps_name || primaryStation.properties.name) : bProps.police_sta,
    matchedBoundary: boundary,
    confidence: maxScore,
    matchType: finalMatchType,
    insidePolygon: finalIsInside,
    distanceKm: finalDist,
    warnings,
    primaryStation,
    relatedStations
  };
}
