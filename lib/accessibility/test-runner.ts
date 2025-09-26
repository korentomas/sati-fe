/**
 * Accessibility Test Runner
 * Automated testing for WCAG compliance during development
 */

import { checkColorContrast, SATI_COLOR_PAIRS, ColorPair } from './color-contrast'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  passed: boolean
  failures: Array<{
    description: string
    foreground: string
    background: string
    ratio: number
    required: number
  }>
  warnings: Array<{
    description: string
    message: string
  }>
}

/**
 * Scan CSS/TSX files for color definitions
 */
function findColorDefinitions(dir: string): Map<string, string[]> {
  const colors = new Map<string, string[]>()
  const fileExtensions = ['.css', '.tsx', '.ts']

  function scanDirectory(currentDir: string) {
    const files = fs.readdirSync(currentDir)

    for (const file of files) {
      const fullPath = path.join(currentDir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath)
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // Find hex colors
        const hexMatches = content.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)
        for (const match of hexMatches) {
          const color = match[0].toLowerCase()
          if (!colors.has(color)) {
            colors.set(color, [])
          }
          colors.get(color)!.push(fullPath)
        }

        // Find rgb colors
        const rgbMatches = content.matchAll(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)
        for (const match of rgbMatches) {
          const r = parseInt(match[1])
          const g = parseInt(match[2])
          const b = parseInt(match[3])
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          if (!colors.has(hex)) {
            colors.set(hex, [])
          }
          colors.get(hex)!.push(fullPath)
        }
      }
    }
  }

  scanDirectory(dir)
  return colors
}

/**
 * Test predefined color pairs
 */
export function testColorPairs(): TestResult {
  const result: TestResult = {
    passed: true,
    failures: [],
    warnings: []
  }

  for (const pair of SATI_COLOR_PAIRS) {
    const contrastResult = checkColorContrast(pair.foreground, pair.background)

    if (!contrastResult.passesAA) {
      result.passed = false
      result.failures.push({
        description: pair.description || 'Unnamed color pair',
        foreground: pair.foreground,
        background: pair.background,
        ratio: contrastResult.ratio,
        required: 4.5
      })
    } else if (!contrastResult.passesAAA) {
      result.warnings.push({
        description: pair.description || 'Unnamed color pair',
        message: contrastResult.recommendation || 'Consider improving contrast'
      })
    }
  }

  return result
}

/**
 * Test common text colors against backgrounds
 */
export function testCommonPatterns(): TestResult {
  const result: TestResult = {
    passed: true,
    failures: [],
    warnings: []
  }

  // Common SATI terminal colors
  const terminalPatterns: ColorPair[] = [
    { foreground: '#00ff00', background: '#000000', description: 'Terminal green on black' },
    { foreground: '#0f0', background: '#1a1a1a', description: 'Green on dark gray' },
    { foreground: '#ff0', background: '#000000', description: 'Yellow warning on black' },
    { foreground: '#f00', background: '#000000', description: 'Red error on black' },
    { foreground: '#0ff', background: '#000000', description: 'Cyan info on black' },
    { foreground: '#fff', background: '#333333', description: 'White on panel border' },
    { foreground: '#aaa', background: '#000000', description: 'Gray text on black' },
  ]

  // Test against both dark and light backgrounds
  const backgrounds = ['#000000', '#ffffff', '#1a1a1a', '#f5f5f5']
  const textColors = ['#00ff00', '#ffff00', '#ff0000', '#00ffff', '#ffffff', '#000000']

  for (const bg of backgrounds) {
    for (const fg of textColors) {
      // Skip same color combinations
      if (fg === bg) continue

      const contrastResult = checkColorContrast(fg, bg)
      const bgName = bg === '#000000' ? 'black' : bg === '#ffffff' ? 'white' : bg
      const fgName = fg === '#00ff00' ? 'green' : fg === '#ffff00' ? 'yellow' :
                     fg === '#ff0000' ? 'red' : fg === '#00ffff' ? 'cyan' : fg

      if (!contrastResult.passesAA) {
        result.passed = false
        result.failures.push({
          description: `${fgName} on ${bgName}`,
          foreground: fg,
          background: bg,
          ratio: contrastResult.ratio,
          required: 4.5
        })
      }
    }
  }

  return result
}

/**
 * Main test runner
 */
export function runAccessibilityTests(projectDir?: string): void {
  console.log('🔍 Running SATI Accessibility Tests')
  console.log('=====================================\n')

  // Test predefined pairs
  console.log('Testing Predefined Color Pairs:')
  const pairResults = testColorPairs()

  if (pairResults.failures.length > 0) {
    console.error('\n❌ Color Contrast Failures:')
    for (const failure of pairResults.failures) {
      console.error(`  - ${failure.description}`)
      console.error(`    ${failure.foreground} on ${failure.background}`)
      console.error(`    Ratio: ${failure.ratio.toFixed(2)}:1 (Required: ${failure.required}:1)`)
    }
  }

  if (pairResults.warnings.length > 0) {
    console.warn('\n⚠️  Warnings (AA passed, AAA failed):')
    for (const warning of pairResults.warnings) {
      console.warn(`  - ${warning.description}: ${warning.message}`)
    }
  }

  // Test common patterns
  console.log('\n\nTesting Common Color Patterns:')
  const patternResults = testCommonPatterns()

  if (patternResults.failures.length > 0) {
    console.error('\n❌ Pattern Failures:')
    for (const failure of patternResults.failures) {
      console.error(`  - ${failure.description}`)
      console.error(`    Ratio: ${failure.ratio.toFixed(2)}:1`)
    }
  }

  // Scan project for colors if directory provided
  if (projectDir) {
    console.log('\n\nScanning Project Files:')
    const foundColors = findColorDefinitions(projectDir)
    console.log(`Found ${foundColors.size} unique colors in project`)

    // Report most common colors
    const colorUsage = Array.from(foundColors.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)

    console.log('\nTop 10 Most Used Colors:')
    for (const [color, files] of colorUsage) {
      console.log(`  ${color}: Used in ${files.length} file(s)`)
    }
  }

  // Final summary
  console.log('\n=====================================')
  if (pairResults.passed && patternResults.passed) {
    console.log('✅ All accessibility tests passed!')
  } else {
    const totalFailures = pairResults.failures.length + patternResults.failures.length
    console.error(`❌ ${totalFailures} accessibility test(s) failed`)
    console.error('\n⚠️  Fix these issues before deployment!')
    process.exit(1)
  }
}

// CLI execution
if (typeof require !== 'undefined' && require.main === module) {
  const projectDir = process.argv[2] || process.cwd()
  runAccessibilityTests(projectDir)
}

// Direct execution for ES modules
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectDir = process.argv[2] || process.cwd()
  runAccessibilityTests(projectDir)
}