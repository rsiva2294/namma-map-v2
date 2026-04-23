import * as topojson from 'topojson-client';
import RBush from 'rbush';
import type { 
  GisFeature, 
  GisFeatureCollection, 
  Geometry,
  Position,
  Polygon,
  MultiPolygon
} from '../types/gis';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: GisFeature;
}

let districtsGeoJson: GisFeatureCollection | null = null;
let stateBoundaryGeoJson: GisFeatureCollection | null = null;
let pdsIndex: [string, string, string, string, number, number][] | null = null;
let pincodesGeoJson: GisFeatureCollection | null = null;
let tnebGeoJson: GisFeatureCollection | null = null;
let tnebOffices: GisFeatureCollection | null = null;
let acGeoJson: GisFeatureCollection | null = null;
let pcGeoJson: GisFeatureCollection | null = null;
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

// R-trees for spatial indexing
const pincodesIndex = new RBush<SpatialItem>();
const tnebIndex = new RBush<SpatialItem>();
const stateBoundaryIndex = new RBush<SpatialItem>();
const acIndex = new RBush<SpatialItem>();
const pcIndex = new RBush<SpatialItem>();
const pdsIndexes = new Map<string, RBush<SpatialItem>>();

function getBBox(geometry: Geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
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
  const candidates = index.search({ minX: lng, minY: lat, maxX: lng, maxY: lat });
  
  return candidates.find(item => {
    const geometry = item.feature.geometry;
    if (geometry.type === 'Polygon') return isPointInPolygon([lng, lat], (geometry as Polygon).coordinates);
    if (geometry.type === 'MultiPolygon') return (geometry as MultiPolygon).coordinates.some((poly: Position[][]) => isPointInPolygon([lng, lat], poly));
    return false;
  })?.feature || null;
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
          districtsGeoJson = topojson.feature(data, data.objects[objectName]) as unknown as GisFeatureCollection;
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
          
          // Indexing
          const items: SpatialItem[] = stateBoundaryGeoJson!.features.map((f: GisFeature) => ({
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
        if (!pdsIndex) {
          const response = await fetchWithRetry('/data/pds_index.json');
          pdsIndex = await response.json();
        }
        self.postMessage({ type: 'PDS_INDEX_LOADED' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS index: ${message}` });
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
          tnebGeoJson = topojson.feature(dataBound, dataBound.objects[objectName]) as unknown as GisFeatureCollection;
          tnebOffices = dataOff as GisFeatureCollection;
          
          // Indexing
          const items: SpatialItem[] = tnebGeoJson.features.map((f: GisFeature) => ({
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
          pincodesGeoJson = topojson.feature(data, data.objects[objectName]) as unknown as GisFeatureCollection;
          
          // Indexing
          const items: SpatialItem[] = pincodesGeoJson.features.map((f: GisFeature) => ({
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
          .filter((f: GisFeature) => (f.properties.district || f.properties.DISTRICT || f.properties.NAME || '').toString().toLowerCase().includes(q))
          .slice(0, 2)
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

      self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: suggestions.slice(0, 8) });
      break;
    }

    case 'LOAD_PDS': {
      const { district: districtName, boundary } = payload;

      const processAndSendPds = (data: GisFeatureCollection) => {
        let filteredFeatures = data.features;
        if (boundary) {
          // Use R-tree for filtering PDS shops within boundary
          const districtIndex = pdsIndexes.get(districtName);
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
        self.postMessage({ type: 'PDS_LOADED', payload: { district: districtName, data: { ...data, features: filteredFeatures } } });
      };

      if (loadedPds.has(districtName)) {
        processAndSendPds(loadedPds.get(districtName)!);
        return;
      }
      try {
        const response = await fetchWithRetry(`/data/pds/${districtName}.json`);
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
        pdsIndexes.set(districtName, districtIndex);
        
        loadedPds.set(districtName, data);
        processAndSendPds(data);
      } catch (err) {
        console.error(`[Worker] Failed to load PDS for ${districtName}:`, err);
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
          
          // Indexing
          acIndex.load(acGeoJson.features.map(f => ({ ...getBBox(f.geometry), feature: f })));
          pcIndex.load(pcGeoJson.features.map(f => ({ ...getBBox(f.geometry), feature: f })));
        }
        self.postMessage({ type: 'CONSTITUENCIES_LOADED', payload: { ac: acGeoJson, pc: pcGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading constituencies:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load constituency data' });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
