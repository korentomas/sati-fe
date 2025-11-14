'use client'

import styles from './Workspace.module.css'
import PropertiesPanel from './Panels/PropertiesPanel'
import AnalysisPanel from './Panels/AnalysisPanel'
import TimeSeriesPanel from './Panels/TimeSeriesPanel'

interface RightPanelProps {
  isOpen: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  onToggle: () => void
  selectedLayers: string[]
}

export default function RightPanel({
  isOpen,
  activeTab,
  onTabChange,
  onToggle,
  selectedLayers,
}: RightPanelProps) {
  const tabs = [
    { id: 'properties', label: 'PROPERTIES' },
    { id: 'analysis', label: 'ANALYSIS' },
    { id: 'timeseries', label: 'TIME SERIES' },
  ]

  return (
    <div className={`${styles.panel} ${styles.panelRight} ${!isOpen ? styles.panelCollapsed : ''}`}>
      <div className={styles.panelHeader}>
        <button className={styles.panelToggle} onClick={onToggle}>
          {isOpen ? '▶' : '◀'}
        </button>
        <div className={styles.panelTabs}>
          {isOpen &&
            tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.panelTab} ${activeTab === tab.id ? styles.panelTabActive : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      {isOpen && (
        <div className={styles.panelContent}>
          {activeTab === 'properties' && <PropertiesPanel selectedLayers={selectedLayers} />}
          {activeTab === 'analysis' && <AnalysisPanel selectedLayers={selectedLayers} />}
          {activeTab === 'timeseries' && <TimeSeriesPanel selectedLayers={selectedLayers} />}
        </div>
      )}
    </div>
  )
}
