'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { imageryApi, Collection, SearchResponse, Scene } from '@/lib/api/imagery'
import { useAuth } from '@/hooks/useAuth'
import type { ImageryLayer } from '@/components/Map/ImageryMap'

// Dynamic import to avoid SSR issues with Leaflet
const ImageryMap = dynamic(() => import('@/components/Map/ImageryMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      Loading map...
    </div>
  ),
})

export default function ImageryPage() {
  const { isLoading, isAuthenticated, handleAuthError } = useAuth(true)
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
  const [searchMode, setSearchMode] = useState<'bbox' | 'polygon'>('bbox')
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null)
  const [selectedBands, setSelectedBands] = useState<string[]>(['visual'])
  const [processingLevel, setProcessingLevel] = useState<string>('l2a')
  const [mapLayers, setMapLayers] = useState<ImageryLayer[]>([])

  // Simple bbox for demo (covers interesting area)
  const defaultBbox: [number, number, number, number] = [-10, 35, 30, 60] // Europe

  useEffect(() => {
    // Load collections once authenticated
    if (isAuthenticated) {
      loadCollections()
    }
  }, [isAuthenticated])

  const loadCollections = async () => {
    try {
      const cols = await imageryApi.listCollections()
      setCollections(cols)
    } catch (err: any) {
      // Handle auth errors
      if (!handleAuthError(err)) {
        console.error('Failed to load collections:', err)
      }
    }
  }

  const handlePolygonDrawn = useCallback((polygon: GeoJSON.Polygon) => {
    setDrawnPolygon(polygon)
    setSearchMode('polygon')
  }, [])

  const handleSearch = async () => {
    if (searchMode === 'polygon' && !drawnPolygon) {
      setError('Please draw a polygon on the map first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams: any = {
        date_from: dateFrom,
        date_to: dateTo,
        collections: [selectedCollection],
        cloud_cover_max: cloudCover,
        limit: 20,
      }

      // Use polygon or bbox depending on mode
      if (searchMode === 'polygon' && drawnPolygon) {
        searchParams.geometry = drawnPolygon
      } else {
        searchParams.bbox = defaultBbox
      }

      const results = await imageryApi.search(searchParams)
      setSearchResults(results)
    } catch (err: any) {
      // Check if it's an auth error
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : 'Search failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const handleAddToMap = (scene: Scene) => {
    // Check if layer already exists
    const existingLayer = mapLayers.find((l) => l.id === scene.id)
    if (existingLayer) {
      // Toggle visibility if layer exists
      handleLayerUpdate(scene.id, { visible: !existingLayer.visible })
      return
    }

    // For STAC, we typically need a COG (Cloud Optimized GeoTIFF) URL
    // or a TileJSON endpoint for visualization
    // For demo purposes, we'll use a tile service URL pattern

    console.log('Scene data:', scene)
    console.log('Thumbnail URL:', scene.thumbnail_url)
    console.log('Assets:', scene.assets)

    // Check for visual asset or preview
    let tileUrl = ''

    // For Sentinel-2, we can try to construct a tile URL
    // In production, you'd use a proper tile server
    if (scene.collection.includes('sentinel-2')) {
      // Use a public Sentinel-2 tile service as an example
      // This is a placeholder - real implementation would use your own tile server
      tileUrl = `https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&layers=s2cloudless_3857&width=256&height=256&format=image/png&transparent=true&version=1.1.1&bbox={bbox-epsg-3857}&srs=EPSG:3857&TIME=2023-01-01`
    } else if (scene.thumbnail_url) {
      // Ensure thumbnail URL is complete
      tileUrl = scene.thumbnail_url.startsWith('http')
        ? scene.thumbnail_url
        : `https://earth-search.aws.element84.com/v1${scene.thumbnail_url}`
    }

    if (!tileUrl) {
      setError('No imagery URL available for this scene')
      return
    }

    console.log('Using tile URL:', tileUrl)

    // Add new layer
    const newLayer: ImageryLayer = {
      id: scene.id,
      name: `${scene.collection} - ${formatDate(scene.properties.datetime)}`,
      url: tileUrl,
      opacity: 0.8,
      visible: true,
      bounds: scene.bbox
        ? [
            [scene.bbox[1], scene.bbox[0]],
            [scene.bbox[3], scene.bbox[2]],
          ]
        : undefined,
    }

    setMapLayers([...mapLayers, newLayer])
  }

  const handleLayerUpdate = useCallback((layerId: string, updates: Partial<ImageryLayer>) => {
    setMapLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer))
    )
  }, [])

  const handleLayerRemove = useCallback((layerId: string) => {
    setMapLayers((prev) => prev.filter((layer) => layer.id !== layerId))
  }, [])

  // Show loading while checking auth
  if (isLoading) {
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
                <option value="sentinel-2-l2a">Sentinel-2 L2A (10m)</option>
                <option value="sentinel-2-l1c">Sentinel-2 L1C (Raw)</option>
                <option value="landsat-c2-l2">Landsat 8/9 L2 (30m)</option>
                <option value="landsat-c2-l1">Landsat 8/9 L1 (Raw)</option>
                <option value="sentinel-1-grd">Sentinel-1 SAR GRD</option>
                <option value="cop-dem-glo-30">Copernicus DEM 30m</option>
                <option value="cop-dem-glo-90">Copernicus DEM 90m</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                BAND COMBINATION:
              </label>
              <select
                value={selectedBands[0]}
                onChange={(e) => setSelectedBands([e.target.value])}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="visual">True Color (RGB)</option>
                <option value="false-color">False Color (NIR)</option>
                <option value="ndvi">NDVI Vegetation</option>
                <option value="ndwi">NDWI Water</option>
                <option value="swir">SWIR Infrared</option>
                <option value="urban">Urban False Color</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                PROCESSING LEVEL:
              </label>
              <select
                value={processingLevel}
                onChange={(e) => setProcessingLevel(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="l1c">Level-1C (Top of Atmosphere)</option>
                <option value="l2a">Level-2A (Surface Reflectance)</option>
                <option value="l3">Level-3 (Monthly Composite)</option>
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
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}
                      >
                        <div>
                          <div style={{ color: '#0f0', marginBottom: '4px', fontSize: '11px' }}>
                            {scene.collection}/{scene.id}
                          </div>
                          <div>Date: {formatDate(scene.properties.datetime)}</div>
                          <div>Cloud: {scene.properties.cloud_cover?.toFixed(1) || 'N/A'}%</div>
                          {scene.properties.platform && (
                            <div>Platform: {scene.properties.platform}</div>
                          )}
                          <button
                            onClick={() => handleAddToMap(scene)}
                            style={{
                              marginTop: '8px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: mapLayers.find((l) => l.id === scene.id)
                                ? '#008000'
                                : '#000080',
                              color: '#fff',
                              border: '1px solid #333',
                              cursor: 'pointer',
                            }}
                          >
                            {mapLayers.find((l) => l.id === scene.id) ? '[ON MAP]' : '[ADD TO MAP]'}
                          </button>
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
                              cursor: 'pointer',
                            }}
                            onClick={() => handleAddToMap(scene)}
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

      {/* Map Panel */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">SATI // Area Selection</div>
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px', fontSize: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              SEARCH MODE: {searchMode === 'polygon' ? '[POLYGON DRAWN]' : '[DEFAULT BBOX]'}
            </div>
            <div style={{ color: '#666' }}>
              Use polygon tool to draw custom search area or use default Europe bbox
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <ImageryMap
              onPolygonDrawn={handlePolygonDrawn}
              layers={mapLayers}
              onLayerUpdate={handleLayerUpdate}
            />
            {mapLayers.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 1000,
                  background: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  padding: '8px',
                  maxWidth: '200px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  LAYERS [{mapLayers.length}]
                </div>
                {mapLayers.map((layer) => (
                  <div key={layer.id} style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={(e) => handleLayerUpdate(layer.id, { visible: e.target.checked })}
                      />
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {layer.name}
                      </span>
                    </label>
                    <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity * 100}
                        onChange={(e) =>
                          handleLayerUpdate(layer.id, { opacity: Number(e.target.value) / 100 })
                        }
                        style={{ width: '100%' }}
                        disabled={!layer.visible}
                      />
                      <div style={{ fontSize: '9px', color: '#666' }}>
                        Opacity: {Math.round(layer.opacity * 100)}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleLayerRemove(layer.id)}
                      style={{
                        marginTop: '4px',
                        marginLeft: '20px',
                        padding: '2px 6px',
                        fontSize: '9px',
                        background: '#ff0000',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">SATI // Data Info</div>
        <div style={{ padding: '16px', fontSize: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Data Source:</strong> AWS Earth Search (STAC API)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Available Collections:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
              <li>Sentinel-2 Level 2A (10m resolution)</li>
              <li>Landsat 8/9 Collection 2 (30m resolution)</li>
              <li>Copernicus DEM (30m elevation)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
