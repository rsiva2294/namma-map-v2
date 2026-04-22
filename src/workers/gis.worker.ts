import * as topojson from 'topojson-client';

let districtsGeoJson: any = null;
let stateBoundaryGeoJson: any = null;
let pincodesGeoJson: any = null;
let tnebGeoJson: any = null;
let tnebOffices: any = null;
let loadedPds: Map<string, any> = new Map();

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

    case 'LOAD_STATE_BOUNDARY':
      try {
        if (!stateBoundaryGeoJson) {
          const response = await fetch('/data/tn_state_boundary.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          stateBoundaryGeoJson = topojson.feature(data, data.objects[objectName]);
        }
        self.postMessage({ type: 'STATE_BOUNDARY_LOADED', payload: stateBoundaryGeoJson });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load state boundary data' });
      }
      break;

    case 'LOAD_TNEB':
      try {
        if (!tnebGeoJson) {
          const [resBound, resOff] = await Promise.all([
            fetch('/data/tneb_boundaries.topojson'),
            fetch('/data/tneb_offices.geojson')
          ]);
          const dataBound = await resBound.json();
          const dataOff = await resOff.json();
          const objectName = Object.keys(dataBound.objects)[0];
          tnebGeoJson = topojson.feature(dataBound, dataBound.objects[objectName]);
          tnebOffices = dataOff;
        }
        self.postMessage({ type: 'TNEB_LOADED' });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load TNEB data' });
      }
      break;

    case 'RESOLVE_LOCATION':
      const { lat, lng, layer } = payload;
      
      if (layer === 'TNEB') {
        if (!tnebGeoJson) return;
        const found = tnebGeoJson.features.find((f: any) => {
          const geometry = f.geometry;
          if (geometry.type === 'Polygon') return isPointInPolygon([lng, lat], geometry.coordinates);
          if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((poly: any) => isPointInPolygon([lng, lat], poly));
          return false;
        });

        if (found) {
          const office = tnebOffices?.features.find((o: any) => {
            const sCoMatch = o.properties.section_co === found.properties.section_co;
            const cCodMatch = o.properties.circle_cod === found.properties.circle_cod;
            const rIdMatch = (o.properties.region_id || o.properties.region_cod) === (found.properties.region_cod || found.properties.region_id);
            return sCoMatch && cCodMatch && rIdMatch;
          });

          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              properties: { ...found.properties, office_location: office?.geometry.coordinates }, 
              geometry: found.geometry,
              layer: 'TNEB'
            } 
          });
        } else {
          self.postMessage({ type: 'RESOLUTION_RESULT', payload: null });
        }
      } else if (layer === 'PINCODE' || layer === 'PDS') {
        if (!pincodesGeoJson) return;
        const found = pincodesGeoJson.features.find((f: any) => {
          const geometry = f.geometry;
          if (geometry.type === 'Polygon') return isPointInPolygon([lng, lat], geometry.coordinates);
          if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((poly: any) => isPointInPolygon([lng, lat], poly));
          return false;
        });

        if (found) {
          self.postMessage({ 
            type: 'RESOLUTION_RESULT', 
            payload: { 
              properties: found.properties, 
              geometry: found.geometry,
              layer: layer
            } 
          });
        } else {
          self.postMessage({ type: 'RESOLUTION_RESULT', payload: null });
        }
      }
      break;

    case 'LOAD_PINCODES':
      try {
        if (!pincodesGeoJson) {
          const response = await fetch('/data/tn_pincodes.topojson');
          const data = await response.json();
          const objectName = Object.keys(data.objects)[0];
          pincodesGeoJson = topojson.feature(data, data.objects[objectName]);
        }
        self.postMessage({ type: 'PINCODES_LOADED' });
      } catch (error) {
        self.postMessage({ type: 'ERROR', payload: 'Failed to load pincode data' });
      }
      break;

    case 'GET_SUGGESTIONS':
      const q = payload.toLowerCase().trim();
      if (!q) {
        self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: [] });
        return;
      }

      let suggestions: any[] = [];

      // Check Pincodes (Numeric)
      if (!isNaN(Number(q))) {
        if (pincodesGeoJson) {
          suggestions = pincodesGeoJson.features.filter((f: any) => {
            const pin = f.properties.PIN_CODE || f.properties.pincode;
            return pin && pin.toString().startsWith(q);
          }).slice(0, 5);
        }
      } else {
        // Check Districts (Text)
        if (districtsGeoJson) {
          suggestions = districtsGeoJson.features.filter((f: any) => {
            const name = (f.properties.district || f.properties.DISTRICT_NAME || f.properties.NAME || '').toLowerCase();
            return name && name.includes(q);
          }).slice(0, 5);
        }
      }

      self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: suggestions });
      break;

    case 'LOAD_PDS':
      const { district: districtName, boundary } = payload;

      const processAndSendPds = (data: any) => {
        let filteredFeatures = data.features;
        if (boundary) {
          filteredFeatures = data.features.filter((f: any) => {
            const point = f.geometry.coordinates; // [lng, lat]
            if (boundary.type === 'Polygon') {
              return isPointInPolygon(point, boundary.coordinates);
            } else if (boundary.type === 'MultiPolygon') {
              return boundary.coordinates.some((poly: any) => isPointInPolygon(point, poly));
            }
            return false;
          });
        }
        self.postMessage({ type: 'PDS_LOADED', payload: { district: districtName, data: { ...data, features: filteredFeatures } } });
      };

      if (loadedPds.has(districtName)) {
        processAndSendPds(loadedPds.get(districtName));
        return;
      }
      try {
        const response = await fetch(`/data/pds/${districtName}.json`);
        const data = await response.json();
        loadedPds.set(districtName, data);
        processAndSendPds(data);
      } catch (error) {
        console.error(`[Worker] Failed to load PDS for ${districtName}:`, error);
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
