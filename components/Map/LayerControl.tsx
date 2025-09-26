'use client'

import { ImageryLayer } from './ImageryMap'

interface LayerControlProps {
  layers: ImageryLayer[]
  onLayerUpdate: (layerId: string, updates: Partial<ImageryLayer>) => void
  onLayerRemove: (layerId: string) => void
}

export default function LayerControl({ layers, onLayerUpdate, onLayerRemove }: LayerControlProps) {
  if (layers.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: '#fff',
        border: '2px solid #000',
        borderRadius: '4px',
        padding: '8px',
        maxWidth: '250px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '12px',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          borderBottom: '1px solid #333',
          paddingBottom: '4px',
        }}
      >
        LAYERS [{layers.length}]
      </div>

      {layers.map((layer) => (
        <div
          key={layer.id}
          style={{
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) => onLayerUpdate(layer.id, { visible: e.target.checked })}
              style={{ marginRight: '6px' }}
            />
            <span
              style={{
                flex: 1,
                fontWeight: 'bold',
                fontSize: '11px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {layer.name}
            </span>
            <button
              onClick={() => onLayerRemove(layer.id)}
              style={{
                marginLeft: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                background: '#ff0000',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              X
            </button>
          </div>

          <div style={{ marginLeft: '20px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>
              Opacity: {Math.round(layer.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity * 100}
              onChange={(e) => onLayerUpdate(layer.id, { opacity: Number(e.target.value) / 100 })}
              disabled={!layer.visible}
              style={{ width: '100%', height: '16px' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
