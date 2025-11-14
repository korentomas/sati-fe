interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface UserProfile {
  user_id: string
  email: string
  created_at?: string
}

interface ApiKeyRequest {
  name: string
  description?: string
  expires_in_days?: number
}

interface ApiKeyResponse {
  key_id: string
  api_key: string
  name: string
  description?: string
  created_at: string
  expires_at?: string
}

// Imagery types
interface GeoJSONGeometry {
  type: string
  coordinates: number[][][] | number[][]
}

interface SearchRequest {
  geometry?: GeoJSONGeometry
  bbox?: number[]
  date_from: string
  date_to: string
  collections?: string[]
  cloud_cover_max?: number
  limit?: number
}

interface SceneProperties {
  datetime: string
  cloud_cover?: number
  platform?: string
  instrument?: string
  gsd?: number
}

interface SceneResponse {
  id: string
  collection: string
  bbox: number[]
  geometry: GeoJSONGeometry
  properties: SceneProperties
  thumbnail_url?: string
  assets: Record<string, any>
}

interface SearchResponse {
  total: number
  returned: number
  scenes: SceneResponse[]
  next_token?: string
}

interface CollectionInfo {
  id: string
  title: string
  description?: string
  temporal_extent?: (string | null)[]
  spatial_extent?: number[]
  providers: string[]
  license?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    // Try to get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('api_token')
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (this.token && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return {
          error: data?.detail || `Error: ${response.status} ${response.statusText}`,
          status: response.status,
        }
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.data?.access_token) {
      this.token = response.data.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('api_token', response.data.access_token)
        localStorage.setItem('user_email', email)
      }
    }

    return response
  }

  async register(email: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.data?.access_token) {
      this.token = response.data.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('api_token', response.data.access_token)
        localStorage.setItem('user_email', email)
      }
    }

    return response
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    })

    // Clear token regardless of response
    this.clearToken()

    return response
  }

  async verifyToken(): Promise<ApiResponse<UserProfile>> {
    // Use profile endpoint to verify token validity
    return this.request<UserProfile>('/auth/profile')
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/auth/profile')
  }

  async createApiKey(name: string, description?: string): Promise<ApiResponse<ApiKeyResponse>> {
    return this.request<ApiKeyResponse>('/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, description, expires_in_days: 365 }),
    })
  }

  async listApiKeys(): Promise<ApiResponse<ApiKeyResponse[]>> {
    return this.request<ApiKeyResponse[]>('/auth/api-keys')
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/auth/api-keys/${keyId}`, {
      method: 'DELETE',
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request<{ status: string; message: string }>('/health')
  }

  // Clear token (for logout)
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_token')
      localStorage.removeItem('user_email')
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Get current user email from localStorage
  getCurrentUserEmail(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_email')
    }
    return null
  }

  // Imagery endpoints
  async getCollections(): Promise<ApiResponse<CollectionInfo[]>> {
    return this.request<CollectionInfo[]>('/imagery/collections')
  }

  async searchImagery(request: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    return this.request<SearchResponse>('/imagery/search', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async getScene(collectionId: string, sceneId: string): Promise<ApiResponse<SceneResponse>> {
    return this.request<SceneResponse>(`/imagery/scenes/${collectionId}/${sceneId}`)
  }

  // Generate tile URL for a scene
  getTileUrl(sceneId: string, z: number, x: number, y: number, bands?: string): string {
    const params = new URLSearchParams()
    if (bands) params.append('bands', bands)
    const query = params.toString()
    return `${this.baseUrl}/imagery/tiles/${sceneId}/{z}/{x}/{y}.png${query ? '?' + query : ''}`
  }

  // Processing endpoints
  async createProcessingJob(request: any): Promise<ApiResponse<any>> {
    return this.request<any>('/processing/jobs', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async createSpectralIndex(request: any): Promise<ApiResponse<any>> {
    return this.request<any>('/processing/spectral-index', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async getProcessingJob(jobId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/processing/jobs/${jobId}`)
  }

  async listProcessingJobs(status?: string): Promise<ApiResponse<any[]>> {
    const params = status ? `?status=${status}` : ''
    return this.request<any[]>(`/processing/jobs${params}`)
  }

  async cancelProcessingJob(jobId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/processing/jobs/${jobId}`, {
      method: 'DELETE'
    })
  }

  async getProcessingResult(jobId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/processing/jobs/${jobId}/result`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
  ApiKeyRequest,
  ApiKeyResponse,
  GeoJSONGeometry,
  SearchRequest,
  SceneProperties,
  SceneResponse,
  SearchResponse,
  CollectionInfo,
}
