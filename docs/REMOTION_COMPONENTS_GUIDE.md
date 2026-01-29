# Remotion Components Usage Guide

## Quick Reference

This guide shows how to use each Remotion component created in Phase 3.

## Component Overview

```
src/compositions/
├── BubbleVideoComposition  # Main orchestrator (use this!)
├── BrandedIntro           # Branded intro sequence
├── BrandedOutro           # Branded outro sequence
├── TitleCard              # Section title cards
├── BRollScene             # B-roll with voiceover
├── AvatarScene            # HeyGen avatar display
├── AnimatedScene          # Data viz animations (counters, charts)
├── KineticTypography      # Big text overlay
├── SubtitleOverlay        # Word-level subtitles
├── SceneRouter            # Scene type router
└── animations/            # Animation component library
    ├── Counter            # Counting numbers
    ├── StackingObjects    # Piling objects
    ├── ProgressBar        # Filling bars
    ├── LineChart          # Line graphs
    ├── BarChart           # Bar graphs
    ├── IconGrid           # "1 in 3" statistics
    └── ScaleComparison    # Size comparisons
```

## Primary Entry Point

### BubbleVideoComposition

**Use Case**: Main video rendering (this is what you import)

```typescript
import { BubbleVideoComposition } from './compositions';
import type { BubbleVideoInputProps } from './types';

const props: BubbleVideoInputProps = {
  scenes: [
    // Scene objects with script_line, audio, video
  ],
  logo_path: 'logo.png',
  background_music_path: 'music.mp3',
  music_volume: -20, // dB
  config: projectConfig,
};

<BubbleVideoComposition {...props} />
```

**What it does**:
- Renders BrandedIntro (3s)
- Sequences all scenes with fade transitions
- Renders BrandedOutro (3s)
- Overlays background music with ducking

## Individual Components

### BrandedIntro

**Use Case**: Standalone branded intro

```typescript
import { BrandedIntro } from './compositions';

<BrandedIntro
  logoPath="logo.png"  // or null for text fallback
  duration={75}        // frames (3s at 25fps)
/>
```

**Visual Output**:
- White background
- Centered logo (350px) or "BUBBLE." text
- Fade-in animation (0.5s)
- Subtle scale effect

### BrandedOutro

**Use Case**: Standalone branded outro

```typescript
import { BrandedOutro } from './compositions';

<BrandedOutro
  logoPath="logo.png"
  ctaText="Subscribe for more!"  // optional
  duration={75}
/>
```

**Visual Output**:
- Same as intro
- Fade-out animation
- Optional CTA text below logo

### TitleCard

**Use Case**: Section separators ("PARTIE 1: LA RÉVOLUTION")

```typescript
import { TitleCard } from './compositions';

<TitleCard
  text="PARTIE 1: LA RÉVOLUTION"
  duration={75}  // 3s at 25fps
/>
```

**Visual Output**:
- White background
- 90pt Inter-ExtraBold, black, centered
- Fade in/out (0.5s each)

### BRollScene

**Use Case**: B-roll footage with voiceover narration

```typescript
import { BRollScene } from './compositions';
import type { Scene } from './types';

const scene: Scene = {
  script_line: {
    text: "De Terminator à ChatGPT...",
    type: "speech",
    search_query: "futuristic cyborg",
    scene_type: "broll",
  },
  audio: {
    file_path: "audio_0.mp3",
    duration: 5.2,
    word_timings: [
      { word: "De", start: 0.0, end: 0.2 },
      // ...
    ],
  },
  video: {
    file_path: "video_0.mp4",
    width: 1920,
    height: 1080,
  },
  output_path: "scene_0.mp4",
};

<BRollScene scene={scene} />
```

**Visual Output**:
- Full-screen video (1920x1080)
- Voiceover audio
- Subtitles at bottom (if word_timings provided)

### AvatarScene

**Use Case**: HeyGen avatar talking head

