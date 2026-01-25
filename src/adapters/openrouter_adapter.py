from typing import List, Dict
import os
import json
from openai import AsyncOpenAI
from src.ports.interfaces import ScriptGenerator

class OpenRouterAdapter(ScriptGenerator):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        self.model = model

    async def generate_script(self, raw_text: str) -> List[Dict]:
        prompt = """
        You are an Expert Video Editor and Scriptwriter for the "Bubble" brand.
        Your task is to convert the following Educational Text into a JSON Video Script.

        Title: "Understanding AI (Foundations)"
        
        **Rules for Transformation:**
        
        1.  **Rhythm (Segmentation)**:
            - Break the text into SHORT, PUNCHY segments (1-2 sentences max).
            - Mix durations: Some segments should be very short (1 sec), others normal (3-4 sec) for dynamic pacing.

        2.  **Visual Imagination (Search Queries)**:
            - For each segment, provide a `search_query` for Pexels.
            - **CRITICAL**: Do NOT use generic terms like "AI". Use **Cinematic Descriptions**: "glowing blue neural network macro", "cyberpunk city drone shot", "hacker typing green code night".

        3.  **Highlights (Dramatic Text)**:
            - **SPARSELY** use `highlight_word` (Only for ~20% of segments).
            - Triggers: Key dates ("2012"), Mind-blowing concepts ("Révolution"), or Shocking stats.
            - If a segment is normal narration, set `highlight_word` to null.
            - The word must be in the spoken text.

        4.  **Structure**:
            - If you see a major section change in the text, insert a "title" type item.
            - Otherwise use "speech" type.

        **Output Format**:
        Return ONLY a raw JSON list. No markdown formatting.
        [
          { "type": "title", "text": "PART IE 1..." },
          { "type": "speech", "text": "...", "search_query": "...", "highlight_word": "..." }
        ]
        """

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": raw_text}
            ],
            response_format={ "type": "json_object" } # OpenRouter/OpenAI json mode
        )

        content = response.choices[0].message.content
        
        # Verify JSON
        try:
            # Sometimes 'json_object' wraps it in a root key, but we asked for a list.
            # Let's inspect or just parse.
            # If the model returns `{"script": [...]}` we handle it.
            # We instructed "Return ONLY a raw JSON list".
            data = json.loads(content)
            
            # If it's a dict with a single key list, unwrap it.
            if isinstance(data, dict):
                # Look for a list value
                for k, v in data.items():
                    if isinstance(v, list):
                        return v
                # Fallback
                return []
            
            return data
            
        except json.JSONDecodeError:
            print(f"Failed to parse LLM response: {content}")
            return []
