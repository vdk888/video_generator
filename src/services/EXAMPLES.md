# Service Usage Examples

Complete examples for using each service in the Bubble Video Engine.

## Full Pipeline Example

```typescript
import { loadConfig } from '../config.js';
import { OpenRouter, OpenAITTS, Pexels, Music } from './index.js';

async function generateVideo(rawText: string, projectName: string) {
  const config = loadConfig(projectName);

  // 1. Generate script from raw text
  console.log('Generating script...');
  const scriptLines = await OpenRouter.generateScript(rawText, config);

  // 2. Process each scene
  for (let i = 0; i < scriptLines.length; i++) {
    const line = scriptLines[i];

    if (line.type === 'speech') {
      // 2a. Generate audio
      const audioPath = `${config.assets_dir}/audio_${i}.mp3`;
      const audio = await OpenAITTS.generateSpeech(
        line.text,
        audioPath,
        config.openrouter_api_key
      );
      console.log(`Audio ${i}: ${audio.duration}s`);

      // 2b. Download B-roll video (if scene_type is broll)
      if (line.scene_type === 'broll' && line.search_query) {
        const videoPath = `${config.assets_dir}/video_${i}.mp4`;
        const video = await Pexels.searchAndDownload(
          line.search_query,
          videoPath,
          config.pexels_api_key
        );
        console.log(`Video ${i}: ${video.width}x${video.height}`);
      }
    }
  }

  // 3. Select background music
  if (config.enable_background_music) {
    const musicPath = await Music.selectTrack(
      config.music_mood,
      config.assets_dir
    );
    console.log(`Music: ${musicPath}`);
  }

  // 4. Next: Render scenes with FFmpeg (Phase 3)
  // ...
}
```

---

## Script Generation

```typescript
import { loadConfig } from '../config.js';
import { OpenRouter } from './index.js';

const config = loadConfig('my-project');

const rawText = `
L'intelligence artificielle révolutionne notre quotidien.
Mais comment fonctionne-t-elle vraiment ?
Spoiler : ce n'est pas de la magie.
`;

const script = await OpenRouter.generateScript(rawText, config);

console.log(`Generated ${script.length} script lines`);

script.forEach((line, i) => {
  console.log(`\n[${i}] Type: ${line.type}, Scene: ${line.scene_type}`);
  console.log(`Text: ${line.text}`);
  if (line.search_query) {
    console.log(`Query: ${line.search_query}`);
  }
  if (line.highlight_word) {
    console.log(`Highlight: ${line.highlight_word}`);
  }
});
```

**Output**:
```
Generated 5 script lines

[0] Type: title, Scene: title
Text: PARTIE 1 : LA RÉVOLUTION

[1] Type: speech, Scene: broll
Text: De Terminator à ChatGPT. Comment la science-fiction est-elle devenue notre quotidien ?
Query: futuristic cyborg face close up cinematic lighting
Highlight: quotidien

[2] Type: speech, Scene: avatar
Text: Spoiler : ce n'est pas de la magie.
Query: magician revealing trick behind curtain
```

---

## TTS Provider Comparison

```typescript
import { OpenAITTS, ElevenLabs, EdgeTTS } from './index.js';

const text = "Bonjour, bienvenue dans cette vidéo Bubble.";
const apiKey = process.env.OPENROUTER_API_KEY!;

// OpenAI TTS (via OpenRouter)
const openaiAudio = await OpenAITTS.generateSpeech(
  text,
  'output/openai.mp3',
  apiKey,
  'alloy'
);
console.log('OpenAI:', openaiAudio.duration, 'seconds');

// ElevenLabs (premium quality)
const elevenLabsAudio = await ElevenLabs.generateSpeech(
  text,
  'output/elevenlabs.mp3',
  process.env.ELEVENLABS_API_KEY!,
  'EXAVITQu4vr4xnSDxMaL' // Bella voice
);
console.log('ElevenLabs:', elevenLabsAudio.duration, 'seconds');

// Edge TTS (free)
const edgeAudio = await EdgeTTS.generateSpeech(
  text,
  'output/edge.mp3',
  'fr-FR-VivienneMultilingualNeural'
);
console.log('Edge TTS:', edgeAudio.duration, 'seconds');
```

---

## Avatar Video Generation

```typescript
import { HeyGen } from './index.js';

const apiKey = process.env.HEYGEN_API_KEY!;

const avatarVideo = await HeyGen.generateAvatar(
  "Bonjour ! Aujourd'hui, nous allons découvrir l'intelligence artificielle.",
  'output/avatar_intro.mp4',
  apiKey,
  'Angela-inblackskirt-20220820', // Professional female presenter
  '1bd001e7e50f421d891986aad5158bc8' // French female voice
);

console.log('Avatar video generated:', avatarVideo.file_path);
console.log('Duration:', avatarVideo.duration, 'seconds');
console.log('Resolution:', avatarVideo.width, 'x', avatarVideo.height);
```

