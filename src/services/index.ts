/**
 * Service Layer - API Adapters
 * TypeScript ports of Python adapters for external services
 */

// Script generation (LLM)
export * as OpenRouter from './openrouter.js';

// Text-to-Speech providers
export * as OpenAITTS from './openai-tts.js';
export * as ElevenLabs from './elevenlabs.js';
export * as EdgeTTS from './edge-tts.js';

// Video services
export * as HeyGen from './heygen.js';
export * as Pexels from './pexels.js';

// Audio services
export * as Music from './music.js';

/**
 * Usage examples:
 *
 * import { OpenRouter, OpenAITTS, Pexels } from './services/index.js';
 *
 * // Generate script
 * const script = await OpenRouter.generateScript(rawText, config);
 *
 * // Generate audio
 * const audio = await OpenAITTS.generateSpeech(text, outputPath, apiKey);
 *
 * // Download video
 * const video = await Pexels.searchAndDownload(query, outputPath, apiKey);
 */
