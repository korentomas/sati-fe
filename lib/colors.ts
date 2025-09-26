/**
 * SATI Terminal Color System
 * WCAG AA/AAA compliant color palette
 */

export const colors = {
  // Background colors
  bg: {
    primary: '#000000',    // Black terminal background
    secondary: '#1a1a1a',  // Dark gray
    panel: '#111111',      // Panel background
    border: '#333333',     // Border gray
  },

  // Terminal colors for dark backgrounds
  terminal: {
    green: '#00ff00',      // Classic terminal green (use on dark only!)
    yellow: '#ffff00',     // Warning yellow (use on dark only!)
    red: '#ff0000',        // Error red
    cyan: '#00ffff',       // Info cyan (use on dark only!)
    white: '#ffffff',      // Terminal white
    gray: '#aaaaaa',       // Muted gray
  },

  // Accessible colors for light backgrounds
  accessible: {
    green: '#008800',      // Dark green (4.64:1 on white)
    yellow: '#886600',     // Dark yellow (5.32:1 on white)
    red: '#cc0000',        // Dark red (5.92:1 on white)
    cyan: '#006666',       // Dark cyan (4.95:1 on white)
    black: '#000000',      // Black text
  },

  // Smart color function that picks appropriate contrast
  smart: {
    green: (bgLuminance: number) => bgLuminance > 0.5 ? '#008800' : '#00ff00',
    yellow: (bgLuminance: number) => bgLuminance > 0.5 ? '#886600' : '#ffff00',
    cyan: (bgLuminance: number) => bgLuminance > 0.5 ? '#006666' : '#00ffff',
    text: (bgLuminance: number) => bgLuminance > 0.5 ? '#000000' : '#ffffff',
  }
}

/**
 * Calculate luminance of a color
 */
export function getLuminance(hex: string): number {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const [rs, gs, bs] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Get appropriate text color for a background
 */
export function getTextColor(bgColor: string): string {
  const lum = getLuminance(bgColor)
  return colors.smart.text(lum)
}

/**
 * Get appropriate terminal color for a background
 */
export function getTerminalColor(color: 'green' | 'yellow' | 'cyan', bgColor: string): string {
  const lum = getLuminance(bgColor)
  return colors.smart[color](lum)
}

// CSS Variables for global use
export const cssVariables = `
  :root {
    --bg-primary: ${colors.bg.primary};
    --bg-secondary: ${colors.bg.secondary};
    --bg-panel: ${colors.bg.panel};
    --border: ${colors.bg.border};

    --terminal-green: ${colors.terminal.green};
    --terminal-yellow: ${colors.terminal.yellow};
    --terminal-red: ${colors.terminal.red};
    --terminal-cyan: ${colors.terminal.cyan};
    --terminal-white: ${colors.terminal.white};
    --terminal-gray: ${colors.terminal.gray};

    --accessible-green: ${colors.accessible.green};
    --accessible-yellow: ${colors.accessible.yellow};
    --accessible-red: ${colors.accessible.red};
    --accessible-cyan: ${colors.accessible.cyan};
  }
`