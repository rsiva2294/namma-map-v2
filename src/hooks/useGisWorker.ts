import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/useMapStore';

export const useGisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [districts, setDistricts] = useState<any>(null);
  const { setPdsData, setActiveDistrict } = useMapStore();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/gis.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      
      switch (type) {
        case 'READY':
          setIsReady(true);
          break;
        case 'DISTRICTS_LOADED':
          setDistricts(payload);
          break;
        case 'SEARCH_RESULT':
          useMapStore.getState().setSearchResult(payload);
          break;
        case 'PDS_LOADED':
          setPdsData(payload.data);
          setActiveDistrict(payload.district);
          break;
        case 'AUTO_TRIGGER_PDS':
          // Convert "CHENNAI" or similar to Title Case if needed, 
          // or just pass it through if our filenames match
          workerRef.current?.postMessage({ type: 'LOAD_PDS', payload });
          break;
        case 'ERROR':
          console.error('[Worker Error]', payload);
          break;
      }
    };

    workerRef.current.postMessage({ type: 'INIT_DB' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadDistricts = () => {
    workerRef.current?.postMessage({ type: 'LOAD_DISTRICTS' });
  };

  const loadPincodes = () => {
    workerRef.current?.postMessage({ type: 'LOAD_PINCODES' });
  };

  const loadPds = (district: string) => {
    workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: district });
  };

  const searchPincode = (query: string) => {
    workerRef.current?.postMessage({ type: 'SEARCH_PINCODE', payload: query });
  };

  return { 
    isReady, 
    districts, 
    loadDistricts, 
    loadPincodes, 
    loadPds,
    searchPincode 
  };
};
