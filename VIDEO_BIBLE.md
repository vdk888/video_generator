---
# VIDEO_BIBLE.md - Bubble Video Production Guidelines
# This YAML frontmatter can be parsed by code for configuration

version: "2.0"

timing:
  intro_duration: [3, 5]           # seconds [min, max]
  hook_duration: [10, 30]          # CRITICAL for retention
  title_card_duration: [2, 3]
  speech_segment_duration: [4, 8]  # 1-2 sentences
  highlight_duration: [2, 3]
  recap_duration: [10, 15]
  outro_duration: [3, 5]
  total_target: [180, 480]         # 3-8 minutes
  words_per_minute: 150
  transition_duration: 0.4         # fade between scenes

visual:
  resolution: [1920, 1080]
  framerate: 25
  pixel_format: "yuv420p"
  colors:
    primary: "#FFFFFF"             # white
    secondary: "#000000"           # black
    accent: "#667eea"              # violet (highlights, kinetic text)
  fonts:
    title: "Inter-ExtraBold"
    subtitle: "Inter"
    kinetic: "Inter-ExtraBold"
  kinetic_typography:
    font_size: 220                 # Dramatic highlight text
    background_dim: 0.85
    frequency: 0.20                # ~1 in 5 segments

audio:
  tts_provider: "elevenlabs"       # elevenlabs (primary) | openai | edge
  sample_rate: 48000
  channels: 2
  background_music_volume: -20     # dB under voice
  music_style: "ambient_cinematic" # no lyrics

avatars:
  provider: "heygen"
  voices:
    jade: "JvD1a0L9rABccms2q9zH"   # ElevenLabs voice ID
    joris: "N4YBsGFiKuErjI8uZn5R"  # ElevenLabs voice ID
  avatar_ids:
    jade: "990f87a5dcfe440ca7d096749c3228c8"
    joris: "71f036185b76438a9dd794c59a0601c6"
    joris_alt: "73fa46c193344a56ac3ddc8b8eb2d7ef"

assets:
  logo_path: "assets/logo.png"
  intro_video: null                # Uses BrandedIntro component
  outro_video: null                # Uses BrandedOutro component

scene_types:
  - name: "avatar"
    provider: "heygen"
    voice_provider: "elevenlabs"
    use_for: ["hook", "key_explanations", "cta", "personal_moments"]
  - name: "broll"
    provider: "pexels"
    use_for: ["illustrations", "metaphors", "transitions"]
  - name: "title"
    use_for: ["part_transitions", "section_breaks"]
  - name: "animated"
    provider: "remotion"
    use_for: ["data_visualization", "statistics", "counters", "charts"]
  - name: "kinetic"
    provider: "remotion"
    use_for: ["key_phrases", "emphasis", "dramatic_moments"]

structure:
  - section: "intro"
    required: true
    description: "Branded animation / logo reveal (BrandedIntro component)"
  - section: "hook"
    required: true
    scene_type: "avatar"
    description: "Question / Shocking fact / Spoiler - MUST grab in first 10s"
  - section: "content"
    required: true
    parts: true
    description: "Main content divided into Partie 1, 2, etc."
  - section: "cta"
    required: true
    scene_type: "avatar"
    description: "Clear call to action with avatar"
  - section: "outro"
    required: true
    description: "Logo + brand animation (BrandedOutro component)"
---

# VIDEO_BIBLE.md - Bubble Video Production Guidelines

> **Purpose**: This document defines the structure, timing, branding, and quality standards for all Bubble Video Engine output. It serves as the single source of truth for both human editors (Director Mode) and AI agents.

---

## 1. Video Structure Blueprint

