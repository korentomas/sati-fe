'use client'

import styles from '../Workspace.module.css'

interface TimeSeriesPanelProps {
  selectedLayers: string[]
}

export default function TimeSeriesPanel({ selectedLayers }: TimeSeriesPanelProps) {
  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>TIME SERIES ANALYSIS</h4>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Date Range</label>
        <input type="date" className={styles.formInput} />
        <input type="date" className={styles.formInput} style={{ marginTop: '4px' }} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Temporal Resolution</label>
        <select className={styles.formInput}>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Seasonal</option>
        </select>
      </div>

      <button className={styles.searchButton}>
        [ BUILD TIME SERIES ]
      </button>

      <div style={{ marginTop: '20px', fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
        [ TIME SERIES CHART WILL APPEAR HERE ]
      </div>
    </div>
  )
}