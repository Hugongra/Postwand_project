import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from controller import ChatController, StructuredPost

# Test 1: Simple chat
def test_simple():
    chat = ChatController.chat_base("grok")
    response = chat.send(
        system_prompt="You are helpful.",
        user_message="Say hello",
    )
    print(f"Simple: {response['content']}")

# Test 2: Structured output
def test_structured():
    chat = ChatController.chat_structured("grok")
    response = chat.send(
        system_prompt="Create social media posts.",
        user_message="Create 2 posts about coffee for instagram and twitter",
        response_model=StructuredPost,  
    )
    data = response['content']
    print(f"Structured: {len(data.posts)} posts")
    for post in data.posts:
        print(f"- {post.platform}: {post.content[:50]}...")

# Test 3: Memory
def test_memory():
    chat = ChatController.chat_with_memory("grok")
    
    r1 = chat.send("user1", "My name is Albert", system_prompt="You are helpful.")
    print(f"Memory 1: {r1['content']}")
    
    r2 = chat.send("user1", "What's my name?")
    print(f"Memory 2: {r2['content']}")

# Test 4: Memory + Structured
def test_memory_structured():
    chat = ChatController.chat_with_memory("grok")
    
    r1 = chat.send("user2", "I sell coffee")
    print(f"Context: {r1['content'][:50]}...")
    
    r2 = chat.send(
        "user2", 
        "Create posts for instagram", 
        response_model=StructuredPost
    )
    data = r2['content']
    print(f"Structured with memory: {len(data.posts)} posts")

if __name__ == "__main__":
    print("=== Test 1: Simple ===")
    test_simple()
    
    print("\n=== Test 2: Structured ===")
    test_structured()
    
    print("\n=== Test 3: Memory ===")
    test_memory()
    
    print("\n=== Test 4: Memory + Structured ===")
    test_memory_structured()