```typescript
import { AvatarScene } from './compositions';

const scene: Scene = {
  script_line: {
    text: "Spoiler : ce n'est pas de la magie.",
    type: "speech",
    scene_type: "avatar",
    custom_media_path: "heygen_clip.mp4",
  },
  audio: {
    file_path: "heygen_clip.mp4", // avatar includes audio
    duration: 4.8,
  },
  video: {
    file_path: "heygen_clip.mp4",
    width: 1920,
    height: 1080,
  },
  output_path: "scene_1.mp4",
};

<AvatarScene scene={scene} />
```

**Visual Output**:
- Full-screen avatar video
- Built-in avatar audio (no separate voiceover)

### KineticTypography

**Use Case**: Highlight key words/phrases with big text

```typescript
import { KineticTypography } from './compositions';

const scene: Scene = {
  script_line: {
    text: "1 million d'utilisateurs en 2022",
    type: "speech",
    highlight_word: "1 MILLION",
    scene_type: "kinetic",
  },
  audio: {
    file_path: "audio_2.mp3",
    duration: 3.5,
  },
  video: {
    file_path: "video_2.mp4",
    width: 1920,
    height: 1080,
  },
  output_path: "scene_2.mp4",
};

<KineticTypography
  scene={scene}
  highlightWord="1 MILLION"
/>
```

**Visual Output**:
- Dimmed background video (brightness 60%)
- 170pt violet text, centered
- Spring animation (scale + fade)
- Optional subtitles

### SubtitleOverlay

**Use Case**: Add subtitles to any scene

```typescript
import { SubtitleOverlay } from './compositions';

<SubtitleOverlay
  wordTimings={[
    { word: "Bonjour", start: 0.0, end: 0.5 },
    { word: "monde", start: 0.5, end: 1.0 },
  ]}
  startFrame={0}  // offset in frames
/>
```

**Visual Output**:
- 60pt white text with black outline
- Bottom position (80px from bottom)
- Auto-groups overlapping words
- Smooth fade transitions

### AnimatedScene

**Use Case**: Ray Dalio-style data visualizations synced to voiceover

```typescript
import { AnimatedScene } from './compositions';

const scene: Scene = {
  script_line: {
    text: "100 millions d'utilisateurs en deux mois.",
    type: "speech",
    scene_type: "animated",
    animation: {
      type: "counter",
      params: {
        start: 0,
        end: 100000000,
        format: "millions",
        suffix: " utilisateurs"
      }
    }
  },
  audio: {
    file_path: "audio_3.mp3",
    duration: 3.5,
    word_timings: [/* ... */],
  },
  video: {
    file_path: "",  // No video file needed
    width: 1920,
    height: 1080,
  },
  output_path: "scene_3.mp4",
};

<AnimatedScene
  scene={scene}
  animation={scene.script_line.animation}
/>
```

**Available Animation Types**:
| Type | Description |
|------|-------------|
| `counter` | Numbers counting up/down |
| `stacking` | Objects piling up |
| `progress_bar` | Horizontal/vertical filling bar |
| `line_chart` | Animated line graph |
| `bar_chart` | Animated bar graph |
| `icon_grid` | "1 in 3" icon statistics |
| `scale_comparison` | Size comparison visualization |

**Visual Output**:
- Dark gradient background
- Animated data visualization
- Voiceover audio
- Subtitles at bottom

📖 **Full reference**: See `docs/ANIMATION_COMPONENTS.md` for all parameters and examples.

### SceneRouter

**Use Case**: Automatically route scene to correct component

```typescript
import { SceneRouter } from './compositions';

// Automatically picks the right component based on scene_type
<SceneRouter scene={scene} />

// Routes to:
// - TitleCard (if scene_type === "title")
// - AvatarScene (if scene_type === "avatar")
// - AnimatedScene (if scene_type === "animated" && animation exists)
// - KineticTypography (if scene_type === "kinetic" && highlight_word exists)
// - BRollScene (default)
```

## Common Patterns

### Creating a Scene Sequence

```typescript
import { Sequence } from 'remotion';
import { SceneRouter } from './compositions';

const scenes: Scene[] = [/* ... */];

{scenes.map((scene, i) => {
  const from = i === 0 ? 0 : calculatePreviousFrameSum(scenes, i);
  const duration = Math.ceil(scene.audio.duration * fps);

  return (
    <Sequence key={i} from={from} durationInFrames={duration}>
      <SceneRouter scene={scene} />
    </Sequence>
  );
})}
```

