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
    setStateBoundaryData,
    setNoDataFound,
    setActiveLayer
  } = useMapStore();

  const loadDistricts = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_DISTRICTS' }), []);
  const loadStateBoundary = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_STATE_BOUNDARY' }), []);
  const loadPdsIndex = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_PDS_INDEX' }), []);
  const loadPincodes = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_PINCODES' }), []);
  const loadTneb = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_TNEB' }), []);

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
          if (payload && payload.found !== false) {
            const { keepSelection } = payload;
            setNoDataFound(false);
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
            const { lat, lng, isInsideState } = payload || {};
            if (isInsideState) {
              setNoDataFound(true, lat && lng ? { lat, lng } : null);
            } else {
              setNoDataFound(false);
            }
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
    setStateBoundaryData,
    setNoDataFound,
    loadPdsIndex
  ]);


  const resolveLocation = useCallback((lat: number, lng: number, layer: string, keepSelection: boolean = false) => {
    setIsResolving(true);
    setSearchResult(null, keepSelection);
    workerRef.current?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng, layer, keepSelection }
    });
  }, [setSearchResult, setIsResolving]);

  const getSuggestions = useCallback((query: string) => {
    workerRef.current?.postMessage({ type: 'GET_SUGGESTIONS', payload: { query } });
  }, []);

  const selectSuggestion = useCallback((item: GisFeature, currentLayer: string) => {
    if (item.suggestionType === 'TNEB_SECTION') {
      if (currentLayer !== 'TNEB') setActiveLayer('TNEB');
      const [lng, lat] = item.geometry.type === 'Point' 
        ? (item.geometry.coordinates as [number, number])
        : (item.properties.office_location as [number, number] || [78.6569, 11.1271]); // Fallback
      resolveLocation(lat, lng, 'TNEB');
    } else if (item.suggestionType === 'PDS_SHOP') {
      if (currentLayer !== 'PDS') setActiveLayer('PDS');
      const [lng, lat] = item.geometry.type === 'Point' 
        ? (item.geometry.coordinates as [number, number])
        : (item.properties.office_location as [number, number] || [78.6569, 11.1271]); // Fallback
      const district = item.properties.district as string;
      if (district) {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: null } });
      }
      // Trigger resolution for the shop itself to show the card
      resolveLocation(lat, lng, 'PDS');
    } else if (item.suggestionType === 'DISTRICT') {
      // Switch to PINCODE if we want to show the district boundary in that layer context
      // or PDS if that was the intent. For now, stay in current layer but focus district.
      setSearchResult(item);
      const district = (item.properties.district || item.properties.DISTRICT || item.properties.NAME || '').toString();
      if (district && currentLayer === 'PDS') {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: item.geometry } });
      }
    } else {
      // PINCODE or Area
      if (currentLayer === 'TNEB') setActiveLayer('PINCODE');
      setSearchResult(item);
      const district = item.properties.district || item.properties.DISTRICT || item.properties.DISTRICT_NAME || item.properties.NAME;
      const targetLayer = (currentLayer === 'TNEB') ? 'PINCODE' : currentLayer;
      if (district && targetLayer === 'PDS') {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: item.geometry } });
      }
    }
  }, [resolveLocation, setSearchResult, setActiveLayer]);

  const loadPds = useCallback((district: string, boundary: Geometry) => {
    workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary } });
  }, []);

  return { isReady, loadDistricts, loadStateBoundary, loadPdsIndex, loadPincodes, loadTneb, loadPds, resolveLocation, getSuggestions, selectSuggestion };
};
