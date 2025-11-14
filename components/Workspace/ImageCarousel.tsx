'use client'

import { useEffect, useState, useCallback } from 'react'
import { SceneResponse } from '@/lib/api/client'
import styles from './Workspace.module.css'

interface ImageCarouselProps {
  scenes: SceneResponse[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onAddLayer: (scene: SceneResponse) => void
}

export default function ImageCarousel({
  scenes,
  initialIndex,
  isOpen,
  onClose,
  onAddLayer,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set())

  const currentScene = scenes[currentIndex]

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen) return

    const indicesToPreload = [currentIndex, currentIndex - 1, currentIndex + 1].filter(
      (i) => i >= 0 && i < scenes.length
    )

    indicesToPreload.forEach((index) => {
      if (!loadedImages.has(index) && !loadingImages.has(index)) {
        const img = new Image()
        setLoadingImages((prev) => new Set(prev).add(index))

        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(index))
          setLoadingImages((prev) => {
            const next = new Set(prev)
            next.delete(index)
            return next
          })
        }

        img.onerror = () => {
          setLoadingImages((prev) => {
            const next = new Set(prev)
            next.delete(index)
            return next
          })
        }

        const scene = scenes[index]
        img.src = scene.thumbnail_url || ''
      }
    })
  }, [currentIndex, scenes, isOpen, loadedImages, loadingImages])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(scenes.length - 1, prev + 1))
  }, [scenes.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrevious, handleNext, onClose])

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.carouselOverlay} onClick={handleBackdropClick}>
      <div className={styles.carouselContainer}>
        {/* Close button */}
        <button className={styles.carouselClose} onClick={onClose}>
          ×
        </button>

        {/* Previous button */}
        <button
          className={`${styles.carouselNav} ${styles.carouselNavPrev}`}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        {/* Next button */}
        <button
          className={`${styles.carouselNav} ${styles.carouselNavNext}`}
          onClick={handleNext}
          disabled={currentIndex === scenes.length - 1}
        >
          ›
        </button>

        {/* Main content */}
        <div className={styles.carouselContent}>
          {/* Image display */}
          <div className={styles.carouselImageContainer}>
            {currentScene.thumbnail_url ? (
              <>
                {loadedImages.has(currentIndex) ? (
                  <img
                    src={currentScene.thumbnail_url}
                    alt={currentScene.id}
                    className={styles.carouselImage}
                  />
                ) : (
                  <div className={styles.carouselLoading}>
                    <div className={styles.spinner}></div>
                    <p>Loading image...</p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.carouselNoImage}>No preview available</div>
            )}
          </div>

          {/* Scene info panel */}
          <div className={styles.carouselInfo}>
            <div className={styles.carouselHeader}>
              <h3 className={styles.carouselTitle}>{currentScene.id}</h3>
              <div className={styles.carouselCounter}>
                {currentIndex + 1} / {scenes.length}
              </div>
            </div>

            <div className={styles.carouselMetadata}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Collection:</span>
                <span className={styles.metadataValue}>{currentScene.collection}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Date:</span>
                <span className={styles.metadataValue}>
                  {new Date(currentScene.properties.datetime).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Cloud Cover:</span>
                <span className={styles.metadataValue}>
                  {currentScene.properties.cloud_cover?.toFixed(1) || 'N/A'}%
                </span>
              </div>
              {currentScene.properties.platform && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Platform:</span>
                  <span className={styles.metadataValue}>{currentScene.properties.platform}</span>
                </div>
              )}
              {currentScene.properties.gsd && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Resolution:</span>
                  <span className={styles.metadataValue}>{currentScene.properties.gsd}m</span>
                </div>
              )}
            </div>

            <div className={styles.carouselBounds}>
              <span className={styles.metadataLabel}>Bounding Box:</span>
              <div className={styles.boundsValues}>
                <span>West: {currentScene.bbox[0].toFixed(4)}°</span>
                <span>South: {currentScene.bbox[1].toFixed(4)}°</span>
                <span>East: {currentScene.bbox[2].toFixed(4)}°</span>
                <span>North: {currentScene.bbox[3].toFixed(4)}°</span>
              </div>
            </div>

            <div className={styles.carouselActions}>
              <button className={styles.carouselAddLayer} onClick={() => onAddLayer(currentScene)}>
                [ADD AS LAYER]
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className={styles.carouselThumbnails}>
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`${styles.carouselThumbnail} ${
                index === currentIndex ? styles.carouselThumbnailActive : ''
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {scene.thumbnail_url ? (
                <img src={scene.thumbnail_url} alt={scene.id} />
              ) : (
                <div className={styles.carouselThumbnailEmpty}>{index + 1}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
