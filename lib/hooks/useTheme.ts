'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeMode = 'light' | 'dark' | 'auto'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Load saved preference
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    if (savedMode) {
      setMode(savedMode)
    }

    // Detect system theme
    const detectSystemTheme = (): Theme => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }

    // Apply theme based on mode
    const applyTheme = () => {
      let theme: Theme
      if (mode === 'auto') {
        theme = detectSystemTheme()
      } else {
        theme = mode as Theme
      }

      setCurrentTheme(theme)
      document.documentElement.setAttribute('data-theme', theme)
    }

    // Initial application
    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'auto') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
    localStorage.setItem('theme-mode', newMode)
  }

  return {
    theme: currentTheme,
    mode,
    setTheme
  }
}