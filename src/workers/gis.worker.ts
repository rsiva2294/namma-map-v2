import * as topojson from 'topojson-client';
import RBush from 'rbush';
import type { 
  GisFeature, 
  GisFeatureCollection, 
  Geometry,
  Position,
  Point,
  Polygon,
  MultiPolygon,
  PoliceBoundaryProperties,
  PoliceStationProperties,
  PoliceResolutionResult,
  PoliceMatchConfidence,
  PoliceMatchDebug
} from '../types/gis';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: GisFeature;
}

interface ProcessedStationProperties extends PoliceStationProperties {
  resolved_code?: string;
  resolved_name?: string;
  normalized_key?: string;
}

let policeCrosswalk: Record<string, string> | null = null;

interface DistrictIdentity {
  id: string;
  display_name: string;
  pds_file: string;
  aliases: string[];
}

let pdsManifest: DistrictIdentity[] | null = null;

/**
 * Resolves a raw district string to a canonical district identity using the manifest.
 */
const resolveDistrictIdentity = (rawName: string): DistrictIdentity | null => {
  if (!rawName || !pdsManifest) return null;

  const normalized = rawName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/\s+/g, '');

  // 1. Try exact alias match
  const match = pdsManifest.find(d => 
    d.aliases.some(alias => alias.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized)
  );

  if (match) return match;

  // 2. Try partial match if no exact match found
  return pdsManifest.find(d => 
    d.id.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized ||
    d.display_name.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized
  ) || null;
};

