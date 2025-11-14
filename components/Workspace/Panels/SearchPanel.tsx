'use client'

import { useState, useEffect } from 'react'
import { apiClient, SceneResponse } from '@/lib/api/client'
import { useLayerStore } from '@/lib/stores/layerStore'
import ImageCarousel from '../ImageCarousel'
import styles from '../Workspace.module.css'

interface SearchPanelProps {
  drawnPolygon?: GeoJSON.Polygon
  onSceneSelect?: (scene: SceneResponse) => void
  onLayerAdd?: (scene: SceneResponse) => void
}

export default function SearchPanel({ drawnPolygon, onSceneSelect, onLayerAdd }: SearchPanelProps) {
  const addLayer = useLayerStore((state) => state.addLayer)
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [cloudCover, setCloudCover] = useState(30)
  const [collection, setCollection] = useState('sentinel-2-l2a')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SceneResponse[]>([])
  const [showResults, setShowResults] = useState(false)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)

  const handleAddLayer = (scene: SceneResponse) => {
    // Add to layer store
    addLayer({
      id: `scene-${scene.id}`,
      name: `${scene.collection} - ${new Date(scene.properties.datetime).toLocaleDateString()}`,
      type: 'satellite',
      visible: true,
      scene: scene,
      visualization: {
        brightness: 0,
        contrast: 0,
        opacity: 100,
        bands: 'B4,B3,B2', // Default to true color
        min: 0,
        max: 3000, // Default for Sentinel-2
        gamma: 1,
      },
    })

    // Call the parent handler if provided
    onLayerAdd?.(scene)

    // Close carousel if open
    setCarouselOpen(false)
  }

  const handleViewScene = (index: number) => {
    setCarouselIndex(index)
    setCarouselOpen(true)
  }

  const handleSearch = async () => {
    if (!drawnPolygon) {
      setError('Please draw a polygon on the map first')
      return
    }

    setLoading(true)
    setError(null)
    setShowResults(false)

    try {
      const response = await apiClient.searchImagery({
        geometry: drawnPolygon,
        date_from: dateFrom,
        date_to: dateTo,
        collections: [collection],
        cloud_cover_max: cloudCover,
        limit: 20,
      })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setSearchResults(response.data.scenes)
        setShowResults(true)
        console.log(`Found ${response.data.total} scenes`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.searchForm}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Collection</label>
        <select
          className={styles.formInput}
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="sentinel-2-l2a">Sentinel-2 L2A</option>
          <option value="landsat-8">Landsat 8</option>
          <option value="landsat-9">Landsat 9</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Date From</label>
        <input
          type="date"
          className={styles.formInput}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Date To</label>
        <input
          type="date"
          className={styles.formInput}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Cloud Cover Max (%)</label>
        <input
          type="range"
          className={styles.formInput}
          min="0"
          max="100"
          value={cloudCover}
          onChange={(e) => setCloudCover(Number(e.target.value))}
        />
        <span style={{ fontSize: '11px' }}>{cloudCover}%</span>
      </div>

      {error && <div style={{ color: 'rgb(var(--destructive))', fontSize: '11px' }}>{error}</div>}

      <button
        className={styles.searchButton}
        onClick={handleSearch}
        disabled={loading || !drawnPolygon}
      >
        {loading ? '[ SEARCHING... ]' : '[ SEARCH ]'}
      </button>

      {!drawnPolygon && (
        <div className={styles.infoMessage}>Draw a polygon on the map to search for imagery</div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className={styles.searchResults}>
          <div className={styles.resultsHeader}>Found {searchResults.length} scenes</div>
          <div
            style={{
              fontSize: '11px',
              padding: '8px',
              background: 'rgba(var(--warning), 0.1)',
              border: '1px solid rgba(var(--warning), 0.3)',
              marginBottom: '8px',
            }}
          >
            ℹ️ <strong>Note:</strong> Each satellite scene covers a fixed area (~100km²). Your area
            may require multiple scenes for complete coverage. Green dashed lines show actual scene
            boundaries.
          </div>
          <div className={styles.resultsList}>
            {searchResults.map((scene, index) => (
              <div
                key={scene.id}
                className={styles.sceneCard}
                onClick={() => handleViewScene(index)}
                style={{ cursor: 'pointer' }}
              >
                {scene.thumbnail_url && (
                  <img src={scene.thumbnail_url} alt={scene.id} className={styles.sceneThumbnail} />
                )}
                <div className={styles.sceneInfo}>
                  <div className={styles.sceneId}>{scene.id}</div>
                  <div className={styles.sceneDetails}>
                    <span>Date: {new Date(scene.properties.datetime).toLocaleDateString()}</span>
                    <span>Cloud: {scene.properties.cloud_cover?.toFixed(1) || 'N/A'}%</span>
                    {/* Show if scene might not fully cover the area */}
                    {drawnPolygon && scene.geometry && (
                      <span style={{ color: 'rgb(var(--warning))' }}>⚠️ Check coverage</span>
                    )}
                  </div>
                  <div className={styles.sceneActions}>
                    <button
                      className={styles.sceneButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewScene(index)
                      }}
                    >
                      [VIEW]
                    </button>
                    <button
                      className={styles.sceneButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddLayer(scene)
                      }}
                    >
                      [ADD LAYER]
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && searchResults.length === 0 && (
        <div className={styles.infoMessage}>No scenes found for the selected criteria</div>
      )}

      {/* Image Carousel Modal */}
      <ImageCarousel
        scenes={searchResults}
        initialIndex={carouselIndex}
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        onAddLayer={handleAddLayer}
      />
    </div>
  )
}
