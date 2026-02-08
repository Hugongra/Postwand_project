from .memory import ChatMemory
from .factory import AdapterFactory

class ChatWithMemory:
    def __init__(self, provider, memory=None):
        self.adapter = AdapterFactory.get(provider)
        self.memory = memory or ChatMemory()

    def send(self, user_id, user_message, system_prompt=None, response_model=None, **kwargs):
        history = self.memory.get(user_id)
        
        # Build messages for API call (without structured_posts metadata)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add history without structured_posts field
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": user_message})

        structured_posts = None
        if response_model:
            response = self.adapter.chat_structured(messages, response_model, **kwargs)
            reply = response.get("content", "")
            if hasattr(reply, 'model_dump'):
                structured_data = reply.model_dump()
                # Extract posts for display
                if 'posts' in structured_data:
                    structured_posts = structured_data['posts']
                reply_text = structured_data.get('summary', 'Generated content')
            else:
                reply_text = str(reply)
        else:
            response = self.adapter.chat(messages, **kwargs)
            reply = response.get("content", "")
            reply_text = reply

        self.memory.add(user_id, "user", user_message)
        self.memory.add(user_id, "assistant", reply_text, structured_posts=structured_posts)

        return response
