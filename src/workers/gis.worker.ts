import * as topojson from 'topojson-client';

let districtsGeoJson: any = null;
let pincodesGeoJson: any = null;
let tnebGeoJson: any = null;
let loadedPds: Map<string, any> = new Map();

/**
 * Robust Point-in-Polygon (Ray Casting)
 */
function isPointInPolygon(point: [number, number], vs: [number, number][][]) {
  const x = point[0], y = point[1];
  let inside = false;
  
  // Handle MultiPolygon (array of arrays of rings)
  for (let i = 0; i < vs.length; i++) {
    const ring = vs[i];
    for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) {
      const xi = ring[j][0], yi = ring[j][1];
      const xj = ring[k][0], yj = ring[k][1];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    // If we're inside the outer ring and not in any inner ring (holes), we'd return.
    // For simplicity, we assume the first ring is outer and others are holes.
    // However, basic Ray Casting on all rings works for non-intersecting rings.
  }
  return inside;
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
          const response = await fetch('/data/tn_districts.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          districtsGeoJson = topojson.feature(data, data.objects[objectName]);
        }
        self.postMessage({ type: 'DISTRICTS_LOADED', payload: districtsGeoJson });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load district data' });
      }
      break;

    case 'LOAD_TNEB':
      try {
        if (!tnebGeoJson) {
          const response = await fetch('/data/tneb_boundaries.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          tnebGeoJson = topojson.feature(data, data.objects[objectName]);
        }
        self.postMessage({ type: 'TNEB_LOADED', payload: tnebGeoJson });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load TNEB data' });
      }
      break;

    case 'RESOLVE_LOCATION':
      const { lat, lng } = payload;
      if (!tnebGeoJson) {
        self.postMessage({ type: 'ERROR', payload: 'TNEB data not loaded' });
        return;
      }

      // Simple linear scan for now. 
      // Optimization: Bounding Box check first.
      const found = tnebGeoJson.features.find((f: any) => {
        const geometry = f.geometry;
        if (geometry.type === 'Polygon') {
          return isPointInPolygon([lng, lat], geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
          return geometry.coordinates.some((poly: any) => isPointInPolygon([lng, lat], poly));
        }
        return false;
      });

      self.postMessage({ type: 'RESOLUTION_RESULT', payload: found ? found.properties : null });
      break;

    case 'LOAD_PINCODES':
      // Existing pincode logic...
      try {
        if (!pincodesGeoJson) {
          const response = await fetch('/data/tn_pincodes.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          pincodesGeoJson = topojson.feature(data, data.objects[objectName]);
        }
        self.postMessage({ type: 'PINCODES_LOADED', payload: pincodesGeoJson });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load pincode data' });
      }
      break;

    case 'SEARCH_PINCODE':
      if (!pincodesGeoJson) return;
      const query = payload.toLowerCase();
      const result = pincodesGeoJson.features.find((f: any) => {
        const pin = f.properties.PIN_CODE || f.properties.pincode;
        return pin && pin.toString() === query;
      });
      if (result) {
        self.postMessage({ type: 'SEARCH_RESULT', payload: result });
        const district = result.properties.district || result.properties.DISTRICT;
        if (district) self.postMessage({ type: 'AUTO_TRIGGER_PDS', payload: district });
      } else {
        self.postMessage({ type: 'SEARCH_RESULT', payload: null });
      }
      break;

    case 'LOAD_PDS':
      // Existing PDS logic...
      const districtName = payload;
      if (loadedPds.has(districtName)) {
        self.postMessage({ type: 'PDS_LOADED', payload: { district: districtName, data: loadedPds.get(districtName) } });
        return;
      }
      try {
        const response = await fetch(`/data/pds/${districtName}.json`);
        const data = await response.json();
        loadedPds.set(districtName, data);
        self.postMessage({ type: 'PDS_LOADED', payload: { district: districtName, data } });
      } catch (error) {
        console.error(`[Worker] Failed to load PDS for ${districtName}:`, error);
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