Every Bubble video follows this structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  INTRO (3-5s)      │ Branded animation / logo reveal           │
├────────────────────┼────────────────────────────────────────────┤
│  HOOK (10-30s)     │ Avatar: Question / Shocking fact / Spoiler│
│                    │ + Promise of what viewer will learn       │
├────────────────────┼────────────────────────────────────────────┤
│  CONTENT           │ PARTIE 1: [Title]                         │
│  (variable)        │   └─ Speech segments + B-roll/Avatar      │
│                    │   └─ Highlight flash for key moments      │
│                    │ PARTIE 2: [Title]                         │
│                    │   └─ ...                                  │
├────────────────────┼────────────────────────────────────────────┤
│  CTA (5-10s)       │ Avatar: Clear call to action              │
├────────────────────┼────────────────────────────────────────────┤
│  OUTRO (3-5s)      │ Logo + brand animation                    │
└─────────────────────────────────────────────────────────────────┘
```

| Section | Duration | Scene Type | Purpose |
|---------|----------|------------|---------|
| **Intro** | 3-5s | BrandedIntro | Animated logo reveal (black "BUBBLE." text) |
| **Hook** | 10-30s | Avatar | Question/Fact/Spoiler - GRAB ATTENTION |
| **Content** | Variable | Mixed | Parts with title cards + B-roll + Avatar |
| **CTA** | 5-10s | Avatar | Clear next step for viewer |
| **Outro** | 3-5s | BrandedOutro | Logo + brand animation |

**Total target duration**: 3-8 minutes (educational content)

---

## 2. The Hook (CRITICAL)

> The first 30 seconds determine if viewers stay or leave.

**IMPORTANT**: The hook MUST be an avatar scene for personal connection.

### Hook Types

| Type | Example | When to Use |
|------|---------|-------------|
| **Question** | "What if I told you AI isn't magic?" | Challenging assumptions |
| **Shocking Fact** | "90% of people use AI wrong" | Data-driven topics |
| **Spoiler** | "Spoiler: it's simpler than you think" | Demystifying complex topics |

### The Hook + Promise Formula

```
HOOK (grab attention) + PROMISE (what they'll learn)
```

**Example**:
> "J'ai une question pour vous. En combien de temps une machine a appris à parler ? Pas en mille ans. Pas en cent. En cinq ans. Et dans les trois prochaines minutes, vous allez comprendre comment."

---

## 3. Scene Types & Providers

### 3.1 Provider Stack

| Component | Provider | Status |
|-----------|----------|--------|
| **Avatar Video** | HeyGen | ✅ Integrated |
| **Avatar Voice** | ElevenLabs | ✅ Integrated |
| **B-Roll Video** | Pexels | ✅ Integrated |
| **B-Roll Voice** | ElevenLabs | ✅ Integrated |
| **Background Music** | Local files | ✅ Integrated |
| **Rendering** | Remotion | ✅ Integrated |

### 3.2 Scene Types

| Type | Visual | When to Use | Audio Source |
|------|--------|-------------|--------------|
| **Avatar** | HeyGen talking head | Hook, key explanations, CTA, personal moments | ElevenLabs (lip-synced) |
| **B-Roll** | Pexels stock footage | Illustrations, metaphors, background visuals | ElevenLabs voiceover |
| **Title** | White bg + black text | Part transitions ("PARTIE 1: ...") | None (2s duration) |
| **Animated** | Programmatic animation | Data viz, counters, charts, statistics | ElevenLabs voiceover |
| **Kinetic** | Text highlight takeover | Key phrases emphasis | ElevenLabs voiceover |

### 3.2.1 Animated Scenes (Ray Dalio Style)

Animated scenes render programmatic visualizations synced to voiceover. Perfect for:
- **Counters**: Numbers ticking up ("100 million users")
- **Stacking**: Objects piling up (debt accumulating)
- **Charts**: Line/bar charts revealing data
- **Icon Grids**: "1 in 3 people" statistics
- **Progress Bars**: Percentages filling
- **Scale Comparisons**: "10x growth" visualizations

**Usage in script.json**:
```json
{
  "type": "speech",
  "text": "100 millions d'utilisateurs en deux mois.",
  "scene_type": "animated",
  "animation": {
    "type": "counter",
    "params": {
      "start": 0,
      "end": 100000000,
      "format": "millions",
      "suffix": " utilisateurs"
    }
  }
}
```

**Available animation types**: `counter`, `stacking`, `progress_bar`, `line_chart`, `bar_chart`, `icon_grid`, `scale_comparison`

📖 **Full reference**: See `docs/ANIMATION_COMPONENTS.md` for all parameters, examples, and how to create new animations.

### 3.3 Avatar Distribution

Target: **20-30% avatar time** for personal connection

| Video Section | Avatar Usage |
|---------------|--------------|
| Hook (opening) | ✅ Always avatar |
| Part key moments | ✅ 1 avatar scene per part (~10s each) |
| CTA (closing) | ✅ Always avatar |

### 3.4 Available Avatars & Voices

| Person | HeyGen Avatar ID | ElevenLabs Voice ID |
|--------|------------------|---------------------|
| **Jade** | `990f87a5dcfe440ca7d096749c3228c8` | `JvD1a0L9rABccms2q9zH` |
| **Joris** | `71f036185b76438a9dd794c59a0601c6` | `N4YBsGFiKuErjI8uZn5R` |
| **Joris (alt)** | `73fa46c193344a56ac3ddc8b8eb2d7ef` | - |

---

## 4. Visual Grammar

### 4.1 Highlight Flash System (TikTok-Style)

The **HighlightFlash** component creates dramatic mid-scene takeovers.

**Trigger**: `highlight_word` field in script JSON

**Effect Stack** (all simultaneous):
1. **White Flash**: Screen flashes white on impact
2. **Background Dim**: 85% dark overlay
3. **Text Slam**: Word drops from above with spring bounce
4. **Screen Shake**: 25px aggressive shake
5. **Color Pop**: Violet flash after white
6. **Zoom Punch**: B-roll zooms 8% on impact

**Styling**:
- Font: 220px Inter, weight 900
- Color: White with violet glow
- Text shadow: Multi-layer glow effect

### 4.2 Writing Dramatic Highlights

**DO** - Use dramatic phrases (ALL CAPS):
| Speech | Highlight |
|--------|-----------|
| "En cinq ans." | `CINQ ANS` |
| "100 millions d'utilisateurs" | `100 MILLIONS` |
| "C'est le Deep Learning" | `DEEP LEARNING` |
| "Elle ne sait pas parler" | `ELLE NE PARLE PAS` |

**DON'T** - Use weak/generic words:
| Speech | Bad Highlight |
|--------|---------------|
| "On est en 2012" | `2012` |
| "Il y a un problème" | `problème` |

### 4.3 B-Roll Search Strategy

Match the **FEELING**, not the literal term:

| Topic | ❌ Literal | ✅ Feeling |
|-------|-----------|-----------|
| AI | "robot" | "neural network visualization glowing" |
| Growth | "plant growing" | "sunrise over mountain peak timelapse" |
| Speed | "fast car" | "rocket launch flame exhaust dramatic" |

### 4.4 Transitions

- **Default**: Spring-based fade (0.4s) via Remotion TransitionSeries
- **Title cards**: Longer spring (damping: 200)
- **B-roll**: Snappy spring (damping: 20, stiffness: 200)

### 4.5 Scene Entry Effects

Every B-roll scene has entry punch:
- **Entrance Scale**: 1.08 → 1.0 (spring settle)
- **Slide Up**: 20px with easing
- **Brightness Flash**: 1.3 → 1.0
- **Ken Burns**: Slow zoom/pan throughout scene

### 4.6 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | White | #FFFFFF | Backgrounds, title cards |
| Secondary | Black | #000000 | Text, "BUBBLE." logo |
| Accent | Violet | #667eea | Highlights, glows, subtitles |

### 4.7 Typography

| Context | Font | Size | Weight |
|---------|------|------|--------|
| Title cards | Inter | 90px | 800 (ExtraBold) |
| Highlight text | Inter | 220px | 900 |
| Subtitles | Inter | 60px | 600 (SemiBold) |
| Intro "BUBBLE." | Inter | 120px | 800 |

---

## 5. Audio Design

### 5.1 Voice Configuration

| Provider | Use Case | Quality |
|----------|----------|---------|
| **ElevenLabs** | All voices (avatar + B-roll) | Premium, natural |
| OpenAI TTS | Fallback only | Good |
| Edge TTS | Testing only | Basic |

**Current Default**: ElevenLabs with Jade voice

### 5.2 Background Music

| Parameter | Value |
|-----------|-------|
| Volume | -20dB under voice |
| Style | Ambient/cinematic |
| Lyrics | NEVER |
| Source | Local `assets/music/` folder |
| Ducking | Auto-duck during speech |

### 5.3 Subtitle Animation (Karaoke Style)

- Word-by-word spring animation
- Current word scales up 5%
- Spring physics: damping 15, stiffness 180
- Background: Semi-transparent black pill

---

## 6. Script JSON Format

### 6.1 Complete Example

```json
[
  {
    "type": "speech",
    "text": "J'ai une question pour vous. En combien de temps une machine a appris à parler ?",
    "search_query": "person looking at camera cinematic",
    "highlight_word": "CINQ ANS",
    "scene_type": "avatar",
    "avatar_id": "990f87a5dcfe440ca7d096749c3228c8"
  },
  {
    "type": "title",
    "text": "PARTIE 1 : L'ÉTINCELLE"
  },
  {
    "type": "speech",
    "text": "On est en 2012. Personne ne parle d'intelligence artificielle.",
    "search_query": "vintage computer lab university campus",
    "highlight_word": "PERSONNE N'Y CROYAIT",
    "scene_type": "broll"
  },
  {
    "type": "speech",
    "text": "Ils apprennent à un ordinateur à voir.",
    "search_query": "robot eye scanning futuristic",
    "highlight_word": "LA MACHINE VOIT",
    "scene_type": "avatar",
    "avatar_id": "990f87a5dcfe440ca7d096749c3228c8"
  }
]
```

### 6.2 Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"speech"` or `"title"` |
| `text` | string | Yes | Narration or title text |
| `scene_type` | string | Yes | `"avatar"`, `"broll"`, `"title"`, `"animated"`, or `"kinetic"` |
| `search_query` | string | For broll | Pexels search (feeling, not literal) |
| `highlight_word` | string | For kinetic | Dramatic phrase for highlight flash (ALL CAPS) |
| `avatar_id` | string | For avatar | HeyGen avatar ID (overrides default) |
| `voice_id` | string | No | ElevenLabs voice ID (overrides default) |
| `custom_media_path` | string | No | Override with local video/image |
| `animation` | object | For animated | Animation config `{ type, params }` (see docs/ANIMATION_COMPONENTS.md) |

---

## 7. Remotion Components

### 7.1 Composition Structure

```
BubbleVideoComposition
├── BrandedIntro (3-5s)
├── TransitionSeries
│   ├── SceneComposition (per scene)
│   │   ├── AvatarScene / BRollScene / TitleCard
│   │   ├── SubtitleOverlay
│   │   └── HighlightFlash
│   └── fade transitions
├── BrandedOutro (3-5s)
└── BackgroundMusic (full duration)
```

### 7.2 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `BubbleVideoComposition` | `BubbleVideoComposition.tsx` | Main orchestrator |
| `BRollScene` | `BRollScene.tsx` | B-roll with Ken Burns, entry effects |
| `AvatarScene` | `AvatarScene.tsx` | HeyGen avatar playback |
| `AnimatedScene` | `AnimatedScene.tsx` | Programmatic animations (counters, charts) |
| `KineticTypography` | `KineticTypography.tsx` | Full-screen text emphasis |
| `TitleCard` | `TitleCard.tsx` | Part transitions |
| `SubtitleOverlay` | `SubtitleOverlay.tsx` | Karaoke-style subtitles |
| `HighlightFlash` | `HighlightFlash.tsx` | Dramatic text takeover |
| `BrandedIntro` | `BrandedIntro.tsx` | Logo reveal (black text) |
| `BrandedOutro` | `BrandedOutro.tsx` | Closing animation |

### 7.3 Animation Guidelines

**Spring Presets** (from `brand.ts`):
- **Snappy**: `{ damping: 20, stiffness: 200 }` - UI elements, scene entries
- **Bouncy**: `{ damping: 8, stiffness: 200, mass: 0.8 }` - Highlight text
- **Smooth**: `{ damping: 150, stiffness: 100, mass: 1.0 }` - Fades

**FORBIDDEN**: CSS transitions (won't render in Remotion)

---

## 8. Workflow

### 8.1 Development Workflow

```bash
# 1. Create/edit script
vim projects/myproject/script.json

# 2. Prepare assets (TTS, B-roll, avatars)
npm run prepare -- --project=myproject

# 3. Preview in Remotion Studio
npm run dev

# 4. Render final video
npm run render -- --project=myproject
```

### 8.2 Asset Caching

- Audio files: `projects/{name}/assets/audio/`
- Video files: `projects/{name}/assets/video/`
- Avatar videos: `avatar_{index}.mp4`
- B-roll videos: `video_{index}.mp4`

**To force regeneration**: Delete the cached file before running prepare.

---

## 9. Quality Checklist

### Structure
- [ ] Hook is avatar scene (personal connection)
- [ ] Hook grabs attention in first 10s
- [ ] Content divided into parts with title cards
- [ ] CTA is avatar scene
- [ ] Avatar time is 20-30% of total

### Visual
- [ ] Highlights are dramatic phrases (ALL CAPS)
- [ ] Highlights are ~20% of scenes max
- [ ] B-roll searches match feeling, not literal
- [ ] Transitions are smooth (spring-based)
- [ ] Resolution is 1920x1080

### Audio
- [ ] Voice matches avatar (Jade voice + Jade avatar)
- [ ] Music doesn't overpower voice (-20dB)
- [ ] No audio clipping or distortion

### Timing
- [ ] Total duration is 3-8 min
- [ ] Avatar scenes are ~10s each
- [ ] No segment too long (>10s without visual change)

---

## 10. Brand Constants Reference

All styling constants are in `src/brand.ts`:

```typescript
// Colors
COLORS.PRIMARY_TEXT      // #000000 (black)
COLORS.BACKGROUND        // #FFFFFF (white)
COLORS.ACCENT_VIOLET     // #667eea (violet)

// Highlight Effects
HIGHLIGHT_EFFECTS.FLASH_OPACITY_PEAK    // 1.0
HIGHLIGHT_EFFECTS.BACKGROUND_DIM        // 0.85
HIGHLIGHT_EFFECTS.SHAKE_INTENSITY       // 25px
HIGHLIGHT_EFFECTS.TEXT_FONT_SIZE        // 220px
HIGHLIGHT_EFFECTS.ZOOM_PUNCH_AMOUNT     // 1.08

// B-Roll
BROLL.KEN_BURNS_SCALE_START  // 1.12
BROLL.KEN_BURNS_SCALE_END    // 1.0
BROLL.CONTRAST               // 1.08
BROLL.SATURATION             // 1.15
```

---

## 11. References

**Internal Documentation**:
- `CLAUDE.md` - Project overview and commands
- `docs/ANIMATION_COMPONENTS.md` - **Animated scene components (counters, charts, etc.)**
- `docs/REMOTION_SKILLS.md` - Remotion animation reference
- `docs/DRAMATIC_EFFECTS_SKILL.md` - Highlight system details
- `docs/ARCHITECTURE_FLOW.md` - Technical pipeline flow
- `Charte Graphique Bubble...md` - Official brand guidelines

**External**:
- [HeyGen API](https://docs.heygen.com/) - Avatar generation
- [ElevenLabs API](https://docs.elevenlabs.io/) - Voice synthesis
- [Remotion Docs](https://www.remotion.dev/docs) - Video rendering
- [Pexels API](https://www.pexels.com/api/) - Stock footage
