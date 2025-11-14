#!/usr/bin/env node

/**
 * Accessibility checker script
 * Run this to validate color contrast in the project
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

console.log('🔍 SATI Accessibility Check\n')

try {
  // Run the test runner directly with tsx
  execSync('npx tsx lib/accessibility/test-runner.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  })

  console.log('\n✅ Accessibility check completed!')
} catch {
  console.error('\n❌ Accessibility check failed!')
  process.exit(1)
}