### Adding Background Music

```typescript
import { Audio, interpolate } from 'remotion';

// Simple version (no fades)
<Audio
  src={staticFile('background.mp3')}
  volume={0.1}  // -20dB
/>

// With fade in
<Audio
  src={staticFile('background.mp3')}
  volume={(frame) => interpolate(
    frame,
    [0, 50],        // 2s fade at 25fps
    [0, 0.1],       // 0 to -20dB
    { extrapolateRight: 'clamp' }
  )}
/>
```

### Dynamic Duration

```typescript
import { useVideoConfig } from 'remotion';

const { fps } = useVideoConfig();

// Convert seconds to frames
const durationInFrames = Math.ceil(durationInSeconds * fps);

// Convert frames to seconds
const durationInSeconds = durationInFrames / fps;
```

## Styling Reference

### VIDEO_BIBLE.md Compliance

All components follow these specs:

```typescript
const VIDEO_BIBLE_STYLES = {
  // Colors
  primary: '#FFFFFF',      // white backgrounds
  secondary: '#000000',    // black text
  accent: '#667eea',       // violet highlights

  // Fonts
  fontFamily: 'Inter, Arial, sans-serif',

  // Font Sizes
  title: 90,          // TitleCard
  kinetic: 170,       // KineticTypography
  subtitle: 60,       // SubtitleOverlay

  // Durations
  introDuration: 75,     // 3s at 25fps
  outroDuration: 75,     // 3s at 25fps
  transitionDuration: 10, // 0.4s at 25fps
  fadeDuration: 12.5,    // 0.5s at 25fps

  // Resolution
  width: 1920,
  height: 1080,
  fps: 25,
};
```

### Common Animations

```typescript
// Fade in
const opacity = interpolate(frame, [0, 12.5], [0, 1], {
  extrapolateRight: 'clamp',
});

// Fade out
const opacity = interpolate(frame, [duration - 12.5, duration], [1, 0], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// Spring entrance
const scale = spring({
  frame,
  fps,
  from: 0.8,
  to: 1.0,
  config: {
    damping: 100,
    stiffness: 200,
    mass: 0.5,
  },
});
```

## File Organization

Place assets in `public/` directory for `staticFile()` to work:

```
public/
├── logo.png
├── music/
│   └── background.mp3
├── audio/
│   ├── audio_0.mp3
│   └── audio_1.mp3
└── video/
    ├── video_0.mp4
    └── video_1.mp4
```

Then reference like:
```typescript
staticFile('logo.png')
staticFile('music/background.mp3')
staticFile('video/video_0.mp4')
```

## Debugging Tips

### Preview in Remotion Studio

```bash
npm run dev
# Open http://localhost:3000
# Scrub timeline to test animations
```

### Type Errors

```bash
npx tsc --noEmit
# Shows all type errors
```

### Performance Issues

- Use `<OffthreadVideo>` instead of `<Video>` (already done)
- Reduce `Config.setConcurrency()` if running out of memory
- Use lower quality during development

## Integration with Python Pipeline

The Python adapter should:

1. **Generate scenes** → `Scene[]` objects
2. **Copy assets** to `public/` directory
3. **Create input props** → `BubbleVideoInputProps`
4. **Call Remotion renderer**:
   ```bash
   npx remotion render BubbleVideo output.mp4 --props='{"scenes": [...], ...}'
   ```

See `PHASE4_INTEGRATION_PLAN.md` (future) for full details.

## Further Reading

- [Remotion Documentation](https://www.remotion.dev/docs)
- [TransitionSeries Guide](https://www.remotion.dev/docs/transitions)
- [VIDEO_BIBLE.md](../VIDEO_BIBLE.md) - Visual specifications
- [ANIMATION_COMPONENTS.md](./ANIMATION_COMPONENTS.md) - Animation library reference
- [DRAMATIC_EFFECTS_SKILL.md](./DRAMATIC_EFFECTS_SKILL.md) - TikTok-style highlight effects
- [REMOTION_SKILLS.md](./REMOTION_SKILLS.md) - Core Remotion animation patterns
