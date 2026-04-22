import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/useMapStore';

export const useGisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { setPdsData, setActiveDistrict, setJurisdictionDetails, setIsResolving, setSearchSuggestions, setSearchResult, setSearchQuery, setDistrictsData, setStateBoundaryData } = useMapStore();

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
          setDistrictsData(payload);
          break;
        case 'STATE_BOUNDARY_LOADED':
          setStateBoundaryData(payload);
          break;
        case 'SUGGESTIONS_RESULT':
          setSearchSuggestions(payload);
          break;
        case 'RESOLUTION_RESULT':
          if (payload) {
            if (payload.layer === 'TNEB') {
              setSearchResult(null); // Clear previous pincode search boundary FIRST
              setJurisdictionDetails(payload.properties, payload.geometry); // THEN set TNEB details
              setSearchQuery(''); // Clear search box
            } else if (payload.layer === 'PINCODE' || payload.layer === 'PDS') {
              setSearchResult({ type: 'Feature', properties: payload.properties, geometry: payload.geometry });
              setJurisdictionDetails(null, null); // Clear TNEB if switching
              
              if (payload.layer === 'PDS') {
                const district = payload.properties.district || payload.properties.DISTRICT || payload.properties.DISTRICT_NAME || payload.properties.NAME;
                if (district) {
                  workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: payload.geometry } });
                }
              }
            }
          } else {
            setJurisdictionDetails(null, null);
            setSearchResult(null);
          }
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

  const loadDistricts = () => workerRef.current?.postMessage({ type: 'LOAD_DISTRICTS' });
  const loadStateBoundary = () => workerRef.current?.postMessage({ type: 'LOAD_STATE_BOUNDARY' });
  const loadPincodes = () => workerRef.current?.postMessage({ type: 'LOAD_PINCODES' });
  const loadTneb = () => workerRef.current?.postMessage({ type: 'LOAD_TNEB' });

  const resolveLocation = useCallback((lat: number, lng: number, layer: string) => {
    setIsResolving(true);
    setSearchResult(null); // Clear previous search focus immediately
    workerRef.current?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng, layer }
    });
  }, [setSearchResult, setIsResolving]);

  const getSuggestions = (query: string) => {
    workerRef.current?.postMessage({ type: 'GET_SUGGESTIONS', payload: query });
  };

  const selectSuggestion = (feature: any) => {
    setSearchResult(feature);
    const district = feature.properties.district || feature.properties.DISTRICT || feature.properties.DISTRICT_NAME || feature.properties.NAME;
    if (district) {
      workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: feature.geometry } });
    }
  };

  return { isReady, loadDistricts, loadStateBoundary, loadPincodes, loadTneb, resolveLocation, getSuggestions, selectSuggestion };
};
