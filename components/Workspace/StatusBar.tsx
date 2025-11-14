import styles from './Workspace.module.css'

interface StatusBarProps {
  coords: { lat: number; lng: number }
  zoom: number
  leftPanelOpen: boolean
  rightPanelOpen: boolean
}

export default function StatusBar({ coords, zoom, leftPanelOpen, rightPanelOpen }: StatusBarProps) {
  return (
    <div className={styles.statusBar}>
      <div className={styles.statusSection}>
        <div className={styles.statusItem}>
          <span>LAT:</span>
          <span className={styles.statusLabel}>{coords.lat.toFixed(6)}</span>
        </div>
        <div className={styles.statusItem}>
          <span>LNG:</span>
          <span className={styles.statusLabel}>{coords.lng.toFixed(6)}</span>
        </div>
        <div className={styles.statusItem}>
          <span>ZOOM:</span>
          <span className={styles.statusLabel}>{zoom}</span>
        </div>
      </div>

      <div className={styles.statusSection}>
        <div className={styles.statusItem}>
          <span>PANELS:</span>
          <span className={styles.statusLabel}>
            [{leftPanelOpen ? 'L' : '-'}|{rightPanelOpen ? 'R' : '-'}]
          </span>
        </div>
        <div className={styles.statusItem}>
          <span>READY</span>
        </div>
      </div>
    </div>
  )
}
