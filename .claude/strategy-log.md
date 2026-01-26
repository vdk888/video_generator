# Strategy Log
**Vision Version**: 2026-01-26 | **Last Planning**: 2026-01-26 | **Current Focus**: ElevenLabs + HeyGen Integration (Sprint 3-4)

## Active Priorities
1. **Transition System** - COMPLETED in Sprint 1. xfade working.
2. **Music Service** - IN PROGRESS Sprint 1-2. Ducking logic pending.
3. **Branding Assets** - IN PROGRESS Sprint 2. Intro/outro templating.
4. **ElevenLabs Adapter** - PLANNED Sprint 3. Interface-first design ready.
5. **HeyGen Adapter** - PLANNED Sprint 3-4. New IAvatarService interface required.

## Decided Against (Parked)
- **Music Beat Sync**: Parked because complexity outweighs value for MVP. Revisit after Music Service stable.
- **A/B Testing Framework**: Parked because premature optimization. Revisit when measuring video performance.
- **Typography Variety**: Parked for initial sprints. Current kinetic works. Revisit after transitions polished.
- **HeyGen Streaming API**: Parked - batch video generation sufficient for current use case.

## Key Decisions
- [2026-01-26]: Prioritize polish (transitions, music) over new features (avatar) because current output lacks "broadcast quality" feel
- [2026-01-26]: Keep HeyGen as Sprint 3-4 despite being high-impact because external API dependency and complexity warrant stable base first
- [2026-01-26]: Parallel workstreams: Transitions (FFmpeg) + Music Service can proceed independently
- [2026-01-26]: ElevenLabs to implement existing TTSProvider interface - NO new abstraction needed
- [2026-01-26]: HeyGen requires NEW IAvatarService interface + scene_type field in ScriptLine model
- [2026-01-26]: Avatar segments will use HeyGen's own TTS (not accept external audio) to reduce integration complexity

## Technical Constraints
- FFmpeg xfade requires same codec/resolution: All scenes already normalized to 1920x1080@25fps yuv420p - READY
- HeyGen API requires account + paid tier for quality avatars - BLOCKS avatar work until credentials ready
- Music ducking requires sidechain-like filter in FFmpeg - Achievable with dynaudnorm or sidechaincompress
- ElevenLabs API key required - Add ELEVENLABS_API_KEY to .env
- HeyGen video generation is ASYNC - requires polling loop for status
- HeyGen videos have 7-day URL expiration - must download immediately

## Opportunities Identified
- **Semantic B-Roll Enhancement**: Can be done incrementally by improving OpenRouter prompts - LOW EFFORT
- **Scene Type Field**: `scene_type` already in VIDEO_BIBLE.md schema but not implemented - QUICK WIN after HeyGen
- **Voice Selection**: ElevenLabs has voice cloning - premium feature for future
