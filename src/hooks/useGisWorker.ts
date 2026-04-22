import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/useMapStore';

export const useGisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { setPdsData, setActiveDistrict, setJurisdictionDetails, setIsResolving } = useMapStore();

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
          // Optional: handle state-wide districts
          break;
        case 'SEARCH_RESULT':
          useMapStore.getState().setSearchResult(payload);
          break;
        case 'RESOLUTION_RESULT':
          setJurisdictionDetails(payload);
          setIsResolving(false);
          break;
        case 'PDS_LOADED':
          setPdsData(payload.data);
          setActiveDistrict(payload.district);
          break;
        case 'AUTO_TRIGGER_PDS':
          workerRef.current?.postMessage({ type: 'LOAD_PDS', payload });
          break;
        case 'ERROR':
          console.error('[Worker Error]', payload);
          setIsResolving(false);
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

  const loadTneb = () => {
    workerRef.current?.postMessage({ type: 'LOAD_TNEB' });
  };

  const resolveLocation = (lat: number, lng: number) => {
    setIsResolving(true);
    workerRef.current?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng }
    });
  };

  const searchPincode = (query: string) => {
    workerRef.current?.postMessage({ type: 'SEARCH_PINCODE', payload: query });
  };

  return { 
    isReady, 
    loadDistricts, 
    loadPincodes, 
    loadTneb,
    resolveLocation,
    searchPincode 
  };
};
