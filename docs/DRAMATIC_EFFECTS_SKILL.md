# Dramatic Effects Skill

> TikTok-style punch effects for high-retention video content

## Overview

The Dramatic Effects system creates attention-grabbing moments that hold viewer engagement. Unlike subtle animations, these are AGGRESSIVE, intentional emphasis points.

## Components

### 1. HighlightFlash (`src/compositions/HighlightFlash.tsx`)

**Purpose**: Mid-scene takeover that SLAMS key words/phrases onto screen

**Trigger**: `highlight_word` field in script JSON

**Effects Stack** (all simultaneous):
| Effect | Description | Duration |
|--------|-------------|----------|
| White Flash | Screen flashes white | 0.12s |
| Background Dim | 85% dark overlay | Hold |
| Text Slam | Word drops from above with spring bounce | 0.25s |
| Screen Shake | 25px aggressive shake | 0.15s |
| Color Pop | Violet flash after white | 0.2s |

**Timing Diagram**:
```
Word spoken: |----[WORD]----
White flash:   ▓▓░░
Color pop:       ░▓▓░░
Bg dim:      ░▓▓▓▓▓▓▓▓░░
Text:           ⬇️ WORD
Shake:          ↔↔↔░░
Exit:                  ↗️ (zoom through)
```

### 2. Zoom Punch (`src/compositions/BRollScene.tsx`)

**Purpose**: B-roll zooms in sync with highlight word

**Effect**: 8% zoom in on impact, settles back

**Code**:
```tsx
const zoomPunch = interpolate(
  currentTime,
  [highlightTime - 0.02, highlightTime, highlightTime + 0.08, highlightTime + 0.25],
  [1, 1.08, 1.04, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);
```

### 3. Subtitle Karaoke (`src/compositions/SubtitleOverlay.tsx`)

**Purpose**: Word-by-word animation like TikTok/karaoke

**Effects**:
- Each word springs in as spoken
- Current word scales up 5%
- Pop-up animation from below

### 4. Scene Entry (`src/compositions/BRollScene.tsx`)

**Purpose**: Punchy entrance for every B-roll scene

**Effects**:
- 8% zoom settle (1.08 → 1.0)
- 20px slide up
- Brightness flash (1.3 → 1.0)
- Spring physics (damping: 20)

## Writing Effective Highlights

### DO - Dramatic Phrases

```json
{
  "text": "100 millions d'utilisateurs en deux mois.",
  "highlight_word": "100 MILLIONS"
}
```

```json
{
  "text": "Et ça change absolument tout.",
  "highlight_word": "TOUT CHANGE"
}
```

### DON'T - Weak/Generic Words

```json
// BAD - just a date, no emotional impact
{
  "text": "On est en 2012.",
  "highlight_word": "2012"
}
```

```json
// BAD - generic word
{
  "text": "Il y a un problème.",
  "highlight_word": "problème"
}
```

### Highlight Writing Rules

1. **ALL CAPS** - Always uppercase
2. **Short phrases OK** - "LA MACHINE VOIT" beats "voir"
3. **Emotional charge** - Pick impactful words
4. **Reinforce message** - Highlight = takeaway
5. **One per scene** - Don't dilute impact

## Brand Constants

All values are in `src/brand.ts` under `HIGHLIGHT_EFFECTS`:

```typescript
export const HIGHLIGHT_EFFECTS = {
  FLASH_OPACITY_PEAK: 1.0,
  FLASH_DURATION: 0.12,
  BACKGROUND_DIM: 0.85,
  SHAKE_INTENSITY: 25,
  SHAKE_DURATION: 0.15,
  TEXT_SCALE_OVERSHOOT: 1.35,
  TEXT_FONT_SIZE: 220,
  TEXT_FONT_WEIGHT: 900,
  COLOR_POP_OPACITY: 0.3,
  ZOOM_PUNCH_AMOUNT: 1.08,
  TEXT_GLOW: '...multi-layer glow...',
};
```

## Implementation Checklist

When adding dramatic effects to a video:

- [ ] Review script for key moments (stats, reveals, conclusions)
- [ ] Write dramatic highlight phrases (ALL CAPS, emotional)
- [ ] Limit to ~20% of scenes (max 1 highlight per scene)
- [ ] Test timing alignment with word_timings
- [ ] Verify effects stack correctly (no visual clashes)
- [ ] Check mobile readability (large text visible)

## Animation Physics

### Spring Configs

**Bouncy (for highlight text entrance)**:
```typescript
{ damping: 8, stiffness: 200, mass: 0.8 }
```

**Snappy (for scene entries)**:
```typescript
{ damping: 20, stiffness: 200 }
```

**Smooth (for fades)**:
```typescript
{ damping: 150, stiffness: 100, mass: 1.0 }
```

### Easing Functions

- Entry: `Easing.out(Easing.quad)` - fast in, smooth settle
- Exit: `Easing.in(Easing.quad)` - smooth start, fast out

## Troubleshooting

### Highlight not showing
- Check `highlight_word` matches spoken text (case-insensitive)
- Multi-word phrases need exact sequential match
- Check `word_timings` array is populated

### Timing feels off
- Adjust `impactTime` calculation in HighlightFlash
- Check audio alignment with scene start
- Verify fps matches (default 25)

### Text too big/small
- Adjust `TEXT_FONT_SIZE` in brand.ts
- Check viewport padding (`LAYOUT.PADDING_HORIZONTAL`)

### Shake too aggressive
- Reduce `SHAKE_INTENSITY` in brand.ts
- Shorten `SHAKE_DURATION`

## Related Files

- `VIDEO_BIBLE.md` Section 9 - Full production guidelines
- `docs/REMOTION_SKILLS.md` - Core Remotion animation reference
- `src/brand.ts` - All styling constants
- `src/types.ts` - WordTiming interface
