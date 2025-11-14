import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import styles from './Workspace.module.css'

interface TopToolbarProps {
  currentProject: { id: string; name: string } | null
  themeMode: 'light' | 'dark' | 'auto'
  onToggleTheme: () => void
  onSave: () => void
  onExport: () => void
  onNewProject: () => void
}

export default function TopToolbar({
  currentProject,
  themeMode,
  onToggleTheme,
  onSave,
  onExport,
  onNewProject
}: TopToolbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await apiClient.logout()
    router.push('/login')
  }

  const getThemeLabel = () => {
    switch(themeMode) {
      case 'auto': return '[AUTO]'
      case 'light': return '[LIGHT]'
      case 'dark': return '[DARK]'
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.logo}>SATI GIS</div>
        <span className={styles.separator}>|</span>
        <span className={styles.projectName}>
          {currentProject ? currentProject.name : 'No Project'}
        </span>
      </div>

      <div className={styles.toolbarCenter}>
        <button className={styles.toolButton} onClick={onNewProject} title="New Project">
          [NEW]
        </button>
        <button className={styles.toolButton} title="Open Project">
          [OPEN]
        </button>
        <button className={styles.toolButton} onClick={onSave} title="Save Project">
          [SAVE]
        </button>
        <button className={styles.toolButton} onClick={onExport} title="Export">
          [EXPORT]
        </button>
      </div>

      <div className={styles.toolbarRight}>
        <button className={styles.toolButton} onClick={onToggleTheme} title="Toggle Theme">
          {getThemeLabel()}
        </button>
        <button className={styles.toolButton} title="Settings">
          [SETTINGS]
        </button>
        <button className={styles.toolButton} onClick={handleLogout} title="Logout">
          [LOGOUT]
        </button>
      </div>
    </div>
  )
}