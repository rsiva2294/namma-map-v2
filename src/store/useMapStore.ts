import { create } from 'zustand';

interface MapState {
  view: {
    center: [number, number];
    zoom: number;
  };
  searchQuery: string;
  searchResult: any | null;
  
  // Actions
  setView: (center: [number, number], zoom: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchResult: (result: any | null) => void;
  clearSearch: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: {
    center: [11.1271, 78.6569],
    zoom: 7,
  },
  searchQuery: '',
  searchResult: null,

  setView: (center, zoom) => set({ view: { center, zoom } }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResult: (result) => set({ searchResult: result }),
  clearSearch: () => set({ searchQuery: '', searchResult: null }),
}));
