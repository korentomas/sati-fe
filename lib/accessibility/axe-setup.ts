/**
 * Axe-core setup for accessibility testing
 * Automated WCAG compliance checking
 */

import type { AxeResults, Spec } from 'axe-core'

// Color contrast checker using axe-core
export async function checkColorContrast(html: string): Promise<AxeResults> {
  if (typeof window === 'undefined') {
    // Server-side: use jsdom
    const { JSDOM } = await import('jsdom')
    const axe = await import('axe-core')

    const dom = new JSDOM(html)
    const { window: win } = dom

    // @ts-expect-error - Global window assignment for testing
    global.window = win
    global.document = win.document

    return await axe.default.run(document.body, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    })
  } else {
    // Client-side
    const axe = await import('axe-core')
    return await axe.default.run(document.body, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    })
  }
}

// React component wrapper for development
export function AxeAccessibilityReporter() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    import('@axe-core/react').then(({ default: axe }) => {
      axe(React, ReactDOM, 1000, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      })
    })
  }
  return null
}

// Utility to test specific color combinations
export async function testColorPair(
  foreground: string,
  background: string,
  fontSize: string = '16px'
): Promise<boolean> {
  const testHTML = `
    <div style="background: ${background}; padding: 20px;">
      <p style="color: ${foreground}; font-size: ${fontSize};">Test text</p>
    </div>
  `

  const results = await checkColorContrast(testHTML)
  return results.violations.length === 0
}
