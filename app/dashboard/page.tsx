'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-title">LOADING...</div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h1>SATI // SATELLITE IMAGERY GATEWAY</h1>
        <nav>
          <span style={{ marginRight: '16px', fontSize: '14px' }}>
            USER: {user?.email}
          </span>
          <button onClick={handleLogout} style={{
            background: 'transparent',
            border: '1px solid white',
            color: 'white',
            padding: '4px 12px',
            fontSize: '12px'
          }}>
            [LOGOUT]
          </button>
        </nav>
      </div>

      <div className="container">
        <div className="panel">
          <div className="panel-title">
            SYSTEM STATUS
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            <p>[✓] Authentication Module......... ONLINE</p>
            <p>[✓] User Session.................. ACTIVE</p>
            <p>[✓] Database Connection........... ESTABLISHED</p>
            <p>[•] Satellite API................. PENDING</p>
            <p>[•] Map Interface................. PENDING</p>
            <p>[•] Processing Engine............. PENDING</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div className="panel">
            <div className="panel-title">
              USER INFORMATION
            </div>
            <div style={{ fontSize: '12px' }}>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Last Login:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              QUICK ACTIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button disabled style={{ opacity: 0.5 }}>
                [SEARCH IMAGERY] - COMING SOON
              </button>
              <button disabled style={{ opacity: 0.5 }}>
                [VIEW MAP] - COMING SOON
              </button>
              <button disabled style={{ opacity: 0.5 }}>
                [PROCESSING JOBS] - COMING SOON
              </button>
              <button disabled style={{ opacity: 0.5 }}>
                [SETTINGS] - COMING SOON
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              SYSTEM MESSAGES
            </div>
            <div style={{ fontSize: '11px', height: '120px', overflowY: 'auto' }}>
              <p>[{new Date().toLocaleTimeString()}] Welcome to SATI Platform</p>
              <p>[{new Date().toLocaleTimeString()}] Authentication successful</p>
              <p>[{new Date().toLocaleTimeString()}] Loading user preferences...</p>
              <p>[{new Date().toLocaleTimeString()}] Satellite API integration pending</p>
              <p>[{new Date().toLocaleTimeString()}] Map features will be available soon</p>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-title">
            DEVELOPMENT ROADMAP
          </div>
          <div style={{ fontSize: '12px' }}>
            <h4 style={{ marginBottom: '8px' }}>PHASE 1 - Authentication (COMPLETE)</h4>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>[✓] User registration with Supabase</li>
              <li>[✓] Email/password login</li>
              <li>[✓] Protected routes</li>
              <li>[✓] Session management</li>
            </ul>

            <h4 style={{ marginBottom: '8px' }}>PHASE 2 - Map Integration (IN PROGRESS)</h4>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>[•] Leaflet map component</li>
              <li>[•] Geoman drawing tools</li>
              <li>[•] AOI selection</li>
              <li>[•] GeoJSON export/import</li>
            </ul>

            <h4 style={{ marginBottom: '8px' }}>PHASE 3 - Satellite Search (PLANNED)</h4>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>[•] Backend API integration</li>
              <li>[•] Search filters (date, cloud cover)</li>
              <li>[•] Scene preview</li>
              <li>[•] Results visualization</li>
            </ul>

            <h4 style={{ marginBottom: '8px' }}>PHASE 4 - Processing (PLANNED)</h4>
            <ul style={{ marginLeft: '20px' }}>
              <li>[•] NDVI calculation</li>
              <li>[•] Image clipping</li>
              <li>[•] Job queue management</li>
              <li>[•] Result download</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}