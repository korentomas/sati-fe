import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SceneResponse } from '@/lib/api/client'

export interface LayerVisualization {
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  opacity: number // 0 to 100
  bands: string // e.g., "B4,B3,B2" for RGB or "B8,B4,B3" for false color
  min: number // min value for normalization
  max: number // max value for normalization
  gamma: number // gamma correction
}

export interface Layer {
  id: string
  name: string
  type: 'base' | 'satellite' | 'analysis' | 'processing'
  visible: boolean
  scene?: SceneResponse
  visualization: LayerVisualization
  url?: string // For tile layers
  result?: {
    job_id: string
    type: string
    file_path: string
    statistics?: any
  }
}

interface LayerStore {
  layers: Layer[]
  activeLayerId: string | null
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  updateLayerVisualization: (id: string, visualization: Partial<LayerVisualization>) => void
  setActiveLayer: (id: string) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
}

export const useLayerStore = create<LayerStore>()(
  persist(
    (set) => ({
      layers: [
        {
          id: 'osm-base',
          name: 'OpenStreetMap',
          type: 'base' as const,
          visible: true,
          visualization: {
            brightness: 0,
            contrast: 0,
            opacity: 100,
            bands: '',
            min: 0,
            max: 1,
            gamma: 1,
          },
        },
      ],
      activeLayerId: null,

      addLayer: (layer) =>
        set((state) => {
          // Check if a layer with the same scene ID already exists
          const existingLayer = state.layers.find((l) => {
            // For satellite layers, check scene ID
            if (layer.type === 'satellite' && l.type === 'satellite') {
              return l.scene?.id === layer.scene?.id
            }
            // For other layers, check by layer ID
            return l.id === layer.id
          })

          if (existingLayer) {
            console.log(`Layer ${layer.name} already exists, skipping addition`)
            return state // Return unchanged state
          }

          return {
            layers: [...state.layers, layer],
          }
        }),

      removeLayer: (id) =>
        set((state) => ({
          layers: state.layers.filter((l) => l.id !== id),
          activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
        })),

      toggleLayerVisibility: (id) =>
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === id ? { ...layer, visible: !layer.visible } : layer
          ),
        })),

      updateLayerVisualization: (id, visualization) =>
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === id
              ? { ...layer, visualization: { ...layer.visualization, ...visualization } }
              : layer
          ),
        })),

      setActiveLayer: (id) =>
        set(() => ({
          activeLayerId: id,
        })),

      reorderLayers: (fromIndex, toIndex) =>
        set((state) => {
          const newLayers = [...state.layers]
          const [movedLayer] = newLayers.splice(fromIndex, 1)
          newLayers.splice(toIndex, 0, movedLayer)
          return { layers: newLayers }
        }),
    }),
    {
      name: 'layer-store', // unique name for localStorage key
      partialize: (state) => ({
        // Only persist non-base layers and activeLayerId
        layers: state.layers.filter((l) => l.type !== 'base'),
        activeLayerId: state.activeLayerId,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, ensure base layer is always present
        if (state && !state.layers.find((l) => l.id === 'osm-base')) {
          state.layers.unshift({
            id: 'osm-base',
            name: 'OpenStreetMap',
            type: 'base' as const,
            visible: true,
            visualization: {
              brightness: 0,
              contrast: 0,
              opacity: 100,
              bands: '',
              min: 0,
              max: 1,
              gamma: 1,
            },
          })
        }
      },
    }
  )
)
