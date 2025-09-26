'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)

      // Check backend and try to authenticate
      await checkBackendConnection(user.email!)
    }

    initialize()
  }, [router, supabase])

  const checkBackendConnection = async (email: string) => {
    setBackendStatus('checking')

    // First check if backend is up
    const healthResponse = await apiClient.healthCheck()
    if (healthResponse.error) {
      setBackendStatus('disconnected')
      return
    }

    // Try to login to backend with test credentials for now
    // In production, this should sync with Supabase auth
    const loginResponse = await apiClient.login('email@example.com', 'secret')
    if (loginResponse.data) {
      setBackendStatus('connected')
      loadApiKeys()
    } else {
      setBackendStatus('disconnected')
    }
  }

  const loadApiKeys = async () => {
    const response = await apiClient.listApiKeys()
    if (response.data) {
      setApiKeys(response.data)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName) return

    const response = await apiClient.createApiKey(newKeyName, 365)
    if (response.data) {
      setGeneratedKey(response.data.key)
      setNewKeyName('')
      loadApiKeys()
    }
  }

  const handleLogout = async () => {
    apiClient.clearToken()
    await supabase.auth.signOut()
    router.push('/login')
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
        <div className="panel-title">
          SATI // CONTROL PANEL
        </div>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px' }}>
            <span>USER: {user?.email}</span>
            <span style={{ marginLeft: '16px' }}>SESSION: ACTIVE</span>
          </div>
          <button onClick={handleLogout} className="secondary">
            [LOGOUT]
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        <div className="panel">
          <div className="panel-title">
            SATI // System Status
          </div>
          <div style={{ padding: '16px' }}>
            <div>FRONTEND: <span style={{ color: '#0f0' }}>[ONLINE]</span></div>
            <div>BACKEND: <span style={{
              color: backendStatus === 'connected' ? '#0f0' :
                     backendStatus === 'checking' ? '#ff0' : '#f00'
            }}>
              [{backendStatus === 'connected' ? 'ONLINE' :
                backendStatus === 'checking' ? 'CHECKING...' : 'OFFLINE'}]
            </span></div>
            <div>DATABASE: <span style={{ color: '#0f0' }}>[CONNECTED]</span></div>
            <div>GIS ENGINE: <span style={{ color: '#666' }}>[PHASE 2]</span></div>
            <div>STAC API: <span style={{ color: '#666' }}>[PHASE 3]</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            SATI // API Management
          </div>
          <div style={{ padding: '16px' }}>
            {backendStatus === 'connected' ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name (e.g., production)"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={createApiKey}
                      disabled={!newKeyName}
                      className="primary"
                    >
                      [CREATE]
                    </button>
                  </div>
                </div>

                {generatedKey && (
                  <div className="success-message" style={{ marginBottom: '16px', padding: '8px', fontSize: '11px' }}>
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
                    apiKeys.map((key: any, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        • {key.name} - {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Backend connection required
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            SATI // Quick Actions
          </div>
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => window.open('http://localhost:8000/api/v1/docs', '_blank')}
              style={{ marginBottom: '8px', width: '100%' }}
              disabled={backendStatus !== 'connected'}
            >
              [VIEW API DOCS]
            </button>
            <button
              onClick={() => checkBackendConnection(user?.email || '')}
              style={{ marginBottom: '8px', width: '100%' }}
            >
              [RECONNECT BACKEND]
            </button>
            <button
              onClick={() => router.push('/map')}
              style={{ width: '100%' }}
              disabled={true}
            >
              [OPEN MAP VIEW] (Phase 2)
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            SATI // Development Log
          </div>
          <div style={{ padding: '16px', fontSize: '11px', height: '150px', overflowY: 'auto' }}>
            <div>[{new Date().toLocaleTimeString()}] Session initialized</div>
            <div>[{new Date().toLocaleTimeString()}] Checking backend status...</div>
            {backendStatus === 'connected' && (
              <>
                <div>[{new Date().toLocaleTimeString()}] Backend connected</div>
                <div>[{new Date().toLocaleTimeString()}] API keys loaded</div>
              </>
            )}
            {backendStatus === 'disconnected' && (
              <div style={{ color: '#ff0' }}>[{new Date().toLocaleTimeString()}] Backend offline - start with: cd sati-be && python -m app.main</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          SATI // Implementation Roadmap
        </div>
        <div style={{ padding: '16px', fontSize: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>✓ PHASE 1: Authentication & API</strong>
            <div style={{ marginLeft: '16px', color: '#0f0' }}>
              • Supabase auth • Dashboard • API key management • Backend integration
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
              • STAC integration • Date/cloud filters • Scene preview • Metadata view
            </div>
          </div>

          <div>
            <strong>○ PHASE 4: Processing</strong>
            <div style={{ marginLeft: '16px', color: '#666' }}>
              • NDVI/NDWI • Band math • Export formats • Job queue
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}