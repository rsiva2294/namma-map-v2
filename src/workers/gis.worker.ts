import * as topojson from 'topojson-client';

let districtsGeoJson: any = null;
let pincodesGeoJson: any = null;
let loadedPds: Map<string, any> = new Map();

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

    case 'LOAD_PINCODES':
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

    case 'LOAD_PDS':
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

    case 'SEARCH_PINCODE':
      if (!pincodesGeoJson) return;
      
      const query = payload.toLowerCase();
      const result = pincodesGeoJson.features.find((f: any) => {
        const pin = f.properties.PIN_CODE || f.properties.pincode;
        return pin && pin.toString() === query;
      });

      if (result) {
        self.postMessage({ type: 'SEARCH_RESULT', payload: result });
        
        // Auto-load PDS if district is known
        const district = result.properties.district || result.properties.DISTRICT;
        if (district) {
          // Normalize district name if needed (e.g. "SOUTH CHENNAI" -> "South Chennai")
          // For now, assume they match or need basic title-casing
          self.postMessage({ type: 'AUTO_TRIGGER_PDS', payload: district });
        }
      } else {
        self.postMessage({ type: 'SEARCH_RESULT', payload: null });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
