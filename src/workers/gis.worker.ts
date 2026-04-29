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
  PoliceMatchDebug,
  PostalOffice,
  HealthManifest,
  HealthFacilityProperties
} from '../types/gis';
import type { LocalBodyV2Properties } from '../types/gis_v2';

import { openDB } from 'idb';
import { resolveChennaiPolice } from '../utils/resolvers/chennaiPoliceResolver';
import { extractCoordinatesFromUrl } from '../utils/urlParser';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: GisFeature;
}

const CACHE_DB = 'nammamap-cache';
const CACHE_STORE = 'gis-data';

const getCacheDB = () => openDB(CACHE_DB, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(CACHE_STORE)) {
      db.createObjectStore(CACHE_STORE, { keyPath: 'url' });
    }
  }
});

interface ProcessedStationProperties extends PoliceStationProperties {
  resolved_code?: string;
  resolved_name?: string;
  normalized_key?: string;
}

let policeCrosswalk: Record<string, string> | null = null;
let policeValidation: Record<string, { status: string; error: string }> | null = null;

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
let tnebOffices: GisFeatureCollection | null = null;
let acGeoJson: GisFeatureCollection | null = null;
let pcGeoJson: GisFeatureCollection | null = null;
let policeBoundariesGeoJson: GisFeatureCollection | null = null;
let policeStationsGeoJson: GisFeatureCollection | null = null;
const postalOfficesIndex: Map<string, PostalOffice[]> = new Map();
const loadedPds: Map<string, GisFeatureCollection> = new Map();
const loadedHealthDistricts: Map<string, GisFeatureCollection> = new Map();
const loadedPostalDistricts: Map<string, PostalOffice[]> = new Map();
const loadedPoliceDistricts: Map<string, { boundaries: GisFeatureCollection, stations: GisFeatureCollection }> = new Map();
const loadedTnebDistricts: Map<string, { boundaries: GisFeatureCollection, offices: GisFeatureCollection }> = new Map();
const healthDistrictIndexes: Map<string, RBush<SpatialItem>> = new Map();
let healthManifest: HealthManifest | null = null;
let healthPriorityGeoJson: GisFeatureCollection | null = null;
let healthSearchIndex: any[][] | null = null;
let tnebSearchIndex: any[][] | null = null;
let policeSearchIndex: any[][] | null = null;

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  // 1. Try Cache First
  try {
    const db = await getCacheDB();
    const cached = await db.get(CACHE_STORE, url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  } catch (e) {
    console.warn('[Worker] Cache check failed', e);
  }

  // 2. Network Fallback
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // If it's a 404, don't retry, it's likely a missing district file
        if (response.status === 404) {
          throw new Error(`FILE_NOT_FOUND: ${url}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // 3. Update Cache
      try {
        const db = await getCacheDB();
        await db.put(CACHE_STORE, {
          url,
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        });
      } catch (e) {
        console.warn('[Worker] Cache update failed', e);
      }

      return data;
    } catch (e) {
      if (i === retries - 1 || (e instanceof Error && e.message.startsWith('FILE_NOT_FOUND'))) throw e;
      console.warn(`[Worker] Fetch failed for ${url}, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('NETWORK_FAILURE');
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
 * Strips code prefixes like "B1 " or "R3." or "T 11 " from names
 */
const stripCodePrefix = (name: string): string => {
  return name.replace(/^[A-Z]+\s*\d+[\s.]*/i, '').trim();
};

/**
 * Extracts police station code (e.g. R3, J2, P48, T 11) from a string
 * Returns normalized code without spaces (e.g. "T11")
 */
const extractPoliceCode = (str: string | undefined | null): string => {
  if (!str) return '';
  const normalized = str.toString().toUpperCase().trim();
  const match = normalized.match(/^([A-Z]+)\s*(\d+)/);
  return match ? match[1] + match[2] : '';
};

/**
 * Normalizes a district name to match case-sensitive JSON filenames.
 * Handles special cases like "The Nilgiris" and spelling variations.
 */
const normalizeDistrictForFetch = (name: string): string => {
  if (!name) return '';
  const upper = name.toUpperCase().trim().replace(/\s+/g, ' ');

  // Special cases for filenames
  if (upper === 'THE NILGIRIS' || upper === 'NILGIRIS' || upper === 'THE_NILGIRIS') return 'The_Nilgiris';
  if (upper.includes('TIRUCHIRAP')) return 'Tiruchirapalli';
  if (upper === 'THOOTHUKUDI' || upper === 'TUTICORIN') return 'Thoothukudi';
  if (upper === 'KANYAKUMARI') return 'Kanniyakumari';

  // Default: TitleCase with no spaces (e.g. "CHENGALPATTU" -> "Chengalpattu")
  return upper.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
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
  if (!geometry) return [0, 0];
  if (geometry.type === 'Point') return geometry.coordinates as Position;
  const bbox = getBBox(geometry);
  return [(bbox.minX + bbox.maxX) / 2, (bbox.minY + bbox.maxY) / 2];
};

/**
 * Flags postal offices that are geographically too far from their pincode boundary.
 */
const flagPostalOutliers = (offices: PostalOffice[], boundary: Geometry): PostalOffice[] => {
  if (!boundary || !offices.length) return offices;

  const centroid = getCentroid(boundary);
  if (!centroid) return offices;

  return offices.map(off => {
    const lat = parseFloat(off.latitude as string);
    const lng = parseFloat(off.longitude as string);

    if (isNaN(lat) || isNaN(lng)) {
      return { ...off, isOutlier: true, outlierReason: 'Invalid coordinates' };
    }

    const dist = getDistance([centroid[0], centroid[1]], [lng, lat]);

    // Threshold in degrees. 0.15 degrees is approximately 16-17km.
    if (dist > 0.15) {
      return { ...off, isOutlier: true, outlierReason: 'Coordinates far from pincode area' };
    }

    return { ...off, isOutlier: false };
  });
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

    const isNearBoundary = distToCentroid < 0.05; // Approx 5km

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
      currentScore = 80 + (isInside ? 10 : (isNearBoundary ? 5 : 0)) + (districtMatch ? 5 : 0) + (codeMatch ? 5 : 0);
    } else if (codeMatch && (isInside || isNearBoundary)) {
      currentConfidence = 'high';
      currentReason = isInside ? 'Code match with spatial validation' : 'Code match with proximity validation (Near miss)';
      currentScore = 75 + (maxAliasMatch * 10);
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

  if (!bestStation) return {
    boundary,
    station: null,
    confidence: 'unresolved',
    reason: 'No matching station found',
    debug: bestDebug,
    isBoundaryValid: true
  };

  const [stLng, stLat] = bestStation.geometry.coordinates as [number, number];
  const stationKey = `${bestStation.properties.ps_code || ''}|${stLat.toFixed(5)}|${stLng.toFixed(5)}`;
  const validation = policeValidation ? policeValidation[stationKey] : null;
  const isBoundaryValid = !validation || validation.status === 'valid';

  // Clone boundary to avoid mutating the original indexed feature
  const boundaryClone = JSON.parse(JSON.stringify(boundary));
  if (!isBoundaryValid && boundaryClone) {
    (boundaryClone.geometry as Geometry | null) = null;
  }

  return {
    boundary: boundaryClone,
    station: bestStation,
    confidence: bestStation ? bestDebug.confidence : 'unresolved',
    reason: bestStation ? bestDebug.reason : 'No matching station found',
    debug: bestDebug,
    isBoundaryValid,
    validationError: validation?.error
  };
}


// R-trees for spatial indexing
const pincodesIndex = new RBush<SpatialItem>();
const districtsIndex = new RBush<SpatialItem>();
const tnebIndex = new RBush<SpatialItem>();
const stateBoundaryIndex = new RBush<SpatialItem>();
const acIndex = new RBush<SpatialItem>();
const pcIndex = new RBush<SpatialItem>();
const policeBoundariesIndex = new RBush<SpatialItem>();
const policeStationsIndex = new RBush<SpatialItem>();
const pdsIndexes = new Map<string, RBush<SpatialItem>>();
const pdsStatewideIndex = new RBush<SpatialItem>();

const localBodyIndexes = {
  CORPORATION: new RBush<SpatialItem>(),
  MUNICIPALITY: new RBush<SpatialItem>(),
  TOWN_PANCHAYAT: new RBush<SpatialItem>(),
  VILLAGE_PANCHAYAT: new RBush<SpatialItem>()
};

const loadedVillagePanchayats: Map<string, GisFeatureCollection> = new Map();

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

function findFeatureAt(point: [number, number], index: RBush<SpatialItem>, buffer = 0.00001) {
  const [lng, lat] = point;
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

/**
 * Priority-based Local Body Resolution (Unified Discovery)
 */
async function handleLocalBodyV2Resolution(lat: number, lng: number, keepSelection: boolean = false) {
  let resolvedLocal: GisFeature | null = null;
  let resolvedType: string = '';

  // 1. Corporation
  resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.CORPORATION);
  if (resolvedLocal) resolvedType = 'CORPORATION';

  // 2. Municipality
  if (!resolvedLocal) {
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.MUNICIPALITY);
    if (resolvedLocal) resolvedType = 'MUNICIPALITY';
  }

  // 3. Town Panchayat
  if (!resolvedLocal) {
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.TOWN_PANCHAYAT);
    if (resolvedLocal) resolvedType = 'TOWN_PANCHAYAT';
  }

  // 4. Village Panchayat (Lazy load if needed)
  if (!resolvedLocal) {
    // Check current index first
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.VILLAGE_PANCHAYAT);
    if (resolvedLocal) {
      resolvedType = 'VILLAGE_PANCHAYAT';
    } else {
      // Determine district and load
      const distFeature = findFeatureAt([lng, lat], districtsIndex);
      if (distFeature) {
        const districtName = (distFeature.properties.district_n || distFeature.properties.district || distFeature.properties.NAME || distFeature.properties.dist_name)?.toString();
        if (districtName) {
          const districtClean = normalizeDistrictForFetch(districtName);

          if (!loadedVillagePanchayats.has(districtClean)) {
            try {
              const data = await fetchWithRetry(`/data/local_bodies/village_panchayat/${districtClean}.json`);
              let vpFC: GisFeatureCollection;
              if (data.type === 'Topology') {
                vpFC = topojson.feature(data, data.objects[Object.keys(data.objects)[0]]) as unknown as GisFeatureCollection;
              } else {
                vpFC = data;
              }
              loadedVillagePanchayats.set(districtClean, vpFC);
            } catch (err) {
              console.warn(`[Worker] Auto-load VP failed: ${districtClean}`, err);
            }
          }

          const vpData = loadedVillagePanchayats.get(districtClean);
          if (vpData) {
            const scratchIndex = new RBush<SpatialItem>();
            scratchIndex.load(vpData.features.map((f: GisFeature) => ({ ...getBBox(f.geometry), feature: f })));
            resolvedLocal = findFeatureAt([lng, lat], scratchIndex);
            if (resolvedLocal) {
              resolvedType = 'VILLAGE_PANCHAYAT';
              // Swap current index for this district's VPs to optimize future clicks in same area
              localBodyIndexes.VILLAGE_PANCHAYAT.clear();
              localBodyIndexes.VILLAGE_PANCHAYAT.load(vpData.features.map((f: GisFeature) => ({ ...getBBox(f.geometry), feature: f })));
            }
          }
        }
      }
    }
  }

  if (resolvedLocal) {
    // Resolve name based on type — property keys differ between layers
    let resolvedName = 'Unknown';
    if (resolvedType === 'CORPORATION') {
      resolvedName = (resolvedLocal.properties.Corporatio || resolvedLocal.properties.name || 'Unknown').toString();
    } else if (resolvedType === 'MUNICIPALITY') {
      resolvedName = (resolvedLocal.properties.Municipali || resolvedLocal.properties.name || 'Unknown').toString();
    } else if (resolvedType === 'TOWN_PANCHAYAT') {
      resolvedName = (resolvedLocal.properties.name || resolvedLocal.properties.p_name_rd || resolvedLocal.properties.tp_name || 'Unknown').toString();
    } else {
      // VILLAGE_PANCHAYAT
      resolvedName = (resolvedLocal.properties.panchayat_n || resolvedLocal.properties.panchayat || resolvedLocal.properties.name || resolvedLocal.properties.Village || 'Unknown').toString();
    }

    // Correct known source data errors in GIS TN corporation/municipality district fields
    const DISTRICT_CORRECTIONS: Record<string, string> = {
      'Trichy': 'Tiruchirappalli',
      'Erode': 'Erode', // Erode corp is in Namakkal district in source — override to Erode
      'Chennai': 'Chennai', // Chennai corp is listed as Chengalpattu in source
    };

    const rawDistrict = (resolvedLocal.properties.District || resolvedLocal.properties.district || resolvedLocal.properties.dist_name || 'Unknown').toString();
    const correctedDistrict = (resolvedType === 'CORPORATION' || resolvedType === 'MUNICIPALITY')
      ? (DISTRICT_CORRECTIONS[resolvedName] || rawDistrict)
      : rawDistrict;

    const normalized: LocalBodyV2Properties = {
      id: (resolvedLocal.properties.id || resolvedLocal.id || Date.now()).toString(),
      name: resolvedName,
      type: resolvedType as any,
      district: correctedDistrict,
      block: resolvedLocal.properties.Block?.toString() || resolvedLocal.properties.b_name?.toString(),
      taluk: resolvedLocal.properties.taluk?.toString() || resolvedLocal.properties.Taluk?.toString(),
      category: resolvedLocal.properties.type1?.toString(),
      raw: resolvedLocal.properties
    };

    self.postMessage({
      type: 'RESOLUTION_RESULT',
      payload: {
        found: true,
        properties: normalized,
        geometry: resolvedLocal.geometry,
        layer: 'LOCAL_BODIES_V2',
        keepSelection
      }
    });
  } else {
    const isInsideState = stateBoundaryGeoJson ? findFeatureAt([lng, lat], stateBoundaryIndex) : false;
    self.postMessage({
      type: 'RESOLUTION_RESULT',
      payload: { found: false, lat, lng, layer: 'LOCAL_BODIES_V2', isInsideState: !!isInsideState }
    });
  }
}


