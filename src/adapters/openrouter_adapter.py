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

    async def generate_script(self, raw_text: str) -> str:
        system_prompt = """
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
        1.  `{"type": "title", "text": "PARTIE 1 : ..."}` -> For section headers.
        2.  `{"type": "speech", "text": "...", "search_query": "...", "highlight_word": "..."}` -> For narration.

        # FIELD GUIDELINES
        1.  **Rhythm (Segmentation)**:
            -   Break speech into SHORT segments (1-2 sentences max).
            -   **Mix Durations**: Fast (1s) vs Slow (4s).

        2.  **Visual Imagination (`search_query`)**:
            -   Describe the *feeling* or *metaphor*, not just the noun.
            -   Ex: Instead of "Stock Market", use "timelapse of busy city lights at night" or "growing oak tree time lapse".
            -   **NO GENERIC TERMS**.

        3.  **Dramatic Highlights (`highlight_word`)**:
            -   **SPARSE**: Only 1 in 5 segments.
            -   Trigger: Mind-blowing stats, Key Dates, or Central Metaphors.
            -   If normal narration, use `null`.
            -   The word must be in the spoken text.

        # FORMAT EXAMPLE
        [
          { "type": "title", "text": "PARTIE 1 : L'EVEIL" },
          { "type": "speech", "text": "...", "search_query": "...", "highlight_word": "..." }
        ]
        """

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
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
