/**
 * Style Presets for Remotion Videos
 *
 * 10 curated visual themes with fonts, colors, animations, and backgrounds.
 * See .agent/skills/style-presets/SKILL.md for full documentation.
 *
 * Usage:
 *   import { STYLE_PRESETS, getStylePreset } from './style-presets';
 *   const style = getStylePreset('neon_cyber');
 */

export interface StyleColors {
  BG_PRIMARY: string;
  BG_SECONDARY: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  ACCENT: string;
  ACCENT_SECONDARY?: string;
  ACCENT_GLOW?: string;
  BORDER?: string;
}

export interface StyleFonts {
  FAMILY_DISPLAY: string;
  FAMILY_BODY: string;
  WEIGHT_DISPLAY: number;
  WEIGHT_BODY: number;
}

export interface StyleSpring {
  damping: number;
  stiffness: number;
  mass?: number;
}

export interface StylePreset {
  name: string;
  description: string;
  vibe: string[];
  colors: StyleColors;
  fonts: StyleFonts;
  fontImport: string;
  springs: {
    entrance: StyleSpring;
    highlight: StyleSpring;
    subtle: StyleSpring;
  };
  background: {
    gradient: string;
    overlay?: string;
  };
}

// =============================================================================
// DARK THEMES
// =============================================================================

