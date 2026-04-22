import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { GisFeature, Geometry } from '../types/gis';

export const useGisWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { 
    setPdsData, 
    setActiveDistrict, 
    setJurisdictionDetails, 
    setIsResolving, 
    setSearchSuggestions, 
    setSearchResult, 
    setSearchQuery, 
    setDistrictsData, 
    setStateBoundaryData 
  } = useMapStore();

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
            const { keepSelection } = payload;
            if (payload.layer === 'TNEB') {
              setSearchResult(null, keepSelection);
              setJurisdictionDetails(payload.properties, payload.geometry);
              const sectionName = payload.properties.section_na || payload.properties.section_office || '';
              setSearchQuery(sectionName);
            } else if (payload.layer === 'PINCODE' || payload.layer === 'PDS') {
              setSearchResult({ type: 'Feature', properties: payload.properties, geometry: payload.geometry }, keepSelection, true);
              
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
  }, [
    setActiveDistrict, 
    setDistrictsData, 
    setIsResolving, 
    setJurisdictionDetails, 
    setPdsData, 
    setSearchQuery, 
    setSearchResult, 
    setSearchSuggestions, 
    setStateBoundaryData
  ]);

  const loadDistricts = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_DISTRICTS' }), []);
  const loadStateBoundary = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_STATE_BOUNDARY' }), []);
  const loadPincodes = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_PINCODES' }), []);
  const loadTneb = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_TNEB' }), []);

  const resolveLocation = useCallback((lat: number, lng: number, layer: string, keepSelection: boolean = false) => {
    setIsResolving(true);
    setSearchResult(null, keepSelection);
    workerRef.current?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng, layer, keepSelection }
    });
  }, [setSearchResult, setIsResolving]);

  const getSuggestions = useCallback((query: string, layer: string) => {
    workerRef.current?.postMessage({ type: 'GET_SUGGESTIONS', payload: { query, layer } });
  }, []);

  const selectSuggestion = useCallback((item: GisFeature, activeLayer: string) => {
    if (item.suggestionType === 'TNEB_SECTION') {
      const [lng, lat] = item.geometry.type === 'Point' 
        ? (item.geometry.coordinates as [number, number])
        : (item.properties.office_location as [number, number] || [78.6569, 11.1271]); // Fallback
      resolveLocation(lat, lng, 'TNEB');
    } else {
      // PINCODE or Area
      setSearchResult(item);
      const district = item.properties.district || item.properties.DISTRICT || item.properties.DISTRICT_NAME || item.properties.NAME;
      if (district && activeLayer === 'PDS') {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: item.geometry } });
      }
    }
  }, [resolveLocation, setSearchResult]);

  const loadPds = useCallback((district: string, boundary: Geometry) => {
    workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary } });
  }, []);

  return { isReady, loadDistricts, loadStateBoundary, loadPincodes, loadTneb, loadPds, resolveLocation, getSuggestions, selectSuggestion };
};
