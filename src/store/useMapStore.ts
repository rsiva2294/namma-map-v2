import { create } from 'zustand';
import type { 
  ServiceLayer, 
  GisFeature, 
  GisFeatureCollection, 
  PdsShop, 
  PdsProperties,
  TnebSection, 
  Geometry 
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
  clearSearch: () => void;
  toggleTheme: () => void;
  isUserTyping: boolean;
  setUserTyping: (isTyping: boolean) => void;
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

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setActiveLayer: (layer) => set({ 
    activeLayer: layer,
    jurisdictionDetails: null,
    jurisdictionGeometry: null,
    selectedPdsShop: null
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
      const name = (result.properties.office_name || result.properties.district || result.properties.NAME || '').toString();
      const pin = (result.properties.PIN_CODE || result.properties.pincode)?.toString();
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
  clearSearch: () => set({ 
    searchQuery: '', 
    searchSuggestions: [],
    selectedSuggestion: null,
    searchResult: null, 
    pdsData: null, 
    selectedPdsShop: null,
    activeDistrict: null,
    jurisdictionDetails: null,
    jurisdictionGeometry: null
  }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
