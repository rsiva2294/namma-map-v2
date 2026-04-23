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
    setActiveLayer,
    setAcData,
    setPcData,
    setConstituencyType,
    setPoliceBoundariesData,
    setPoliceStationsData,
    setSelectedPoliceStation,
    setPoliceResolution,
    setSelectedPostalOffices
  } = useMapStore();

  const loadDistricts = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_DISTRICTS' }), []);
  const loadStateBoundary = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_STATE_BOUNDARY' }), []);
  const loadPdsIndex = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_PDS_INDEX' }), []);
  const loadPincodes = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_PINCODES' }), []);
  const loadTneb = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_TNEB' }), []);
  const loadConstituencies = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_CONSTITUENCIES' }), []);
  const loadPoliceData = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_POLICE' }), []);
  const loadPostalOffices = useCallback(() => workerRef.current?.postMessage({ type: 'LOAD_POSTAL_OFFICES' }), []);

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
            } else if (payload.layer === 'POLICE') {
              setSearchResult(null, keepSelection);
              setPoliceResolution(payload);
              const stationName = payload.station?.properties.ps_name || payload.boundary?.properties.police_sta || '';
              setSearchQuery(stationName);
            } else if (payload.layer === 'PINCODE' || payload.layer === 'PDS' || payload.layer === 'CONSTITUENCY') {
              setSearchResult({ type: 'Feature', properties: payload.properties, geometry: payload.geometry }, keepSelection, true);
              
              if (payload.layer === 'PINCODE' && payload.postalOffices) {
                setSelectedPostalOffices(payload.postalOffices);
              }

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
        case 'CONSTITUENCIES_LOADED':
          setAcData(payload.ac);
          setPcData(payload.pc);
          break;
        case 'POLICE_LOADED':
          setPoliceBoundariesData(payload.boundaries);
          setPoliceStationsData(payload.stations);
          break;
        case 'AUTO_TRIGGER_PDS':
          workerRef.current?.postMessage({ type: 'LOAD_PDS', payload });
          break;
        case 'POSTAL_OFFICES_LOADED':
          // Optional: handle if UI needs to know
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
    loadPdsIndex,
    setAcData,
    setPcData,
    setPoliceBoundariesData,
    setPoliceStationsData,
    setSelectedPoliceStation,
    setPoliceResolution,
    setSelectedPostalOffices
  ]);


  const resolveLocation = useCallback((lat: number, lng: number, layer: string, keepSelection: boolean = false, pincode?: string) => {
    setIsResolving(true);
    setSearchResult(null, keepSelection);
    workerRef.current?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng, layer, keepSelection, pincode, constituencyType: useMapStore.getState().constituencyType }
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
      const district = (item.properties.district || item.properties.DISTRICT || item.properties.NAME || item.properties.district_n || item.properties.DISTRICT_NAME || '').toString();
      const targetLayer = currentLayer;
      if (district && targetLayer === 'PDS') {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: item.geometry } });
      }
    } else if (item.suggestionType === 'CONSTITUENCY') {
      if (currentLayer !== 'CONSTITUENCY') setActiveLayer('CONSTITUENCY');
      // Detect if it's AC or PC based on properties
      const isPc = !!item.properties.parliame_1 && !item.properties.assembly_c;
      setConstituencyType(isPc ? 'PC' : 'AC');
      setSearchResult(item);
    } else if (item.suggestionType === 'POLICE_STATION') {
      if (currentLayer !== 'POLICE') setActiveLayer('POLICE');
      const [lng, lat] = item.geometry.type === 'Point' 
        ? (item.geometry.coordinates as [number, number])
        : (item.properties.station_location as [number, number] || [78.6569, 11.1271]); // Fallback
      resolveLocation(lat, lng, 'POLICE');
    } else {
      // PINCODE or Area
      const pin = (item.properties.pin_code || item.properties.PIN_CODE || item.properties.pincode)?.toString();
      
      if (pin && (currentLayer === 'PINCODE' || currentLayer === 'CONSTITUENCY')) {
        resolveLocation(0, 0, currentLayer, false, pin);
      } else {
        setSearchResult(item);
      }

      const district = item.properties.district || item.properties.DISTRICT || item.properties.DISTRICT_NAME || item.properties.NAME;
      if (district && currentLayer === 'PDS') {
        workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: item.geometry } });
      }
    }
  }, [resolveLocation, setSearchResult, setActiveLayer, setConstituencyType]);

  const loadPds = useCallback((district: string, boundary: Geometry) => {
    workerRef.current?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary } });
  }, []);

  return { isReady, loadDistricts, loadStateBoundary, loadPdsIndex, loadPincodes, loadTneb, loadPds, loadConstituencies, loadPoliceData, loadPostalOffices, resolveLocation, getSuggestions, selectSuggestion };
};
