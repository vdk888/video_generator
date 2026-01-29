/**
 * OpenRouter Script Generation Service
 * Converts raw text into structured video scripts using LLM
 */

import type { ScriptLine, ProjectConfig } from '../types.js';

/**
 * System prompt for script generation (from VIDEO_BIBLE.md)
 */
const SYSTEM_PROMPT = `
You are the **Bubble Scriptwriter**, an expert in educational storytelling.
Your goal is to turn raw information into a captivating, rhythmic video script.

# THE BUBBLE TONE (CRITICAL)
1.  **Storytelling First**: Do not just list facts. Tell a story with a beginning, middle, and end.
2.  **Analogies**: Use concrete, everyday comparisons (e.g., "Investing is like planting a garden", "Data is the new oil").
3.  **Accessible & Engaging**:
    -   Talk TO the viewer ("Vous").
    -   Demystify complex terms immediately ("Spoiler: it's simpler than you think").
    -   Use short, punchy sentences.
4.  **Conviction**: Be authoritative but reassuring.

# SCRIPT STRUCTURE
-   **Divide into Parts**: Explicitly use "Partie 1: [Title]", "Partie 2: [Title]" for structure.
-   **Introduction**: Start with a Hook (Question, Shocking Fact, or "Spoiler").
-   **Conclusion**: End with a call to action or a final thought-provoking question.

# JSON OUTPUT FORMAT
Return a JSON List of objects.

Item Types:
1.  \`{"type": "title", "text": "PARTIE 1 : ..."}\` -> For section headers.
2.  \`{"type": "speech", "text": "...", "search_query": "...", "highlight_word": "...", "scene_type": "broll"}\` -> For narration.

# FIELD GUIDELINES
1.  **Rhythm (Segmentation)** — THIS IS THE MOST IMPORTANT RULE:
    -   Break speech into VERY SHORT segments: **ONE sentence max per segment**.
    -   Target **1 to 3 seconds** of spoken audio per segment (5-20 words).
    -   A single long sentence MUST be split into 2-3 segments.
    -   NEVER combine two sentences into one segment.
    -   **Mix Durations**: Punch lines = 1-2s, Explanations = 2-3s. Never exceed 4s.
    -   More segments = better. 30+ segments for a 2-minute video is normal.

2.  **Visual Imagination (\`search_query\`)**:
    -   Describe the *feeling* or *metaphor*, not just the noun.
    -   Ex: Instead of "Stock Market", use "timelapse of busy city lights at night" or "growing oak tree time lapse".
    -   **NO GENERIC TERMS**.

3.  **Dramatic Highlights (\`highlight_word\`)**:
    -   **SPARSE**: Only 1 in 4 segments. Most segments should be \`null\`.
    -   **ONLY use for**: Specific numbers/dates ("2012", "100 millions"), brand names ("ChatGPT", "Google"), or short punchy phrases (2-4 words max, e.g. "Deep Learning", "ère générative").
    -   **NEVER use** generic single words like "voir", "parler", "crée", "maths", "contexte". These are NOT impactful.
    -   The highlight must be a phrase that SLAMS on screen and makes the viewer go "wow". Think billboard, not dictionary.
    -   The phrase must appear verbatim in the spoken text.
    -   If the segment has no mind-blowing stat, date, or key concept, use \`null\`.

4.  **Scene Type (\`scene_type\`)**:
    -   "broll" (default, ~80%): Stock footage for illustrations
    -   "avatar" (~15-20%): AI talking head for personal, direct-to-camera moments. Use for:
        - The hook/opening line (builds connection)
        - Personal opinions or "let me explain" moments
        - Transitions between parts ("Maintenant, parlons de...")
        - The conclusion/CTA
        Do NOT use for factual exposition — that's broll territory.
    -   "kinetic": Big text overlay for stats/dates (rarely used, prefer highlight_word on broll)
    -   "title": Part transitions (automatic for type="title")

# FORMAT EXAMPLE
[
  { "type": "title", "text": "PARTIE 1 : L'EVEIL" },
  { "type": "speech", "text": "...", "search_query": "...", "highlight_word": "...", "scene_type": "broll" }
]
`;

/**
 * Response format from OpenRouter
 */
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Raw script item from LLM (before validation)
 */
interface RawScriptItem {
  type: 'title' | 'speech';
  text: string;
  search_query?: string;
  highlight_word?: string | null;
  scene_type?: 'broll' | 'avatar' | 'title' | 'kinetic';
  custom_media_path?: string | null;
  voice_id?: string | null;
}

/**
 * Generate a structured video script from raw text using OpenRouter LLM
 *
 * @param rawText - Raw source text to convert into script
 * @param config - Project configuration with API keys
 * @returns Array of ScriptLine objects ready for video generation
 */
export async function generateScript(
  rawText: string,
  config: ProjectConfig
): Promise<ScriptLine[]> {
  console.log('Generating script via OpenRouter...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openrouter_api_key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bubble-video-engine.local',
      'X-Title': 'Bubble Video Engine',
    },
    body: JSON.stringify({
      model: config.openrouter_model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawText },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from OpenRouter');
  }

  // Parse JSON response
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse LLM response:', content);
    throw new Error('Invalid JSON response from LLM');
  }

  // Handle wrapped responses (e.g., {"script": [...]})
  let scriptItems: unknown;
  if (typeof parsedData === 'object' && parsedData !== null) {
    // Look for an array value in the object
    const values = Object.values(parsedData);
    const arrayValue = values.find((v) => Array.isArray(v));
    scriptItems = arrayValue || [];
  } else {
    scriptItems = parsedData;
  }

  if (!Array.isArray(scriptItems)) {
    console.error('LLM did not return an array:', parsedData);
    return [];
  }

  // Convert raw items to ScriptLine format
  const scriptLines: ScriptLine[] = scriptItems
    .filter((item): item is RawScriptItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        'text' in item
      );
    })
    .map((item) => {
      // Determine line type and scene type
      const lineType = item.type === 'title' ? 'title' : 'speech';
      const sceneType = item.type === 'title' ? 'title' : (item.scene_type || 'broll');

      const scriptLine: ScriptLine = {
        text: item.text,
        type: lineType,
        scene_type: sceneType,
        search_query: item.search_query,
        highlight_word: item.highlight_word === null ? null : item.highlight_word,
        custom_media_path: item.custom_media_path || null,
        voice_id: item.voice_id || null,
      };

      return scriptLine;
    });

  console.log(`Generated ${scriptLines.length} script lines`);
  return scriptLines;
}