const NEON_CYBER: StylePreset = {
  name: 'Neon Cyber',
  description: 'Futuristic, techy, AI/crypto, cutting-edge',
  vibe: ['impressed', 'excited', 'techy'],
  colors: {
    BG_PRIMARY: '#0a0f1c',
    BG_SECONDARY: '#111827',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#94a3b8',
    ACCENT: '#00ffcc',
    ACCENT_SECONDARY: '#ff00aa',
    ACCENT_GLOW: 'rgba(0, 255, 204, 0.4)',
  },
  fonts: {
    FAMILY_DISPLAY: 'Clash Display, sans-serif',
    FAMILY_BODY: 'Satoshi, sans-serif',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://api.fontshare.com/v2/css?f[]=clash-display@700&f[]=satoshi@400,500&display=swap',
  springs: {
    entrance: { damping: 15, stiffness: 150 },
    highlight: { damping: 10, stiffness: 180, mass: 0.8 },
    subtle: { damping: 20, stiffness: 120 },
  },
  background: {
    gradient: `
      radial-gradient(ellipse at 30% 20%, rgba(0, 255, 204, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(255, 0, 170, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, #0a0f1c 0%, #111827 100%)
    `,
    overlay: `
      linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px)
    `,
  },
};

const MIDNIGHT_EXECUTIVE: StylePreset = {
  name: 'Midnight Executive',
  description: 'Premium, trustworthy, corporate, sophisticated',
  vibe: ['impressed', 'confident', 'professional'],
  colors: {
    BG_PRIMARY: '#0f172a',
    BG_SECONDARY: '#1e293b',
    TEXT_PRIMARY: '#f8fafc',
    TEXT_SECONDARY: '#94a3b8',
    ACCENT: '#3b82f6',
    ACCENT_SECONDARY: '#fbbf24',
  },
  fonts: {
    FAMILY_DISPLAY: 'Libre Baskerville, serif',
    FAMILY_BODY: 'Source Sans 3, sans-serif',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Source+Sans+3:wght@400;600&display=swap',
  springs: {
    entrance: { damping: 25, stiffness: 200 },
    highlight: { damping: 20, stiffness: 180 },
    subtle: { damping: 30, stiffness: 150 },
  },
  background: {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },
};

const DEEP_SPACE: StylePreset = {
  name: 'Deep Space',
  description: 'Inspiring, vast, contemplative, visionary',
  vibe: ['inspired', 'calm', 'visionary'],
  colors: {
    BG_PRIMARY: '#030712',
    BG_SECONDARY: '#111827',
    TEXT_PRIMARY: '#f9fafb',
    TEXT_SECONDARY: '#6b7280',
    ACCENT: '#818cf8',
    ACCENT_SECONDARY: '#c084fc',
  },
  fonts: {
    FAMILY_DISPLAY: 'Space Grotesk, sans-serif',
    FAMILY_BODY: 'DM Sans, sans-serif',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=DM+Sans:wght@400;500&display=swap',
  springs: {
    entrance: { damping: 12, stiffness: 80, mass: 1.2 },
    highlight: { damping: 10, stiffness: 100 },
    subtle: { damping: 15, stiffness: 60 },
  },
  background: {
    gradient: `
      radial-gradient(ellipse at center, rgba(129, 140, 248, 0.1) 0%, transparent 60%),
      #030712
    `,
  },
};

const TERMINAL_GREEN: StylePreset = {
  name: 'Terminal Green',
  description: 'Developer-focused, hacker aesthetic, retro-tech',
  vibe: ['techy', 'developer', 'retro'],
  colors: {
    BG_PRIMARY: '#0d1117',
    BG_SECONDARY: '#161b22',
    TEXT_PRIMARY: '#c9d1d9',
    TEXT_SECONDARY: '#8b949e',
    ACCENT: '#39d353',
    ACCENT_GLOW: 'rgba(57, 211, 83, 0.2)',
    BORDER: '#30363d',
  },
  fonts: {
    FAMILY_DISPLAY: 'JetBrains Mono, monospace',
    FAMILY_BODY: 'JetBrains Mono, monospace',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
  springs: {
    entrance: { damping: 20, stiffness: 250 },
    highlight: { damping: 25, stiffness: 220 },
    subtle: { damping: 30, stiffness: 200 },
  },
  background: {
    gradient: '#0d1117',
    overlay: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
  },
};

const CINEMATIC_DARK: StylePreset = {
  name: 'Cinematic Dark',
  description: 'Professional, versatile, modern (Bubble default)',
  vibe: ['professional', 'modern', 'versatile'],
  colors: {
    BG_PRIMARY: '#0f0f1a',
    BG_SECONDARY: '#1a1a2e',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#9ca3af',
    ACCENT: '#667eea',
    ACCENT_SECONDARY: '#764ba2',
  },
  fonts: {
    FAMILY_DISPLAY: 'Inter, sans-serif',
    FAMILY_BODY: 'Inter, sans-serif',
    WEIGHT_DISPLAY: 800,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap',
  springs: {
    entrance: { damping: 20, stiffness: 200 },
    highlight: { damping: 8, stiffness: 200, mass: 0.8 },
    subtle: { damping: 150, stiffness: 100, mass: 1.0 },
  },
  background: {
    gradient: `
      radial-gradient(ellipse at 30% 20%, hsla(230, 60%, 25%, 1) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, hsla(250, 50%, 20%, 1) 0%, transparent 50%),
      linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)
    `,
  },
};

// =============================================================================
// LIGHT THEMES
// =============================================================================

const PAPER_INK: StylePreset = {
  name: 'Paper & Ink',
  description: 'Editorial, literary, thoughtful, refined',
  vibe: ['calm', 'thoughtful', 'editorial'],
  colors: {
    BG_PRIMARY: '#faf9f7',
    BG_SECONDARY: '#f5f3ef',
    TEXT_PRIMARY: '#1a1a1a',
    TEXT_SECONDARY: '#666666',
    ACCENT: '#c41e3a',
    BORDER: '#e5e2db',
  },
  fonts: {
    FAMILY_DISPLAY: 'Cormorant Garamond, serif',
    FAMILY_BODY: 'Source Serif 4, serif',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Source+Serif+4:wght@400&display=swap',
  springs: {
    entrance: { damping: 25, stiffness: 100 },
    highlight: { damping: 20, stiffness: 120 },
    subtle: { damping: 30, stiffness: 80 },
  },
  background: {
    gradient: '#faf9f7',
  },
};

const SWISS_MODERN: StylePreset = {
  name: 'Swiss Modern',
  description: 'Clean, precise, Bauhaus-inspired, geometric',
  vibe: ['calm', 'precise', 'minimal'],
  colors: {
    BG_PRIMARY: '#ffffff',
    BG_SECONDARY: '#f7f7f7',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#555555',
    ACCENT: '#ff3300',
  },
  fonts: {
    FAMILY_DISPLAY: 'Archivo, sans-serif',
    FAMILY_BODY: 'Nunito, sans-serif',
    WEIGHT_DISPLAY: 800,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Nunito:wght@400;600&display=swap',
  springs: {
    entrance: { damping: 30, stiffness: 200 },
    highlight: { damping: 25, stiffness: 180 },
    subtle: { damping: 35, stiffness: 150 },
  },
  background: {
    gradient: '#ffffff',
    overlay: `
      linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
    `,
  },
};

const SOFT_PASTEL: StylePreset = {
  name: 'Soft Pastel',
  description: 'Friendly, approachable, creative, playful',
  vibe: ['playful', 'friendly', 'creative'],
  colors: {
    BG_PRIMARY: '#fef3f2',
    BG_SECONDARY: '#fef9f5',
    TEXT_PRIMARY: '#374151',
    TEXT_SECONDARY: '#6b7280',
    ACCENT: '#f472b6',
    ACCENT_SECONDARY: '#a78bfa',
  },
  fonts: {
    FAMILY_DISPLAY: 'Nunito, sans-serif',
    FAMILY_BODY: 'Nunito, sans-serif',
    WEIGHT_DISPLAY: 800,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&display=swap',
  springs: {
    entrance: { damping: 8, stiffness: 180, mass: 0.8 },
    highlight: { damping: 6, stiffness: 200, mass: 0.7 },
    subtle: { damping: 12, stiffness: 150 },
  },
  background: {
    gradient: '#fef3f2',
  },
};

const WARM_EDITORIAL: StylePreset = {
  name: 'Warm Editorial',
  description: 'Human, storytelling, photographic, magazine',
  vibe: ['inspired', 'warm', 'storytelling'],
  colors: {
    BG_PRIMARY: '#fffbf5',
    BG_SECONDARY: '#f5efe6',
    TEXT_PRIMARY: '#2d2a24',
    TEXT_SECONDARY: '#78716c',
    ACCENT: '#b45309',
    ACCENT_SECONDARY: '#0369a1',
  },
  fonts: {
    FAMILY_DISPLAY: 'Playfair Display, serif',
    FAMILY_BODY: 'Work Sans, sans-serif',
    WEIGHT_DISPLAY: 700,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Work+Sans:wght@400;500&display=swap',
  springs: {
    entrance: { damping: 15, stiffness: 100 },
    highlight: { damping: 12, stiffness: 120 },
    subtle: { damping: 20, stiffness: 80 },
  },
  background: {
    gradient: '#fffbf5',
  },
};

const GRADIENT_WAVE: StylePreset = {
  name: 'Gradient Wave',
  description: 'Modern SaaS, energetic, approachable tech',
  vibe: ['excited', 'modern', 'saas'],
  colors: {
    BG_PRIMARY: '#0f0f1a',
    BG_SECONDARY: '#1a1a2e',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a1a1aa',
    ACCENT: '#667eea',
    ACCENT_SECONDARY: '#f472b6',
  },
  fonts: {
    FAMILY_DISPLAY: 'Cabinet Grotesk, sans-serif',
    FAMILY_BODY: 'Inter, sans-serif',
    WEIGHT_DISPLAY: 800,
    WEIGHT_BODY: 400,
  },
  fontImport: 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800&display=swap',
  springs: {
    entrance: { damping: 18, stiffness: 150 },
    highlight: { damping: 15, stiffness: 170 },
    subtle: { damping: 22, stiffness: 120 },
  },
  background: {
    gradient: `
      linear-gradient(135deg,
        rgba(102, 126, 234, 0.3) 0%,
        rgba(118, 75, 162, 0.3) 50%,
        rgba(244, 114, 182, 0.2) 100%
      ),
      #0f0f1a
    `,
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export const STYLE_PRESETS = {
  // Dark themes
  neon_cyber: NEON_CYBER,
  midnight_executive: MIDNIGHT_EXECUTIVE,
  deep_space: DEEP_SPACE,
  terminal_green: TERMINAL_GREEN,
  cinematic_dark: CINEMATIC_DARK,

  // Light themes
  paper_ink: PAPER_INK,
  swiss_modern: SWISS_MODERN,
  soft_pastel: SOFT_PASTEL,
  warm_editorial: WARM_EDITORIAL,
  gradient_wave: GRADIENT_WAVE,
} as const;

export type StylePresetName = keyof typeof STYLE_PRESETS;

/**
 * Get a style preset by name
 */
export function getStylePreset(name: StylePresetName): StylePreset {
  return STYLE_PRESETS[name];
}

/**
 * Get style preset names matching a vibe
 */
export function getStylesByVibe(vibe: string): StylePresetName[] {
  return (Object.entries(STYLE_PRESETS) as [StylePresetName, StylePreset][])
    .filter(([_, preset]) => preset.vibe.includes(vibe.toLowerCase()))
    .map(([name]) => name);
}

/**
 * List all available style preset names
 */
export function listStylePresets(): StylePresetName[] {
  return Object.keys(STYLE_PRESETS) as StylePresetName[];
}

// Default export for convenience
export default STYLE_PRESETS;
