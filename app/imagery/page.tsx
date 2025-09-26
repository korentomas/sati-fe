'use client'

import { useState, useEffect } from 'react'
import { imageryApi, Collection, SearchResponse, Scene } from '@/lib/api/imagery'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function ImageryPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('sentinel-2-l2a')
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0])
  const [cloudCover, setCloudCover] = useState<number>(30)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simple bbox for demo (covers interesting area)
  const defaultBbox: [number, number, number, number] = [-10, 35, 30, 60] // Europe

  useEffect(() => {
    // Check authentication
    if (!apiClient.isAuthenticated()) {
      // Redirect to login with return URL
      router.push('/login?from=/imagery')
      return
    }

    // Load collections
    loadCollections()
  }, [router])

  const loadCollections = async () => {
    try {
      const cols = await imageryApi.listCollections()
      setCollections(cols)
    } catch (err) {
      console.error('Failed to load collections:', err)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await imageryApi.search({
        bbox: defaultBbox,
        date_from: dateFrom,
        date_to: dateTo,
        collections: [selectedCollection],
        cloud_cover_max: cloudCover,
        limit: 20,
      })
      setSearchResults(results)
    } catch (err: any) {
      // Check if it's an auth error
      if (err?.status === 401 || err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        // Session expired, redirect to login
        router.push('/login?from=/imagery')
      } else {
        setError(err instanceof Error ? err.message : 'Search failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="container">
      <div className="panel">
        <div className="panel-title">SATI // Satellite Imagery Search</div>

        <div style={{ padding: '16px' }}>
          {/* Search Controls */}
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                COLLECTION:
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="sentinel-2-l2a">Sentinel-2 L2A</option>
                <option value="landsat-c2-l2">Landsat 8/9 Collection 2</option>
                <option value="cop-dem-glo-30">Copernicus DEM 30m</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  FROM DATE:
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                  TO DATE:
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                MAX CLOUD COVER: {cloudCover}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cloudCover}
                onChange={(e) => setCloudCover(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="primary"
              style={{ width: '100%' }}
            >
              {loading ? 'SEARCHING...' : '[SEARCH IMAGERY]'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Search Results */}
          {searchResults && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '12px', color: '#0f0' }}>
                FOUND: {searchResults.total} scenes | SHOWING: {searchResults.returned}
              </div>

              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '8px',
                }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  {searchResults.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      style={{
                        padding: '12px',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
                        <div>
                          <div style={{ color: '#0f0', marginBottom: '4px', fontSize: '11px' }}>
                            {scene.collection}/{scene.id}
                          </div>
                          <div>Date: {formatDate(scene.properties.datetime)}</div>
                          <div>
                            Cloud: {scene.properties.cloud_cover?.toFixed(1) || 'N/A'}%
                          </div>
                          {scene.properties.platform && (
                            <div>Platform: {scene.properties.platform}</div>
                          )}
                        </div>
                        {scene.thumbnail_url && (
                          <img
                            src={scene.thumbnail_url}
                            alt="Scene thumbnail"
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              border: '1px solid #666',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">SATI // Search Info</div>
        <div style={{ padding: '16px', fontSize: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Data Source:</strong> AWS Earth Search (STAC API)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Coverage:</strong> Europe (demo bbox)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Available Collections:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
              <li>Sentinel-2 Level 2A (10m resolution)</li>
              <li>Landsat 8/9 Collection 2 (30m resolution)</li>
              <li>Copernicus DEM (30m elevation)</li>
            </ul>
          </div>
          <div style={{ color: '#ff0' }}>
            ⚠️ Map drawing coming in next iteration
          </div>
        </div>
      </div>
    </div>
  )
}