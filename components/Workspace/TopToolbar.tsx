import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import styles from './Workspace.module.css'

interface TopToolbarProps {
  onToggleTheme: () => void
}

export default function TopToolbar({ onToggleTheme }: TopToolbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await apiClient.logout()
    router.push('/login')
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.logo}>SATI GIS</div>
        <span className={styles.separator}>|</span>
        <span className={styles.projectName}>Untitled Project</span>
      </div>

      <div className={styles.toolbarCenter}>
        <button className={styles.toolButton} title="New Project">
          [NEW]
        </button>
        <button className={styles.toolButton} title="Open Project">
          [OPEN]
        </button>
        <button className={styles.toolButton} title="Save Project">
          [SAVE]
        </button>
        <button className={styles.toolButton} title="Export">
          [EXPORT]
        </button>
      </div>

      <div className={styles.toolbarRight}>
        <button className={styles.toolButton} onClick={onToggleTheme} title="Toggle Theme">
          [THEME]
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