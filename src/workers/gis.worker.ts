import * as topojson from 'topojson-client';

let districtsGeoJson: any = null;
let pincodesGeoJson: any = null;

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

    case 'SEARCH_PINCODE':
      if (!pincodesGeoJson) {
        self.postMessage({ type: 'ERROR', payload: 'Pincode data not loaded' });
        return;
      }
      
      const query = payload.toLowerCase();
      // Searching by properties.PIN_CODE or properties.pincode
      const result = pincodesGeoJson.features.find((f: any) => {
        const pin = f.properties.PIN_CODE || f.properties.pincode || f.properties.pincode_id;
        return pin && pin.toString() === query;
      });

      if (result) {
        self.postMessage({ type: 'SEARCH_RESULT', payload: result });
      } else {
        self.postMessage({ type: 'SEARCH_RESULT', payload: null });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
