import os
import json
from openai import OpenAI
from .base_adapter import BaseAdapter

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class OpenAIAdapter(BaseAdapter):
    def _run_completion(self, messages, **kwargs):
        response_model = kwargs.pop("response_model", None)
        response_format = kwargs.pop("response_format", None)
        max_tokens = kwargs.get("max_tokens", 16000)
        model = kwargs.get("model", "gpt-4.1-mini")

        params = {
            "model": model,
            "messages": messages,
            "max_completion_tokens": max_tokens
        }

        # Case 1: Pydantic model parsing
        if response_model:
            params["response_format"] = response_model
            completion = openai_client.beta.chat.completions.parse(**params)
            parsed = completion.choices[0].message.parsed
            if parsed is None:
                finish = completion.choices[0].finish_reason
                raise ValueError(
                    f"Structured response incomplete (finish_reason={finish}). "
                    "The model may need more tokens — try a shorter prompt or fewer platforms."
                )
            return {
                "content": parsed,
                "tokens": getattr(completion.usage, "total_tokens", None),
            }

        # Case 2: JSON mode or other response_format
        if response_format:
            params["response_format"] = response_format
            completion = openai_client.chat.completions.create(**params)
            
            # Check for refusal or empty content
            message = completion.choices[0].message
            if hasattr(message, 'refusal') and message.refusal:
                raise ValueError(f"OpenAI refused: {message.refusal}")
            
            content = message.content
            if content is None:
                raise ValueError("OpenAI returned None content")
            
            content = content.strip()
            if not content:
                raise ValueError("OpenAI returned empty content")

            # Try parsing JSON automatically if response_format is JSON
            if isinstance(response_format, dict) and response_format.get("type") == "json_object":
                try:
                    content = json.loads(content)
                except Exception as e:
                    raise ValueError(f"Failed to parse JSON response: {e}. Content: {content[:200]}")

            return {
                "content": content,
                "tokens": getattr(completion.usage, "total_tokens", None),
            }

        # Case 3: Plain text
        completion = openai_client.chat.completions.create(**params)
        return {
            "content": completion.choices[0].message.content.strip(),
            "tokens": getattr(completion.usage, "total_tokens", None),
        }
