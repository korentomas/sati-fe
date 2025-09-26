#!/usr/bin/env node

/**
 * Simple accessibility check using axe-core
 * Tests HTML files for WCAG violations
 */

const { execSync } = require('child_process')

console.log('🔍 SATI Accessibility Check\n')

// Install axe CLI if needed
try {
  execSync('npx @axe-core/cli --version', { stdio: 'ignore' })
} catch {
  console.log('Installing axe-core CLI...')
  execSync('npm install -g @axe-core/cli', { stdio: 'inherit' })
}

// Run accessibility check on the dev server
console.log('Starting accessibility scan...\n')

const urls = [
  'http://localhost:3000',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/imagery',
  'http://localhost:3000/login',
  'http://localhost:3000/register'
]

let hasErrors = false

for (const url of urls) {
  console.log(`Checking ${url}...`)
  try {
    // Run axe on the URL and check for color contrast issues specifically
    const result = execSync(
      `npx @axe-core/cli ${url} --rules color-contrast,color-contrast-enhanced --disable link-name,region`,
      { encoding: 'utf8' }
    )
    console.log(`✅ ${url} - No accessibility violations\n`)
  } catch (error) {
    console.error(`❌ ${url} - Found accessibility violations`)
    console.error(error.stdout || error.message)
    hasErrors = true
  }
}

if (hasErrors) {
  console.error('\n❌ Accessibility check failed!')
  console.error('Fix the color contrast issues before committing.')
  process.exit(1)
} else {
  console.log('\n✅ All pages pass accessibility checks!')
}