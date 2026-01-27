/**
 * Brand Constants - Official Bubble Brand Guidelines
 * Source: Charte Graphique Bubble + VIDEO_BIBLE.md
 *
 * IMPORTANT: These constants are the single source of truth for all brand styling.
 * All compositions MUST import from this file instead of hardcoding values.
 */

// ============================================================================
// COLORS
// ============================================================================

/**
 * Brand color palette per Charte Graphique
 * Primary brand approach: White backgrounds with black/gray text
 */
export const COLORS = {
  // Primary colors
  PRIMARY_TEXT: '#000000', // Black - main text, logo on white
  BACKGROUND: '#FFFFFF', // White - primary background (always preferred)

  // Accent colors
  ACCENT_VIOLET: '#667eea', // Violet - kinetic text, highlights, CTAs, chart elements

  // Secondary/supporting colors
  GRAY_DARK: '#333333', // Dark gray - headings, primary buttons
  GRAY_MEDIUM: '#666666', // Medium gray - secondary text
  GRAY_LIGHT: '#F8F8F8', // Light gray - card backgrounds
  GRAY_BORDER: '#EEEEEE', // Very light gray - borders

  // Subtitle specific
  SUBTITLE_TEXT: '#FFFFFF', // White text
  SUBTITLE_OUTLINE: '#000000', // Black outline
  SUBTITLE_HIGHLIGHT: '#667eea', // Violet for emphasized words (NOT orange)
} as const;

/**
 * CRITICAL FIX: The Python implementation incorrectly used #ea7e66 (orange) for subtitle highlights.
 * The correct brand color per Charte Graphique is #667eea (violet).
 */

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Font family configuration
 * Primary: Inter (from Google Fonts via @remotion/google-fonts)
 */
export const FONTS = {
  PRIMARY: 'Inter', // Inter is the brand font
  FALLBACK: 'Arial, sans-serif',

  // Convenience getters
  get FAMILY() {
    return `${this.PRIMARY}, ${this.FALLBACK}`;
  },
} as const;

/**
 * Font weights per Charte Graphique
 */
export const FONT_WEIGHTS = {
  REGULAR: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
  EXTRABOLD: 800, // Used for titles and kinetic text
} as const;

/**
 * Typography sizes per VIDEO_BIBLE.md
 * All sizes in pixels
 */
export const FONT_SIZES = {
  // Video-specific sizes (from VIDEO_BIBLE.md)
  KINETIC: 170, // Kinetic typography - 170px Inter-ExtraBold
  TITLE_CARD: 90, // Title cards (PARTIE 1, etc.) - 90px Inter-ExtraBold
  SUBTITLE: 60, // Subtitles - 60px Inter with outline

  // Intro/Outro
  LOGO_TEXT_FALLBACK: 120, // Fallback text logo when image not available
  CTA_TEXT: 32, // Call-to-action text in outro
} as const;

/**
 * Letter spacing adjustments per Charte Graphique
 */
export const LETTER_SPACING = {
  KINETIC: '-2px', // Tight spacing for large kinetic text
  TITLE_CARD: '-1px', // Slightly tight for title cards
  LOGO: '-2px', // Logo text
  NORMAL: '0px', // Default
} as const;

// ============================================================================
// TIMING
// ============================================================================

/**
 * Timing constants per VIDEO_BIBLE.md
 * All durations in seconds (convert to frames using fps)
 */
export const TIMING = {
  // Section durations
  INTRO_MIN: 3,
  INTRO_MAX: 5,
  HOOK_MIN: 10,
  HOOK_MAX: 30,
  TITLE_CARD_MIN: 2,
  TITLE_CARD_MAX: 3,
  OUTRO_MIN: 3,
  OUTRO_MAX: 5,

  // Animation durations
  TRANSITION_DURATION: 0.4, // Fade between scenes - 10 frames at 25fps
  FADE_IN_DURATION: 0.5, // Fade in for intro/title cards - 12.5 frames at 25fps
  FADE_OUT_DURATION: 0.5, // Fade out - 12.5 frames at 25fps

  // Audio
  MUSIC_FADE_DURATION: 2.0, // Music fade in/out - 50 frames at 25fps
  SUBTITLE_FADE_DURATION: 0.1, // Quick fade for word transitions
} as const;

/**
 * Helper: Convert seconds to frames
 */
export const secondsToFrames = (seconds: number, fps: number): number => {
  return Math.ceil(seconds * fps);
};

// ============================================================================
// VIDEO SPECIFICATIONS
// ============================================================================

/**
 * Video output specifications per VIDEO_BIBLE.md
 */
export const VIDEO_SPECS = {
  WIDTH: 1920,
  HEIGHT: 1080,
  FPS: 25,
  PIXEL_FORMAT: 'yuv420p',
} as const;

// ============================================================================
// AUDIO SPECIFICATIONS
// ============================================================================

/**
 * Audio specifications per VIDEO_BIBLE.md
 */
export const AUDIO_SPECS = {
  SAMPLE_RATE: 48000,
  CHANNELS: 2,
  BACKGROUND_MUSIC_VOLUME_DB: -20, // dB below voice (≈ 0.1 linear)
} as const;

/**
 * Helper: Convert dB to linear volume
 * Formula: 10^(dB/20)
 */
