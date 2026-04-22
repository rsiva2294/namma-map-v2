import { useEffect, useRef, useState } from 'react';

export const useGisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [districts, setDistricts] = useState<any>(null);
  const [pincodes, setPincodes] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<any>(null);

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
        case 'PINCODES_LOADED':
          setPincodes(payload);
          break;
        case 'SEARCH_RESULT':
          setSearchResult(payload);
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

  const searchPincode = (query: string) => {
    workerRef.current?.postMessage({ type: 'SEARCH_PINCODE', payload: query });
  };

  return { 
    isReady, 
    districts, 
    pincodes, 
    searchResult, 
    loadDistricts, 
    loadPincodes, 
    searchPincode 
  };
};
