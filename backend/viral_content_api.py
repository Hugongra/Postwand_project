from flask import Blueprint, request, jsonify, session, Response, stream_with_context
import os
import uuid
from viral_ideas import create_viral_content, AIScriptGenerator, ViralContentChatSession
from video_transcript import process_video, VideoTranscriber
from backend.viral_ideas_chat import initialize_chatbot
import json

# Get API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Store chat sessions
chat_sessions = {}

# Store chatbots by brand name
chatbots = {}

# Create blueprint
viral_content_bp = Blueprint('viral_content', __name__)

@viral_content_bp.route('/api/viral-analysis', methods=['POST'])
def analyze_viral_video():
    """Analyze a viral video and generate content ideas"""
    data = request.json
    
    # Validate request
    if not data or 'video_url' not in data:
        return jsonify({"error": "Missing video URL"}), 400
    
    video_url = data.get('video_url')
    brand_info = data.get('brand_info', 'Generic brand')
    platform = data.get('platform', 'general')
    
    try:
        # Process the video and generate content
        result = create_viral_content(
            video_url=video_url,
            brand_info=brand_info,
            platform=platform,
            openai_api_key=OPENAI_API_KEY
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/video-metadata', methods=['POST'])
def get_video_metadata():
    """Extract metadata from a video URL"""
    data = request.json
    
    # Validate request
    if not data or 'video_url' not in data:
        return jsonify({"error": "Missing video URL"}), 400
    
    video_url = data.get('video_url')
    
    try:
        # Process the video to get metadata and transcript
        transcriber = VideoTranscriber(OPENAI_API_KEY)
        result = transcriber.process_video(video_url=video_url)
        
        if not result["metadata"]:
            return jsonify({"error": "Failed to extract metadata"}), 400
            
        return jsonify({"success": True, "metadata": result["metadata"]})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/generate-hooks', methods=['POST'])
def generate_hooks():
    """Generate hook ideas from a transcript"""
    data = request.json
    
    # Validate request
    if not data or 'transcript' not in data:
        return jsonify({"error": "Missing transcript"}), 400
    
    transcript = data.get('transcript')
    count = data.get('count', 5)
    metadata = data.get('metadata', None)
    
    try:
        # Generate hooks
        generator = AIScriptGenerator(OPENAI_API_KEY)
        hooks = generator.generate_quick_hooks(transcript, count, metadata)
        
        return jsonify({"success": True, "hooks": hooks})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Chat session routes
@viral_content_bp.route('/api/chat/create-session', methods=['POST'])
def create_chat_session():
    """Create a new chat session"""
    data = request.json
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Create a new chat session
    chat_sessions[session_id] = ViralContentChatSession(OPENAI_API_KEY)
    
    # Set brand info if provided
    brand_info = data.get('brand_info')
    if brand_info:
        chat_sessions[session_id].set_brand_info(brand_info)
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "message": "Chat session created successfully"
    })

