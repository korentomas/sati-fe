// Type definitions for @geoman-io/leaflet-geoman-free
// Minimal type definitions for the parts we use

import * as L from 'leaflet'

declare module 'leaflet' {
  interface PMOptions {
    position?: string
    drawCircle?: boolean
    drawCircleMarker?: boolean
    drawPolyline?: boolean
    drawMarker?: boolean
    drawText?: boolean
    drawRectangle?: boolean
    drawPolygon?: boolean
    editMode?: boolean
    dragMode?: boolean
    cutPolygon?: boolean
    rotateMode?: boolean
  }

  interface PM {
    addControls(options?: PMOptions): void
    removeControls(): void
    enableDraw(shape: string, options?: any): void
    disableDraw(): void
  }

  interface Map {
    pm: PM
  }

  interface Layer {
    toGeoJSON?(): GeoJSON.Feature
  }
}

export {}
