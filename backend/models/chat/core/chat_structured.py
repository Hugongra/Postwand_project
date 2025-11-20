from .factory import AdapterFactory

class ChatStructured:
    def __init__(self, provider):
        self.adapter = AdapterFactory.get(provider)

    def send(self, system_prompt, user_message, response_model, **kwargs):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        return self.adapter.chat_structured(messages, response_model, **kwargs)

