interface ApiResponse<T = any> {
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })

    // Clear token regardless of response
    this.clearToken()

    return response
  }

  async verifyToken(): Promise<ApiResponse<any>> {
    return this.request('/auth/verify')
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

  async listApiKeys(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/auth/api-keys')
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse<any>> {
    return this.request(`/auth/api-keys/${keyId}`, {
      method: 'DELETE',
    })
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
}
