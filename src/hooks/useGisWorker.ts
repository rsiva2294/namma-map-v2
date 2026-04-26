import { useCallback, useEffect, useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { Geometry, HealthFilters, HealthScope } from '../types/gis';
import { APP_VERSION } from '../constants';

// Singleton worker instance to avoid multiple threads and memory bloat
let sharedWorker: Worker | null = null;
let isWorkerInitialized = false;

/**
 * Initializes the global message listener for the shared worker.
 * This updates the Zustand store directly based on worker messages.
 */
const initializeWorkerListener = () => {
  if (!sharedWorker || isWorkerInitialized) return;

  sharedWorker.onmessage = (e) => {
    const { type, payload } = e.data;
    const state = useMapStore.getState();
    
    switch (type) {
      case 'READY':
        sharedWorker?.postMessage({ type: 'SET_VERSION', payload: { version: APP_VERSION } });
        break;
      case 'DISTRICTS_LOADED':
        state.setDistrictsData(payload);
        break;
      case 'STATE_BOUNDARY_LOADED':
        state.setStateBoundaryData(payload);
        break;
      case 'SUGGESTIONS_RESULT':
        state.setSearchSuggestions(payload);
        break;
      case 'RESOLUTION_RESULT':
        if (payload.layer !== state.activeLayer) return;
        console.log('[Worker -> Store] RESOLUTION_RESULT received:', payload.layer, 'Found:', payload.found);
        
        if (payload && payload.found !== false) {
          const { keepSelection } = payload;
          state.setNoDataFound(false);
          
          if (payload.layer === 'TNEB') {
            state.setSearchResult(null, keepSelection);
            state.setJurisdictionDetails(payload.properties, payload.geometry);
            const sectionName = payload.properties.section_na || payload.properties.section_office || '';
            state.setSearchQuery(sectionName);
          } else if (payload.layer === 'POLICE') {
            state.setSearchResult(null, keepSelection);
            state.setPoliceResolution(payload);
            const stationName = payload.station?.properties.ps_name || payload.boundary?.properties.police_sta || '';
            state.setSearchQuery(stationName);
          } else if (payload.layer === 'PINCODE' || payload.layer === 'PDS' || payload.layer === 'CONSTITUENCY' || payload.layer === 'HEALTH' || payload.layer === 'LOCAL_BODIES' || payload.layer === 'DISTRICT' || payload.layer === 'LOCAL_BODIES_V2') {
            state.setSearchResult({ type: 'Feature', properties: payload.properties, geometry: payload.geometry }, keepSelection, true);
            
            if (payload.layer === 'LOCAL_BODIES' || payload.layer === 'DISTRICT' || payload.layer === 'LOCAL_BODIES_V2') {
              if (payload.layer === 'LOCAL_BODIES') {
                state.setSelectedLocalBody({ type: 'Feature', properties: payload.properties, geometry: payload.geometry });
              }
              
              if (payload.layer === 'LOCAL_BODIES_V2') {
                state.setSelectedLocalBodyV2({ type: 'Feature', properties: payload.properties, geometry: payload.geometry });
              }
              
              const district = payload.properties.District || payload.properties.district || payload.properties.dist_name || payload.properties.district_n || payload.properties.NAME || payload.properties.DISTRICT;
              if (district) {
                state.setActiveDistrict(district.toString());
              }
            }
            
            if (payload.layer === 'PINCODE' && payload.postalOffices) {
              state.setSelectedPostalOffices(payload.postalOffices);
            }

            if (payload.layer === 'HEALTH' || (state.activeLayer === 'HEALTH' && (payload.layer === 'PINCODE' || payload.layer === 'DISTRICT'))) {
              const district = payload.properties.district || payload.properties.DISTRICT || payload.properties.DISTRICT_NAME || payload.properties.NAME || payload.properties.district_n;
              if (district) {
                const districtName = district.toString();
                if (state.healthScope === 'STATE') {
                   useMapStore.setState({ healthScope: 'DISTRICT', activeDistrict: districtName });
                }
              }
            }
          }

          if (payload.layer === 'PDS') {
            const district = payload.properties.district || payload.properties.DISTRICT || payload.properties.DISTRICT_NAME || payload.properties.NAME;
            if (district) {
              sharedWorker?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary: payload.geometry } });
            }
          }
        } else {
          console.log('[Worker -> Store] Resolution failed for layer:', payload.layer);
          const { lat, lng, isInsideState } = payload || {};
          if (isInsideState) {
            state.setNoDataFound(true, lat && lng ? { lat, lng } : null);
          } else {
            state.setNoDataFound(false);
          }
        }
        state.setIsResolving(false);
        break;
      case 'TNEB_STATEWIDE_LOADED':
        break;
      case 'TNEB_DISTRICT_LOADED':
        state.setActiveDistrict(payload.district);
        break;
      case 'PDS_LOADED':
        state.setPdsData(payload.data);
        state.setActiveDistrict(payload.district);
        break;
      case 'CONSTITUENCIES_LOADED':
        state.setAcData(payload.ac);
        state.setPcData(payload.pc);
        break;
      case 'POLICE_LOADED':
        state.setPoliceBoundariesData(payload.boundaries);
        state.setPoliceStationsData(payload.stations);
        break;
      case 'HEALTH_MANIFEST_LOADED':
        state.setHealthManifest(payload);
        break;
      case 'HEALTH_PRIORITY_LOADED':
        state.setHealthPriorityData(payload);
        break;
      case 'HEALTH_DISTRICT_LOADED':
        state.setHealthDistrictData(payload.data);
        state.setHealthSummary(payload.summary);
        state.setIsHealthLoading(false);
        break;
      case 'HEALTH_FACILITY_RESOLVED':
        state.setSelectedHealthFacility(payload);
        break;
      case 'LOCAL_BODIES_DATA':
        state.setLocalBodiesData(payload);
        break;
      case 'ERROR':
        console.error('[Worker Error]', payload);
        break;
    }
  };

  isWorkerInitialized = true;
};

