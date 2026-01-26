---
# VIDEO_BIBLE.md - Bubble Video Production Guidelines
# This YAML frontmatter can be parsed by code for configuration

version: "1.0"

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
    font_size: 170
    background_dim: -0.4
    frequency: 0.20                # ~1 in 5 segments

audio:
  tts_provider: "openai"           # openai | elevenlabs
  tts_voice: "alloy"               # or elevenlabs voice ID
  sample_rate: 48000
  channels: 2
  background_music_volume: -20     # dB under voice
  music_style: "ambient_cinematic" # no lyrics

assets:
  logo_path: "assets/logo.png"     # TODO: add
  intro_video: null                # TODO: create branded intro
  outro_video: "vidu-video-3072694396319459.mov"

scene_types:
  - name: "avatar"
    provider: "heygen"             # TODO: integrate
    use_for: ["intro_host", "key_explanations", "outro_host"]
  - name: "broll"
    provider: "pexels"
    use_for: ["illustrations", "metaphors", "transitions"]
  - name: "kinetic"
    use_for: ["stats", "key_dates", "central_metaphors"]
  - name: "title_card"
    use_for: ["part_transitions", "section_breaks"]

structure:
  - section: "intro"
    required: true
    description: "Branded animation / logo reveal"
  - section: "hook"
    required: true
    description: "Question / Shocking fact / Spoiler - MUST grab in first 10s"
  - section: "content"
    required: true
    parts: true                    # Multiple parts with title cards
    description: "Main content divided into Partie 1, 2, etc."
  - section: "recap"
    required: true
    description: "Summary of key points"
  - section: "cta"
    required: true
    description: "Clear call to action"
  - section: "outro"
    required: true
    description: "Logo + brand animation"
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
│  HOOK (10-30s)     │ Question / Shocking fact / Spoiler        │
│                    │ + Promise of what viewer will learn       │
├────────────────────┼────────────────────────────────────────────┤
│  CONTENT           │ PARTIE 1: [Title]                         │
│  (variable)        │   └─ Speech segments + B-roll/Avatar      │
│                    │   └─ Kinetic typography for key moments   │
│                    │ PARTIE 2: [Title]                         │
│                    │   └─ ...                                  │
├────────────────────┼────────────────────────────────────────────┤
│  RECAP (10-15s)    │ Summary of key points                     │
├────────────────────┼────────────────────────────────────────────┤
│  CTA (5-10s)       │ Clear call to action                      │
├────────────────────┼────────────────────────────────────────────┤
│  OUTRO (3-5s)      │ Logo + brand animation                    │
└─────────────────────────────────────────────────────────────────┘
```

| Section | Duration | Purpose |
|---------|----------|---------|
| **Intro** | 3-5s | Branded animation, logo reveal |
| **Hook** | 10-30s | Question/Fact/Spoiler - GRAB ATTENTION |
| **Content** | Variable | Parts with title cards + segments |
| **Recap** | 10-15s | Summary of key points |
| **CTA** | 5-10s | Clear next step for viewer |
| **Outro** | 3-5s | Logo + brand animation |

**Total target duration**: 3-8 minutes (educational content)

---

## 2. The Hook (CRITICAL)

> The first 30 seconds determine if viewers stay or leave.

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
> "From Terminator to ChatGPT. How did science fiction become our reality?" (HOOK)
> "In the next 5 minutes, you'll understand AI better than 90% of people." (PROMISE)

---

## 3. Scene Types & When to Use

| Type | Visual | When to Use | Provider |
|------|--------|-------------|----------|
| **Avatar** | Talking head | Intro host, key explanations, personal moments | HeyGen |
| **B-Roll** | Stock footage | Illustrations, metaphors, background visuals | Pexels |
| **Kinetic** | Big text overlay | Stats, dates, central metaphors | FFmpeg |
| **Title Card** | White bg + black text | Part transitions ("PARTIE 1: ...") | FFmpeg |

### Scene Type Distribution (typical 5-min video)

- **Avatar**: 20-30% (personal connection)
- **B-Roll**: 50-60% (visual variety)
- **Kinetic**: 10-15% (emphasis moments)
- **Title Cards**: 5-10% (structure)

---

## 4. Visual Grammar

### 4.1 Kinetic Typography Rules

- **Frequency**: Max 1 in 5 segments (~20%)
- **Triggers**: Mind-blowing stats, key dates, central metaphors
- **Style**: 170px Inter-ExtraBold, violet #667eea, centered
- **Background**: Dimmed (-0.4 brightness) for contrast

**Good candidates for highlights**:
- Numbers: "1 000 000 utilisateurs"
- Dates: "2022"
- Key concepts: "Révolution"

**Bad candidates** (too frequent = no impact):
- Generic words
- Every sentence

### 4.2 B-Roll Search Strategy

Match the **FEELING**, not the literal term:

| Topic | ❌ Literal Search | ✅ Feeling Search |
|-------|-------------------|-------------------|
| Stock Market | "stock market graph" | "city lights timelapse at night" |
| AI | "robot" | "neural network visualization glowing" |
| Growth | "plant growing" | "sunrise over mountain peak timelapse" |
| Complexity | "maze" | "intricate clockwork gears moving" |

### 4.3 Transitions

- **Default**: Fade (0.3-0.5s) between ALL scenes
- **NO hard cuts** (jarring, unprofessional)
- **Exception**: Kinetic typography can cut in for impact

### 4.4 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | White | #FFFFFF | Backgrounds, title cards |
| Secondary | Black | #000000 | Text, subtitles |
| Accent | Violet | #667eea | Highlights, kinetic text, CTA |

### 4.5 Typography

| Context | Font | Size |
|---------|------|------|
| Title cards | Inter-ExtraBold | 90px |
| Kinetic text | Inter-ExtraBold | 170px |
| Subtitles | Inter | 40-60px |

---

## 5. Audio Design

### 5.1 Voice

| Provider | Voice | Quality | Use Case |
|----------|-------|---------|----------|
| OpenAI TTS | alloy | High | Default |
| ElevenLabs | (custom) | Premium | Brand voice clone |

**Settings**: 48kHz, stereo, AAC

### 5.2 Background Music

| Parameter | Value |
|-----------|-------|
| Volume | -20dB under voice |
| Style | Ambient/cinematic |
| Lyrics | NEVER (distracting) |
| Source | Royalty-free (Epidemic Sound, Artlist) |

### 5.3 Audio Dynamics

- **Fade in** music at intro (0.5s)
- **Duck** music during avatar/emotional moments
- **Fade out** music before CTA
- **Silent** or subtle during kinetic typography

---

## 6. Script Writing (The Bubble Tone)

### 6.1 Core Principles

1. **Analogy First**: Explain complex topics with everyday concepts
   > "The CPU is the brain, RAM is the workbench"

2. **Hook + Promise**: Grab AND promise value in first 30s

3. **Structure**: Explicit parts ("Partie 1", "Partie 2")

4. **Voice**: Direct ("vous"), reassuring yet authoritative

5. **Sentences**: Short, punchy (1-2 per segment)

6. **CTA**: Always end with clear next step

### 6.2 Pacing

- **Words per minute**: ~150 (conversational, not rushed)
- **Segment length**: 1-2 sentences (4-8 seconds spoken)
- **Part length**: 3-5 segments per part
- **Mix durations**: Alternate fast (1-2s) and slow (4-8s) for rhythm

### 6.3 Language Patterns

**Use**:
- "Vous" (direct address)
- "Spoiler:", "En 5 minutes,", "Prenons un exemple"
- Questions to the viewer
- Everyday analogies

**Avoid**:
- Jargon without explanation
- Long sentences (>20 words)
- Passive voice
- "Dans cette vidéo, nous allons..." (boring)

---

## 7. Script JSON Format

```json
[
  {
    "type": "title",
    "text": "PARTIE 1 : LA RÉVOLUTION"
  },
  {
    "type": "speech",
    "text": "De Terminator à ChatGPT. Comment la science-fiction est-elle devenue notre quotidien ?",
    "search_query": "futuristic cyborg face close up cinematic lighting",
    "highlight_word": "quotidien",
    "scene_type": "broll"
  },
  {
    "type": "speech",
    "text": "Spoiler : ce n'est pas de la magie.",
    "search_query": "magician revealing trick behind curtain",
    "highlight_word": null,
    "scene_type": "avatar",
    "custom_media_path": "/path/to/heygen_clip.mp4"
  }
]
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | "speech" or "title" |
| `text` | string | Yes | Narration or title text |
| `search_query` | string | For speech | Pexels search (feeling, not literal) |
| `highlight_word` | string/null | No | Word for kinetic typography |
| `scene_type` | string | No | "avatar", "broll", "kinetic" (default: broll) |
| `custom_media_path` | string | No | Override with custom video/image |

