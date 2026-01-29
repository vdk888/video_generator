# Remotion Skills Reference

Best practices and patterns for professional video production with Remotion.
Source: https://github.com/remotion-dev/skills

---

## Animations

**Core Requirements:**
- All animations MUST be driven by `useCurrentFrame()` hook
- Express timing in seconds, multiply by `fps` from `useVideoConfig()`
- CSS transitions/animations are FORBIDDEN (won't render)
- Tailwind animation classes are FORBIDDEN

**Example - Fade In:**
```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
  extrapolateRight: 'clamp',
});
```

---

## Timing & Interpolation

### Linear Interpolation
```tsx
interpolate(frame, [inputStart, inputEnd], [outputStart, outputEnd], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

### Spring Animations
Natural motion with physics-based easing. Default: `mass: 1, damping: 10, stiffness: 100`

**Presets:**
| Effect | Config |
|--------|--------|
| Smooth reveal | `damping: 200` |
| Snappy UI | `damping: 20, stiffness: 200` |
| Bouncy/playful | `damping: 8` |
| Heavy/weighty | `damping: 15, stiffness: 80, mass: 2` |

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const scale = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
```

### Easing Functions
Available via `Easing` import:
- Curves: `quad`, `sin`, `exp`, `circle`, `cubic`
- Directions: `in`, `out`, `inOut`
- Custom: `Easing.bezier(x1, y1, x2, y2)`

```tsx
interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.out(Easing.cubic),
});
```

---

## Sequencing

### Sequence Component
Delays element appearance. Inside a Sequence, `useCurrentFrame()` returns LOCAL frame (starts at 0).

```tsx
<Sequence from={30} durationInFrames={60} premountFor={10}>
  <MyComponent />
</Sequence>
```

**Always premount** to preload components before playback.

### Series Component
Arranges elements sequentially without overlap:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneOne />
  </Series.Sequence>
  <Series.Sequence durationInFrames={90}>
    <SceneTwo />
  </Series.Sequence>
</Series>
```

**Overlapping:** Use negative offset for crossfades:
```tsx
<Series.Sequence durationInFrames={60} offset={-15}>
```

---

## Transitions

Install: `npx remotion add @remotion/transitions`

### Available Transitions
- **Fade**: Opacity-based
- **Slide**: from-left, from-right, from-top, from-bottom
- **Wipe**: Progressive reveal
- **Flip**: Rotation-based
- **Clock Wipe**: Circular reveal

### TransitionSeries
```tsx
import { TransitionSeries, linearTiming, fade } from '@remotion/transitions';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 15 })}
    presentation={fade()}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Important:** Transitions overlap scenes, so total duration is SHORTER than sum of sequences.

### Timing Options
- `linearTiming({ durationInFrames })` - Constant speed
- `springTiming({ config })` - Organic motion

---

## Text Animations

### Typewriter Effect
Always use string slicing, never per-character opacity:

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const text = "Hello World";
const charsToShow = Math.floor(frame / 2); // 2 frames per character
const visibleText = text.slice(0, charsToShow);
```

### Word Highlighting
Animate word emphasis like a highlighter pen effect.

---

## Audio

Install: `npx remotion add @remotion/media`

```tsx
import { Audio } from '@remotion/media';
import { staticFile } from 'remotion';

<Audio src={staticFile('audio.mp3')} />
```

### Props
| Prop | Description |
|------|-------------|
| `volume` | 0-1 static or callback `(f) => value` |
| `muted` | Boolean, can be dynamic |
| `playbackRate` | Speed multiplier (no reverse) |
| `loop` | Enable looping |
| `toneFrequency` | 0.01-2, pitch shift (render only) |
| `trimBefore` | Frames to skip at start |
| `trimAfter` | Frames to skip at end |

**Volume callback:** `f` starts at 0 when audio begins, not composition frame.

### Delay Audio
```tsx
<Sequence from={30}>
  <Audio src={staticFile('sound.mp3')} />
</Sequence>
```

---

## Video

```tsx
import { Video } from '@remotion/media';

<Video
  src={staticFile('video.mp4')}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

### Props
| Prop | Description |
|------|-------------|
| `volume` | 0-1 or callback |
| `muted` | Silence audio |
| `playbackRate` | Speed (no reverse) |
| `loop` | Infinite repeat |
| `trimBefore/After` | In frames |
| `toneFrequency` | Pitch shift (render only) |

---

## Best Practices Summary

1. **Always use `useCurrentFrame()`** - Never CSS animations
2. **Premount sequences** - Preload before playback
3. **Clamp interpolations** - Prevent values overshooting
4. **Use springs for UI** - More natural than linear
5. **Calculate transition overlap** - Total duration = sum - transitions
6. **Express time in seconds × fps** - More readable than raw frames
7. **Volume callbacks get local frame** - Starts at 0 when audio begins
