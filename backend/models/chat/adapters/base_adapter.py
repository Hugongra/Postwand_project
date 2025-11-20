class BaseAdapter:
    def _run_completion(self, messages, **kwargs):
        raise NotImplementedError

    def chat(self, messages, **kwargs):
        return self._run_completion(messages, **kwargs)

    def chat_json(self, messages, **kwargs):
        kwargs["response_format"] = {"type": "json_object"}
        return self._run_completion(messages, **kwargs)
    
    def chat_structured(self, messages, response_model, **kwargs):
        kwargs["response_model"] = response_model
        return self._run_completion(messages, **kwargs)