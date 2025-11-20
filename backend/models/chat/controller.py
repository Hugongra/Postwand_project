import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from core.chat_base import ChatBase
from core.chat_structured import ChatStructured
from core.chat_with_memory import ChatWithMemory
from core.schemas import *

class ChatController:
    @staticmethod
    def chat_base(provider: str = "grok"):
        return ChatBase(provider)
    
    @staticmethod
    def chat_structured(provider: str = "grok"):
        return ChatStructured(provider)
    
    @staticmethod
    def chat_with_memory(provider: str = "grok"):
        return ChatWithMemory(provider)