export const dbToLinear = (db: number): number => {
  return Math.pow(10, db / 20);
};

// ============================================================================
// KINETIC TYPOGRAPHY
// ============================================================================

/**
 * Kinetic typography configuration per VIDEO_BIBLE.md
 */
export const KINETIC = {
  FONT_SIZE: FONT_SIZES.KINETIC,
  FONT_WEIGHT: FONT_WEIGHTS.EXTRABOLD,
  COLOR: COLORS.ACCENT_VIOLET,
  BACKGROUND_BRIGHTNESS: 0.6, // CSS filter: brightness(0.6) = -0.4 from VIDEO_BIBLE
  TEXT_SHADOW: '0 4px 20px rgba(102, 126, 234, 0.5)', // Glow effect
  MAX_FREQUENCY: 0.20, // ~20% of segments maximum
} as const;

// ============================================================================
// SUBTITLE STYLING
// ============================================================================

/**
 * Subtitle styling per VIDEO_BIBLE.md
 */
export const SUBTITLES = {
  FONT_SIZE: FONT_SIZES.SUBTITLE,
  FONT_WEIGHT: FONT_WEIGHTS.SEMIBOLD,
  COLOR: COLORS.SUBTITLE_TEXT,
  OUTLINE_COLOR: COLORS.SUBTITLE_OUTLINE,
  HIGHLIGHT_COLOR: COLORS.SUBTITLE_HIGHLIGHT, // Violet, NOT orange

  // Position
  BOTTOM_OFFSET: 80, // px from bottom

  // Text outline (using textShadow for black outline effect)
  TEXT_SHADOW: `
    -2px -2px 0 ${COLORS.SUBTITLE_OUTLINE},
    2px -2px 0 ${COLORS.SUBTITLE_OUTLINE},
    -2px 2px 0 ${COLORS.SUBTITLE_OUTLINE},
    2px 2px 0 ${COLORS.SUBTITLE_OUTLINE},
    0 0 8px rgba(0, 0, 0, 0.8)
  `,
} as const;

// ============================================================================
// TITLE CARD STYLING
// ============================================================================

/**
 * Title card styling per VIDEO_BIBLE.md
 * Used for section transitions (PARTIE 1, PARTIE 2, etc.)
 */
export const TITLE_CARD = {
  BACKGROUND: COLORS.BACKGROUND,
  FONT_SIZE: FONT_SIZES.TITLE_CARD,
  FONT_WEIGHT: FONT_WEIGHTS.EXTRABOLD,
  COLOR: COLORS.PRIMARY_TEXT,
  LETTER_SPACING: LETTER_SPACING.TITLE_CARD,
  LINE_HEIGHT: 1.2,

  // Animation
  FADE_IN: TIMING.FADE_IN_DURATION,
  FADE_OUT: TIMING.FADE_OUT_DURATION,
  SCALE_FROM: 0.98, // Subtle scale animation
  SCALE_TO: 1.0,
} as const;

// ============================================================================
// INTRO/OUTRO STYLING
// ============================================================================

/**
 * Intro/Outro styling per Charte Graphique + VIDEO_BIBLE.md
 */
export const INTRO_OUTRO = {
  BACKGROUND: COLORS.BACKGROUND,
  LOGO_WIDTH: 350, // px

  // Fallback text logo (when image not available)
  LOGO_TEXT_SIZE: FONT_SIZES.LOGO_TEXT_FALLBACK,
  LOGO_TEXT_WEIGHT: FONT_WEIGHTS.EXTRABOLD,
  LOGO_TEXT_COLOR: COLORS.ACCENT_VIOLET,
  LOGO_TEXT_SPACING: LETTER_SPACING.LOGO,

  // CTA text
  CTA_SIZE: FONT_SIZES.CTA_TEXT,
  CTA_WEIGHT: FONT_WEIGHTS.SEMIBOLD,
  CTA_COLOR: COLORS.PRIMARY_TEXT,

  // Animation
  FADE_DURATION: 0.5, // 12.5 frames at 25fps
  SCALE_FROM: 0.95,
  SCALE_TO: 1.0,
} as const;

// ============================================================================
// ANIMATION SPRING CONFIGS
// ============================================================================

/**
 * Spring animation configurations for Remotion
 * Per Charte Graphique: Subtle, efficient, futuristic
 */
export const SPRING_CONFIGS = {
  // Kinetic text entrance
  KINETIC: {
    damping: 100,
    stiffness: 200,
    mass: 0.5,
  },

  // Smooth fade/scale
  SMOOTH: {
    damping: 150,
    stiffness: 100,
    mass: 1.0,
  },
} as const;

// ============================================================================
// LAYOUT
// ============================================================================

/**
 * Layout constants
 */
export const LAYOUT = {
  PADDING_HORIZONTAL: 100, // Standard horizontal padding for text
  MAX_WIDTH_PERCENT: 90, // Max width as percentage for text
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Export types for type safety
 */
export type BrandColor = typeof COLORS[keyof typeof COLORS];
export type FontSize = typeof FONT_SIZES[keyof typeof FONT_SIZES];
export type FontWeight = typeof FONT_WEIGHTS[keyof typeof FONT_WEIGHTS];
export type TimingConstant = typeof TIMING[keyof typeof TIMING];
