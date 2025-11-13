'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface WorkspaceMapProps {
  onCoordsChange: (coords: { lat: number; lng: number }) => void
  onZoomChange: (zoom: number) => void
  selectedLayers: string[]
}

export default function WorkspaceMap({
  onCoordsChange,
  onZoomChange,
  selectedLayers
}: WorkspaceMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current, {
      center: [40.0, -3.0], // Spain
      zoom: 6,
      zoomControl: false
    })

    // Add zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Add scale control
    L.control.scale({ position: 'bottomright' }).addTo(map)

    // Base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

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
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle layer changes
  useEffect(() => {
    if (!mapRef.current) return

    // TODO: Add/remove layers based on selectedLayers
    console.log('Selected layers:', selectedLayers)
  }, [selectedLayers])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'rgb(var(--muted))'
      }}
    />
  )
}