import { create } from 'zustand';
import type { 
  ServiceLayer, 
  GisFeature, 
  GisFeatureCollection, 
  PdsShop, 
  PdsProperties,
  TnebSection, 
  Geometry,
  Point,
  ConstituencyProperties,
  PoliceBoundaryProperties,
  PoliceStationProperties,
  PoliceResolutionResult,
  PostalOffice,
  HealthManifest,
  HealthFacilityProperties,
  HealthFacility,
  HealthScope,
  HealthFilters,
  HealthSummary,
  LocalBodyProperties
} from '../types/gis';

interface MapState {
  view: {
    center: [number, number];
    zoom: number;
  };
  activeLayer: ServiceLayer;
  searchQuery: string;
  searchSuggestions: GisFeature[];
  selectedSuggestion: GisFeature | null;
  focusedSuggestionIndex: number; // For keyboard navigation
  searchResult: GisFeature | null; // This is the Pincode highlight
  districtsData: GisFeatureCollection | null; // All district boundaries
  stateBoundaryData: GisFeatureCollection | null; // State boundary
  pdsData: GisFeatureCollection<Geometry, PdsProperties> | null;
  selectedPdsShop: PdsShop | null;
  activeDistrict: string | null;
  jurisdictionDetails: TnebSection | null; // This is the TNEB office data
  jurisdictionGeometry: Geometry | null; // This is the TNEB polygon
  isResolving: boolean;
  isLocating: boolean;
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  triggerLocateMe: boolean;
  isReportModalOpen: boolean;
  reportContext: { type: string; data: Record<string, string | number> } | null;
  noDataFound: boolean;
  lastClickedPoint: { lat: number; lng: number } | null;
  constituencyType: 'AC' | 'PC';
  acData: GisFeatureCollection<Geometry, ConstituencyProperties> | null;
  pcData: GisFeatureCollection<Geometry, ConstituencyProperties> | null;
  policeBoundariesData: GisFeatureCollection<Geometry, PoliceBoundaryProperties> | null;
  policeStationsData: GisFeatureCollection<Point, PoliceStationProperties> | null;
  selectedPoliceStation: GisFeature<Point, PoliceStationProperties> | null;
  policeResolution: PoliceResolutionResult | null;
  selectedPostalOffices: PostalOffice[] | null;
  selectedPostalOffice: PostalOffice | null;
  healthManifest: HealthManifest | null;
  healthPriorityData: GisFeatureCollection<Point, HealthFacilityProperties> | null;
  healthDistrictData: GisFeatureCollection<Point, HealthFacilityProperties> | null;
  selectedHealthFacility: HealthFacility | null;
  healthScope: HealthScope;
  healthFilters: HealthFilters;
  healthSummary: HealthSummary | null;
  isHealthLoading: boolean;
  isLegalModalOpen: boolean;
  legalTab: 'disclaimer' | 'privacy' | 'terms';
  postalFilters: {
    delivery: 'All' | 'Delivery' | 'Non Delivery';
    type: 'All' | 'HO' | 'SO' | 'BO';
  };

