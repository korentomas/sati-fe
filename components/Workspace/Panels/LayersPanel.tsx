'use client'

import { useLayerStore } from '@/lib/stores/layerStore'
import styles from '../Workspace.module.css'

interface LayersPanelProps {
  selectedLayers: string[]
  onLayerSelect: (layerId: string) => void
}

const BAND_COMBINATIONS = [
  { label: 'True Color', value: 'B4,B3,B2', description: 'Natural RGB' },
  { label: 'False Color', value: 'B8,B4,B3', description: 'Vegetation' },
  { label: 'Agriculture', value: 'B11,B8,B2', description: 'Crop health' },
  { label: 'Atmospheric', value: 'B12,B11,B8A', description: 'SWIR' },
  { label: 'NDVI', value: 'NDVI', description: 'Normalized Difference Vegetation Index' },
  { label: 'NDWI', value: 'NDWI', description: 'Normalized Difference Water Index' },
]

export default function LayersPanel({ selectedLayers, onLayerSelect }: LayersPanelProps) {
  const {
    layers,
    activeLayerId,
    toggleLayerVisibility,
    updateLayerVisualization,
    setActiveLayer,
    removeLayer,
  } = useLayerStore()

  const activeLayer = layers.find((l) => l.id === activeLayerId)

  return (
    <div className={styles.layersPanel}>
      <div className={styles.layersList}>
        <div className={styles.layersHeader}>LAYERS</div>
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`${styles.layerItem} ${activeLayerId === layer.id ? styles.layerItemActive : ''}`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) => {
                e.stopPropagation()
                toggleLayerVisibility(layer.id)
              }}
              className={styles.layerCheckbox}
            />
            <span className={styles.layerName}>{layer.name}</span>
            <span className={styles.layerType}>[{layer.type}]</span>
            {layer.type !== 'base' && (
              <button
                className={styles.layerRemove}
                onClick={(e) => {
                  e.stopPropagation()
                  removeLayer(layer.id)
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {activeLayer && activeLayer.type !== 'base' && (
        <div className={styles.layerControls}>
          <div className={styles.controlsHeader}>LAYER CONTROLS</div>

          {/* Band Selection */}
          {activeLayer.type === 'satellite' && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Band Combination</label>
              <select
                className={styles.controlSelect}
                value={activeLayer.visualization.bands}
                onChange={(e) =>
                  updateLayerVisualization(activeLayer.id, { bands: e.target.value })
                }
              >
                {BAND_COMBINATIONS.map((combo) => (
                  <option key={combo.value} value={combo.value}>
                    {combo.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Brightness Control - Only for satellite layers */}
          {activeLayer.type === 'satellite' &&
            activeLayer.visualization.brightness !== undefined && (
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  Brightness: {activeLayer.visualization.brightness}
                </label>
                <input
                  type="range"
                  className={styles.controlSlider}
                  min="-100"
                  max="100"
                  value={activeLayer.visualization.brightness}
                  onChange={(e) =>
                    updateLayerVisualization(activeLayer.id, { brightness: Number(e.target.value) })
                  }
                />
              </div>
            )}

          {/* Contrast Control - Only for satellite layers */}
          {activeLayer.type === 'satellite' && activeLayer.visualization.contrast !== undefined && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                Contrast: {activeLayer.visualization.contrast}
              </label>
              <input
                type="range"
                className={styles.controlSlider}
                min="-100"
                max="100"
                value={activeLayer.visualization.contrast}
                onChange={(e) =>
                  updateLayerVisualization(activeLayer.id, { contrast: Number(e.target.value) })
                }
              />
            </div>
          )}

          {/* Opacity Control */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Opacity: {activeLayer.visualization.opacity}%
            </label>
            <input
              type="range"
              className={styles.controlSlider}
              min="0"
              max="100"
              value={activeLayer.visualization.opacity}
              onChange={(e) =>
                updateLayerVisualization(activeLayer.id, { opacity: Number(e.target.value) })
              }
            />
          </div>

          {/* Gamma Control - Only for satellite layers */}
          {activeLayer.type === 'satellite' && activeLayer.visualization.gamma !== undefined && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                Gamma: {activeLayer.visualization.gamma.toFixed(1)}
              </label>
              <input
                type="range"
                className={styles.controlSlider}
                min="0.1"
                max="2"
                step="0.1"
                value={activeLayer.visualization.gamma}
                onChange={(e) =>
                  updateLayerVisualization(activeLayer.id, { gamma: Number(e.target.value) })
                }
              />
            </div>
          )}

          {/* Min/Max Controls */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Value Range</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                className={styles.rangeInput}
                placeholder="Min"
                value={activeLayer.visualization.min}
                onChange={(e) =>
                  updateLayerVisualization(activeLayer.id, { min: Number(e.target.value) })
                }
              />
              <span>-</span>
              <input
                type="number"
                className={styles.rangeInput}
                placeholder="Max"
                value={activeLayer.visualization.max}
                onChange={(e) =>
                  updateLayerVisualization(activeLayer.id, { max: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            className={styles.resetButton}
            onClick={() => {
              const resetValues: any = {
                opacity: 100,
                min: activeLayer.type === 'processing' ? -1 : 0,
                max: 1,
              }

              // Only reset satellite layer properties if they exist
              if (activeLayer.type === 'satellite') {
                resetValues.brightness = 0
                resetValues.contrast = 0
                resetValues.gamma = 1
              }

              updateLayerVisualization(activeLayer.id, resetValues)
            }}
          >
            [RESET]
          </button>
        </div>
      )}
    </div>
  )
}
