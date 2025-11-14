'use client'

import { useState } from 'react'
import styles from '../Workspace.module.css'

interface AnalysisPanelProps {
  selectedLayers: string[]
}

export default function AnalysisPanel({ selectedLayers }: AnalysisPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState('ndvi')

  const indices = [
    { id: 'ndvi', name: 'NDVI', desc: 'Vegetation Health' },
    { id: 'ndwi', name: 'NDWI', desc: 'Water Content' },
    { id: 'evi', name: 'EVI', desc: 'Enhanced Vegetation' },
    { id: 'savi', name: 'SAVI', desc: 'Soil Adjusted' },
    { id: 'nbr', name: 'NBR', desc: 'Burn Ratio' },
    { id: 'ndbi', name: 'NDBI', desc: 'Built-up Areas' },
  ]

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>SPECTRAL INDICES</h4>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Select Index</label>
        <select
          className={styles.formInput}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(e.target.value)}
        >
          {indices.map((idx) => (
            <option key={idx.id} value={idx.id}>
              {idx.name} - {idx.desc}
            </option>
          ))}
        </select>
      </div>

      {selectedLayers.length > 0 && (
        <>
          <button className={styles.searchButton}>[ CALCULATE INDEX ]</button>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>STATISTICS</h4>
            <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
              Min: --
              <br />
              Max: --
              <br />
              Mean: --
              <br />
              Std Dev: --
            </div>
          </div>
        </>
      )}
    </div>
  )
}
