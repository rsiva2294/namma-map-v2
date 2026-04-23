import { create } from 'zustand';
import type { 
  ServiceLayer, 
  GisFeature, 
  GisFeatureCollection, 
  PdsShop, 
  PdsProperties,
  TnebSection, 
  Geometry,
  ConstituencyProperties
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

  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setActiveLayer: (layer: ServiceLayer) => void;
  setSearchQuery: (query: string) => void;
  setSearchSuggestions: (suggestions: GisFeature[]) => void;
  setSelectedSuggestion: (suggestion: GisFeature | null) => void;
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

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setActiveLayer: (layer) => set({ 
    activeLayer: layer,
    jurisdictionDetails: null,
    jurisdictionGeometry: null,
    selectedPdsShop: null,
    // Reset result if switching from/to Constituency
    searchResult: null
  }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchSuggestions: (suggestions) => set({ searchSuggestions: suggestions }),
  setSelectedSuggestion: (suggestion) => set({ selectedSuggestion: suggestion }),
  setSearchResult: (result, keepSelection = false, updateQuery = false) => set((state) => {
    const newState: Partial<MapState> = { 
      searchResult: result,
      jurisdictionDetails: keepSelection ? state.jurisdictionDetails : null,
      jurisdictionGeometry: keepSelection ? state.jurisdictionGeometry : null,
      selectedPdsShop: keepSelection ? state.selectedPdsShop : null
    };

    if (updateQuery && result) {
      const p = result.properties as any;
      const num = p.assembly_1 || p.parliament;
      const baseName = (p.assembly_c || p.parliame_1 || p.office_name || p.district || p.NAME || '').toString();
      const name = num ? `${p.assembly_c ? 'AC' : 'PC'} #${num} - ${baseName}` : baseName;
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
    jurisdictionDetails: val ? null : undefined
  }),
  clearSearch: () => set({ 
    searchQuery: '', 
    searchSuggestions: [],
    selectedSuggestion: null,
    searchResult: null, 
    pdsData: null, 
    selectedPdsShop: null,
    activeDistrict: null,
    jurisdictionDetails: null,
    jurisdictionGeometry: null,
    noDataFound: false,
    lastClickedPoint: null
  }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setConstituencyType: (type) => set({ constituencyType: type, searchResult: null }),
  setAcData: (data) => set({ acData: data }),
  setPcData: (data) => set({ pcData: data }),
}));
