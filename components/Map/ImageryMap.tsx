'use client'

import { useEffect, useRef, memo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'

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
    const layersRef = useRef<Map<string, L.Layer>>(new Map())

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
      map.on('pm:create', (e) => {
        const event = e as L.LeafletEvent & {
          layer: L.Layer & { toGeoJSON: () => GeoJSON.Feature }
          shape: string
        }
        const { layer, shape } = event
        if (shape === 'Rectangle' || shape === 'Polygon') {
          const geoJson = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>
          callbackRef.current(geoJson.geometry)

          // Remove other polygons
          map.eachLayer((l: L.Layer) => {
            if (l instanceof L.Polygon && l !== layer) {
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
              // Check if it's a WMS URL
              if (layer.url.includes('WMS') || layer.url.includes('wms')) {
                // For WMS layers, use tileLayer.wms
                mapLayer = L.tileLayer.wms(layer.url.split('?')[0], {
                  layers: 's2cloudless_3857',
                  format: 'image/png',
                  transparent: true,
                  opacity: layer.opacity,
                  attribution: `© ${layer.name}`,
                })
              } else if (layer.url.includes('{z}') && layer.url.includes('{x}') && layer.url.includes('{y}')) {
                // This is a tile URL pattern - use as tile layer
                mapLayer = L.tileLayer(layer.url, {
                  opacity: layer.opacity,
                  attribution: `© ${layer.name}`,
                  maxZoom: 18,
                  minZoom: 2,
                  tileSize: 256,
                  crossOrigin: true,
                  errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Transparent 1x1 pixel
                })

                // Add loading and error event handlers
                if (mapLayer) {
                  mapLayer.on('loading', () => {
                    console.log(`Loading tiles for ${layer.name}`)
                  })

                  mapLayer.on('load', () => {
                    console.log(`Tiles loaded for ${layer.name}`)
                  })

                  interface TileErrorEvent extends L.LeafletEvent {
                    tile: { src: string }
                  }
                  mapLayer.on('tileerror', (error: TileErrorEvent) => {
                    console.warn(`Tile error for ${layer.name}:`, error.tile.src)
                    // The errorTileUrl will be used automatically
                  })
                }
              } else if (layer.bounds && !layer.url.includes('{')) {
                // Use image overlay for static images with known bounds
                const bounds = L.latLngBounds(layer.bounds as L.LatLngExpression[])

                // For thumbnails, we'll create a simple colored rectangle as placeholder
                // since the actual thumbnail URLs might not be accessible
                console.log('Creating placeholder for:', layer.name)

                // Create a simple rectangle to show the scene bounds
                const rectangle = L.rectangle(bounds, {
                  color: '#0f0',
                  weight: 2,
                  opacity: layer.opacity,
                  fillColor: '#0f0',
                  fillOpacity: layer.opacity * 0.2,
                })

                mapLayer = rectangle
              } else {
                // Try as generic tile layer
                mapLayer = L.tileLayer(layer.url, {
                  opacity: layer.opacity,
                  attribution: `© ${layer.name}`,
                  maxZoom: 18,
                })
              }

              if (mapLayer) {
                layersRef.current.set(layer.id, mapLayer)
              }
            } catch (err) {
              console.error('Error creating layer:', err)
              return
            }
          }
        }

        if (mapLayer) {
          // Update existing layer
          if ('setOpacity' in mapLayer && typeof mapLayer.setOpacity === 'function') {
            (mapLayer as L.TileLayer).setOpacity(layer.opacity)
          }

          if (layer.visible && !map.hasLayer(mapLayer)) {
            mapLayer.addTo(map)
            // If it has bounds, fit the map to show the layer
            if (layer.bounds && layers.filter((l) => l.visible).length === 1) {
              const bounds = L.latLngBounds(layer.bounds as L.LatLngExpression[])
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
