import os
from flask import request
from utils.token_usage import check_token_limit, update_token_usage
from backend.models.chat.controller import ChatController, StructuredPost

chat = ChatController.chat_with_memory("grok")

def load_system_prompt(mode):
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    filename = os.path.join(current_dir, 'services', 'create_text', f'system_prompt_{mode}.txt')
    with open(filename, 'r', encoding='utf-8') as file:
        return file.read()


def send_chat_message(user_id):
    try:
        data = request.json
        message = data.get('message')
        mode = data.get('mode', 'ask')
        platforms = data.get('platforms', [])

        if check_token_limit(user_id, 'grok'):
            return {'success': False, 'error': 'Monthly Grok token limit exceeded'}, 500
        
        system_prompt = load_system_prompt(mode)
        
        if mode == "write_post" and platforms:
            system_prompt += f"\n\nIMPORTANT: Create exactly ONE post for each of these platforms: {', '.join(platforms)}. Each post should be optimized specifically for that platform's audience and format."
        
        if mode == "write_post":
            response = chat.send(
                user_id,
                message,
                system_prompt=system_prompt,
                response_model=StructuredPost,
            
            )
            structured_data = response['content'].model_dump()
            tokens = response.get('usage', {}).get('total_tokens')
            
            if tokens: update_token_usage(user_id, tokens, 'grok')
            
            return {
                'success': True,
                'message': structured_data.get('summary', 'Content created successfully'),
                'structured_content': structured_data,
                'tokens_used': tokens
            }, 200
        else:
            response = chat.send(
                user_id,
                message,
                system_prompt=system_prompt,
            )
            tokens = response.get('usage', {}).get('total_tokens')
            
            if tokens:
                update_token_usage(user_id, tokens, 'grok')
            
            return {
                'success': True,
                'message': response['content'],
                'tokens_used': tokens
            }, 200
            
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {'error': str(e)}, 500


def get_chat_history(user_id):
    try:
        history = chat.memory.get(user_id)
        return {'success': True, 'history': history}, 200
    except Exception as e:
        return {'error': str(e)}, 500


def clear_chat_history(user_id):
    try:
        chat.memory.clear(user_id)
        return {'success': True}, 200
    except Exception as e:
        return {'error': str(e)}, 500


def text_action(user_id):
    try:
        data = request.json
        action = data.get('action')
        content = data.get('content', '')
        platform = data.get('platform', 'facebook')
        user_input = data.get('user_input', '')
        
        if not action:
            return {'error': 'Action is required'}, 400
        
        if check_token_limit(user_id, 'grok'):
            return {'success': False, 'error': 'Monthly Grok token limit exceeded'}, 500
        
        action_prompts = {
            "Improve": f"Improve this {platform} post to make it more engaging and effective. Keep the same general message but enhance the writing quality, tone, and impact:",
            "Expand": f"Expand this {platform} post with more details, examples, or context. Make it more comprehensive while maintaining the original message:",
            "Shorten": f"Make this {platform} post shorter and more concise while keeping the key message and impact. Remove unnecessary words:",
            "Ask": f"Modify this {platform} post based on this specific request: {user_input}. Here's the current post:"
        }
        
        if action not in action_prompts or not content.strip():
            return {'error': 'Invalid action or content'}, 400
        
        if action == "Ask" and not user_input.strip():
            return {'error': 'User input required for Ask action'}, 400
        
        simple_chat = ChatController.chat_base("grok")
        system_prompt = f"You are a {platform} content expert. Return only the modified post content, no explanations. IMPORTANT: Always respond in the same language that the user writes in."
        user_message = f"{action_prompts[action]}\n\n{content}"
        
        response = simple_chat.send(system_prompt, user_message)
        tokens = response.get('usage', {}).get('total_tokens')
        
        if tokens:
            update_token_usage(user_id, tokens, 'grok')
        
        return {
            'success': True,
            'modified_content': response['content'].strip(),
            'tokens_used': tokens
        }, 200
        
    except Exception as e:
        return {'error': str(e)}, 500