@viral_content_bp.route('/api/chat/add-video', methods=['POST'])
def add_video_to_chat():
    """Add an analyzed video to a chat session"""
    data = request.json
    
    # Validate request
    if not data or 'session_id' not in data or 'video_url' not in data:
        return jsonify({"error": "Missing session_id or video_url"}), 400
    
    session_id = data.get('session_id')
    video_url = data.get('video_url')
    brand_info = data.get('brand_info', None)
    platform = data.get('platform', 'general')
    
    # Check if session exists
    if session_id not in chat_sessions:
        return jsonify({"error": "Invalid session ID"}), 404
    
    try:
        # Process the video and generate content
        result = create_viral_content(
            video_url=video_url,
            brand_info=brand_info or "Generic brand",
            platform=platform,
            openai_api_key=OPENAI_API_KEY
        )
        
        # Add the video to the chat session
        success = chat_sessions[session_id].add_analyzed_video(result)
        
        if not success:
            return jsonify({"error": "Failed to add video to chat session"}), 500
        
        return jsonify({
            "success": True,
            "message": "Video added to chat session",
            "video_title": result.get("metadata", {}).get("title", "Unknown video"),
            "analysis": {
                "viral_elements": result.get("viral_analysis", ""),
                "viral_patterns": result.get("viral_patterns", {}),
                "hooks": result.get("hooks", [])[:3]
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/chat/send-message', methods=['POST'])
def send_chat_message():
    """Send a message to the chat session"""
    data = request.json
    
    # Validate request
    if not data or 'session_id' not in data or 'message' not in data:
        return jsonify({"error": "Missing session_id or message"}), 400
    
    session_id = data.get('session_id')
    message = data.get('message')
    
    # Check if session exists
    if session_id not in chat_sessions:
        return jsonify({"error": "Invalid session ID"}), 404
    
    try:
        # Send message to chat session
        response = chat_sessions[session_id].chat(message)
        
        return jsonify({
            "success": True,
            "response": response
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/chat/get-history', methods=['GET'])
def get_chat_history():
    """Get the chat history for a session"""
    session_id = request.args.get('session_id')
    
    # Validate request
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
    
    # Check if session exists
    if session_id not in chat_sessions:
        return jsonify({"error": "Invalid session ID"}), 404
    
    try:
        # Get chat history
        history = chat_sessions[session_id].get_conversation_history()
        
        return jsonify({
            "success": True,
            "history": history
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/chat/generate-plan', methods=['POST'])
def generate_content_plan():
    """Generate a content plan based on analyzed videos"""
    data = request.json
    
    # Validate request
    if not data or 'session_id' not in data:
        return jsonify({"error": "Missing session_id"}), 400
    
    session_id = data.get('session_id')
    
    # Check if session exists
    if session_id not in chat_sessions:
        return jsonify({"error": "Invalid session ID"}), 404
    
    try:
        # Generate content plan
        plan = chat_sessions[session_id].generate_content_plan()
        
        return jsonify(plan)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/chat/cleanup-sessions', methods=['POST'])
def cleanup_sessions():
    """Admin endpoint to clean up old sessions"""
    # This would typically be protected by authentication
    
    # For now, just return the number of active sessions
    return jsonify({
        "success": True,
        "active_sessions": len(chat_sessions)
    })

@viral_content_bp.route('/api/viral-ideas/chat', methods=['POST'])
def chat():
    """
    Regular (non-streaming) chat endpoint
    """
    data = request.json
    brand_name = data.get('brand_name')
    message = data.get('message')
    
    if not brand_name or not message:
        return jsonify({"error": "Brand name and message are required"}), 400
    
    # Get or initialize chatbot for this brand
    if brand_name not in chatbots:
        chatbots[brand_name] = initialize_chatbot(brand_name)
    
    # Get user ID from session or create a temporary one
    user_id = session.get('user_id', str(uuid.uuid4()))
    
    try:
        # Get response from chatbot
        response = chatbots[brand_name].chat(user_id, message)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viral_content_bp.route('/api/viral-ideas/stream-chat', methods=['POST'])
def stream_chat():
    """
    Streaming chat endpoint that returns chunks as they're generated
    """
    data = request.json
    brand_name = data.get('brand_name')
    message = data.get('message')
    
    if not brand_name or not message:
        return jsonify({"error": "Brand name and message are required"}), 400
    
    # Get or initialize chatbot for this brand
    if brand_name not in chatbots:
        chatbots[brand_name] = initialize_chatbot(brand_name)
    
    # Get user ID from session or create a temporary one
    user_id = session.get('user_id', str(uuid.uuid4()))
    
    def generate():
        try:
            for chunk in chatbots[brand_name].stream_chat(user_id, message):
                # Send each chunk as a Server-Sent Event
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'  # Disable buffering for Nginx
        }
    )

@viral_content_bp.route('/api/viral-ideas/clear-history', methods=['POST'])
def clear_history():
    """
    Clear chat history for a user and brand
    """
    data = request.json
    brand_name = data.get('brand_name')
    
    if not brand_name:
        return jsonify({"error": "Brand name is required"}), 400
    
    # Get user ID from session or create a temporary one
    user_id = session.get('user_id', str(uuid.uuid4()))
    
    # Check if chatbot exists for this brand
    if brand_name in chatbots:
        chatbots[brand_name].clear_history(user_id)
        return jsonify({"status": "success", "message": "Chat history cleared"})
    else:
        return jsonify({"status": "success", "message": "No chat history found"})

@viral_content_bp.route('/viral-chat', methods=['POST'])
def viral_chat():
    data = request.json
    message = data.get('message')
    brand_id = data.get('brand_id')
    user_id = data.get('user_id')
    
    if not message or not brand_id or not user_id:
        return {"error": "Missing required parameters"}, 400
    
    # Initialize chatbot if not already done for this brand
    if brand_id not in chatbots:
        chatbots[brand_id] = initialize_chatbot(brand_id)
    
    chatbot = chatbots[brand_id]
    
    # Create a streaming response
    def generate():
        for text_chunk in chatbot.stream_chat(user_id, message):
            yield text_chunk
    
    return Response(stream_with_context(generate()), mimetype='text/plain')

@viral_content_bp.route('/clear-chat-history', methods=['POST'])
def clear_chat_history():
    data = request.json
    brand_id = data.get('brand_id')
    user_id = data.get('user_id')
    
    if not brand_id or not user_id:
        return {"error": "Missing required parameters"}, 400
    
    if brand_id in chatbots:
        chatbots[brand_id].clear_history(user_id)
        return {"message": "Chat history cleared successfully"}, 200
    
    return {"error": "Brand not found"}, 404 