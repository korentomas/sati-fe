'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface UserProfile {
  user_id: string
  email: string
  created_at?: string
}

export default function DashboardPage() {
  const { isLoading: authLoading, isAuthenticated, handleAuthError } = useAuth(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [apiKeys, setApiKeys] = useState<
    Array<{ key_id: string; name: string; created_at: string }>
  >([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      // Wait for auth check to complete
      if (authLoading || !isAuthenticated || initialized) {
        return
      }

      setInitialized(true)

      // Get user profile
      try {
        const profileResponse = await apiClient.getProfile()
        if (profileResponse.data) {
          setUser(profileResponse.data)
          setBackendStatus('connected')
          loadApiKeys()
        } else if (profileResponse.status === 401) {
          // Auth error already handled by hook
          handleAuthError(profileResponse)
        } else {
          setBackendStatus('disconnected')
        }
      } catch (err) {
        handleAuthError(err)
      } finally {
        setLoading(false)
      }
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, initialized])

  const loadApiKeys = async () => {
    const response = await apiClient.listApiKeys()
    if (response.data) {
      setApiKeys(response.data)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName) return

    const response = await apiClient.createApiKey(newKeyName)
    if (response.data) {
      setGeneratedKey(response.data.api_key)
      setNewKeyName('')
      loadApiKeys()
    }
  }

  const handleLogout = async () => {
    await apiClient.logout()
    router.push('/login')
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-title">SATI // Authenticating...</div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div>[ VERIFYING ACCESS ]</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-title">INITIALIZING...</div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="ascii-logo" style={{ fontSize: '10px' }}>
              {`   _____ ___  _______ ____
  / ___//   |/_  __//  _/
  \\__ \\/ /| | / /   / /
 ___/ / ___ |/ /  _/ /
/____/_/  |_/_/  /___/`}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-title">SATI // CONTROL PANEL</div>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px' }}>
            <span>USER: {user?.email}</span>
            <span style={{ marginLeft: '16px' }}>SESSION: ACTIVE</span>
          </div>
          <button onClick={handleLogout} className="secondary">
            [LOGOUT]
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="panel">
          <div className="panel-title">SATI // System Status</div>
          <div style={{ padding: '16px' }}>
            <div>
              FRONTEND: <span style={{ color: '#0f0' }}>[ONLINE]</span>
            </div>
            <div>
              BACKEND: <span style={{ color: '#0f0' }}>[ONLINE]</span>
            </div>
            <div>
              AUTH: <span style={{ color: '#0f0' }}>[UNIFIED]</span>
            </div>
            <div>
              GIS ENGINE: <span style={{ color: '#666' }}>[PHASE 2]</span>
            </div>
            <div>
              STAC API: <span style={{ color: '#666' }}>[PHASE 3]</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">SATI // API Management</div>
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g., production)"
                  style={{ flex: 1 }}
                />
                <button onClick={createApiKey} disabled={!newKeyName} className="primary">
                  [CREATE]
                </button>
              </div>
            </div>

            {generatedKey && (
              <div
                className="success-message"
                style={{ marginBottom: '16px', padding: '8px', fontSize: '11px' }}
              >
                <div>API KEY GENERATED:</div>
                <div style={{ wordBreak: 'break-all', marginTop: '4px', fontFamily: 'monospace' }}>
                  {generatedKey}
                </div>
                <div style={{ marginTop: '4px', color: '#ff0' }}>⚠ Save this key!</div>
              </div>
            )}

            <div style={{ fontSize: '12px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>ACTIVE KEYS:</div>
              {apiKeys.length === 0 ? (
                <div style={{ color: '#666' }}>No API keys yet</div>
              ) : (
                apiKeys.map((key, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    • {key.name} - {new Date(key.created_at).toLocaleDateString()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">SATI // Quick Actions</div>
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => window.open('http://localhost:8000/api/v1/docs', '_blank')}
              style={{ marginBottom: '8px', width: '100%' }}
            >
              [VIEW API DOCS]
            </button>
            <button onClick={() => router.push('/imagery')} style={{ width: '100%' }}>
              [SEARCH SATELLITE IMAGERY] ✨
            </button>
            <button onClick={() => router.push('/map')} style={{ width: '100%' }} disabled={true}>
              [OPEN MAP VIEW] (Coming Soon)
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">SATI // Development Log</div>
          <div style={{ padding: '16px', fontSize: '11px', height: '150px', overflowY: 'auto' }}>
            <div>[{new Date().toLocaleTimeString()}] Session initialized</div>
            <div>[{new Date().toLocaleTimeString()}] Backend authenticated</div>
            <div>[{new Date().toLocaleTimeString()}] User profile loaded</div>
            <div style={{ color: '#0f0' }}>
              [{new Date().toLocaleTimeString()}] ✓ Auth unified: Backend handles all
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">SATI // Architecture Status</div>
        <div style={{ padding: '16px', fontSize: '12px' }}>
          <div style={{ marginBottom: '12px', color: '#0f0' }}>
            <strong>✓ UNIFIED AUTH COMPLETE</strong>
            <div style={{ marginLeft: '16px' }}>
              • Frontend → Backend API only
              <br />• Backend uses SQLAlchemy + PostgreSQL
              <br />• Single JWT token system managed by backend
              <br />• Clean separation of concerns
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong>→ PHASE 2: GIS Visualization</strong>
            <div style={{ marginLeft: '16px', color: '#ff0' }}>
              • Leaflet map • Geoman tools • AOI selection • Layer management
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong>○ PHASE 3: Satellite Search</strong>
            <div style={{ marginLeft: '16px', color: '#666' }}>
              • STAC integration • Date/cloud filters • Scene preview
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
