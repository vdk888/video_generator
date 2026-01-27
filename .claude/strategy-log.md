# Strategy Log
**Vision Version**: 2026-01-26 | **Last Planning**: 2026-01-27 | **Current Focus**: Full TypeScript/Remotion Migration

## Active Priorities
1. **TypeScript/Remotion Migration** - Complete rewrite from Python+FFmpeg to TypeScript+Remotion. Eliminates FFmpeg shell-out complexity, enables visual preview via Remotion Studio, single-language codebase. Target: 6 phases over ~4-6 weeks.
2. **Preserve all API integrations** - ElevenLabs, OpenAI TTS, HeyGen, Pexels, OpenRouter must all have TypeScript adapters
3. **Maintain script.json contract** - The JSON format is the API boundary between LLM/Director and rendering. Must not change.

## Decided Against (Parked)
- **Music Beat Sync**: Parked because complexity outweighs value for MVP. Revisit after migration stable.
- **A/B Testing Framework**: Parked. Revisit when measuring video performance post-migration.
- **Typography Variety**: Parked for migration. Current kinetic works. Revisit after Remotion components stable.
- **HeyGen Streaming API**: Parked - batch video generation sufficient.
- **Edge TTS Adapter**: Low priority for migration. OpenAI and ElevenLabs are primary. Can add later.
- **Incremental migration (Python+TS hybrid)**: Decided against. Clean rewrite is simpler since Remotion replaces the entire FFmpeg rendering pipeline.

## Key Decisions
- [2026-01-27]: DECIDED full rewrite over incremental migration. Rationale: FFmpeg subprocess calls cannot coexist with Remotion React rendering. The rendering layer is the core, and replacing it means replacing the orchestration too.
- [2026-01-27]: Remotion replaces ALL FFmpeg rendering: scene composition, transitions (xfade->TransitionSeries), kinetic typography (drawtext->React components), title cards, intro/outro, music mixing (volume prop)
- [2026-01-27]: Keep Node.js orchestrator script (main.ts) separate from Remotion compositions. Orchestrator handles API calls, asset preparation; Remotion handles rendering.
- [2026-01-27]: Use @remotion/renderer Node.js API for programmatic rendering (not CLI). Enables passing computed props with audio durations, asset paths, etc.
- [2026-01-27]: Audio ducking via Remotion volume callback function (frame-by-frame volume control) replaces FFmpeg amix filter
- [2026-01-27]: Use OffthreadVideo for B-roll (better performance), Html5Audio for TTS audio tracks
- [2026-01-27]: TransitionSeries with fade() replaces FFmpeg xfade filter chains

## Technical Constraints
- Remotion requires React/TypeScript - entire rendering pipeline must be React components
- Remotion renders at 25fps (configurable) matching current VIDEO_BIBLE spec
- OffthreadVideo does not support loop - must handle B-roll looping differently (repeat Sequence or trim video)
- Audio ducking must be manual via volume prop callback - no FFmpeg sidechaincompress equivalent
- HeyGen videos still need to be downloaded as files before Remotion can use them (staticFile or public/)
- Subtitle rendering moves from FFmpeg ASS burn-in to React CSS overlay components

## Opportunities Identified
- **Remotion Studio**: Live preview of video while editing compositions - massive DX improvement
- **React component reuse**: Title cards, kinetic text, branded intro become reusable React components
- **calculateMetadata()**: Remotion can dynamically calculate composition duration from audio files
- **Type safety**: Full TypeScript gives compile-time safety for script.json parsing and prop passing
