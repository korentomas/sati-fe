interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

interface LoginRequest {
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

interface UserProfile {
  id: string
  email: string
  created_at?: string
}

interface ApiKeyRequest {
  name: string
  expires_in_days?: number
}

interface ApiKeyResponse {
  key: string
  name: string
  created_at: string
  expires_at?: string
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
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
      }
    }

    return response
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/auth/profile')
  }

  async createApiKey(name: string, expiresInDays?: number): Promise<ApiResponse<ApiKeyResponse>> {
    return this.request<ApiKeyResponse>('/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, expires_in_days: expiresInDays }),
    })
  }

  async listApiKeys(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/auth/api-keys')
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health')
  }

  // Clear token (for logout)
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_token')
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type {
  ApiResponse,
  LoginRequest,
  TokenResponse,
  UserProfile,
  ApiKeyRequest,
  ApiKeyResponse,
}