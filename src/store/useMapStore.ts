import { create } from 'zustand';

interface MapState {
  view: {
    center: [number, number];
    zoom: number;
  };
  searchQuery: string;
  searchResult: any | null;
  pdsData: any | null;
  activeDistrict: string | null;
  jurisdictionDetails: any | null;
  isResolving: boolean;
  
  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchResult: (result: any | null) => void;
  setPdsData: (data: any | null) => void;
  setActiveDistrict: (district: string | null) => void;
  setJurisdictionDetails: (details: any | null) => void;
  setIsResolving: (val: boolean) => void;
  clearSearch: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: {
    center: [11.1271, 78.6569],
    zoom: 7,
  },
  searchQuery: '',
  searchResult: null,
  pdsData: null,
  activeDistrict: null,
  jurisdictionDetails: null,
  isResolving: false,

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResult: (result) => set({ searchResult: result }),
  setPdsData: (data) => set({ pdsData: data }),
  setActiveDistrict: (district) => set({ activeDistrict: district }),
  setJurisdictionDetails: (details) => set({ jurisdictionDetails: details }),
  setIsResolving: (val) => set({ isResolving: val }),
  clearSearch: () => set({ 
    searchQuery: '', 
    searchResult: null, 
    pdsData: null, 
    activeDistrict: null,
    jurisdictionDetails: null
  }),
}));
