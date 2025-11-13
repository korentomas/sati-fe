'use client'

import { useState } from 'react'
import { imageryApi } from '@/lib/api/imagery'
import styles from '../Workspace.module.css'

export default function SearchPanel() {
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [cloudCover, setCloudCover] = useState(30)
  const [collection, setCollection] = useState('sentinel-2-l2a')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      // Default bbox for demo - will be replaced by drawn polygon
      const defaultBbox: [number, number, number, number] = [-10, 35, 30, 60]

      const results = await imageryApi.search({
        date_from: dateFrom,
        date_to: dateTo,
        bbox: defaultBbox,
        collections: [collection],
        cloud_cover_max: cloudCover,
        limit: 20
      })

      console.log('Search results:', results)
      // TODO: Add results to map layers
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.searchForm}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Collection</label>
        <select
          className={styles.formInput}
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="sentinel-2-l2a">Sentinel-2 L2A</option>
          <option value="landsat-8">Landsat 8</option>
          <option value="landsat-9">Landsat 9</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Date From</label>
        <input
          type="date"
          className={styles.formInput}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Date To</label>
        <input
          type="date"
          className={styles.formInput}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Cloud Cover Max (%)</label>
        <input
          type="range"
          className={styles.formInput}
          min="0"
          max="100"
          value={cloudCover}
          onChange={(e) => setCloudCover(Number(e.target.value))}
        />
        <span style={{ fontSize: '11px' }}>{cloudCover}%</span>
      </div>

      {error && (
        <div style={{ color: 'rgb(var(--destructive))', fontSize: '11px' }}>
          {error}
        </div>
      )}

      <button
        className={styles.searchButton}
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? '[ SEARCHING... ]' : '[ SEARCH ]'}
      </button>
    </div>
  )
}