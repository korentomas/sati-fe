'use client'

import { useState } from 'react'
import styles from './Workspace.module.css'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
  pendingAction: 'save' | 'export' | null
}

export default function ProjectModal({ isOpen, onClose, onCreate, pendingAction }: ProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    if (projectName.length < 3) {
      setError('Project name must be at least 3 characters')
      return
    }

    onCreate(projectName)
    setProjectName('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {pendingAction === 'save' && 'Save requires a project'}
            {pendingAction === 'export' && 'Export requires a project'}
            {!pendingAction && 'Create New Project'}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label htmlFor="projectName">Project Name:</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value)
                setError('')
              }}
              placeholder="Enter project name..."
              autoFocus
            />
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          <div className={styles.modalDescription}>
            {pendingAction === 'save' && (
              <p>You need to create a project before saving your work. This will help organize your layers, analysis, and results.</p>
            )}
            {pendingAction === 'export' && (
              <p>You need to create a project before exporting. All your layers and analysis will be associated with this project.</p>
            )}
            {!pendingAction && (
              <p>Create a new project to organize your GIS work, layers, and analysis results.</p>
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.buttonSecondary}>
              Cancel
            </button>
            <button type="submit" className={styles.buttonPrimary}>
              Create Project
              {pendingAction === 'save' && ' & Save'}
              {pendingAction === 'export' && ' & Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}