'use client'

import { useState } from 'react'
import styles from './Workspace.module.css'
import SearchPanel from './Panels/SearchPanel'
import LayersPanel from './Panels/LayersPanel'
import DrawPanel from './Panels/DrawPanel'
import ProcessingPanel from './Panels/ProcessingPanel'

interface LeftPanelProps {
  isOpen: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  onToggle: () => void
  onLayerSelect: (layerId: string) => void
  selectedLayers: string[]
}

export default function LeftPanel({
  isOpen,
  activeTab,
  onTabChange,
  onToggle,
  onLayerSelect,
  selectedLayers
}: LeftPanelProps) {
  const tabs = [
    { id: 'search', label: 'SEARCH' },
    { id: 'layers', label: 'LAYERS' },
    { id: 'draw', label: 'DRAW' },
    { id: 'process', label: 'PROCESS' }
  ]

  return (
    <div className={`${styles.panel} ${styles.panelLeft} ${!isOpen ? styles.panelCollapsed : ''}`}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTabs}>
          {isOpen && tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.panelTab} ${activeTab === tab.id ? styles.panelTabActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className={styles.panelToggle} onClick={onToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {isOpen && (
        <div className={styles.panelContent}>
          {activeTab === 'search' && <SearchPanel />}
          {activeTab === 'layers' && (
            <LayersPanel
              selectedLayers={selectedLayers}
              onLayerSelect={onLayerSelect}
            />
          )}
          {activeTab === 'draw' && <DrawPanel />}
          {activeTab === 'process' && (
            <ProcessingPanel selectedLayers={selectedLayers} />
          )}
        </div>
      )}
    </div>
  )
}