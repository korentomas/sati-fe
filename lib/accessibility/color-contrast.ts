/**
 * WCAG 2.1 Color Contrast Checker
 * Ensures text meets accessibility standards
 */

export interface ColorPair {
  foreground: string
  background: string
  description?: string
}

export interface ContrastResult {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  recommendation?: string
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '')

  // Handle 3-digit hex codes
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * Calculate relative luminance
 * WCAG formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb

  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const r2 = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g2 = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b2 = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  const l1 = getLuminance(fg)
  const l2 = getLuminance(bg)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color pair meets WCAG standards
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText = false
): ContrastResult {
  const ratio = getContrastRatio(foreground, background)

  // WCAG AA requirements
  const aaMinimum = isLargeText ? 3 : 4.5
  const aaaMinimum = isLargeText ? 4.5 : 7

  const passesAA = ratio >= aaMinimum
  const passesAAA = ratio >= aaaMinimum

  let recommendation = ''
  if (!passesAA) {
    recommendation = `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG AA. Minimum required: ${aaMinimum}:1`
  } else if (!passesAAA) {
    recommendation = `Passes AA (${ratio.toFixed(2)}:1) but not AAA. Consider improving for better accessibility.`
  } else {
    recommendation = `Excellent contrast (${ratio.toFixed(2)}:1). Passes both AA and AAA.`
  }

  return {
    ratio,
    passesAA,
    passesAAA,
    recommendation,
  }
}

/**
 * Test all color combinations in the app
 */
export const SATI_COLOR_PAIRS: ColorPair[] = [
  // Terminal green colors
  { foreground: '#00ff00', background: '#000000', description: 'Terminal green on black' },
  { foreground: '#00ff00', background: '#ffffff', description: 'Terminal green on white - FAILS!' },
  { foreground: '#0f0', background: '#000', description: 'Bright green on black' },

  // Yellow/warning colors
  { foreground: '#ffff00', background: '#000000', description: 'Yellow on black' },
  { foreground: '#ffff00', background: '#ffffff', description: 'Yellow on white - FAILS!' },
  { foreground: '#ff0', background: '#000', description: 'Warning yellow on black' },

  // Fixed alternatives
  { foreground: '#008800', background: '#ffffff', description: 'Dark green on white (ACCESSIBLE)' },
  {
    foreground: '#886600',
    background: '#ffffff',
    description: 'Dark yellow on white (ACCESSIBLE)',
  },
  { foreground: '#00cc00', background: '#000000', description: 'Medium green on black' },
]

/**
 * Run accessibility audit on all colors
 */
export function auditColors(): void {
  console.log('🔍 SATI Color Contrast Audit')
  console.log('============================\n')

  let failures = 0

  SATI_COLOR_PAIRS.forEach((pair) => {
    const result = checkColorContrast(pair.foreground, pair.background)
    const status = result.passesAA ? '✅' : '❌'

    console.log(`${status} ${pair.description}`)
    console.log(`   ${pair.foreground} on ${pair.background}`)
    console.log(`   Ratio: ${result.ratio.toFixed(2)}:1`)
    console.log(`   ${result.recommendation}\n`)

    if (!result.passesAA) failures++
  })

  if (failures > 0) {
    console.error(`\n⚠️ ${failures} color combinations fail WCAG AA standards!`)
    console.error('These MUST be fixed for accessibility compliance.')
  } else {
    console.log('\n✅ All color combinations pass WCAG AA standards!')
  }
}

// Run audit if executed directly
if (require.main === module || process.argv[1] === import.meta.url.slice(7)) {
  auditColors()
}
