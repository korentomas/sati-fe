'use client'

import { useEffect, useRef, memo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export interface ImageryLayer {
  id: string
  name: string
  url: string
  bounds?: L.LatLngBoundsExpression
  opacity: number
  visible: boolean
}

interface ImageryMapProps {
  onPolygonDrawn: (polygon: GeoJSON.Polygon) => void
  layers?: ImageryLayer[]
  onLayerUpdate?: (layerId: string, updates: Partial<ImageryLayer>) => void
  center?: [number, number]
  zoom?: number
}

const ImageryMap = memo(
  ({
    onPolygonDrawn,
    layers = [],
    onLayerUpdate,
    center = [45, 10],
    zoom = 5,
  }: ImageryMapProps) => {
    const mapRef = useRef<L.Map | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const callbackRef = useRef(onPolygonDrawn)
    const layersRef = useRef<Map<string, L.ImageOverlay | L.TileLayer>>(new Map())

    // Update callback ref when it changes
    useEffect(() => {
      callbackRef.current = onPolygonDrawn
    }, [onPolygonDrawn])

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return

      // Initialize map
      const map = L.map(containerRef.current).setView(center, zoom)
      mapRef.current = map

      // Add base tile layer with error handling
      try {
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        })

        if (osmLayer && typeof osmLayer.addTo === 'function') {
          osmLayer.addTo(map)
        } else {
          console.warn('TileLayer created but addTo method not available')
        }
      } catch (err) {
        console.error('Error creating tile layer:', err)
      }

      // Initialize Geoman controls
      ;(map as any).pm.addControls({
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
        const layer = e.layer
        if (e.shape === 'Rectangle' || e.shape === 'Polygon') {
          const geoJson = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
          callbackRef.current(geoJson.geometry)

          // Remove other polygons
          map.eachLayer((l: any) => {
            if (l instanceof L.Polygon && l !== layer && l !== e.layer) {
              map.removeLayer(l)
            }
          })
        }
      })

      return () => {
        map.remove()
        mapRef.current = null
      }
    }, []) // Remove dependencies to prevent re-initialization

    // Handle layer changes
    useEffect(() => {
      if (!mapRef.current) return

      const map = mapRef.current

      // Update or add layers
      layers.forEach((layer) => {
        let mapLayer = layersRef.current.get(layer.id)

        if (!mapLayer) {
          // Create new layer
          if (layer.url) {
            try {
              if (layer.bounds) {
                // Use image overlay for thumbnails with known bounds
                // Convert bounds to LatLngBounds if needed
                const bounds = L.latLngBounds(layer.bounds as L.LatLngBoundsExpression)
                mapLayer = L.imageOverlay(layer.url, bounds, {
                  opacity: layer.opacity,
                  attribution: `© ${layer.name}`,
                })
              } else {
                // Try as tile layer if it's a tile service URL
                // This would work with TMS/XYZ tile services
                mapLayer = L.tileLayer(layer.url, {
                  opacity: layer.opacity,
                  attribution: `© ${layer.name}`,
                  maxZoom: 18,
                })
              }
              layersRef.current.set(layer.id, mapLayer)
            } catch (err) {
              console.error('Error creating layer:', err)
              return
            }
          }
        }

        if (mapLayer) {
          // Update existing layer
          mapLayer.setOpacity(layer.opacity)

          if (layer.visible && !map.hasLayer(mapLayer)) {
            mapLayer.addTo(map)
            // If it has bounds, fit the map to show the layer
            if (layer.bounds && layers.filter((l) => l.visible).length === 1) {
              const bounds = L.latLngBounds(layer.bounds as L.LatLngBoundsExpression)
              map.fitBounds(bounds, { padding: [50, 50] })
            }
          } else if (!layer.visible && map.hasLayer(mapLayer)) {
            map.removeLayer(mapLayer)
          }
        }
      })

      // Remove layers that are no longer in the list
      layersRef.current.forEach((mapLayer, id) => {
        if (!layers.find((l) => l.id === id)) {
          if (map.hasLayer(mapLayer)) {
            map.removeLayer(mapLayer)
          }
          layersRef.current.delete(id)
        }
      })
    }, [layers])

    return (
      <div
        ref={containerRef}
        style={{
          height: '400px',
          width: '100%',
          border: '1px solid #333',
          borderRadius: '4px',
        }}
      />
    )
  }
)

ImageryMap.displayName = 'ImageryMap'

export default ImageryMap
