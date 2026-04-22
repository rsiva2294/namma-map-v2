import { create } from 'zustand';

export type ServiceLayer = 'PDS' | 'TNEB';

interface MapState {
  view: {
    center: [number, number];
    zoom: number;
  };
  activeLayer: ServiceLayer;
  searchQuery: string;
  searchResult: any | null; // This is the Pincode highlight
  pdsData: any | null;
  activeDistrict: string | null;
  jurisdictionDetails: any | null; // This is the TNEB office data
  jurisdictionGeometry: any | null; // This is the TNEB polygon
  isResolving: boolean;
  
  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setActiveLayer: (layer: ServiceLayer) => void;
  setSearchQuery: (query: string) => void;
  setSearchResult: (result: any | null) => void;
  setPdsData: (data: any | null) => void;
  setActiveDistrict: (district: string | null) => void;
  setJurisdictionDetails: (details: any | null, geometry?: any | null) => void;
  setIsResolving: (val: boolean) => void;
  clearSearch: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: {
    center: [11.1271, 78.6569],
    zoom: 7,
  },
  activeLayer: 'TNEB', // Default to TNEB
  searchQuery: '',
  searchResult: null,
  pdsData: null,
  activeDistrict: null,
  jurisdictionDetails: null,
  jurisdictionGeometry: null,
  isResolving: false,

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResult: (result) => set({ searchResult: result }),
  setPdsData: (data) => set({ pdsData: data }),
  setActiveDistrict: (district) => set({ activeDistrict: district }),
  setJurisdictionDetails: (details, geometry = null) => set({ 
    jurisdictionDetails: details, 
    jurisdictionGeometry: geometry 
  }),
  setIsResolving: (val) => set({ isResolving: val }),
  clearSearch: () => set({ 
    searchQuery: '', 
    searchResult: null, 
    pdsData: null, 
    activeDistrict: null,
    jurisdictionDetails: null,
    jurisdictionGeometry: null
  }),
}));
