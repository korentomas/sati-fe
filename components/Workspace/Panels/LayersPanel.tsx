'use client'

import styles from '../Workspace.module.css'

interface LayersPanelProps {
  selectedLayers: string[]
  onLayerSelect: (layerId: string) => void
}

export default function LayersPanel({ selectedLayers, onLayerSelect }: LayersPanelProps) {
  // Mock layers for now
  const layers = [
    { id: 'basemap', name: 'OpenStreetMap', type: 'basemap' },
    { id: 'sentinel-1', name: 'Sentinel-2 2024-01-15', type: 'imagery' },
    { id: 'ndvi-1', name: 'NDVI Analysis', type: 'index' },
  ]

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>ACTIVE LAYERS</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {layers.map(layer => (
          <div
            key={layer.id}
            style={{
              padding: '8px',
              border: '1px solid rgb(var(--border))',
              background: selectedLayers.includes(layer.id)
                ? 'rgb(var(--primary) / 0.1)'
                : 'transparent',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <input
                  type="checkbox"
                  checked={selectedLayers.includes(layer.id)}
                  onChange={() => onLayerSelect(layer.id)}
                  style={{ marginRight: '8px' }}
                />
                {layer.name}
              </div>
              <span style={{ fontSize: '10px', color: 'rgb(var(--muted-foreground))' }}>
                {layer.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>BAND COMBINATION</h4>
        <select className={styles.formInput}>
          <option>Natural Color (RGB)</option>
          <option>False Color (NIR,R,G)</option>
          <option>Agriculture (SWIR,NIR,B)</option>
          <option>Atmospheric (SWIR2,SWIR1,R)</option>
          <option>Custom...</option>
        </select>
      </div>
    </div>
  )
}