---

## 8. Quality Checklist

Before export, verify:

### Structure
- [ ] Intro is present (3-5s)
- [ ] Hook grabs attention in first 10s
- [ ] Hook includes a clear promise
- [ ] Content is divided into parts with title cards
- [ ] Recap summarizes key points
- [ ] CTA is clear and specific
- [ ] Outro shows logo

### Visual
- [ ] Highlights are sparse (~20% max)
- [ ] B-roll matches feeling, not literal terms
- [ ] Transitions are smooth (no hard cuts)
- [ ] Colors follow brand palette
- [ ] Resolution is 1920x1080

### Audio
- [ ] Voice is clear and natural
- [ ] Music doesn't overpower voice (-20dB)
- [ ] No audio clipping or distortion
- [ ] Silence/fades are intentional

### Timing
- [ ] Total duration is 3-8 min (educational)
- [ ] Pacing is ~150 words/min
- [ ] No segment is too long (>10s without visual change)

---

## 9. Future Integrations (TODO)

| Feature | Status | Provider |
|---------|--------|----------|
| HeyGen Avatar | Not started | HeyGen API |
| ElevenLabs Voice | Not started | ElevenLabs API |
| Background Music | Not started | Local files / API |
| Transitions | Not started | FFmpeg xfade filter |
| Branded Intro | Not started | Custom video asset |

---

## 10. References

**Internal**:
- `Charte Graphique Bubble...md` - Official Bubble brand guidelines (source of truth for colors, fonts, logo)

**External**:
- [Julia McCoy / First Movers](https://www.heygen.com/customer-stories/first-movers) - AI video scaling
- [HeyGen](https://www.heygen.com/) - AI avatars
- [ElevenLabs](https://elevenlabs.io/) - Voice synthesis
- [Synthesia](https://www.synthesia.io/post/how-to-write-a-training-video-script) - Script structure
- [Video Brand Guidelines](https://www.vyond.com/resources/how-to-create-a-video-style-guide/) - Style guides
