from .factory import AdapterFactory

class ChatBase:
    def __init__(self, provider):
        self.adapter = AdapterFactory.get(provider)

    def send(self, system_prompt, user_message, **kwargs):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        return self.adapter.chat(messages, **kwargs)
