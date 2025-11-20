class ChatMemory:
    """Stores chat history per user or session."""

    def __init__(self):
        self._sessions = {}

    def get(self, user_id):
        return self._sessions.get(user_id, [])

    def add(self, user_id, role, content):
        self._sessions.setdefault(user_id, []).append({"role": role, "content": content})
        if len(self._sessions[user_id]) > 10:
            self._sessions[user_id] = self._sessions[user_id][-10:]

    def clear(self, user_id):
        self._sessions[user_id] = []
