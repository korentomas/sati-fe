'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/lib/hooks/useTheme'
import dynamic from 'next/dynamic'
import TopToolbar from '@/components/Workspace/TopToolbar'
import LeftPanel from '@/components/Workspace/LeftPanel'
import RightPanel from '@/components/Workspace/RightPanel'
import StatusBar from '@/components/Workspace/StatusBar'
import ProjectModal from '@/components/Workspace/ProjectModal'
import styles from './workspace.module.css'

const WorkspaceMap = dynamic(() => import('@/components/Workspace/WorkspaceMap'), {
  ssr: false,
  loading: () => <div className={styles.loading}>[ LOADING MAP... ]</div>,
})

export default function WorkspacePage() {
  const { isLoading, isAuthenticated } = useAuth(true)
  const { theme, mode, setTheme } = useTheme()
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState('search')
  const [activeRightTab, setActiveRightTab] = useState('properties')
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lng: 0 })
  const [zoom, setZoom] = useState(10)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [currentProject, setCurrentProject] = useState<{ id: string; name: string } | null>(null)
  const [pendingAction, setPendingAction] = useState<'save' | 'export' | null>(null)
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | undefined>()

  const handleTogglePanel = useCallback((side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftPanelOpen((prev) => !prev)
    } else {
      setRightPanelOpen((prev) => !prev)
    }
  }, [])

  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayers((prev) => {
      if (prev.includes(layerId)) {
        return prev.filter((id) => id !== layerId)
      }
      return [...prev, layerId]
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!currentProject) {
      setPendingAction('save')
      setShowProjectModal(true)
    } else {
      // Perform save with existing project
      console.log('Saving to project:', currentProject.name)
      // TODO: Implement actual save logic
    }
  }, [currentProject])

  const handleExport = useCallback(() => {
    if (!currentProject) {
      setPendingAction('export')
      setShowProjectModal(true)
    } else {
      // Perform export with existing project
      console.log('Exporting project:', currentProject.name)
      // TODO: Implement actual export logic
    }
  }, [currentProject])

  const handleProjectCreate = useCallback(
    (projectName: string) => {
      const newProject = {
        id: `proj_${Date.now()}`,
        name: projectName,
      }
      setCurrentProject(newProject)
      setShowProjectModal(false)

      // Execute pending action if any
      if (pendingAction === 'save') {
        console.log('Saving to new project:', projectName)
        // TODO: Implement actual save logic
      } else if (pendingAction === 'export') {
        console.log('Exporting new project:', projectName)
        // TODO: Implement actual export logic
      }
      setPendingAction(null)
    },
    [pendingAction]
  )

  const handleToggleTheme = useCallback(() => {
    const nextMode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto'
    setTheme(nextMode)
  }, [mode, setTheme])

  if (isLoading || !isAuthenticated) {
    return <div className={styles.loading}>[ INITIALIZING WORKSPACE... ]</div>
  }

  return (
    <div className={styles.workspace}>
      <TopToolbar
        currentProject={currentProject}
        themeMode={mode}
        onToggleTheme={handleToggleTheme}
        onSave={handleSave}
        onExport={handleExport}
        onNewProject={() => setShowProjectModal(true)}
      />

      <div className={styles.mainContainer}>
        <LeftPanel
          isOpen={leftPanelOpen}
          activeTab={activeLeftTab}
          onTabChange={setActiveLeftTab}
          onToggle={() => handleTogglePanel('left')}
          onLayerSelect={handleLayerSelect}
          selectedLayers={selectedLayers}
          drawnPolygon={drawnPolygon}
          onSceneAdd={(scene) => {
            console.log('Adding scene as layer:', scene)
            // TODO: Add scene to map layers
          }}
        />

        <div className={styles.mapContainer}>
          <WorkspaceMap
            onCoordsChange={setMouseCoords}
            onZoomChange={setZoom}
            selectedLayers={selectedLayers}
            onPolygonDrawn={setDrawnPolygon}
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

      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false)
            setPendingAction(null)
          }}
          onCreate={handleProjectCreate}
          pendingAction={pendingAction}
        />
      )}
    </div>
  )
}
