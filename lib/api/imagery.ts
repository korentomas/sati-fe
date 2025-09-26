import { apiClient } from './client'

// Types for imagery search
export interface GeoJSONGeometry {
  type: string
  coordinates: number[][][] | number[][]
}

export interface SearchRequest {
  geometry?: GeoJSONGeometry
  bbox?: [number, number, number, number]
  date_from: string
  date_to: string
  collections?: string[]
  cloud_cover_max?: number
  limit?: number
}

export interface SceneProperties {
  datetime: string
  cloud_cover?: number
  platform?: string
  instrument?: string
  gsd?: number
}

export interface Scene {
  id: string
  collection: string
  bbox: [number, number, number, number]
  geometry: GeoJSONGeometry
  properties: SceneProperties
  thumbnail_url?: string
  assets: Record<string, any>
}

export interface SearchResponse {
  total: number
  returned: number
  scenes: Scene[]
  next_token?: string
}

export interface Collection {
  id: string
  title: string
  description?: string
  temporal_extent?: [string | null, string | null]
  spatial_extent?: number[]
}

// Imagery API functions
export const imageryApi = {
  // List available collections (Sentinel-2, Landsat, etc.)
  async listCollections(): Promise<Collection[]> {
    const response = await apiClient.request<Collection[]>('/imagery/collections')
    return response.data || []
  },

  // Search for satellite imagery
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.request<SearchResponse>('/imagery/search', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || { total: 0, returned: 0, scenes: [] }
  },

  // Get scene details
  async getScene(collectionId: string, sceneId: string): Promise<Scene | null> {
    const response = await apiClient.request<Scene>(
      `/imagery/scenes/${collectionId}/${sceneId}`
    )

    if (response.error) {
      return null
    }

    return response.data || null
  },
}