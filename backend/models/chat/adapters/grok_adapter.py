import os
from openai import OpenAI
from .base_adapter import BaseAdapter


def _get_grok_client():
    key = os.getenv("XAI_API_KEY")
    if not key:
        raise ValueError(
            "XAI_API_KEY is not set in .env. Get one at https://console.x.ai"
        )
    return OpenAI(api_key=key, base_url="https://api.x.ai/v1")

class GrokAdapter(BaseAdapter):
    def _run_completion(self, messages, **kwargs):
        client = _get_grok_client()
        response_model = kwargs.pop("response_model", None)
        
        params = {
            "model": kwargs.get("model", "grok-3-mini-beta"),
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 4000),
        }
        
        if response_model:
            params["response_format"] = response_model
            completion = client.beta.chat.completions.parse(**params)
            return {
                "content": completion.choices[0].message.parsed,
                "tokens": getattr(completion.usage, "total_tokens", None),
            }
        
        params["response_format"] = kwargs.get("response_format", None)
        completion = client.chat.completions.create(**params)
        return {
            "content": completion.choices[0].message.content.strip(),
            "tokens": getattr(completion.usage, "total_tokens", None),
        }