self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'SET_VERSION':
      try {
        const { version } = payload;
        const db = await getCacheDB();
        const stored = await db.get(CACHE_STORE, 'app-version');
        if (stored && stored.data !== version) {
          await db.clear(CACHE_STORE);
          console.log('[Worker] App version changed. Cache cleared.');
        }
        await db.put(CACHE_STORE, { url: 'app-version', data: version, expiresAt: Infinity });
      } catch (e) {
        console.warn('[Worker] Version sync failed', e);
      }
      break;
    
    case 'INIT_DB':
      self.postMessage({ type: 'READY' });
      break;

    case 'LOAD_DISTRICTS':
      try {
        if (!districtsGeoJson) {
          const data = await fetchWithRetry('/data/tn_districts.topojson');
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          districtsGeoJson = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection', features: [feature as GisFeature] };

          // Indexing with safety filters
          const items: SpatialItem[] = districtsGeoJson!.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          districtsIndex.load(items);
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
          const data = await fetchWithRetry('/data/tn_state_boundary.topojson');
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
        if (!pdsIndex) pdsIndex = await fetchWithRetry('/data/pds_index.json');
        if (!pdsManifest) pdsManifest = await fetchWithRetry('/data/pds_manifest.json');

        // Build statewide spatial index for PDS shops
        if (pdsIndex && pdsStatewideIndex.all().length === 0) {
          const items: SpatialItem[] = pdsIndex.map(shop => ({
            minX: shop[5], minY: shop[4], maxX: shop[5], maxY: shop[4],
            feature: {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [shop[5], shop[4]] },
              properties: {
                shop_code: shop[0],
                name: shop[1],
                taluk: shop[2],
                district: shop[3]
              }
            } as GisFeature
          }));
          pdsStatewideIndex.load(items);
        }

        self.postMessage({ type: 'PDS_INDEX_LOADED' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS assets: ${message}` });
      }
      break;

    case 'LOAD_TNEB_STATEWIDE':
      try {
        if (!tnebSearchIndex) {
          tnebSearchIndex = await fetchWithRetry('/data/tneb_index.json');
        }
        self.postMessage({ type: 'TNEB_STATEWIDE_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading TNEB search index:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load TNEB search index' });
      }
      break;

    case 'LOAD_TNEB_DISTRICT':
      try {
        const { district } = payload;
        if (!district) return;

        if (!loadedTnebDistricts.has(district)) {
          const [dataBound, dataOff] = await Promise.all([
            fetchWithRetry(`/data/tneb_by_district/${district}_boundaries.json`),
            fetchWithRetry(`/data/tneb_by_district/${district}_offices.json`)
          ]);

          const boundaries = dataBound as GisFeatureCollection;
          const offices = dataOff as GisFeatureCollection;

          loadedTnebDistricts.set(district, { boundaries, offices });

          // Index boundaries for spatial resolution
          const items: SpatialItem[] = boundaries.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({ ...getBBox(f.geometry), feature: f }));
          tnebIndex.load(items);

          // Merge offices into the statewide collection if not already there (for metadata fallbacks)
          if (!tnebOffices) {
            tnebOffices = { type: 'FeatureCollection', features: [] };
          }
          offices.features.forEach((f: GisFeature) => {
            if (!tnebOffices!.features.some(o => o.properties.section_co === f.properties.section_co && o.properties.circle_cod === f.properties.circle_cod)) {
              tnebOffices!.features.push(f);
            }
          });
        }

        const { boundaries, offices } = loadedTnebDistricts.get(district)!;
        self.postMessage({ type: 'TNEB_DISTRICT_LOADED', payload: { district, boundaries, offices } });
      } catch (err) {
        console.error('[Worker] Error loading TNEB district:', err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load TNEB data for ${payload.district}` });
      }
      break;

    case 'RESOLVE_LOCATION': {
      const { lat, lng, layer, keepSelection, pincode: pincodeOverride } = payload;

      let found: GisFeature | null = null;
      if (layer === 'TNEB') {
        if (tnebIndex.all().length === 0 || !findFeatureAt([lng, lat], tnebIndex)) {
          const distFeature = findFeatureAt([lng, lat], districtsIndex);
          const districtName = (distFeature?.properties.district_n || distFeature?.properties.district)?.toString();

          if (districtName && !loadedTnebDistricts.has(districtName)) {
            try {
              const [dataBound, dataOff] = await Promise.all([
                fetchWithRetry(`/data/tneb_by_district/${districtName}_boundaries.json`),
                fetchWithRetry(`/data/tneb_by_district/${districtName}_offices.json`)
              ]);

              const boundaries = dataBound as GisFeatureCollection;
              const offices = dataOff as GisFeatureCollection;

              loadedTnebDistricts.set(districtName, { boundaries, offices });

              const items: SpatialItem[] = boundaries.features
                .filter(f => f.geometry && f.geometry.coordinates)
                .map((f: GisFeature) => ({ ...getBBox(f.geometry), feature: f }));
              tnebIndex.load(items);

              if (!tnebOffices) {
                tnebOffices = { type: 'FeatureCollection', features: [] };
              }
              offices.features.forEach((f: GisFeature) => {
                if (!tnebOffices!.features.some(o => o.properties.section_co === f.properties.section_co && o.properties.circle_cod === f.properties.circle_cod)) {
                  tnebOffices!.features.push(f);
                }
              });
            } catch (err) {
              console.error('[Worker] Error lazy loading TNEB district:', err);
            }
          }
        }

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
        const { constituencyType, pincode: pincodeOverride } = payload;

        if (pincodeOverride) {
          const pinFeature = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString());
          if (pinFeature) {
            const centroid = getCentroid(pinFeature.geometry);
            const resolvedConst = findFeatureAt(centroid as [number, number], constituencyType === 'PC' ? pcIndex : acIndex);

            if (resolvedConst) {
              self.postMessage({
                type: 'RESOLUTION_RESULT',
                payload: {
                  properties: { ...resolvedConst.properties, ...pinFeature.properties },
                  geometry: pinFeature.geometry,
                  layer: 'CONSTITUENCY',
                  constituencyType,
                  keepSelection
                }
              });
              return;
            } else {
              // Fallback to just pincode if no constituency found at centroid (unlikely but possible at borders)
              found = pinFeature;
            }
          }
        } else {
          found = findFeatureAt([lng, lat], constituencyType === 'PC' ? pcIndex : acIndex);
        }

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
        const { stationCode } = payload;

        // Ensure district boundaries are loaded for this area
        const distFeature = findFeatureAt([lng, lat], districtsIndex);
        const districtName = (distFeature?.properties.district_n || distFeature?.properties.district)?.toString();

        const loadPoliceDistrict = async (name: string) => {
          if (!name || loadedPoliceDistricts.has(name)) return;
          try {
            const [dataBound, dataOff] = await Promise.all([
              fetchWithRetry(`/data/police_by_district/${name}_boundaries.json`),
              fetchWithRetry(`/data/police_by_district/${name}_stations.json`)
            ]);

            const boundaries = dataBound as GisFeatureCollection;
            const stations = dataOff as GisFeatureCollection;

            loadedPoliceDistricts.set(name, { boundaries, stations });

            const items: SpatialItem[] = boundaries.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => ({ ...getBBox(f.geometry), feature: f }));
            policeBoundariesIndex.load(items);

            if (!policeBoundariesGeoJson) {
              policeBoundariesGeoJson = { type: 'FeatureCollection', features: [] };
            }
            policeBoundariesGeoJson.features.push(...boundaries.features);

            if (!policeStationsGeoJson) {
              policeStationsGeoJson = { type: 'FeatureCollection', features: [] };
            }
            stations.features.forEach((f: GisFeature) => {
              f.properties.station_location = f.geometry.coordinates as Position;
              if (!policeStationsGeoJson!.features.some(s => s.properties.ps_code === f.properties.ps_code && s.properties.ps_name === f.properties.ps_name)) {
                policeStationsGeoJson!.features.push(f);
              }
            });
          } catch (err) {
            console.error('[Worker] Error lazy loading police district:', err);
          }
        };

        const isChennai = districtName?.toUpperCase().includes('CHENNAI');

        if (isChennai) {
          // Special case: Chennai City Police covers parts of Tiruvallur and Chengalpattu
          await Promise.all([
            loadPoliceDistrict('Chennai'),
            loadPoliceDistrict('Tiruvallur'),
            loadPoliceDistrict('Chengalpattu')
          ]);
        } else if (districtName) {
          await loadPoliceDistrict(districtName);
        }

        if (stationCode && policeBoundariesGeoJson) {
          // Find all boundaries with this code (codes are not unique statewide)
          // Search across ALL loaded boundaries
          const candidates = policeBoundariesGeoJson.features.filter(f => {
            const code = (f.properties.police_s_1 || '').toString().trim().toUpperCase();
            return code === stationCode && f.geometry;
          });

          if (candidates.length > 0) {
            // Pick the one closest to the clicked coordinates or centroid
            found = candidates.sort((a, b) => {
              const da = getDistance([lng, lat], getCentroid(a.geometry));
              const db = getDistance([lng, lat], getCentroid(b.geometry));
              return da - db;
            })[0];
          }
        }

        if (!found) {
          found = findFeatureAt([lng, lat], policeBoundariesIndex);
        }

        // Proximity Fallback: If no exact containment, try a radial search (approx 200m)
        if (!found && !stationCode) {
          const proximityBuffer = 0.002;
          const candidates = policeBoundariesIndex.search({
            minX: lng - proximityBuffer,
            minY: lat - proximityBuffer,
            maxX: lng + proximityBuffer,
            maxY: lat + proximityBuffer
          });

          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              const da = getDistance([lng, lat], getCentroid(a.feature.geometry));
              const db = getDistance([lng, lat], getCentroid(b.feature.geometry));
              return da - db;
            });
            found = candidates[0].feature;
          }
        }

        if (found && policeStationsGeoJson) {
          // If we have a stationCode, we want to make sure we resolve to THAT station specifically
          // even if the resolver thinks another station is better. 
          // Since codes are not unique, we filter and pick the closest one.
          const targetStation = (() => {
            if (!stationCode || !policeStationsGeoJson) return null;
            const stations = policeStationsGeoJson.features.filter(s => {
              const code = (s.properties.ps_code || extractPoliceCode((s.properties.ps_name || s.properties.name || '').toString())).toString().trim().toUpperCase();
              return code === stationCode && s.geometry;
            });
            if (stations.length > 1) {
              return [...stations].sort((a, b) => {
                const da = getDistance([lng, lat], a.geometry.coordinates as [number, number]);
                const db = getDistance([lng, lat], b.geometry.coordinates as [number, number]);
                return da - db;
              })[0];
            }
            return stations[0] || null;
          })();

          let result: PoliceResolutionResult;

          if (isChennai) {
            const chennaiRes = resolveChennaiPolice(
              [lng, lat],
              policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
              policeBoundariesGeoJson as GisFeatureCollection<Polygon | MultiPolygon, PoliceBoundaryProperties>,
              true
            );

            if (chennaiRes) {
              result = {
                boundary: JSON.parse(JSON.stringify(chennaiRes.matchedBoundary!)),
                station: chennaiRes.primaryStation,
                isBoundaryValid: true,
                confidence: (chennaiRes.confidence >= 90 ? 'high' : chennaiRes.confidence >= 70 ? 'medium' : 'low') as any,
                reason: chennaiRes.matchType,
                debug: {
                  boundaryId: chennaiRes.matchedBoundary?.id?.toString() || 'chennai',
                  boundaryCode: (chennaiRes.matchedBoundary?.properties.police_s_1 || '').toString(),
                  boundaryAliases: [chennaiRes.matchedBoundary?.properties.police_sta || ''],
                  stationCode: chennaiRes.stationCode || undefined,
                  codeMatch: chennaiRes.confidence >= 75,
                  aliasMatchStrength: chennaiRes.confidence / 100,
                  isInsideBoundary: chennaiRes.insidePolygon,
                  distanceToClick: 0,
                  distanceToCentroid: chennaiRes.distanceKm,
                  overrideUsed: false,
                  confidence: (chennaiRes.confidence >= 90 ? 'high' : 'medium') as any,
                  reason: chennaiRes.matchType,
                  method: 'chennai-resolver'
                },
                chennaiResult: chennaiRes
              };
            } else {
              result = resolvePoliceStation(
                found as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
                policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
                [lng, lat]
              );
            }
          } else {
            result = resolvePoliceStation(
              found as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
              policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
              [lng, lat]
            );
          }

          if (targetStation) {
            result.station = targetStation as GisFeature<Point, PoliceStationProperties>;
            // Re-validate boundary for this specific target station
            const [stLng, stLat] = targetStation.geometry.coordinates as [number, number];
            const stCode = (targetStation.properties.ps_code || extractPoliceCode((targetStation.properties.ps_name || targetStation.properties.name || '').toString())).toString().trim().toUpperCase();
            const stationKey = `${stCode}|${stLat.toFixed(5)}|${stLng.toFixed(5)}`;
            const validation = policeValidation ? policeValidation[stationKey] : null;
            result.isBoundaryValid = !validation || validation.status === 'valid';
            result.validationError = validation?.error;

            // CRITICAL: If boundary is flagged as wrong or missing, nullify the geometry 
            // so the MapController doesn't "fly" to a wrong location.
            if (!result.isBoundaryValid && result.boundary) {
              (result.boundary.geometry as Geometry | null) = null;
            }
          }

          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              ...result,
              layer: 'POLICE',
              keepSelection
            }
          });
        } else if (stationCode && policeStationsGeoJson) {
          // Case where boundary is missing but we have the station
          const targetStation = (() => {
            const stations = policeStationsGeoJson.features.filter(s => {
              const code = (s.properties.ps_code || extractPoliceCode((s.properties.ps_name || s.properties.name || '').toString())).toString().trim().toUpperCase();
              return code === stationCode && s.geometry;
            });
            if (stations.length > 1) {
              return [...stations].sort((a, b) => {
                const da = getDistance([lng, lat], a.geometry.coordinates as [number, number]);
                const db = getDistance([lng, lat], b.geometry.coordinates as [number, number]);
                return da - db;
              })[0];
            }
            return stations[0] || null;
          })();

          if (targetStation) {
            const [stLng, stLat] = targetStation.geometry.coordinates as [number, number];
            const stCode = (targetStation.properties.ps_code || extractPoliceCode((targetStation.properties.ps_name || targetStation.properties.name || '').toString())).toString().trim().toUpperCase();
            const stationKey = `${stCode}|${stLat.toFixed(5)}|${stLng.toFixed(5)}`;
            const validation = policeValidation ? policeValidation[stationKey] : null;

            self.postMessage({
              type: 'RESOLUTION_RESULT',
              payload: {
                station: targetStation,
                boundary: { type: 'Feature', geometry: null, properties: {} },
                confidence: 'exact',
                reason: 'Direct station selection',
                isBoundaryValid: false,
                validationError: validation?.error || 'No boundary found for this station',
                layer: 'POLICE',
                keepSelection
              }
            });
          }
        }
      } else if (layer === 'HEALTH') {
        let pinFeature: GisFeature | null = null;
        if (pincodeOverride) {
          pinFeature = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString()) || null;
        } else {
          pinFeature = findFeatureAt([lng, lat], pincodesIndex);
        }

        const distFeature = pinFeature
          ? findFeatureAt(getCentroid(pinFeature.geometry) as [number, number], districtsIndex)
          : findFeatureAt([lng, lat], districtsIndex);

        self.postMessage({
          type: 'RESOLUTION_RESULT',
          payload: {
            properties: {
              ...(distFeature?.properties || {}),
              ...(pinFeature?.properties || {})
            },
            geometry: pinFeature?.geometry || distFeature?.geometry,
            layer: 'HEALTH',
            keepSelection
          }
        });
        return;
      } else if (layer === 'PINCODE' || layer === 'PDS') {
        if (pincodeOverride) {
          found = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString()) || null;
        } else {
          found = findFeatureAt([lng, lat], pincodesIndex);
        }

        if (found) {
          const pincode = (found.properties.pin_code || found.properties.PIN_CODE || found.properties.pincode)?.toString();
          const district = (found.properties.district || found.properties.DISTRICT || found.properties.NAME)?.toString();

          if (layer === 'PINCODE' && district && !loadedPostalDistricts.has(district)) {
            // Lazy load the district postal data
            const data = await fetchWithRetry(`/data/postal_by_district/${district}.json`) as PostalOffice[];
            loadedPostalDistricts.set(district, data);
            if (data) {
              data.forEach(po => {
                const pin = po.pincode.toString();
                if (!postalOfficesIndex.has(pin)) postalOfficesIndex.set(pin, []);
                const existing = postalOfficesIndex.get(pin)!;
                if (!existing.some(e => e.officename === po.officename)) {
                  existing.push(po);
                }
              });
            }
          }

          const offices = pincode ? postalOfficesIndex.get(pincode) || [] : [];
          const flaggedOffices = flagPostalOutliers(offices, found.geometry);

          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              properties: found.properties,
              geometry: found.geometry,
              layer: 'PINCODE',
              postalOffices: flaggedOffices,
              keepSelection
            }
          });
        }
      } else if (layer === 'LOCAL_BODIES_V2') {
        await handleLocalBodyV2Resolution(lat, lng, keepSelection);
        return;
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
          const data = await fetchWithRetry('/data/tn_pincodes.topojson');
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

    case 'LOAD_POSTAL_DISTRICT':
      try {
        const { district } = payload;
        if (!district) return;

        if (!loadedPostalDistricts.has(district)) {
          const data = await fetchWithRetry(`/data/postal_by_district/${district}.json`) as PostalOffice[];
          loadedPostalDistricts.set(district, data);

          if (data) {
            data.forEach(po => {
              const pin = po.pincode.toString();
              if (!postalOfficesIndex.has(pin)) postalOfficesIndex.set(pin, []);
              // Avoid duplicates if loading multiple districts that share a pincode (rare but possible)
              const existing = postalOfficesIndex.get(pin)!;
              if (!existing.some(e => e.officename === po.officename)) {
                existing.push(po);
              }
            });
          }
        }
        self.postMessage({ type: 'POSTAL_DISTRICT_LOADED', payload: { district } });
      } catch (err) {
        console.error('[Worker] Error loading postal district:', err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load postal data for ${payload.district}` });
      }
      break;

    case 'LOAD_HEALTH_MANIFEST':
      try {
        if (!healthManifest) {
          healthManifest = await fetchWithRetry('/data/health_manifest.json');
        }
        self.postMessage({ type: 'HEALTH_MANIFEST_LOADED', payload: healthManifest });
      } catch (err) {
        console.error('[Worker] Error loading health manifest:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health manifest' });
      }
      break;

    case 'LOAD_HEALTH_SEARCH_INDEX':
      try {
        if (!healthSearchIndex) {
          healthSearchIndex = await fetchWithRetry('/data/health_search_index.json');
        }
        self.postMessage({ type: 'HEALTH_SEARCH_INDEX_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading health search index:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health search index' });
      }
      break;

    case 'LOAD_HEALTH_PRIORITY':
      try {
        if (!healthPriorityGeoJson) {
          healthPriorityGeoJson = await fetchWithRetry('/data/health_statewide_priority.geojson');
        }
        self.postMessage({ type: 'HEALTH_PRIORITY_LOADED', payload: healthPriorityGeoJson });
      } catch (err) {
        console.error('[Worker] Error loading health priority data:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health priority data' });
      }
      break;

    case 'LOAD_HEALTH_DISTRICT':
      try {
        const { district, file_name } = payload;
        if (!loadedHealthDistricts.has(district)) {
          const data = await fetchWithRetry(`/data/health_by_district/${file_name}`) as GisFeatureCollection;
          loadedHealthDistricts.set(district, data);

          const index = new RBush<SpatialItem>();
          const items: SpatialItem[] = data.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          index.load(items);
          healthDistrictIndexes.set(district, index);
        }
        self.postMessage({
          type: 'HEALTH_DISTRICT_LOADED',
          payload: { district, data: loadedHealthDistricts.get(district) }
        });
      } catch (err) {
        console.error('[Worker] Error loading health district:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health district data' });
      }
      break;

    case 'FILTER_HEALTH': {
      try {
        const { scope, filters, district, pincode } = payload;
        let features: GisFeature[] = [];
        let activeDistrictData: GisFeatureCollection | null = null;

        if (scope === 'STATE') {
          features = healthPriorityGeoJson?.features || [];
        } else if (scope === 'DISTRICT' || scope === 'PINCODE') {
          if (!district) {
            self.postMessage({ type: 'ERROR', payload: 'District name required for drill-down' });
            return;
          }

          const distManifest = healthManifest?.districts.find(d =>
            d.district.toLowerCase().replace(/\s+/g, '') === district.toLowerCase().replace(/\s+/g, '')
          );
          if (!distManifest) {
            self.postMessage({ type: 'ERROR', payload: `Manifest entry not found for district: ${district}` });
            return;
          }

          if (!loadedHealthDistricts.has(district)) {
            activeDistrictData = await fetchWithRetry(`/data/health_by_district/${distManifest.file_name}`);
            if (activeDistrictData) {
              loadedHealthDistricts.set(district, activeDistrictData);

              // Also index it for spatial lookups
              const index = new RBush<SpatialItem>();
              const items: SpatialItem[] = activeDistrictData.features
                .filter(f => f.geometry && f.geometry.coordinates)
                .map((f: GisFeature) => ({
                  ...getBBox(f.geometry),
                  feature: f
                }));
              index.load(items);
              healthDistrictIndexes.set(district, index);
            }
          } else {
            activeDistrictData = loadedHealthDistricts.get(district) || null;
          }

          if (!activeDistrictData) {
            self.postMessage({ type: 'ERROR', payload: 'Failed to load health district data' });
            return;
          }

          features = activeDistrictData.features;

          if (scope === 'PINCODE' && pincode) {
            const pinFeature = pincodesGeoJson?.features.find(f =>
              (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincode.toString()
            );
            if (pinFeature) {
              const distIndex = healthDistrictIndexes.get(district);
              if (distIndex) {
                const bbox = getBBox(pinFeature.geometry);
                const candidates = distIndex.search(bbox);

                features = candidates.filter(item => {
                  const pt = item.feature.geometry.coordinates as [number, number];
                  if (pinFeature!.geometry.type === 'Polygon') {
                    return isPointInPolygon(pt, (pinFeature!.geometry as Polygon).coordinates);
                  } else if (pinFeature!.geometry.type === 'MultiPolygon') {
                    return (pinFeature!.geometry as MultiPolygon).coordinates.some(poly => isPointInPolygon(pt, poly));
                  }
                  return false;
                }).map(item => item.feature);
              }
            }
          }
        }

        // Capability check helper
        const isTrue = (val: any) => val === 1 || val === '1' || (typeof val === 'string' && val.trim().length > 0 && val !== '0' && val !== 'null');

        // Apply Filters
        const filtered = features.filter(f => {
          const p = f.properties;

          // 1. Mandatory Filters (AND)

          // Facility Type
          if (filters.facilityTypes.length > 0 && !filters.facilityTypes.includes(p.facility_t)) return false;

          // Location Type
          if (filters.locationType === 'Urban' && p.location_t !== 'Urban') return false;
          if (filters.locationType === 'Rural' && p.location_t !== 'Rural') return false;

          // 2. Capability Filters (OR)
          // If no capability filters are active, we don't filter by them (passes through)
          // If any are active, the facility must match AT LEAST ONE of the active filters

          const capabilityCriteria: { key: string; check: (p: HealthFacilityProperties) => boolean }[] = [
            { key: 'isHwc', check: (p) => isTrue(p.hwc) },
            { key: 'hasDelivery', check: (p) => isTrue(p.delivery_p) },
            { key: 'isFru', check: (p) => !!p.fru },
            { key: 'is24x7', check: (p) => String(p.timing_of_ || '').includes('24x7') },
            { key: 'hasBloodBank', check: (p) => isTrue(p.blood_bank) },
            { key: 'hasBloodStorage', check: (p) => isTrue(p.blood_stor) },
            { key: 'hasSncu', check: (p) => isTrue(p.sncu) },
            { key: 'hasNbsu', check: (p) => isTrue(p.nbsu) },
            { key: 'hasDeic', check: (p) => isTrue(p.deic) },
            { key: 'hasCt', check: (p) => isTrue(p.ct) },
            { key: 'hasMri', check: (p) => isTrue(p.mri) },
            { key: 'hasDialysis', check: (p) => isTrue(p.dialysis_c) },
            { key: 'hasCbnaat', check: (p) => isTrue(p.cbnaat_sit) },
            { key: 'hasTeleConsultation', check: (p) => isTrue(p.tele_v_car) },
            { key: 'hasStemiHub', check: (p) => isTrue(p.stemi_hubs) },
            { key: 'hasStemiSpoke', check: (p) => isTrue(p.stemi_spok) },
            { key: 'hasCathLab', check: (p) => isTrue(p.cath_lab_m) }
          ];

          const activeCriteria = capabilityCriteria.filter(c => filters[c.key as keyof typeof filters] === true);

          if (activeCriteria.length > 0) {
            const matchesAny = activeCriteria.some(c => c.check(p as HealthFacilityProperties));
            if (!matchesAny) return false;
          }

          return true;
        });

        // Calculate Summary
        const countsByType: Record<string, number> = {};
        const countsByCapability: Record<string, number> = {
          hwc: 0, delivery: 0, fru: 0, t24x7: 0,
          blood_bank: 0, blood_stor: 0,
          sncu: 0, nbsu: 0, deic: 0,
          ct: 0, mri: 0, dialysis: 0, cbnaat: 0, tele: 0,
          stemi_hub: 0, stemi_spoke: 0, cath_lab: 0
        };

        filtered.forEach(f => {
          const p = f.properties;
          const t = String(p.facility_t || 'Unknown');
          countsByType[t] = (countsByType[t] || 0) + 1;

          if (isTrue(p.hwc)) countsByCapability.hwc++;
          if (isTrue(p.delivery_p)) countsByCapability.delivery++;
          if (p.fru) countsByCapability.fru++;
          if (String(p.timing_of_ || '').includes('24x7')) countsByCapability.t24x7++;
          if (isTrue(p.blood_bank)) countsByCapability.blood_bank++;
          if (isTrue(p.blood_stor)) countsByCapability.blood_stor++;
          if (isTrue(p.sncu)) countsByCapability.sncu++;
          if (isTrue(p.nbsu)) countsByCapability.nbsu++;
          if (isTrue(p.deic)) countsByCapability.deic++;
          if (isTrue(p.ct)) countsByCapability.ct++;
          if (isTrue(p.mri)) countsByCapability.mri++;
          if (isTrue(p.dialysis_c)) countsByCapability.dialysis++;
          if (isTrue(p.cbnaat_sit)) countsByCapability.cbnaat++;
          if (isTrue(p.tele_v_car)) countsByCapability.tele++;
          if (isTrue(p.stemi_hubs)) countsByCapability.stemi_hub++;
          if (isTrue(p.stemi_spok)) countsByCapability.stemi_spoke++;
          if (isTrue(p.cath_lab_m)) countsByCapability.cath_lab++;
        });

        const summary = {
          name: scope === 'STATE' ? 'Statewide (Priority)' : (scope === 'DISTRICT' ? (district || 'Selected District') : `Pincode ${pincode}`),
          scope,
          total: filtered.length,
          countsByType,
          countsByCapability,
          activeFilters: Object.entries(filters)
            .filter(([, v]) => v !== null && (Array.isArray(v) ? v.length > 0 : (v !== 'All' && v !== false)))
            .flatMap(([k, v]) => {
              if (k === 'facilityTypes' && Array.isArray(v)) return v;
              return [k];
            }),
          district,
          pincode
        };

        // Thinned Payload for Map
        const thinnedFeatures = filtered.map((f, idx) => ({
          type: 'Feature',
          id: f.id || idx,
          geometry: f.geometry,
          properties: {
            ogc_fid: f.properties.ogc_fid,
            nin_number: f.properties.nin_number || f.properties.nin,
            facility_n: f.properties.facility_n || f.properties.name,
            facility_t: f.properties.facility_t || f.properties.type,
            district_n: f.properties.district_n || f.properties.district,
            hwc: f.properties.hwc,
            delivery_p: f.properties.delivery_p
          }
        }));

        self.postMessage({
          type: 'HEALTH_FILTERED',
          payload: {
            features: thinnedFeatures,
            summary,
            scope
          }
        });
      } catch (err) {
        console.error('[Worker] Error filtering health:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to filter health data' });
      }
      break;
    }

/**
 * Global search via Google Geocoding API
 */
async function fetchGoogleGeocode(query: string): Promise<any[]> {
  if (query.length < 4) return [];

  try {
    // We now route the request through our secure Firebase Cloud Function proxy
    // to prevent the API key from being exposed to the client.
    // In production, this resolves to the same domain via Firebase rewrites.
    // In dev, you'll need the Firebase Emulators running, or it defaults to production URL if not available locally.
    
    // We determine the origin to handle dev vs prod environments correctly
    const origin = self.location.origin.includes('localhost') 
      ? 'http://127.0.0.1:5001/namma-map-407ca/asia-south1/geocodeAddress' 
      : '/api/geocode';

    const url = `${origin}?address=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.results.map((res: any) => {
        const mainText = res.address_components[0]?.long_name || res.formatted_address;
        const secondaryText = res.formatted_address.replace(mainText + ', ', '').replace(mainText, '');

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [res.geometry.location.lng, res.geometry.location.lat]
          },
          properties: {
            name: res.formatted_address,
            main_text: mainText,
            secondary_text: secondaryText || 'Tamil Nadu, India',
            place_id: res.place_id,
            lat: res.geometry.location.lat,
            lng: res.geometry.location.lng,
            viewport: res.geometry.viewport,
            bounds: res.geometry.bounds
          },
          score: 40, // Base score for global matches, lower than exact local matches
          suggestionType: 'GLOBAL_PLACE'
        };
      });
    }
  } catch (e) {
    console.warn('[Worker] Google Geocode failed', e);
  }
  return [];
}


    case 'GET_SUGGESTIONS': {
      const { query, activeLayer } = payload;
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: [] });
        return;
      }

      interface ScoredSuggestion extends GisFeature {
        score: number;
      }

      const allScored: ScoredSuggestion[] = [];

      // Helper to calculate a simple match score
      const getScore = (text: string, query: string): number => {
        const t = text.toLowerCase();
        if (t === query) return 100;
        if (t.startsWith(query)) return 80;
        if (t.includes(query)) return 50;
        return 0;
      };

      // 0. Coordinate Detection
      // Check for raw coordinates: "lat, lng"
      const coordMatch = q.match(/^([-+]?\d+\.?\d*),\s*([-+]?\d+\.?\d*)$/);
      let detectedCoords: { lat: number; lng: number } | null = null;

      if (coordMatch) {
        detectedCoords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
      } else {
        // Check for Google Maps URL
        detectedCoords = extractCoordinatesFromUrl(query); // Use raw query for URL parsing
      }

      if (detectedCoords && !isNaN(detectedCoords.lat) && !isNaN(detectedCoords.lng)) {
        allScored.push({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [detectedCoords.lng, detectedCoords.lat] },
          properties: {
            name: `${detectedCoords.lat.toFixed(6)}, ${detectedCoords.lng.toFixed(6)}`,
            lat: detectedCoords.lat,
            lng: detectedCoords.lng
          },
          score: 2000, // Top priority
          suggestionType: 'COORDINATES'
        } as ScoredSuggestion);
      }

      // 1. Search Districts
      if (districtsGeoJson) {
        districtsGeoJson.features.forEach((f: GisFeature) => {
          const props = f.properties;
          const name = (props.district || props.DISTRICT || props.NAME || props.district_n || '').toString();
          const score = getScore(name, q);
          if (score > 0) {
            allScored.push({ ...f, score: score + 10, suggestionType: 'DISTRICT' as const });
          }
        });
      }

      // 2. Search Pincodes
      if (pincodesGeoJson) {
        pincodesGeoJson.features.forEach((f: GisFeature) => {
          const pin = (f.properties.PIN_CODE || f.properties.pincode || '').toString();
          const office = (f.properties.search_string as string || f.properties.office_name as string || '');
          const pinScore = pin.startsWith(q) ? 90 : (pin.includes(q) ? 40 : 0);
          const officeScore = getScore(office, q);
          const finalScore = Math.max(pinScore, officeScore);
          if (finalScore > 0) {
            allScored.push({ ...f, score: finalScore, suggestionType: 'PINCODE' as const });
          }
        });
      }

      if (activeLayer === 'HEALTH') {
        if (healthSearchIndex) {
          const tierWeights: Record<string, number> = {
            'MCH': 1.5,
            'DH': 1.4,
            'SDH': 1.3,
            'CHC': 1.1,
            'PHC': 1.0,
            'HSC': 0.5
          };

          healthSearchIndex.forEach(facility => {
            const name = facility[0].toString();
            const type = facility[3].toString();
            const nin = (facility[8] || '').toString();

            let finalScore = getScore(name, q);
            const ninScore = nin === q ? 100 : (nin.includes(q) ? 70 : 0);
            finalScore = Math.max(finalScore, ninScore);

            if (finalScore > 0) {
              // Exact match bonus
              if (name.toLowerCase() === q) finalScore += 20;

              // Tier boost
              const boost = tierWeights[type] || 1.0;
              finalScore *= boost;

              // HSC suppression for broad/short queries
              if (type === 'HSC' && q.length < 4) {
                finalScore *= 0.2;
              }

              if (finalScore > 5) { // Filter out low quality matches
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [facility[5], facility[4]] },
                  properties: {
                    facility_n: name,
                    district_n: facility[1],
                    facility_t: type,
                    nin_number: facility[8],
                    location_t: facility[6],
                    block_name: facility[2]
                  },
                  score: finalScore,
                  suggestionType: 'HEALTH_FACILITY' as const
                } as ScoredSuggestion);
              }
            }
          });
        }
      } else {
        // Search other layer-specific items
        // 3. Search TNEB Offices from Index
        if (activeLayer === 'TNEB' && tnebSearchIndex) {
          tnebSearchIndex.forEach(section => {
            const [name, sectionCode, circleCode, lat, lng, district] = section;
            const nameScore = getScore(name, q);
            const codeScore = sectionCode.toString().includes(q) ? 70 : 0;
            const finalScore = Math.max(nameScore, codeScore);

            if (finalScore > 0) {
              allScored.push({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {
                  section_na: name,
                  section_co: sectionCode,
                  circle_cod: circleCode,
                  district,
                  office_location: [lng, lat] as [number, number]
                },
                score: finalScore + 5,
                suggestionType: 'TNEB_SECTION' as const
              } as ScoredSuggestion);
            }
          });
        }

        // 4. Search PDS Shops from Index
        if (activeLayer === 'PDS' && pdsIndex) {
          // Optimization: If query is short, don't scan all 30k shops
          // Unless it's a numeric shop code
          const isNumeric = /^\d+$/.test(q);
          const minLen = isNumeric ? 3 : 4;
          
          if (q.length >= minLen) {
            pdsIndex.forEach(shop => {
              const shopCode = shop[0].toString();
              const name = shop[1].toString();
              
              // Shop codes are high priority
              if (isNumeric && shopCode.startsWith(q)) {
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [shop[5], shop[4]] },
                  properties: { shop_code: shop[0], name: shop[1], taluk: shop[2], district: shop[3], office_location: [shop[5], shop[4]] as [number, number] },
                  score: 95,
                  suggestionType: 'PDS_SHOP' as const
                } as ScoredSuggestion);
                return;
              }

              const nameScore = getScore(name, q);
              if (nameScore > 0) {
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [shop[5], shop[4]] },
                  properties: { shop_code: shop[0], name: shop[1], taluk: shop[2], district: shop[3], office_location: [shop[5], shop[4]] as [number, number] },
                  score: nameScore,
                  suggestionType: 'PDS_SHOP' as const
                } as ScoredSuggestion);
              }
            });
          }
        }

        // 5. Search Constituencies
        if (activeLayer === 'CONSTITUENCY') {
          if (acGeoJson) {
            acGeoJson.features.forEach((f: GisFeature) => {
              const name = (f.properties.assembly_c as string || '');
              const score = getScore(name, q);
              if (score > 0) {
                allScored.push({ ...f, score: score + 2, suggestionType: 'CONSTITUENCY' as const });
              }
            });
          }
          if (pcGeoJson) {
            pcGeoJson.features.forEach((f: GisFeature) => {
              const name = (f.properties.parliame_1 as string || '');
              const score = getScore(name, q);
              if (score > 0) {
                allScored.push({ ...f, score: score + 1, suggestionType: 'CONSTITUENCY' as const });
              }
            });
          }
        }

        // 6. Search Police Stations from Index
        if (activeLayer === 'POLICE' && policeSearchIndex) {
          policeSearchIndex.forEach(station => {
            const [name, psCode, lat, lng, district] = station;
            const nameScore = getScore(name, q);
            const codeScore = psCode.toString().includes(q) ? 90 : 0;
            const finalScore = Math.max(nameScore, codeScore);

            if (finalScore > 0) {
              // Infer code if empty (common in Chennai data)
              const finalCode = psCode || extractPoliceCode(name);

              allScored.push({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {
                  name,
                  ps_name: name,
                  ps_code: finalCode,
                  district,
                  station_location: [lng, lat] as [number, number]
                },
                score: finalScore + 8,
                suggestionType: 'POLICE_STATION' as const
              } as ScoredSuggestion);
            }
          });
        }
      }

      // 7. Global Fallback (only if local results are low or query is complex)
      if (q.length > 3 && allScored.length < 10) {
        const globalResults = await fetchGoogleGeocode(query);
        globalResults.forEach(res => allScored.push(res as any));
      }

      // Final sort and limit
      const finalSuggestions = allScored
        .sort((a, b) => b.score - a.score)
        .slice(0, 15); // Show more results now that we have categories

      self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: finalSuggestions });
      break;
    }

    case 'SELECT_SUGGESTION': {
      const { suggestion, layer } = payload;
      if (layer === 'LOCAL_BODIES_V2' && suggestion.geometry) {
        // Resolve via centroid for any suggestion type (PINCODE, DISTRICT, etc.)
        const centroid = getCentroid(suggestion.geometry);
        await handleLocalBodyV2Resolution(centroid[1], centroid[0], false);
      }
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
        const data = await fetchWithRetry(`/data/pds_by_district/${pdsFileName}.json`) as GisFeatureCollection;

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
          const [dataAc, dataPc] = await Promise.all([
            fetchWithRetry('/data/tn_assembly_constituencies.topojson'),
            fetchWithRetry('/data/tn_parliamentary_constituencies.topojson')
          ]);

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
        if (!policeSearchIndex) {
          const [indexData, resVal] = await Promise.all([
            fetchWithRetry('/data/police_index.json'),
            fetch('/data/police_validation.json').catch(() => null)
          ]);

          policeSearchIndex = indexData;

          if (resVal && resVal.ok) {
            const contentType = resVal.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              policeValidation = await resVal.json();
            }
          }

          if (!policeStationsGeoJson) {
            policeStationsGeoJson = { type: 'FeatureCollection', features: [] };
          }

          // Build RBush from index for statewide proximity search
          policeStationsIndex.load(
            policeSearchIndex!.map(s => ({
              minX: s[3], minY: s[2], maxX: s[3], maxY: s[2],
              feature: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [s[3], s[2]] },
                properties: { ps_name: s[0], ps_code: s[1], district: s[4], station_location: [s[3], s[2]] }
              } as GisFeature
            }))
          );
        }
        self.postMessage({ type: 'POLICE_LOADED', payload: { boundaries: policeBoundariesGeoJson, stations: policeStationsGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading Police index:', err);
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

    case 'RESOLVE_HEALTH_FACILITY': {
      const { id, nin, district } = payload;
      let found: GisFeature | null = null;

      if (district && loadedHealthDistricts.has(district)) {
        found = loadedHealthDistricts.get(district)!.features.find(f =>
          (f.id === id) || (f.properties.nin_number === nin) || (f.properties.ogc_fid === id)
        ) || null;
      }

      if (!found && healthPriorityGeoJson) {
        found = healthPriorityGeoJson.features.find(f =>
          (f.id === id) || (f.properties.nin_number === nin) || (f.properties.ogc_fid === id)
        ) || null;
      }

      self.postMessage({ type: 'HEALTH_FACILITY_RESOLVED', payload: found });
      break;
    }

    case 'LOAD_LOCAL_BODIES_V2':
      try {
        console.log('[Worker] Loading Local Bodies V2 base layers...');
        const [corpRaw, muniRaw, tpRaw] = await Promise.all([
          fetchWithRetry('/data/local_bodies/corporation.json'),
          fetchWithRetry('/data/local_bodies/municipality.json'),
          fetchWithRetry('/data/local_bodies/town_panchayat.json')
        ]);

        // All three files are TopoJSON — convert to GeoJSON before indexing
        const corpGeoJson = topojson.feature(corpRaw, corpRaw.objects.Corporation) as unknown as GisFeatureCollection;
        const muniGeoJson = topojson.feature(muniRaw, muniRaw.objects.Municipality) as unknown as GisFeatureCollection;
        const tpGeoJson = topojson.feature(tpRaw, tpRaw.objects.Town_Panchayat) as unknown as GisFeatureCollection;

        const loadToLayer = (data: GisFeatureCollection, index: RBush<SpatialItem>) => {
          const items: SpatialItem[] = data.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => ({
              ...getBBox(f.geometry),
              feature: f
            }));
          index.clear();
          index.load(items);
        };

        loadToLayer(corpGeoJson, localBodyIndexes.CORPORATION);
        loadToLayer(muniGeoJson, localBodyIndexes.MUNICIPALITY);
        loadToLayer(tpGeoJson, localBodyIndexes.TOWN_PANCHAYAT);

        console.log(`[Worker] Corp: ${localBodyIndexes.CORPORATION.all().length}, Muni: ${localBodyIndexes.MUNICIPALITY.all().length}, TP: ${localBodyIndexes.TOWN_PANCHAYAT.all().length}`);
        self.postMessage({ type: 'LOCAL_BODIES_V2_LOADED' });
        console.log('[Worker] Local Bodies V2 base layers indexed.');
      } catch (err) {
        console.error('[Worker] Error loading Local Bodies V2:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load local body data' });
      }
      break;

    case 'PREFETCH':
      if (payload && Array.isArray(payload.urls)) {
        payload.urls.forEach((url: string) => {
          fetchWithRetry(url).catch(err => console.warn(`[Worker] Prefetch failed for ${url}:`, err));
        });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export { };
