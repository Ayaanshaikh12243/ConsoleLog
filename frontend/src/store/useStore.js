import { create } from 'zustand';

const useStore = create((set) => ({
  selectedLocation: null,
  cellData: null,
  loading: false,
  error: null,
  activePage: 'Map',
  layers: {
    heatmap: true,
    nodes: true,
    infrastructure: false,
  },
  
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  setCellData: (data) => set({ cellData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActivePage: (page) => set({ activePage: page }),
  toggleLayer: (layer) => set((state) => ({ 
    layers: { ...state.layers, [layer]: !state.layers[layer] } 
  })),
}));

export default useStore;