**Expected Output**:
```
Generating HeyGen avatar video...
  Avatar: Angela-inblackskirt-20220820
  Voice: 1bd001e7e50f421d891986aad5158bc8
  Text length: 73 chars
  Video ID: abc123...
  Status: pending... (0s elapsed)
  Status: processing... (5s elapsed)
  Status: processing... (10s elapsed)
  Video ready: https://cdn.heygen.com/...
  Downloaded: output/avatar_intro_raw.mp4
  Normalized: output/avatar_intro.mp4

Avatar video generated: output/avatar_intro.mp4
Duration: 5.2 seconds
Resolution: 1920 x 1080
```

---

## B-Roll Search Strategies

```typescript
import { Pexels } from './index.js';

const apiKey = process.env.PEXELS_API_KEY!;

// BAD: Literal terms (generic, boring)
const badQuery = 'stock market graph';

// GOOD: Feeling-based queries (cinematic, evocative)
const goodQuery = 'timelapse busy city lights at night aerial view';

const video = await Pexels.searchAndDownload(
  goodQuery,
  'output/broll_cityscape.mp4',
  apiKey,
  5 // minimum 5 seconds
);

console.log('Downloaded:', video.file_path);
console.log('Resolution:', video.width, 'x', video.height);
console.log('Duration:', video.duration, 'seconds');
```

**More Good Queries** (from VIDEO_BIBLE.md):
```typescript
const queries = {
  growth: 'sunrise over mountain peak timelapse golden hour',
  technology: 'abstract digital network connections particles flowing',
  complexity: 'intricate clockwork gears moving macro shot',
  innovation: 'light bulb illuminating darkness slow motion',
  speed: 'fast motion highway traffic blur night lights',
  nature: 'forest canopy sunlight rays penetrating leaves',
  data: 'matrix style falling code green binary',
  connection: 'hands reaching towards each other silhouette',
};
```

---

## Music Library Organization

```typescript
import { Music } from './index.js';
import { promises as fs } from 'fs';

// Setup music library structure
async function setupMusicLibrary() {
  const baseDir = 'assets/music';

  // Create mood directories
  const moods = ['ambient_cinematic', 'upbeat', 'dramatic'];
  for (const mood of moods) {
    await fs.mkdir(`${baseDir}/${mood}`, { recursive: true });
  }

  console.log('Music library structure created');
  console.log('Add MP3 files to each mood directory:');
  console.log('  assets/music/ambient_cinematic/track1.mp3');
  console.log('  assets/music/upbeat/track1.mp3');
  console.log('  assets/music/dramatic/track1.mp3');
}

// List available moods
const moods = await Music.listAvailableMoods('assets');
console.log('Available moods:', moods);

// Get tracks for a mood
const tracks = await Music.getTracksForMood('ambient_cinematic', 'assets');
console.log('Ambient tracks:', tracks);

// Select a track for video
const selectedTrack = await Music.selectTrack('ambient_cinematic', 'assets');
if (selectedTrack) {
  console.log('Selected for video:', selectedTrack);
} else {
  console.log('No music found for this mood');
}
```

---

## Error Handling Patterns

```typescript
import { OpenAITTS, Pexels } from './index.js';

// Retry with fallback
async function generateAudioWithFallback(
  text: string,
  outputPath: string,
  config: any
) {
  try {
    // Try primary provider
    return await OpenAITTS.generateSpeech(
      text,
      outputPath,
      config.openrouter_api_key
    );
  } catch (error) {
    console.error('OpenAI TTS failed, trying Edge TTS:', error);

    // Fallback to free provider
    const { EdgeTTS } = await import('./index.js');
    return await EdgeTTS.generateSpeech(text, outputPath);
  }
}

// Retry with backoff
async function downloadVideoWithRetry(
  query: string,
  outputPath: string,
  apiKey: string,
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Pexels.searchAndDownload(query, outputPath, apiKey);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error}`);
      }

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

---

## Batch Processing

