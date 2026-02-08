class ChatMemory:
    """Stores chat history per user or session."""

    def __init__(self):
        self._sessions = {}

    def get(self, user_id):
        return self._sessions.get(user_id, [])

    def add(self, user_id, role, content, structured_posts=None):
        message = {"role": role, "content": content}
        if structured_posts:
            message["structured_posts"] = structured_posts
        self._sessions.setdefault(user_id, []).append(message)
        if len(self._sessions[user_id]) > 10:
            self._sessions[user_id] = self._sessions[user_id][-10:]

    def clear(self, user_id):
        self._sessions[user_id] = []
