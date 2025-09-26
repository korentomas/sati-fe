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

interface ImageryMapProps {
  onPolygonDrawn: (polygon: GeoJSON.Polygon) => void
  center?: [number, number]
  zoom?: number
}

const ImageryMap = memo(({ onPolygonDrawn, center = [45, 10], zoom = 5 }: ImageryMapProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onPolygonDrawn)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onPolygonDrawn
  }, [onPolygonDrawn])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current).setView(center, zoom)
    mapRef.current = map

    // Add base tile layer with proper error handling
    try {
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      })

      if (tileLayer && typeof tileLayer.addTo === 'function') {
        tileLayer.addTo(map)
      }
    } catch (err) {
      console.error('Error adding tile layer:', err)
    }

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