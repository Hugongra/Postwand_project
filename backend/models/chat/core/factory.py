from adapters.openai_adapter import OpenAIAdapter
from adapters.grok_adapter import GrokAdapter

adapters = {
    "openai": OpenAIAdapter(),
    "grok": GrokAdapter(),
}

class AdapterFactory:
    @staticmethod
    def get(provider: str):
        return adapters.get(provider.lower(), None)

