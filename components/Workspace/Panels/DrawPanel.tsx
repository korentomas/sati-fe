'use client'

import { useState } from 'react'
import styles from '../Workspace.module.css'

export default function DrawPanel() {
  const [drawMode, setDrawMode] = useState('polygon')

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>DRAWING TOOLS</h4>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Draw Mode</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            className={styles.toolButton}
            style={{
              background: drawMode === 'polygon' ? 'rgb(var(--primary))' : 'transparent',
              color: drawMode === 'polygon' ? 'rgb(var(--primary-foreground))' : 'rgb(var(--foreground))'
            }}
            onClick={() => setDrawMode('polygon')}
          >
            POLYGON
          </button>
          <button
            className={styles.toolButton}
            style={{
              background: drawMode === 'rectangle' ? 'rgb(var(--primary))' : 'transparent',
              color: drawMode === 'rectangle' ? 'rgb(var(--primary-foreground))' : 'rgb(var(--foreground))'
            }}
            onClick={() => setDrawMode('rectangle')}
          >
            RECTANGLE
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>SAVED AOIs</h4>
        <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
          [ NO SAVED AREAS ]
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button className={styles.searchButton}>
          [ UPLOAD GEOJSON ]
        </button>
        <button className={styles.searchButton} style={{ marginTop: '8px' }}>
          [ SAVE CURRENT AOI ]
        </button>
      </div>

      <div className={styles.formGroup} style={{ marginTop: '20px' }}>
        <label className={styles.formLabel}>Instructions</label>
        <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))', lineHeight: '1.5' }}>
          • Click on map to start drawing<br />
          • Click to add vertices<br />
          • Right-click to finish<br />
          • Press ESC to cancel
        </div>
      </div>
    </div>
  )
}