```typescript
import { OpenAITTS } from './index.js';
import { loadConfig } from '../config.js';

async function batchGenerateAudio(texts: string[]) {
  const config = loadConfig('batch-project');

  // Sequential processing (to avoid rate limits)
  const audioAssets = [];
  for (let i = 0; i < texts.length; i++) {
    console.log(`Generating audio ${i + 1}/${texts.length}...`);

    const audio = await OpenAITTS.generateSpeech(
      texts[i],
      `output/audio_${i}.mp3`,
      config.openrouter_api_key
    );

    audioAssets.push(audio);

    // Rate limiting: wait 1s between requests
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return audioAssets;
}

// Parallel processing (use with caution - may hit rate limits)
async function batchGenerateAudioParallel(texts: string[]) {
  const config = loadConfig('batch-project');

  const promises = texts.map((text, i) =>
    OpenAITTS.generateSpeech(
      text,
      `output/audio_${i}.mp3`,
      config.openrouter_api_key
    )
  );

  // Wait for all to complete
  return await Promise.all(promises);
}
```

---

## Integration with Remotion

```typescript
// Pre-generate assets for Remotion composition
import { OpenRouter, OpenAITTS, Pexels } from './services/index.js';
import { loadConfig } from './config.js';
import type { BubbleVideoInputProps, Scene } from './types.js';

async function prepareRemotionAssets(
  rawText: string,
  projectName: string
): Promise<BubbleVideoInputProps> {
  const config = loadConfig(projectName);

  // 1. Generate script
  const scriptLines = await OpenRouter.generateScript(rawText, config);

  // 2. Generate scenes
  const scenes: Scene[] = [];

  for (let i = 0; i < scriptLines.length; i++) {
    const line = scriptLines[i];

    if (line.type === 'speech') {
      // Generate audio
      const audioPath = `${config.assets_dir}/audio_${i}.mp3`;
      const audio = await OpenAITTS.generateSpeech(
        line.text,
        audioPath,
        config.openrouter_api_key
      );

      // Download video
      let videoPath = `${config.assets_dir}/video_${i}.mp4`;
      if (line.search_query) {
        const video = await Pexels.searchAndDownload(
          line.search_query,
          videoPath,
          config.pexels_api_key
        );
      }

      scenes.push({
        script_line: line,
        audio: audio,
        video: { file_path: videoPath, width: 1920, height: 1080 },
        output_path: `${config.assets_dir}/scene_${i}.mp4`,
      });
    }
  }

  // 3. Return Remotion input props
  return {
    scenes,
    logo_path: config.logo_path,
    intro_video_path: config.intro_video_path,
    outro_video_path: config.outro_video_path,
    background_music_path: null, // TODO: add music selection
    music_volume: config.audio.background_music_volume,
    config,
  };
}

// Usage in Remotion CLI
async function renderWithRemotion() {
  const props = await prepareRemotionAssets('Raw text here...', 'my-project');

  // Write props to JSON file
  await fs.writeFile(
    'remotion-props.json',
    JSON.stringify(props, null, 2)
  );

  // Call Remotion render
  // npx remotion render BubbleVideo output.mp4 --props=remotion-props.json
}
```

---

## Performance Monitoring

```typescript
import { OpenAITTS } from './index.js';

async function generateAudioWithTiming(text: string, outputPath: string, apiKey: string) {
  const startTime = Date.now();

  const audio = await OpenAITTS.generateSpeech(text, outputPath, apiKey);

  const elapsed = Date.now() - startTime;
  const realTimeFactor = audio.duration / (elapsed / 1000);

  console.log(`Audio generation took ${elapsed}ms`);
  console.log(`Audio duration: ${audio.duration}s`);
  console.log(`Real-time factor: ${realTimeFactor.toFixed(2)}x`);

  return audio;
}
```

---

## Testing Utilities

```typescript
// test/helpers/services.ts
import { promises as fs } from 'fs';

export async function cleanupTestFiles(paths: string[]) {
  for (const path of paths) {
    try {
      await fs.unlink(path);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(path: string): Promise<number> {
  const stats = await fs.stat(path);
  return stats.size;
}

// Usage in tests
import { OpenAITTS } from '../../src/services/index.js';
import { cleanupTestFiles, fileExists, getFileSize } from '../helpers/services.js';

test('generates audio file', async () => {
  const outputPath = '/tmp/test_audio.mp3';

  try {
    const audio = await OpenAITTS.generateSpeech(
      'Test',
      outputPath,
      process.env.OPENROUTER_API_KEY!
    );

    expect(await fileExists(outputPath)).toBe(true);
    expect(await getFileSize(outputPath)).toBeGreaterThan(1000);
    expect(audio.duration).toBeGreaterThan(0);
  } finally {
    await cleanupTestFiles([outputPath, outputPath.replace('.mp3', '.ass')]);
  }
});
```

---

## Conclusion

These examples demonstrate:
- ✅ Full pipeline integration
- ✅ Error handling and retries
- ✅ Provider comparison
- ✅ Batch processing
- ✅ Remotion integration
- ✅ Performance monitoring
- ✅ Testing utilities

For more details, see `README.md` in this directory.
