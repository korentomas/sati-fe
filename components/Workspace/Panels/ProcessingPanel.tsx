'use client'

import { useState } from 'react'
import styles from '../Workspace.module.css'

interface ProcessingPanelProps {
  selectedLayers: string[]
}

export default function ProcessingPanel({ selectedLayers }: ProcessingPanelProps) {
  const [processingType, setProcessingType] = useState('classification')

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>PROCESSING TOOLS</h4>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Processing Type</label>
        <select
          className={styles.formInput}
          value={processingType}
          onChange={(e) => setProcessingType(e.target.value)}
        >
          <option value="classification">Classification</option>
          <option value="change">Change Detection</option>
          <option value="zonalstats">Zonal Statistics</option>
          <option value="mosaic">Mosaic</option>
          <option value="composite">Composite</option>
        </select>
      </div>

      {processingType === 'classification' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Method</label>
            <select className={styles.formInput}>
              <option>K-Means</option>
              <option>Random Forest</option>
              <option>SVM</option>
              <option>Maximum Likelihood</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Number of Classes</label>
            <input type="number" className={styles.formInput} defaultValue="5" min="2" max="20" />
          </div>
        </div>
      )}

      {processingType === 'change' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Compare With</label>
            <select className={styles.formInput}>
              <option>Select layer...</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Threshold</label>
            <input type="range" className={styles.formInput} min="0" max="100" defaultValue="30" />
          </div>
        </div>
      )}

      {selectedLayers.length > 0 ? (
        <button className={styles.searchButton}>
          [ START PROCESSING ]
        </button>
      ) : (
        <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))', marginTop: '20px' }}>
          [ SELECT A LAYER TO PROCESS ]
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>PROCESSING QUEUE</h4>
        <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
          [ NO JOBS IN QUEUE ]
        </div>
      </div>
    </div>
  )
}