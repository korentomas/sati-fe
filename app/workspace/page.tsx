'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import dynamic from 'next/dynamic'
import TopToolbar from '@/components/Workspace/TopToolbar'
import LeftPanel from '@/components/Workspace/LeftPanel'
import RightPanel from '@/components/Workspace/RightPanel'
import StatusBar from '@/components/Workspace/StatusBar'
import styles from './workspace.module.css'

const WorkspaceMap = dynamic(() => import('@/components/Workspace/WorkspaceMap'), {
  ssr: false,
  loading: () => <div className={styles.loading}>[ LOADING MAP... ]</div>
})

export default function WorkspacePage() {
  const { isLoading, isAuthenticated } = useAuth(true)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState('search')
  const [activeRightTab, setActiveRightTab] = useState('properties')
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lng: 0 })
  const [zoom, setZoom] = useState(10)

  const handleTogglePanel = useCallback((side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftPanelOpen(prev => !prev)
    } else {
      setRightPanelOpen(prev => !prev)
    }
  }, [])

  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId)
      }
      return [...prev, layerId]
    })
  }, [])

  if (isLoading || !isAuthenticated) {
    return <div className={styles.loading}>[ INITIALIZING WORKSPACE... ]</div>
  }

  return (
    <div className={styles.workspace}>
      <TopToolbar
        onToggleTheme={() => {
          document.documentElement.setAttribute(
            'data-theme',
            document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
          )
        }}
      />

      <div className={styles.mainContainer}>
        <LeftPanel
          isOpen={leftPanelOpen}
          activeTab={activeLeftTab}
          onTabChange={setActiveLeftTab}
          onToggle={() => handleTogglePanel('left')}
          onLayerSelect={handleLayerSelect}
          selectedLayers={selectedLayers}
        />

        <div className={styles.mapContainer}>
          <WorkspaceMap
            onCoordsChange={setMouseCoords}
            onZoomChange={setZoom}
            selectedLayers={selectedLayers}
          />
        </div>

        <RightPanel
          isOpen={rightPanelOpen}
          activeTab={activeRightTab}
          onTabChange={setActiveRightTab}
          onToggle={() => handleTogglePanel('right')}
          selectedLayers={selectedLayers}
        />
      </div>

      <StatusBar
        coords={mouseCoords}
        zoom={zoom}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
      />
    </div>
  )
}