#!/usr/bin/env node

/**
 * Accessibility checker script
 * Run this to validate color contrast in the project
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔍 SATI Accessibility Check\n')

try {
  // Run the test runner directly with tsx
  execSync('npx tsx lib/accessibility/test-runner.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  })

  console.log('\n✅ Accessibility check completed!')
} catch (error) {
  console.error('\n❌ Accessibility check failed!')
  process.exit(1)
}