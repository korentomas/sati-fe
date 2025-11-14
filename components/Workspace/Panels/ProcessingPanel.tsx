'use client'

import { useState, useEffect } from 'react'
import { useLayerStore } from '@/lib/stores/layerStore'
import { AggregationMethod, SpectralIndex, ProcessingType } from '@/types/processing'
import { apiClient } from '@/lib/api/client'
import styles from '../Workspace.module.css'

interface ProcessingPanelProps {
  selectedLayers: string[]
}

interface ProcessingJob {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  layerIds: string[]  // Changed from layerId to support multiple
  aggregationMethod?: string
  createdAt: Date
}

export default function ProcessingPanel({ selectedLayers }: ProcessingPanelProps) {
  const [processingType, setProcessingType] = useState('indices')
  const [selectedIndex, setSelectedIndex] = useState<SpectralIndex>(SpectralIndex.NDVI)
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>(AggregationMethod.MEAN)
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([])
  const layers = useLayerStore(state => state.layers)

  // Get satellite layers for processing
  const satelliteLayers = layers.filter(l => l.type === 'satellite')

  const handleLayerToggle = (layerId: string) => {
    setSelectedLayerIds(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    )
  }

  const handleStartProcessing = async () => {
    if (selectedLayerIds.length === 0) return

    try {
      // Get scene IDs from selected layers
      const sceneIds = selectedLayerIds.map(layerId => {
        const layer = layers.find(l => l.id === layerId)
        return layer?.scene?.id
      }).filter(Boolean)

      if (sceneIds.length === 0) {
        console.error('No valid scene IDs found')
        return
      }

      // Build request based on processing type
      let request: any = {
        scene_ids: sceneIds,
        aggregation_method: selectedLayerIds.length > 1 ? aggregationMethod : AggregationMethod.MEAN
      }

      let response
      if (processingType === 'indices') {
        // Use spectral index endpoint
        request = {
          ...request,
          index_type: selectedIndex,
          type: ProcessingType.SPECTRAL_INDEX
        }
        response = await apiClient.createSpectralIndex(request)
      } else {
        // Use general processing endpoint
        request = {
          ...request,
          type: processingType as ProcessingType
        }
        response = await apiClient.createProcessingJob(request)
      }

      if (response.error) {
        console.error('Processing failed:', response.error)
        return
      }

      // Add job to local state
      const job: ProcessingJob = {
        id: response.data.job_id,
        type: processingType === 'indices' ? selectedIndex : processingType,
        status: response.data.status || 'pending',
        progress: response.data.progress || 0,
        layerIds: selectedLayerIds,
        aggregationMethod: selectedLayerIds.length > 1 ? aggregationMethod : undefined,
        createdAt: new Date()
      }

      setProcessingJobs([...processingJobs, job])

      // Start polling for job status
      pollJobStatus(job.id)
    } catch (error) {
      console.error('Failed to start processing:', error)
    }
  }

  // Handle visualization - add result as new layer
  const handleVisualize = async (jobId: string) => {
    try {
      const response = await apiClient.getProcessingResult(jobId)
      if (response.data) {
        const result = response.data

        // Add as new layer to the map
        const newLayer = {
          id: `result_${jobId}`,
          name: `NDVI Result ${new Date().toLocaleTimeString()}`,
          type: 'processing' as const,
          visible: true,
          visualization: {
            bands: 'ndvi',
            min: result.statistics?.min || -1,
            max: result.statistics?.max || 1,
            palette: 'RdYlGn',
            opacity: 80
          },
          result: {
            job_id: jobId,
            type: result.index_type || result.type,
            file_path: result.output_file,
            statistics: result.statistics
          }
        }

        // Add to layer store
        const addLayer = useLayerStore.getState().addLayer
        addLayer(newLayer)

        console.log('Added result layer:', newLayer)
      }
    } catch (error) {
      console.error('Failed to visualize:', error)
    }
  }

  // Handle download
  const handleDownload = async (jobId: string) => {
    try {
      // Create download URL
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/processing/jobs/${jobId}/download`

      // Get token for authentication
      const token = localStorage.getItem('api_token')

      // Create temporary link and click it
      const link = document.createElement('a')
      link.href = `${downloadUrl}?token=${token}`
      link.download = `ndvi_${jobId}.tif`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('Downloading result:', jobId)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.getProcessingJob(jobId)
        if (response.data) {
          setProcessingJobs(prev => prev.map(job =>
            job.id === jobId
              ? {
                  ...job,
                  status: response.data.status,
                  progress: response.data.progress || 0
                }
              : job
          ))

          // Stop polling if job is complete
          if (['completed', 'failed', 'cancelled'].includes(response.data.status)) {
            clearInterval(pollInterval)

            // If completed, add result as a new layer
            if (response.data.status === 'completed' && response.data.result_url) {
              // TODO: Add result as new layer to map
              console.log('Processing completed:', response.data)
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error)
      }
    }, 2000) // Poll every 2 seconds
  }

  return (
    <div className={styles.processingPanel}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>PROCESSING TOOLS</h4>

      {/* Select Layers (Multi-select with checkboxes) */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Source Layers</label>
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          border: '1px solid rgb(var(--border))',
          borderRadius: '4px',
          padding: '8px'
        }}>
          {satelliteLayers.length > 0 ? (
            satelliteLayers.map(layer => (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLayerIds.includes(layer.id)}
                  onChange={() => handleLayerToggle(layer.id)}
                />
                <span>{layer.name}</span>
              </label>
            ))
          ) : (
            <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
              No satellite layers available
            </div>
          )}
        </div>
        {selectedLayerIds.length > 0 && (
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'rgb(var(--accent))' }}>
            {selectedLayerIds.length} layer{selectedLayerIds.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Aggregation Method (shown when multiple layers selected) */}
      {selectedLayerIds.length > 1 && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Aggregation Method</label>
          <select
            className={styles.formInput}
            value={aggregationMethod}
            onChange={(e) => setAggregationMethod(e.target.value as AggregationMethod)}
          >
            <option value={AggregationMethod.MEAN}>Mean (Average)</option>
            <option value={AggregationMethod.MEDIAN}>Median</option>
            <option value={AggregationMethod.MAX}>Maximum</option>
            <option value={AggregationMethod.MIN}>Minimum</option>
            <option value={AggregationMethod.STD}>Standard Deviation</option>
            <option value={AggregationMethod.FIRST}>First Valid Pixel</option>
            <option value={AggregationMethod.LAST}>Last Valid Pixel</option>
          </select>
        </div>
      )}

      {/* Processing Type */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Processing Type</label>
        <select
          className={styles.formInput}
          value={processingType}
          onChange={(e) => setProcessingType(e.target.value)}
        >
          <option value="indices">Spectral Indices</option>
          <option value="classification">Classification</option>
          <option value="change">Change Detection</option>
          <option value="zonalstats">Zonal Statistics</option>
          <option value="composite">Temporal Composite</option>
        </select>
      </div>

      {/* Indices Options */}
      {processingType === 'indices' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Index Type</label>
            <select
              className={styles.formInput}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
            >
              <option value="ndvi">NDVI - Vegetation</option>
              <option value="ndwi">NDWI - Water</option>
              <option value="evi">EVI - Enhanced Vegetation</option>
              <option value="savi">SAVI - Soil Adjusted Vegetation</option>
              <option value="ndbi">NDBI - Built-up Area</option>
              <option value="bai">BAI - Burned Area</option>
              <option value="mndwi">MNDWI - Modified Water</option>
              <option value="gndvi">GNDVI - Green Vegetation</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Color Map</label>
            <select className={styles.formInput}>
              <option>Viridis</option>
              <option>RdYlGn</option>
              <option>Spectral</option>
              <option>Coolwarm</option>
            </select>
          </div>
        </div>
      )}

      {/* Classification Options */}
      {processingType === 'classification' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Algorithm</label>
            <select className={styles.formInput}>
              <option>Random Forest</option>
              <option>K-Means Clustering</option>
              <option>SVM</option>
              <option>Maximum Likelihood</option>
              <option>Minimum Distance</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Number of Classes</label>
            <input type="number" className={styles.formInput} defaultValue="5" min="2" max="20" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Training Samples</label>
            <button className={styles.formButton}>[ DRAW SAMPLES ]</button>
          </div>
        </div>
      )}

      {/* Change Detection Options */}
      {processingType === 'change' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Compare With</label>
            <select className={styles.formInput}>
              {satelliteLayers.map(layer => (
                <option key={layer.id} value={layer.id}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Method</label>
            <select className={styles.formInput}>
              <option>Image Differencing</option>
              <option>Change Vector Analysis</option>
              <option>Post-Classification Comparison</option>
            </select>
          </div>
        </div>
      )}

      {/* Zonal Statistics Options */}
      {processingType === 'zonalstats' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Statistics</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px' }}>
                <input type="checkbox" defaultChecked /> Mean
              </label>
              <label style={{ fontSize: '11px' }}>
                <input type="checkbox" defaultChecked /> Min/Max
              </label>
              <label style={{ fontSize: '11px' }}>
                <input type="checkbox" /> Standard Deviation
              </label>
              <label style={{ fontSize: '11px' }}>
                <input type="checkbox" /> Median
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {selectedLayerIds.length > 0 ? (
        <button className={styles.searchButton} onClick={handleStartProcessing}>
          [ PROCESS {selectedLayerIds.length} LAYER{selectedLayerIds.length > 1 ? 'S' : ''} ]
        </button>
      ) : satelliteLayers.length > 0 ? (
        <div className={styles.infoMessage} style={{ marginTop: '20px' }}>
          Select one or more layers to process
        </div>
      ) : (
        <div className={styles.infoMessage} style={{ marginTop: '20px' }}>
          Add satellite imagery layers to enable processing
        </div>
      )}

      {/* Processing Queue */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>PROCESSING QUEUE</h4>
        {processingJobs.length > 0 ? (
          <div className={styles.jobsList}>
            {processingJobs.map(job => (
              <div key={job.id} className={styles.jobItem}>
                <div className={styles.jobHeader}>
                  <span className={styles.jobType}>{job.type.toUpperCase()}</span>
                  <span className={styles.jobStatus}>[{job.status}]</span>
                </div>
                {job.status === 'processing' && (
                  <div className={styles.jobProgress}>
                    <div
                      className={styles.jobProgressBar}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                {job.status === 'completed' && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      className={styles.formButton}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      onClick={() => handleVisualize(job.id)}
                    >
                      [ VISUALIZE ]
                    </button>
                    <button
                      className={styles.formButton}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      onClick={() => handleDownload(job.id)}
                    >
                      [ DOWNLOAD ]
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'rgb(var(--muted-foreground))' }}>
            [ NO JOBS IN QUEUE ]
          </div>
        )}
      </div>
    </div>
  )
}