export const useGisWorker = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!sharedWorker) {
      sharedWorker = new Worker(
        new URL('../workers/gis.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    
    if (!isWorkerInitialized) {
      initializeWorkerListener();
    }
    
    setIsReady(true);
  }, []);

  const loadDistricts = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_DISTRICTS' }), []);
  const loadStateBoundary = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_STATE_BOUNDARY' }), []);
  const loadPdsIndex = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_PDS_INDEX' }), []);
  const loadPincodes = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_PINCODES' }), []);
  const loadTnebStatewide = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_TNEB_STATEWIDE' }), []);
  const loadTnebDistrict = useCallback((district: string) => {
    sharedWorker?.postMessage({ type: 'LOAD_TNEB_DISTRICT', payload: { district } });
  }, []);
  const loadConstituencies = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_CONSTITUENCIES' }), []);
  const loadPoliceData = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_POLICE' }), []);
  // const loadPostalDistrict = useCallback((district: string) => {
  //   sharedWorker?.postMessage({ type: 'LOAD_POSTAL_DISTRICT', payload: { district } });
  // }, []);
  const loadHealthManifest = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_HEALTH_MANIFEST' }), []);
  const loadHealthPriority = useCallback(() => sharedWorker?.postMessage({ type: 'LOAD_HEALTH_PRIORITY' }), []);
  const loadHealthDistrict = useCallback((district: string, file_name: string) => {
    useMapStore.getState().setIsHealthLoading(true);
    sharedWorker?.postMessage({ type: 'LOAD_HEALTH_DISTRICT', payload: { district, file_name } });
  }, []);

  const loadHealthSearchIndex = useCallback(() => 
    sharedWorker?.postMessage({ type: 'LOAD_HEALTH_SEARCH_INDEX' }), []);
    
  const filterHealth = useCallback((scope: HealthScope, filters: HealthFilters, district: string | null, pincode: string | null) => {
    sharedWorker?.postMessage({ type: 'FILTER_HEALTH', payload: { scope, filters, district, pincode } });
  }, []);
  
  const resolveHealthFacility = useCallback((id: string | number, nin: string | number | undefined, district: string | null) => {
    sharedWorker?.postMessage({ type: 'RESOLVE_HEALTH_FACILITY', payload: { id, nin, district } });
  }, []);
  
  const loadLocalBodies = useCallback((localBodyType: string, district?: string | null) => {
    sharedWorker?.postMessage({ type: 'LOAD_LOCAL_BODIES', payload: { localBodyType, district } });
  }, []);

  const resolveLocation = useCallback((lat: number, lng: number, layer: string, pincode?: string, keepSelection: boolean = false, stationCode?: string) => {
    useMapStore.getState().setIsResolving(true);
    sharedWorker?.postMessage({
      type: 'RESOLVE_LOCATION',
      payload: { lat, lng, layer, pincode, keepSelection, stationCode }
    });
  }, []);

  const getSuggestions = useCallback((query: string, layer: string) => {
    sharedWorker?.postMessage({ type: 'GET_SUGGESTIONS', payload: { query, layer } });
  }, []);

  const selectSuggestion = useCallback((suggestion: any, layer: string) => {
    sharedWorker?.postMessage({ type: 'SELECT_SUGGESTION', payload: { suggestion, layer } });
  }, []);

  return {
    isReady,
    loadDistricts,
    loadStateBoundary,
    loadPincodes,
    loadTnebStatewide,
    loadTnebDistrict,
    loadPdsIndex,
    loadPds,
    loadConstituencies,
    loadPoliceData,
    loadHealthManifest,
    loadHealthPriority,
    loadHealthDistrict,
    loadHealthSearchIndex,
    filterHealth,
    resolveHealthFacility,
    resolveLocation,
    getSuggestions,
    selectSuggestion,
    loadLocalBodies
  };
};

function loadPds(district: string, boundary: Geometry) {
  sharedWorker?.postMessage({ type: 'LOAD_PDS', payload: { district, boundary } });
}
