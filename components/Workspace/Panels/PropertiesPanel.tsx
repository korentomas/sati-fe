'use client'

import styles from '../Workspace.module.css'

interface PropertiesPanelProps {
  selectedLayers: string[]
}

export default function PropertiesPanel({ selectedLayers }: PropertiesPanelProps) {
  if (selectedLayers.length === 0) {
    return (
      <div style={{ color: 'rgb(var(--muted-foreground))', fontSize: '12px' }}>
        [ NO LAYER SELECTED ]
      </div>
    )
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>LAYER PROPERTIES</h4>
      {selectedLayers.map((layerId) => (
        <div key={layerId} style={{ marginBottom: '16px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Layer ID</label>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{layerId}</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Brightness</label>
            <input
              type="range"
              className={styles.formInput}
              min="-100"
              max="100"
              defaultValue="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contrast</label>
            <input
              type="range"
              className={styles.formInput}
              min="-100"
              max="100"
              defaultValue="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Saturation</label>
            <input
              type="range"
              className={styles.formInput}
              min="-100"
              max="100"
              defaultValue="0"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Opacity</label>
            <input type="range" className={styles.formInput} min="0" max="100" defaultValue="100" />
          </div>
        </div>
      ))}
    </div>
  )
}
