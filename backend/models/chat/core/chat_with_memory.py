from .memory import ChatMemory
from .factory import AdapterFactory

class ChatWithMemory:
    def __init__(self, provider, memory=None):
        self.adapter = AdapterFactory.get(provider)
        self.memory = memory or ChatMemory()

    def send(self, user_id, user_message, system_prompt=None, response_model=None, **kwargs):
        history = self.memory.get(user_id)
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        if response_model:
            response = self.adapter.chat_structured(messages, response_model, **kwargs)
            reply = response.get("content", "")
            if hasattr(reply, 'model_dump'):
                reply_text = f"Generated structured response: {type(reply).__name__}"
            else:
                reply_text = str(reply)
        else:
            response = self.adapter.chat(messages, **kwargs)
            reply = response.get("content", "")
            reply_text = reply

        self.memory.add(user_id, "user", user_message)
        self.memory.add(user_id, "assistant", reply_text)

        return response