  localBodyType: 'CORPORATION' | 'MUNICIPALITY' | 'TOWN_PANCHAYAT' | 'VILLAGE_PANCHAYAT' | 'AUTO';
  localBodiesData: GisFeatureCollection<Geometry, LocalBodyProperties> | null;
  selectedLocalBody: GisFeature<Geometry, LocalBodyProperties> | null;

  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setActiveLayer: (layer: ServiceLayer) => void;
  setSearchQuery: (query: string) => void;
  setSearchSuggestions: (suggestions: GisFeature[]) => void;
  setSelectedSuggestion: (suggestion: GisFeature | null) => void;
  setFocusedSuggestionIndex: (index: number) => void;
  setSearchResult: (result: GisFeature | null, keepSelection?: boolean, updateQuery?: boolean) => void;
  setDistrictsData: (data: GisFeatureCollection | null) => void;
  setStateBoundaryData: (data: GisFeatureCollection | null) => void;
  setPdsData: (data: GisFeatureCollection<Geometry, PdsProperties> | null) => void;
  setSelectedPdsShop: (shop: PdsShop | null) => void;
  setActiveDistrict: (district: string | null) => void;
  setJurisdictionDetails: (details: TnebSection | null, geometry?: Geometry | null) => void;
  setIsResolving: (val: boolean) => void;
  setIsLocating: (val: boolean) => void;
  setSidebarOpen: (val: boolean) => void;
  setTriggerLocateMe: (val: boolean) => void;
  setReportModal: (isOpen: boolean, context?: { type: string; data: Record<string, string | number> } | null) => void;
  setNoDataFound: (val: boolean, point?: { lat: number; lng: number } | null) => void;
  clearSearch: () => void;
  toggleTheme: () => void;
  isUserTyping: boolean;
  setUserTyping: (isTyping: boolean) => void;
  setConstituencyType: (type: 'AC' | 'PC') => void;
  setAcData: (data: GisFeatureCollection<Geometry, ConstituencyProperties> | null) => void;
  setPcData: (data: GisFeatureCollection<Geometry, ConstituencyProperties> | null) => void;
  setPoliceBoundariesData: (data: GisFeatureCollection<Geometry, PoliceBoundaryProperties> | null) => void;
  setPoliceStationsData: (data: GisFeatureCollection<Point, PoliceStationProperties> | null) => void;
  setSelectedPoliceStation: (station: PoliceStationProperties | null, geometry?: Geometry | null) => void;
  setPoliceResolution: (result: PoliceResolutionResult | null) => void;
  setSelectedPostalOffices: (offices: PostalOffice[] | null) => void;
  setSelectedPostalOffice: (office: PostalOffice | null) => void;
  setLegalModal: (open: boolean, tab?: 'disclaimer' | 'privacy' | 'terms') => void;
  setHealthManifest: (manifest: HealthManifest | null) => void;
  setHealthPriorityData: (data: GisFeatureCollection<Point, HealthFacilityProperties> | null) => void;
  setHealthDistrictData: (data: GisFeatureCollection<Point, HealthFacilityProperties> | null) => void;
  setSelectedHealthFacility: (facility: HealthFacility | null) => void;
  setHealthScope: (scope: HealthScope) => void;
  setHealthFilters: (filters: HealthFilters) => void;
  setHealthSummary: (summary: HealthSummary | null) => void;
  setIsHealthLoading: (loading: boolean) => void;
  setPostalFilters: (filters: Partial<MapState['postalFilters']>) => void;
  setLocalBodyType: (type: MapState['localBodyType']) => void;
  setLocalBodiesData: (data: GisFeatureCollection<Geometry, LocalBodyProperties> | null) => void;
  setSelectedLocalBody: (feature: GisFeature<Geometry, LocalBodyProperties> | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: {
    center: [11.1271, 78.6569],
    zoom: 7,
  },
  activeLayer: 'PINCODE', // Default to PINCODE
  searchQuery: '',
  searchSuggestions: [],
  selectedSuggestion: null,
  focusedSuggestionIndex: -1,
  searchResult: null,
  districtsData: null,
  stateBoundaryData: null,
  pdsData: null,
  selectedPdsShop: null,
  activeDistrict: null,
  jurisdictionDetails: null,
  jurisdictionGeometry: null,
  isResolving: false,
  isLocating: false,
  theme: 'light',
  isSidebarOpen: true,
  triggerLocateMe: false,
  isUserTyping: false,
  isReportModalOpen: false,
  reportContext: null,
  noDataFound: false,
  lastClickedPoint: null,
  constituencyType: 'AC',
  acData: null,
  pcData: null,
  policeBoundariesData: null,
  policeStationsData: null,
  selectedPoliceStation: null,
  policeResolution: null,
  selectedPostalOffices: null,
  selectedPostalOffice: null,
  healthManifest: null,
  healthPriorityData: null,
  healthDistrictData: null,
  selectedHealthFacility: null,
  healthScope: 'STATE',
  healthFilters: {
    facilityTypes: [],
    locationType: 'All',
    isHwc: null,
    hasDelivery: null,
    isFru: null,
    is24x7: null,
    hasBloodBank: null,
    hasBloodStorage: null,
    hasSncu: null,
    hasNbsu: null,
    hasDeic: null,
    hasCt: null,
    hasMri: null,
    hasDialysis: null,
    hasCbnaat: null,
    hasTeleConsultation: null,
    hasStemiHub: null,
    hasStemiSpoke: null,
    hasCathLab: null
  },
  healthSummary: null,
  localBodyType: 'AUTO',
  localBodiesData: null,
  selectedLocalBody: null,
  isHealthLoading: false,
  isLegalModalOpen: false,
  legalTab: 'disclaimer',
  postalFilters: {
    delivery: 'All',
    type: 'All'
  },

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setActiveLayer: (layer) => set((state) => {
    return { 
      activeLayer: layer,
      jurisdictionDetails: null,
      jurisdictionGeometry: null,
      selectedPdsShop: null,
      selectedPoliceStation: null,
      policeResolution: null,
      selectedPostalOffices: null,
      selectedPostalOffice: null,
      selectedHealthFacility: null,
      selectedLocalBody: null,
      localBodiesData: null,
      healthDistrictData: state.healthDistrictData,
      healthScope: state.healthScope,
      healthSummary: state.healthSummary,
      activeDistrict: state.activeDistrict,
      healthFilters: state.healthFilters,
      // Reset result if switching from/to layers
      searchResult: null
    };
  }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchSuggestions: (suggestions) => set({ searchSuggestions: suggestions }),
  setSelectedSuggestion: (suggestion) => set({ selectedSuggestion: suggestion, focusedSuggestionIndex: -1 }),
  setFocusedSuggestionIndex: (index) => set({ focusedSuggestionIndex: index }),
  setSearchResult: (result, keepSelection = false, updateQuery = false) => set((state) => {
    const newState: Partial<MapState> = { 
      searchResult: result,
      jurisdictionDetails: keepSelection ? state.jurisdictionDetails : null,
      jurisdictionGeometry: keepSelection ? state.jurisdictionGeometry : null,
      selectedPdsShop: keepSelection ? state.selectedPdsShop : null,
      selectedPoliceStation: keepSelection ? state.selectedPoliceStation : null,
      policeResolution: keepSelection ? state.policeResolution : null,
      selectedPostalOffices: keepSelection ? state.selectedPostalOffices : null,
      selectedPostalOffice: keepSelection ? state.selectedPostalOffice : null,
      selectedHealthFacility: keepSelection ? state.selectedHealthFacility : null,
      selectedLocalBody: (keepSelection ? state.selectedLocalBody : null) || (result?.properties?.localBodyType ? result as any : null),
      healthSummary: keepSelection ? state.healthSummary : null,
      noDataFound: false
    };

    if (updateQuery && result) {
      const p = result.properties;
      const num = (p.assembly_1 || p.parliament || p.ps_code || '').toString();
      const baseName = (p.facility_n || p.ps_name || p.assembly_c || p.parliame_1 || p.office_name || p.district || p.NAME || p.Corporatio || p.Municipali || p.Village || p.name || '').toString();
      const typePrefix = p.ps_name ? 'Station' : p.assembly_c ? 'AC' : p.parliame_1 ? 'PC' : '';
      const name = num ? `${typePrefix} #${num} - ${baseName}` : baseName;
      const pin = (p.PIN_CODE || p.pincode)?.toString();
      newState.searchQuery = pin ? `${pin} - ${name}` : name;
      newState.isUserTyping = false;
    }

    return newState;
  }),
  setDistrictsData: (data) => set({ districtsData: data }),
  setStateBoundaryData: (data) => set({ stateBoundaryData: data }),
  setPdsData: (data: GisFeatureCollection<Geometry, PdsProperties> | null) => set({ pdsData: data }),
  setSelectedPdsShop: (shop) => set({ selectedPdsShop: shop }),
  setActiveDistrict: (district) => set({ activeDistrict: district }),
  setJurisdictionDetails: (details, geometry = null) => set({ 
    jurisdictionDetails: details, 
    jurisdictionGeometry: geometry 
  }),
  setIsResolving: (val) => set({ isResolving: val }),
  setIsLocating: (val) => set({ isLocating: val }),
  setSidebarOpen: (val) => set({ isSidebarOpen: val }),
  setTriggerLocateMe: (trigger) => set({ triggerLocateMe: trigger, isUserTyping: false }),
  setUserTyping: (isTyping) => set({ isUserTyping: isTyping }),
  setReportModal: (isOpen, context = null) => set({ 
    isReportModalOpen: isOpen, 
    reportContext: context 
  }),
  setNoDataFound: (val, point = null) => set({ 
    noDataFound: val, 
    lastClickedPoint: point,
    // Clear other data to show only the "No Data" card
    searchResult: val ? null : undefined,
    jurisdictionDetails: val ? null : undefined,
    selectedPoliceStation: val ? null : undefined,
    policeResolution: val ? null : undefined,
    selectedPostalOffices: val ? null : undefined,
    selectedPostalOffice: val ? null : undefined,
    selectedHealthFacility: val ? null : undefined,
    selectedLocalBody: val ? null : undefined
  }),
  clearSearch: () => set((state) => ({ 
    searchQuery: '', 
    searchSuggestions: [],
    selectedSuggestion: null,
    focusedSuggestionIndex: -1,
    searchResult: null, 
    pdsData: null, 
    selectedPdsShop: null,
    activeDistrict: state.activeLayer === 'HEALTH' ? state.activeDistrict : null,
    jurisdictionDetails: null,
    jurisdictionGeometry: null,
    selectedPoliceStation: null,
    policeResolution: null,
    selectedPostalOffices: null,
    selectedPostalOffice: null,
    selectedHealthFacility: null,
    selectedLocalBody: null,
    healthDistrictData: state.activeLayer === 'HEALTH' ? state.healthDistrictData : null,
    noDataFound: false,
    lastClickedPoint: null
  })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setConstituencyType: (type) => set({ constituencyType: type, searchResult: null }),
  setAcData: (data) => set({ acData: data }),
  setPcData: (data) => set({ pcData: data }),
  setPoliceBoundariesData: (data) => set({ policeBoundariesData: data }),
  setPoliceStationsData: (data) => set({ policeStationsData: data }),
  setSelectedPoliceStation: (station, geometry = null) => set({ 
    selectedPoliceStation: station ? { 
      type: 'Feature', 
      properties: station as PoliceStationProperties, 
      geometry: { 
        type: 'Point', 
        coordinates: (station as PoliceStationProperties).station_location || [78.6569, 11.1271] 
      } as Point 
    } : null,
    jurisdictionGeometry: geometry || null 
  }),
  setPoliceResolution: (result) => set({ 
    policeResolution: result,
    selectedPoliceStation: result?.station || null,
    jurisdictionGeometry: result?.boundary.geometry || null
  }),
  setSelectedPostalOffices: (offices) => set({ selectedPostalOffices: offices }),
  setSelectedPostalOffice: (office) => set({ selectedPostalOffice: office }),
  setLegalModal: (open, tab) => set((state) => ({ 
    isLegalModalOpen: open, 
    legalTab: tab || state.legalTab 
  })),
  setHealthManifest: (manifest) => set({ healthManifest: manifest }),
  setHealthPriorityData: (data) => set({ healthPriorityData: data }),
  setHealthDistrictData: (data) => set({ healthDistrictData: data }),
  setIsHealthLoading: (loading: boolean) => set({ isHealthLoading: loading }),
  setSelectedHealthFacility: (facility) => set({ selectedHealthFacility: facility }),
  setHealthScope: (scope) => set({ healthScope: scope }),
  setHealthFilters: (filters) => set({ healthFilters: filters }),
  setHealthSummary: (summary) => set({ healthSummary: summary }),
  setPostalFilters: (filters) => set((state) => ({
    postalFilters: { ...state.postalFilters, ...filters }
  })),
  setLocalBodyType: (type) => set({ 
    localBodyType: type, 
    selectedLocalBody: null, 
    searchResult: null,
    localBodiesData: null 
  }),
  setLocalBodiesData: (data) => set({ localBodiesData: data }),
  setSelectedLocalBody: (feature) => set({ selectedLocalBody: feature }),
}));
