# Strategy Log
**Vision Version**: 2026-01-26 | **Last Planning**: 2026-01-26 | **Current Focus**: Transition System + Music Layer

## Active Priorities
1. **Transition System** - Highest IUET score (4.40). Low-risk FFmpeg enhancement. Immediate polish improvement. Target: Sprint 1
2. **Music Service** - Second priority (4.15). High impact on "broadcast quality". Requires ducking logic. Target: Sprint 1-2
3. **Branding Assets** - Third priority (4.10). Creates branded intro. Quick asset setup. Target: Sprint 2
4. **ElevenLabs Adapter** - Fourth priority (3.75). Premium voice option. Straightforward interface swap. Target: Sprint 2-3
5. **HeyGen Adapter** - Fifth priority (3.55). Core differentiator but highest complexity. Target: Sprint 3-4

## Decided Against (Parked)
- **Music Beat Sync**: Parked because complexity outweighs value for MVP. Revisit after Music Service stable.
- **A/B Testing Framework**: Parked because premature optimization. Revisit when measuring video performance.
- **Typography Variety**: Parked for initial sprints. Current kinetic works. Revisit after transitions polished.

## Key Decisions
- [2026-01-26]: Prioritize polish (transitions, music) over new features (avatar) because current output lacks "broadcast quality" feel
- [2026-01-26]: Keep HeyGen as Sprint 3-4 despite being high-impact because external API dependency and complexity warrant stable base first
- [2026-01-26]: Parallel workstreams: Transitions (FFmpeg) + Music Service can proceed independently

## Technical Constraints
- FFmpeg xfade requires same codec/resolution: All scenes already normalized to 1920x1080@25fps yuv420p - READY
- HeyGen API requires account + paid tier for quality avatars - BLOCKS avatar work until credentials ready
- Music ducking requires sidechain-like filter in FFmpeg - Achievable with dynaudnorm or sidechaincompress

## Opportunities Identified
- **Semantic B-Roll Enhancement**: Can be done incrementally by improving OpenRouter prompts - LOW EFFORT
- **Scene Type Field**: `scene_type` already in VIDEO_BIBLE.md schema but not implemented - QUICK WIN after HeyGen
