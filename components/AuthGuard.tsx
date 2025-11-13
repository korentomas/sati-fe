'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // First check if we have a token
      if (!apiClient.isAuthenticated()) {
        // Redirect to login with return URL
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
        return
      }

      // Verify token is still valid by making a test request
      try {
        // Use the verify endpoint if available, or any lightweight endpoint
        const response = await apiClient.verifyToken()

        if (response.error || response.status === 401) {
          // Token is invalid/expired
          apiClient.logout()
          router.push(`/login?from=${encodeURIComponent(pathname)}`)
        } else {
          // Token is valid
          setIsAuthenticated(true)
        }
      } catch (_error) {
        // Network error or token invalid
        apiClient.logout()
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-title">SATI // Authenticating...</div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="loading-spinner">[ VERIFYING CREDENTIALS ]</div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
