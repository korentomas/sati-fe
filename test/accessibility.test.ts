/**
 * Accessibility tests for SATI UI
 * Ensures WCAG compliance for all color combinations
 */

import { describe, it, expect } from '@jest/globals'
import { checkColorContrast, getContrastRatio } from '../lib/accessibility/color-contrast'

describe('SATI Color Accessibility', () => {
  describe('Terminal Colors on Dark Backgrounds', () => {
    it('should pass WCAG AA for green on black', () => {
      const result = checkColorContrast('#00ff00', '#000000')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should pass WCAG AA for yellow on black', () => {
      const result = checkColorContrast('#ffff00', '#000000')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should pass WCAG AA for cyan on black', () => {
      const result = checkColorContrast('#00ffff', '#000000')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should pass WCAG AA for white on dark gray', () => {
      const result = checkColorContrast('#ffffff', '#333333')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Problem Cases - Light Backgrounds', () => {
    it('should FAIL WCAG AA for bright green on white', () => {
      const result = checkColorContrast('#00ff00', '#ffffff')
      expect(result.passesAA).toBe(false)
      expect(result.ratio).toBeLessThan(4.5)
    })

    it('should FAIL WCAG AA for yellow on white', () => {
      const result = checkColorContrast('#ffff00', '#ffffff')
      expect(result.passesAA).toBe(false)
      expect(result.ratio).toBeLessThan(4.5)
    })

    it('should FAIL WCAG AA for cyan on white', () => {
      const result = checkColorContrast('#00ffff', '#ffffff')
      expect(result.passesAA).toBe(false)
      expect(result.ratio).toBeLessThan(4.5)
    })
  })

  describe('Accessible Alternatives', () => {
    it('should pass WCAG AA for dark green on white', () => {
      const result = checkColorContrast('#008800', '#ffffff')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should pass WCAG AA for dark yellow/gold on white', () => {
      const result = checkColorContrast('#886600', '#ffffff')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should pass WCAG AA for teal on white', () => {
      const result = checkColorContrast('#008888', '#ffffff')
      expect(result.passesAA).toBe(true)
      expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Large Text Standards', () => {
    it('should have lower requirements for large text', () => {
      const result = checkColorContrast('#00cc00', '#ffffff', true)
      // Large text only needs 3:1 for AA
      expect(result.passesAA).toBe(result.ratio >= 3)
    })
  })

  describe('Contrast Ratio Calculations', () => {
    it('should calculate maximum contrast for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 0) // Maximum possible contrast
    })

    it('should calculate minimum contrast for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff')
      expect(ratio).toBeCloseTo(1, 0) // Minimum possible contrast
    })

    it('should handle 3-digit hex colors', () => {
      const ratio1 = getContrastRatio('#0f0', '#000')
      const ratio2 = getContrastRatio('#00ff00', '#000000')
      expect(ratio1).toBeCloseTo(ratio2, 1)
    })
  })
})

describe('SATI UI Component Accessibility', () => {
  const componentColors = [
    { name: 'Panel border', fg: '#ffffff', bg: '#333333' },
    { name: 'Success message', fg: '#00ff00', bg: '#000000' },
    { name: 'Error message', fg: '#ff0000', bg: '#000000' },
    { name: 'Warning message', fg: '#ffff00', bg: '#000000' },
    { name: 'Info message', fg: '#00ffff', bg: '#000000' },
    { name: 'Button text', fg: '#000000', bg: '#00ff00' },
    { name: 'Input text', fg: '#00ff00', bg: '#1a1a1a' },
  ]

  componentColors.forEach(({ name, fg, bg }) => {
    it(`should have accessible contrast for ${name}`, () => {
      const result = checkColorContrast(fg, bg)
      if (!result.passesAA) {
        console.warn(`${name} fails WCAG AA: ${fg} on ${bg} = ${result.ratio.toFixed(2)}:1`)
      }
      // This will help identify which specific components need fixing
      expect(result.passesAA).toBe(true)
    })
  })
})