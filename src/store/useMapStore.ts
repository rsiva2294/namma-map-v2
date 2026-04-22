import { create } from 'zustand';

export type ServiceLayer = 'PINCODE' | 'PDS' | 'TNEB';

interface MapState {
  view: {
    center: [number, number];
    zoom: number;
  };
  activeLayer: ServiceLayer;
  searchQuery: string;
  searchSuggestions: any[];
  selectedSuggestion: any | null;
  searchResult: any | null; // This is the Pincode highlight
  districtsData: any | null; // All district boundaries
  stateBoundaryData: any | null; // State boundary
  pdsData: any | null;
  selectedPdsShop: any | null;
  activeDistrict: string | null;
  jurisdictionDetails: any | null; // This is the TNEB office data
  jurisdictionGeometry: any | null; // This is the TNEB polygon
  isResolving: boolean;
  isLocating: boolean;
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  triggerLocateMe: boolean;

  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setActiveLayer: (layer: ServiceLayer) => void;
  setSearchQuery: (query: string) => void;
  setSearchSuggestions: (suggestions: any[]) => void;
  setSelectedSuggestion: (suggestion: any | null) => void;
  setSearchResult: (result: any | null, keepSelection?: boolean) => void;
  setDistrictsData: (data: any | null) => void;
  setStateBoundaryData: (data: any | null) => void;
  setPdsData: (data: any | null) => void;
  setSelectedPdsShop: (shop: any | null) => void;
  setActiveDistrict: (district: string | null) => void;
  setJurisdictionDetails: (details: any | null, geometry?: any | null) => void;
  setIsResolving: (val: boolean) => void;
  setIsLocating: (val: boolean) => void;
  setSidebarOpen: (val: boolean) => void;
  setTriggerLocateMe: (val: boolean) => void;
  clearSearch: () => void;
  toggleTheme: () => void;
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
  setSearchResult: (result, keepSelection = false) => set((state) => ({ 
    searchResult: result,
    jurisdictionDetails: keepSelection ? state.jurisdictionDetails : null,
    jurisdictionGeometry: keepSelection ? state.jurisdictionGeometry : null,
    selectedPdsShop: keepSelection ? state.selectedPdsShop : null
  })),
  setDistrictsData: (data) => set({ districtsData: data }),
  setStateBoundaryData: (data) => set({ stateBoundaryData: data }),
  setPdsData: (data) => set({ pdsData: data }),
  setSelectedPdsShop: (shop) => set({ selectedPdsShop: shop }),
  setActiveDistrict: (district) => set({ activeDistrict: district }),
  setJurisdictionDetails: (details, geometry = null) => set({ 
    jurisdictionDetails: details, 
    jurisdictionGeometry: geometry 
  }),
  setIsResolving: (val) => set({ isResolving: val }),
  setIsLocating: (val) => set({ isLocating: val }),
  setSidebarOpen: (val) => set({ isSidebarOpen: val }),
  setTriggerLocateMe: (val) => set({ triggerLocateMe: val }),
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
