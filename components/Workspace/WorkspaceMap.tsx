'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { useLayerStore } from '@/lib/stores/layerStore'

// Fix Leaflet default marker icon issue
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: string
}
delete (L.Icon.Default.prototype as LeafletIconDefault)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface WorkspaceMapProps {
  onCoordsChange: (coords: { lat: number; lng: number }) => void
  onZoomChange: (zoom: number) => void
  selectedLayers: string[]
  onPolygonDrawn?: (polygon: GeoJSON.Polygon) => void
}

export default function WorkspaceMap({
  onCoordsChange,
  onZoomChange,
  selectedLayers,
  onPolygonDrawn,
}: WorkspaceMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null)
  const tileLayersRef = useRef<Map<string, L.TileLayer>>(new Map())

  const layers = useLayerStore((state) => state.layers)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current, {
      center: [40.0, -3.0], // Spain
      zoom: 6,
      zoomControl: false,
    })

    // Add zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Add scale control
    L.control.scale({ position: 'bottomright' }).addTo(map)

    // Base layer with caching optimizations
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
      maxNativeZoom: 19,
      keepBuffer: 2, // Keep tiles around viewport
      crossOrigin: true, // Enable CORS caching
    }).addTo(map)

    // Initialize drawn items layer
    const drawnItems = new L.FeatureGroup() as L.FeatureGroup
    map.addLayer(drawnItems as L.Layer)
    drawnLayersRef.current = drawnItems

    // Initialize Geoman controls
    map.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawMarker: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      rotateMode: false,
    })

    // Handle polygon creation
    map.on('pm:create', (e: any) => {
      const { layer, shape } = e
      if (shape === 'Rectangle' || shape === 'Polygon') {
        // Clear previous drawings
        drawnItems.clearLayers()

        // Add new layer
        drawnItems.addLayer(layer)

        // Convert to GeoJSON and notify parent
        const geoJson = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
        if (onPolygonDrawn) {
          onPolygonDrawn(geoJson.geometry)
        }
      }
    })

    // Mouse position tracking
    map.on('mousemove', (e) => {
      onCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    })

    // Zoom tracking
    map.on('zoomend', () => {
      onZoomChange(map.getZoom())
    })

    mapRef.current = map

    // Initial values
    onZoomChange(map.getZoom())

    return () => {
      // Clean up tile layers
      tileLayersRef.current.forEach((tileLayer) => {
        if (mapRef.current?.hasLayer(tileLayer)) {
          mapRef.current.removeLayer(tileLayer)
        }
      })
      tileLayersRef.current.clear()

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync layers from store with map
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const tileLayers = tileLayersRef.current

    // Process each layer from the store
    layers.forEach((layer) => {
      if (layer.type === 'processing' && layer.result) {
        // Handle processing result layers
        const existingTileLayer = tileLayers.get(layer.id)

        if (!existingTileLayer) {
          // Create tile layer for processing result
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
          const tileUrl = `${baseUrl}/processing/jobs/${layer.result.job_id}/tiles/{z}/{x}/{y}.png`

          const tileLayer = L.tileLayer(tileUrl, {
            attribution: `Processing Result - ${layer.result.type}`,
            maxZoom: 20,
            maxNativeZoom: 18,
            opacity: layer.visualization?.opacity ? layer.visualization.opacity / 100 : 0.8,
            tileSize: 256,
            zIndex: 200 + layers.indexOf(layer), // Stack above satellite layers
            className: 'leaflet-tile-transparent',
            keepBuffer: 4,
            updateWhenIdle: false,
            updateWhenZooming: true,
            crossOrigin: true,
          })

          if (layer.visible) {
            tileLayer.addTo(map)
          }

          tileLayers.set(layer.id, tileLayer)
        } else {
          // Update existing layer
          if (layer.visualization?.opacity) {
            existingTileLayer.setOpacity(layer.visualization.opacity / 100)
          }

          if (layer.visible && !map.hasLayer(existingTileLayer)) {
            existingTileLayer.addTo(map)
          } else if (!layer.visible && map.hasLayer(existingTileLayer)) {
            map.removeLayer(existingTileLayer)
          }

          // Update z-index for proper stacking
          existingTileLayer.setZIndex(200 + layers.indexOf(layer))
        }
      } else if (layer.type === 'satellite' && layer.scene) {
        const existingTileLayer = tileLayers.get(layer.id)

        if (!existingTileLayer) {
          // Create new tile layer
          const { scene, visualization } = layer

          // Build tile URL with visualization params
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
          const collection = scene.collection || 'sentinel-2-l2a'
          const tileUrl = `${baseUrl}/imagery/tiles/${scene.id}/{z}/{x}/{y}.png?bands=${visualization.bands}&collection=${collection}`

          const tileLayer = L.tileLayer(tileUrl, {
            attribution: `${scene.collection} - ${scene.id}`,
            maxZoom: 20,
            maxNativeZoom: 18, // Allow overzoom without re-fetching
            opacity: visualization.opacity / 100,
            tileSize: 256,
            zIndex: 100 + layers.indexOf(layer), // Stack above base layer
            className: 'leaflet-tile-transparent', // Ensure transparency support
            keepBuffer: 4, // Keep 4 rows of tiles outside viewport
            updateWhenIdle: false, // Update tiles immediately
            updateWhenZooming: true, // Keep updating during zoom
            crossOrigin: true, // Enable CORS for better caching
          })

          if (layer.visible) {
            tileLayer.addTo(map)
          }

          tileLayers.set(layer.id, tileLayer)
        } else {
          // Update existing layer
          existingTileLayer.setOpacity(layer.visualization.opacity / 100)

          if (layer.visible && !map.hasLayer(existingTileLayer)) {
            existingTileLayer.addTo(map)
          } else if (!layer.visible && map.hasLayer(existingTileLayer)) {
            map.removeLayer(existingTileLayer)
          }

          // Check if bands have changed (requires new tile layer)
          const currentUrl = (existingTileLayer as any)._url
          const expectedBands = layer.visualization.bands
          if (!currentUrl.includes(`bands=${expectedBands}`)) {
            // Bands changed, need to recreate tile layer
            map.removeLayer(existingTileLayer)
            tileLayers.delete(layer.id)

            // Create new tile layer with updated bands
            const { scene, visualization } = layer
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            const collection = scene.collection || 'sentinel-2-l2a'
            const tileUrl = `${baseUrl}/imagery/tiles/${scene.id}/{z}/{x}/{y}.png?bands=${visualization.bands}&collection=${collection}`

            const newTileLayer = L.tileLayer(tileUrl, {
              attribution: `${scene.collection} - ${scene.id}`,
              maxZoom: 20,
              maxNativeZoom: 18, // Allow overzoom without re-fetching
              opacity: visualization.opacity / 100,
              tileSize: 256,
              zIndex: 100 + layers.indexOf(layer),
              className: 'leaflet-tile-transparent', // Ensure transparency support
              keepBuffer: 4, // Keep 4 rows of tiles outside viewport
              updateWhenIdle: false, // Update tiles immediately
              updateWhenZooming: true, // Keep updating during zoom
              crossOrigin: true, // Enable CORS for better caching
            })

            if (layer.visible) {
              newTileLayer.addTo(map)
            }

            tileLayers.set(layer.id, newTileLayer)
          } else {
            // Update z-index for proper stacking
            existingTileLayer.setZIndex(100 + layers.indexOf(layer))
          }
        }
      }
    })

    // Remove tile layers that are no longer in store
    const layerIds = new Set(layers.map((l) => l.id))
    tileLayers.forEach((tileLayer, id) => {
      if (!layerIds.has(id)) {
        map.removeLayer(tileLayer)
        tileLayers.delete(id)
      }
    })
  }, [layers])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'rgb(var(--muted))',
      }}
    />
  )
}
