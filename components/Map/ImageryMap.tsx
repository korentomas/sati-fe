'use client'

import { useEffect, useRef, memo } from 'react'
import L from 'leaflet'
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

const ImageryMap = memo(({ onPolygonDrawn, layers = [], onLayerUpdate, center = [45, 10], zoom = 5 }: ImageryMapProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onPolygonDrawn)
  const layersRef = useRef<Map<string, L.TileLayer>>(new Map())
  const layerControlRef = useRef<L.Control.Layers | null>(null)
  const baseLayerRef = useRef<L.TileLayer | null>(null)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onPolygonDrawn
  }, [onPolygonDrawn])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current).setView(center, zoom)
    mapRef.current = map

    // Add base tile layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    })
    osmLayer.addTo(map)
    baseLayerRef.current = osmLayer

    // Create layer control
    const baseLayers = {
      'OpenStreetMap': osmLayer
    }

    layerControlRef.current = L.control.layers(baseLayers, {}, {
      position: 'topright',
      collapsed: false
    }).addTo(map)

    // Initialize Geoman controls
    (map as any).pm.addControls({
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
    if (!mapRef.current || !layerControlRef.current) return

    const map = mapRef.current
    const control = layerControlRef.current

    // Update or add layers
    layers.forEach(layer => {
      let tileLayer = layersRef.current.get(layer.id)

      if (!tileLayer) {
        // Create new layer
        tileLayer = L.tileLayer(layer.url, {
          opacity: layer.opacity,
          bounds: layer.bounds,
          attribution: `© ${layer.name}`,
        })
        layersRef.current.set(layer.id, tileLayer)

        // Add to layer control
        control.addOverlay(tileLayer, layer.name)

        // Add to map if visible
        if (layer.visible) {
          tileLayer.addTo(map)
        }
      } else {
        // Update existing layer
        tileLayer.setOpacity(layer.opacity)

        if (layer.visible && !map.hasLayer(tileLayer)) {
          tileLayer.addTo(map)
        } else if (!layer.visible && map.hasLayer(tileLayer)) {
          map.removeLayer(tileLayer)
        }
      }
    })

    // Remove layers that are no longer in the list
    layersRef.current.forEach((tileLayer, id) => {
      if (!layers.find(l => l.id === id)) {
        control.removeLayer(tileLayer)
        if (map.hasLayer(tileLayer)) {
          map.removeLayer(tileLayer)
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
        borderRadius: '4px'
      }}
    />
  )
})

ImageryMap.displayName = 'ImageryMap'

export default ImageryMap