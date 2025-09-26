'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user?: string
}

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter()
  const pathname = usePathname()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check if not required
      if (!requireAuth) {
        setAuthState({ isAuthenticated: false, isLoading: false })
        return
      }

      // Check if we have a token
      if (!apiClient.isAuthenticated()) {
        setAuthState({ isAuthenticated: false, isLoading: false })
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
        return
      }

      // Verify token validity
      try {
        const response = await apiClient.verifyToken()

        if (response.error || response.status === 401) {
          // Token is invalid/expired
          apiClient.logout()
          setAuthState({ isAuthenticated: false, isLoading: false })
          router.push(`/login?from=${encodeURIComponent(pathname)}`)
        } else {
          // Token is valid
          const userEmail = localStorage.getItem('user_email')
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userEmail || undefined,
          })
        }
      } catch (error) {
        // Network error or token invalid
        apiClient.logout()
        setAuthState({ isAuthenticated: false, isLoading: false })
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
      }
    }

    checkAuth()
  }, [router, pathname, requireAuth])

  const handleAuthError = (error: any) => {
    // Helper function for handling auth errors in API calls
    if (
      error?.status === 401 ||
      error?.message?.includes('401') ||
      error?.message?.includes('Unauthorized')
    ) {
      apiClient.logout()
      router.push(`/login?from=${encodeURIComponent(pathname)}`)
      return true
    }
    return false
  }

  return {
    ...authState,
    handleAuthError,
  }
}