let districtsGeoJson: GisFeatureCollection | null = null;
let stateBoundaryGeoJson: GisFeatureCollection | null = null;
let pdsIndex: [string, string, string, string, number, number][] | null = null;
let pincodesGeoJson: GisFeatureCollection | null = null;
let tnebGeoJson: GisFeatureCollection | null = null;
let tnebOffices: GisFeatureCollection | null = null;
let acGeoJson: GisFeatureCollection | null = null;
let pcGeoJson: GisFeatureCollection | null = null;
let policeBoundariesGeoJson: GisFeatureCollection | null = null;
let policeStationsGeoJson: GisFeatureCollection | null = null;
const loadedPds: Map<string, GisFeatureCollection> = new Map();

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`[Worker] Fetch failed for ${url}, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Fetch failed after retries');
}

/**
 * Advanced normalization for police station names and codes
 */
const normalizePoliceName = (str: string | number | undefined | null): string => {
  if (!str) return '';
  return str.toString()
    .toUpperCase()
    .replace(/\./g, ' ')           // Replace dots with spaces
    .replace(/-/g, ' ')           // Replace hyphens with spaces
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/\//g, ' ')           // Replace slashes
    .replace(/,/g, ' ')           // Replace commas
    .replace(/\s+/g, ' ')         // Collapse multiple spaces
    .trim()
    .replace(/TCH/g, 'CH')        // Handle common spelling drift
    .replace(/POLICE STATION/g, 'PS')
    .replace(/P S/g, 'PS')
    .replace(/\sPS$/g, '')         // Strip PS suffix
    .replace(/[^A-Z0-9\s]/g, '')  // Keep spaces for token comparison
    .trim();
};

/**
 * Strips code prefixes like "B1 " or "R3." from names
 */
const stripCodePrefix = (name: string): string => {
  return name.replace(/^[A-Z]+\d+[\s.]*/i, '').trim();
};

/**
 * Extracts police station code (e.g. R3, J2, P48) from a string
 */
const extractPoliceCode = (str: string | undefined | null): string => {
  if (!str) return '';
  const normalized = str.toString().toUpperCase().trim();
  const match = normalized.match(/^[A-Z]+\d+/);
  return match ? match[0] : '';
};

/**
 * Calculates string overlap/similarity score (0 to 1)
 */
const getAliasStrength = (a: string, b: string): number => {
  const normA = normalizePoliceName(a);
  const normB = normalizePoliceName(b);
  
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;
  
  const cleanA = normA.replace(/\s/g, '');
  const cleanB = normB.replace(/\s/g, '');
  if (cleanA === cleanB) return 0.95;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return 0.8;
  
  // Word-based overlap
  const wordsA = normA.split(' ').filter(w => w.length > 2);
  const wordsB = normB.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  
  let intersection = 0;
  const setB = new Set(wordsB);
  wordsA.forEach(w => { if (setB.has(w)) intersection++; });
  return intersection / Math.max(wordsA.length, wordsB.length);
};

const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

const getCentroid = (geometry: Geometry): Position => {
  if (geometry.type === 'Point') return geometry.coordinates as Position;
  const bbox = getBBox(geometry);
  return [(bbox.minX + bbox.maxX) / 2, (bbox.minY + bbox.maxY) / 2];
};

/**
 * Resolves the best matching police station for a given boundary using a layered confidence pipeline
 */
function resolvePoliceStation(
  boundary: GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>, 
  stations: GisFeatureCollection<Point, PoliceStationProperties>, 
  clickPoint?: Position
): PoliceResolutionResult {
  const bProps = boundary.properties;
  const bId = (bProps.ciprus_loc || `${bProps.district_n}_${bProps.police_s_1}_${normalizePoliceName(bProps.police_sta)}`).toString();
  const bCode = (bProps.police_s_1 || '').toString().trim().toUpperCase();
  const bAliases = [bProps.police_sta, bProps.police_s_2].filter(Boolean).map(a => a!.toString());
  const bDistrict = bProps.district_n || '';
  const bCentroid = getCentroid(boundary.geometry);

  const debug: PoliceMatchDebug = {
    boundaryId: bId,
    boundaryCode: bCode,
    boundaryAliases: bAliases,
    codeMatch: false,
    aliasMatchStrength: 0,
    isInsideBoundary: false,
    distanceToClick: clickPoint ? getDistance(clickPoint, bCentroid) : 0,
    distanceToCentroid: 0,
    overrideUsed: false,
    confidence: 'unresolved',
    reason: 'Initial state',
    method: 'metadata'
  };

  // 1. Manual override check
  if (policeCrosswalk && policeCrosswalk[bId]) {
    const targetCode = policeCrosswalk[bId];
    const match = stations.features.find(s => s.properties.ps_code === targetCode);
    if (match) {
      return {
        boundary,
        station: match,
        confidence: 'exact',
        reason: 'Manual crosswalk override',
        debug: { ...debug, confidence: 'exact', reason: 'Manual crosswalk override', method: 'override', stationCode: targetCode, overrideUsed: true }
      };
    }
  }

  let bestStation: GisFeature<Point, PoliceStationProperties> | null = null;
  let bestScore = -1;
  let bestDebug: PoliceMatchDebug = { ...debug };

  for (const s of stations.features) {
    const sProps = s.properties as ProcessedStationProperties;
    const sRawName = sProps.ps_name || sProps.name || '';
    const inferredCode = extractPoliceCode(sRawName);
    const sCode = (sProps.ps_code || inferredCode).toString().trim().toUpperCase();
    const sAliases = [sProps.ps_name, sProps.name].filter(Boolean).map(a => a!.toString());
    const sCoords = s.geometry.coordinates as Position;
    
    // Normalize aliases for comparison
    const cleanSAliases = sAliases.map(stripCodePrefix);
    const cleanBAliases = bAliases.map(stripCodePrefix);

    // Scoring components
    const codeMatch = !!(bCode && sCode && bCode === sCode);
    
    let maxAliasMatch = 0;
    let bothAliasesMatch = false;
    if (cleanBAliases.length > 1) {
       const m1 = Math.max(...cleanSAliases.map(sa => getAliasStrength(cleanBAliases[0], sa)));
       const m2 = Math.max(...cleanSAliases.map(sa => getAliasStrength(cleanBAliases[1], sa)));
       maxAliasMatch = Math.max(m1, m2);
       bothAliasesMatch = m1 > 0.8 && m2 > 0.8;
    } else if (cleanBAliases.length > 0) {
       maxAliasMatch = Math.max(...cleanSAliases.map(sa => getAliasStrength(cleanBAliases[0], sa)));
    }

    const isInside = (boundary.geometry.type === 'Polygon') 
      ? isPointInPolygon(sCoords, (boundary.geometry as Polygon).coordinates)
      : (boundary.geometry as MultiPolygon).coordinates.some(poly => isPointInPolygon(sCoords, poly));

    const distToCentroid = getDistance(sCoords, bCentroid);
    const distToClick = clickPoint ? getDistance(sCoords, clickPoint) : distToCentroid;

    // Optional enrichment (Admin match)
    const districtMatch = sProps.district && bDistrict && normalizePoliceName(sProps.district) === normalizePoliceName(bDistrict);

    // Resolution Logic
    let currentConfidence: PoliceMatchConfidence = 'unresolved';
    let currentReason = '';
    let currentScore = 0;

    if (codeMatch && maxAliasMatch > 0.9) {
      currentConfidence = 'exact';
      currentReason = 'Exact code and strong alias agreement';
      currentScore = 100 + (bothAliasesMatch ? 5 : 0);
    } else if (maxAliasMatch > 0.85) {
      currentConfidence = 'high';
      currentReason = 'Strong alias match';
      currentScore = 80 + (isInside ? 5 : 0) + (districtMatch ? 5 : 0) + (codeMatch ? 5 : 0);
    } else if (codeMatch && maxAliasMatch > 0.5) {
      currentConfidence = 'medium';
      currentReason = 'Code match with moderate alias match';
      currentScore = 60 + (isInside ? 10 : 0);
    } else if (maxAliasMatch > 0.6 && isInside) {
      currentConfidence = 'medium';
      currentReason = 'Alias match with spatial validation';
      currentScore = 55 + (maxAliasMatch * 20);
    } else if (isInside) {
      currentConfidence = 'low';
      currentReason = 'Spatial fallback (station point inside boundary)';
      currentScore = 30 + (maxAliasMatch * 10);
    } else if (maxAliasMatch > 0.4) {
      currentConfidence = 'low';
      currentReason = 'Weak metadata match fallback';
      currentScore = 20 + (maxAliasMatch * 10);
    }

    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestStation = s;
      bestDebug = {
        boundaryId: bId,
        boundaryCode: bCode,
        boundaryAliases: bAliases,
        stationCode: sCode,
        stationAliases: sAliases,
        inferredStationCode: inferredCode,
        codeMatch,
        aliasMatchStrength: maxAliasMatch,
        isInsideBoundary: isInside,
        distanceToClick: distToClick,
        distanceToCentroid: distToCentroid,
        overrideUsed: false,
        confidence: currentConfidence,
        reason: currentReason,
        method: 'layered-resolver'
      };
    } else if (currentScore === bestScore && currentScore > 0) {
      // Tie-breaker: Spatial proximity
      if (distToCentroid < bestDebug.distanceToCentroid) {
        bestStation = s;
        bestDebug = { ...bestDebug, distanceToCentroid: distToCentroid, distanceToClick: distToClick, stationCode: sCode, stationAliases: sAliases, inferredStationCode: inferredCode };
      }
    }
  }

  // Handle final unresolved or low-confidence fallback
  if (!bestStation || bestScore < 30) {
     // Check if we can find nearest as last resort
     let nearest = null;
     let minD = Infinity;
     for (const s of stations.features) {
       const d = getDistance(s.geometry.coordinates as Position, bCentroid);
       if (d < minD) { minD = d; nearest = s; }
     }
     if (nearest && minD < 0.15) {
        return {
          boundary, station: nearest, confidence: 'low',
          reason: 'Nearest station fallback (no strong metadata match)',
          debug: { ...debug, confidence: 'low', reason: 'Nearest spatial fallback', method: 'spatial-fallback', stationCode: nearest.properties.ps_code, distanceToCentroid: minD }
        };
     }
  }

  return {
    boundary,
    station: bestStation,
    confidence: bestStation ? bestDebug.confidence : 'unresolved',
    reason: bestStation ? bestDebug.reason : 'No matching station found',
    debug: bestDebug
  };
}


// R-trees for spatial indexing
const pincodesIndex = new RBush<SpatialItem>();
const tnebIndex = new RBush<SpatialItem>();
const stateBoundaryIndex = new RBush<SpatialItem>();
const acIndex = new RBush<SpatialItem>();
const pcIndex = new RBush<SpatialItem>();
const policeBoundariesIndex = new RBush<SpatialItem>();
const policeStationsIndex = new RBush<SpatialItem>();
const pdsIndexes = new Map<string, RBush<SpatialItem>>();

function getBBox(geometry: Geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  if (!geometry || !geometry.coordinates) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const processCoords = (coords: unknown) => {
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      const [x, y] = coords as [number, number];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else if (Array.isArray(coords)) {
      coords.forEach(processCoords);
    }
  };

  processCoords(geometry.coordinates);
  
  // If no valid coordinates found, return a zero bbox instead of Inifinity
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  
  return { minX, minY, maxX, maxY };
}

function isPointInPolygon(point: [number, number], vs: [number, number][][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0; i < vs.length; i++) {
    const ring = vs[i];
    if (!ring || ring.length < 3) continue;
    for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) {
      const xi = ring[j][0], yi = ring[j][1];
      const xj = ring[k][0], yj = ring[k][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

function findFeatureAt(point: [number, number], index: RBush<SpatialItem>) {
  const [lng, lat] = point;
  // Use a tiny buffer to avoid precision issues at edges
  const buffer = 0.00001;
  const candidates = index.search({ 
    minX: lng - buffer, 
    minY: lat - buffer, 
    maxX: lng + buffer, 
    maxY: lat + buffer 
  });
  
  const foundItem = candidates.find(item => {
    const geometry = item.feature.geometry;
    if (!geometry) return false;
    if (geometry.type === 'Polygon') return isPointInPolygon([lng, lat], (geometry as Polygon).coordinates);
    if (geometry.type === 'MultiPolygon') return (geometry as MultiPolygon).coordinates.some((poly: Position[][]) => isPointInPolygon([lng, lat], poly));
    return false;
  });

  return foundItem ? foundItem.feature : null;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT_DB':
      self.postMessage({ type: 'READY' });
      break;
    
    case 'LOAD_DISTRICTS':
      try {
        if (!districtsGeoJson) {
          const response = await fetchWithRetry('/data/tn_districts.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          districtsGeoJson = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection', features: [feature as GisFeature] };
        }
        self.postMessage({ type: 'DISTRICTS_LOADED', payload: districtsGeoJson });
      } catch (err) {
        console.error('[Worker] Error loading districts:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load district data' });
      }
      break;

    case 'LOAD_STATE_BOUNDARY':
      try {
        if (!stateBoundaryGeoJson) {
          const response = await fetchWithRetry('/data/tn_state_boundary.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown;
          if (feature && typeof feature === 'object' && 'type' in feature && feature.type === 'FeatureCollection') {
            stateBoundaryGeoJson = feature as GisFeatureCollection;
          } else {
            stateBoundaryGeoJson = { type: 'FeatureCollection', features: [feature as GisFeature] };
          }
          
          // Indexing with safety filters
          const items: SpatialItem[] = stateBoundaryGeoJson!.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          stateBoundaryIndex.load(items);
        }
        self.postMessage({ type: 'STATE_BOUNDARY_LOADED', payload: stateBoundaryGeoJson });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load state boundary: ${message}` });
      }
      break;

    case 'LOAD_PDS_INDEX':
      try {
        const [resIndex, resManifest] = await Promise.all([
          !pdsIndex ? fetchWithRetry('/data/pds_index.json') : Promise.resolve(null),
          !pdsManifest ? fetchWithRetry('/data/pds_manifest.json') : Promise.resolve(null)
        ]);
        
        if (resIndex) pdsIndex = await resIndex.json();
        if (resManifest) pdsManifest = await resManifest.json();
        
        self.postMessage({ type: 'PDS_INDEX_LOADED' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS assets: ${message}` });
      }
      break;

    case 'LOAD_TNEB':
      try {
        if (!tnebGeoJson) {
          const [resBound, resOff] = await Promise.all([
            fetchWithRetry('/data/tneb_boundaries.topojson'),
            fetchWithRetry('/data/tneb_offices.geojson')
          ]);
          const dataBound = await resBound.json();
          const dataOff = await resOff.json();
          const objectName = Object.keys(dataBound.objects)[0];
          const feature = topojson.feature(dataBound, dataBound.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          tnebGeoJson = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection', features: [feature as GisFeature] };
          tnebOffices = dataOff as GisFeatureCollection;
          
          // Indexing with safety filters
          const items: SpatialItem[] = tnebGeoJson!.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          tnebIndex.load(items);
        }
        self.postMessage({ type: 'TNEB_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading TNEB:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load TNEB data' });
      }
      break;

    case 'RESOLVE_LOCATION': {
      const { lat, lng, layer, keepSelection } = payload;
      
      let found: GisFeature | null = null;
      if (layer === 'TNEB') {
        found = findFeatureAt([lng, lat], tnebIndex);
        if (found) {
          const office = tnebOffices?.features.find((o: GisFeature) => {
            const sCoMatch = o.properties.section_co === found?.properties.section_co;
            const cCodMatch = o.properties.circle_cod === found?.properties.circle_cod;
            const rIdMatch = (o.properties.region_id || o.properties.region_cod) === (found?.properties.region_cod || found?.properties.region_id);
            return sCoMatch && cCodMatch && rIdMatch;
          });

          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              properties: { ...found.properties, office_location: office?.geometry.coordinates }, 
              geometry: found.geometry,
              layer: 'TNEB',
              keepSelection
            } 
          });
        }
      } else if (layer === 'CONSTITUENCY') {
        const { constituencyType } = payload;
        found = findFeatureAt([lng, lat], constituencyType === 'PC' ? pcIndex : acIndex);
        if (found) {
          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              properties: found.properties, 
              geometry: found.geometry,
              layer: 'CONSTITUENCY',
              constituencyType,
              keepSelection
            } 
          });
        }
      } else if (layer === 'POLICE') {
        found = findFeatureAt([lng, lat], policeBoundariesIndex);
        if (found && policeStationsGeoJson) {
          const result = resolvePoliceStation(
            found as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>, 
            policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>, 
            [lng, lat]
          );

          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              ...result,
              layer: 'POLICE',
              keepSelection
            } 
          });
        }
      } else if (layer === 'PINCODE' || layer === 'PDS') {
        found = findFeatureAt([lng, lat], pincodesIndex);
        if (found) {
          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              properties: found.properties, 
              geometry: found.geometry,
              layer: layer,
              keepSelection
            } 
          });
        }
      }

      if (!found) {
        const isInsideState = stateBoundaryGeoJson ? findFeatureAt([lng, lat], stateBoundaryIndex) : false; 

        self.postMessage({ 
          type: 'RESOLUTION_RESULT', 
          payload: { found: false, lat, lng, layer, isInsideState: !!isInsideState } 
        });
      }
      break;
    }

    case 'LOAD_PINCODES':
      try {
        if (!pincodesGeoJson) {
          const response = await fetchWithRetry('/data/tn_pincodes.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          pincodesGeoJson = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection', features: [feature as GisFeature] };
          
          // Indexing with safety filters
          const items: SpatialItem[] = pincodesGeoJson!.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          pincodesIndex.load(items);
        }
        self.postMessage({ type: 'PINCODES_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading pincodes:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load pincode data' });
      }
      break;

    case 'GET_SUGGESTIONS': {
      const { query } = payload;
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: [] });
        return;
      }

      let suggestions: GisFeature[] = [];

      // 1. Search Districts
      if (districtsGeoJson) {
        const districtMatches = districtsGeoJson.features
          .filter((f: GisFeature) => {
            const props = f.properties;
            const searchBase = (props.district || props.DISTRICT || props.NAME || props.district_n || '').toString().toLowerCase();
            return searchBase.includes(q);
          })
          .slice(0, 5)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'DISTRICT' as const }));
        suggestions = [...suggestions, ...districtMatches];
      }

      // 2. Search Pincodes
      if (pincodesGeoJson) {
        const pinMatches = pincodesGeoJson.features
          .filter((f: GisFeature) => {
            const pin = f.properties.PIN_CODE || f.properties.pincode || '';
            const searchStr = (f.properties.search_string as string || f.properties.office_name as string || '').toLowerCase();
            return pin.toString().startsWith(q) || searchStr.includes(q);
          })
          .slice(0, 5)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'PINCODE' as const }));
        suggestions = [...suggestions, ...pinMatches];
      }

      // 3. Search TNEB Offices
      if (tnebOffices) {
        const tnebMatches = tnebOffices.features
          .filter((f: GisFeature) => {
            const name = (f.properties.section_na as string || f.properties.section_office as string || '').toLowerCase();
            return name.includes(q);
          })
          .slice(0, 5)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'TNEB_SECTION' as const }));
        suggestions = [...suggestions, ...tnebMatches];
      }

      // 4. Search PDS Shops from Index
      if (pdsIndex) {
        const pdsMatches = pdsIndex
          .filter(shop => {
            const name = shop[1].toLowerCase();
            const shopCode = shop[0].toLowerCase();
            const taluk = shop[2].toLowerCase();
            return name.includes(q) || shopCode.includes(q) || taluk.includes(q);
          })
          .slice(0, 5)
          .map(shop => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [shop[5], shop[4]] },
            properties: { 
              shop_code: shop[0], 
              name: shop[1], 
              taluk: shop[2], 
              district: shop[3],
              office_location: [shop[5], shop[4]] as [number, number]
            },
            suggestionType: 'PDS_SHOP' as const
          } as GisFeature));
        suggestions = [...suggestions, ...pdsMatches];
      }

      // 5. Search Constituencies
      if (acGeoJson) {
        const acMatches = acGeoJson.features
          .filter((f: GisFeature) => (f.properties.assembly_c as string || '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'CONSTITUENCY' as const }));
        suggestions = [...suggestions, ...acMatches];
      }
      if (pcGeoJson) {
        const pcMatches = pcGeoJson.features
          .filter((f: GisFeature) => (f.properties.parliame_1 as string || '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'CONSTITUENCY' as const }));
        suggestions = [...suggestions, ...pcMatches];
      }

      // 6. Search Police Stations
      if (policeStationsGeoJson) {
        const policeMatches = policeStationsGeoJson.features
          .filter((f: GisFeature) => (f.properties.ps_name as string || '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((s: GisFeature) => ({ ...s, suggestionType: 'POLICE_STATION' as const }));
        suggestions = [...suggestions, ...policeMatches];
      }

      self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: suggestions.slice(0, 8) });
      break;
    }

    case 'LOAD_PDS': {
      const { district: rawDistrictName, boundary } = payload;
      const identity = resolveDistrictIdentity(rawDistrictName);

      if (!identity) {
        console.warn(`[Worker] Unresolved district identity for: "${rawDistrictName}"`);
        self.postMessage({ 
          type: 'ERROR', 
          payload: `Could not resolve district: ${rawDistrictName}. Please verify the manifest aliases.` 
        });
        return;
      }

      const districtId = identity.id;
      const pdsFileName = identity.pds_file;

      const processAndSendPds = (data: GisFeatureCollection) => {
        let filteredFeatures = data.features;
        if (boundary) {
          // Use R-tree for filtering PDS shops within boundary
          const districtIndex = pdsIndexes.get(districtId);
          if (districtIndex) {
            const bbox = getBBox(boundary);
            const candidates = districtIndex.search(bbox);
            
            filteredFeatures = candidates.filter(item => {
              const point = item.feature.geometry.coordinates as Position;
              if (boundary.type === 'Polygon') {
                return isPointInPolygon(point, (boundary as Polygon).coordinates);
              } else if (boundary.type === 'MultiPolygon') {
                return (boundary as MultiPolygon).coordinates.some((poly: Position[][]) => isPointInPolygon(point, poly));
              }
              return false;
            }).map(item => item.feature);
          }
        }
        self.postMessage({ 
          type: 'PDS_LOADED', 
          payload: { 
            district: identity.display_name, 
            district_id: districtId,
            data: { ...data, features: filteredFeatures } 
          } 
        });
      };

      if (loadedPds.has(districtId)) {
        processAndSendPds(loadedPds.get(districtId)!);
        return;
      }
      try {
        const response = await fetchWithRetry(`/data/pds/${pdsFileName}.json`);
        const data = await response.json() as GisFeatureCollection;
        
        // Build R-tree for this district
        const districtIndex = new RBush<SpatialItem>();
        const items: SpatialItem[] = data.features.map((f: GisFeature) => {
          const [lng, lat] = f.geometry.coordinates as Position;
          return {
            minX: lng, minY: lat, maxX: lng, maxY: lat,
            feature: f
          };
        });
        districtIndex.load(items);
        pdsIndexes.set(districtId, districtIndex);
        
        loadedPds.set(districtId, data);
        processAndSendPds(data);
      } catch (err) {
        console.warn(`[Worker] Failed to load PDS for ${districtId} (file: ${pdsFileName}.json):`, err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS data for ${identity.display_name}` });
      }
      break;
    }

    case 'LOAD_CONSTITUENCIES':
      try {
        if (!acGeoJson || !pcGeoJson) {
          const [resAc, resPc] = await Promise.all([
            fetchWithRetry('/data/tn_assembly_constituencies.topojson'),
            fetchWithRetry('/data/tn_parliamentary_constituencies.topojson')
          ]);
          const dataAc = await resAc.json();
          const dataPc = await resPc.json();
          
          acGeoJson = topojson.feature(dataAc, dataAc.objects.tamilnadu_assemply_constituency) as unknown as GisFeatureCollection;
          pcGeoJson = topojson.feature(dataPc, dataPc.objects.tamilnadu_parliament_constituency) as unknown as GisFeatureCollection;
          
          // Indexing with safety filters
          acIndex.load(
            acGeoJson.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => ({ ...getBBox(f.geometry), feature: f }))
          );
          pcIndex.load(
            pcGeoJson.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => ({ ...getBBox(f.geometry), feature: f }))
          );
        }
        self.postMessage({ type: 'CONSTITUENCIES_LOADED', payload: { ac: acGeoJson, pc: pcGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading constituencies:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load constituency data' });
      }
      break;

    case 'LOAD_POLICE':
      try {
        if (!policeBoundariesGeoJson || !policeStationsGeoJson) {
          const [resBound, resOff, resCross] = await Promise.all([
            fetchWithRetry('/data/tn_police_boundaries.topojson'),
            fetchWithRetry('/data/tn_police_stations.geojson'),
            fetch('/data/police_crosswalk.json').catch(() => null) // Use raw fetch for optional
          ]);
          const dataBound = await resBound.json();
          const dataOff = await resOff.json();
          
          if (resCross && resCross.ok) {
            const contentType = resCross.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              policeCrosswalk = await resCross.json();
            }
          }

          const objectName = Object.keys(dataBound.objects)[0];
          const feature = topojson.feature(dataBound, dataBound.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          policeBoundariesGeoJson = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection', features: [feature as GisFeature] };
          policeStationsGeoJson = dataOff as GisFeatureCollection;
          
          // Preprocess stations to handle metadata anomalies
          policeStationsGeoJson.features.forEach((f: GisFeature) => {
            const props = f.properties;
            props.station_location = f.geometry.coordinates as Position;
          });
          
          // Indexing
          policeBoundariesIndex.load(
            policeBoundariesGeoJson!.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => ({ ...getBBox(f.geometry), feature: f }))
          );
          policeStationsIndex.load(
            policeStationsGeoJson.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => ({ ...getBBox(f.geometry), feature: f }))
          );
        }
        self.postMessage({ type: 'POLICE_LOADED', payload: { boundaries: policeBoundariesGeoJson, stations: policeStationsGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading Police data:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load police data' });
      }
      break;

    case 'AUDIT_POLICE':
      if (policeBoundariesGeoJson && policeStationsGeoJson) {
        console.log('[Audit] Starting Police Resolution Audit...');
        const results = policeBoundariesGeoJson.features.map(f => 
          resolvePoliceStation(
            f as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>, 
            policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>
          )
        );
        
        const summary = {
          total: results.length,
          exact: results.filter(r => r.confidence === 'exact').length,
          high: results.filter(r => r.confidence === 'high').length,
          medium: results.filter(r => r.confidence === 'medium').length,
          low: results.filter(r => r.confidence === 'low').length,
          unresolved: results.filter(r => r.confidence === 'unresolved').length,
          mismatchedCodes: results.filter(r => r.station && r.station.properties.ps_code && r.station.properties.ps_code !== r.boundary.properties.police_s_1).length,
          outsidePolygon: results.filter(r => r.station && !r.debug.isInsideBoundary).length
        };
        
        console.table(summary);
        self.postMessage({ type: 'AUDIT_RESULT', payload: { summary, details: results } });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
