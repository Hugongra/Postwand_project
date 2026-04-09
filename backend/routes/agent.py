from flask import Blueprint, g, request
from decorators.decorators import login_required
from services.agent.orchestrator import run_agent

agent_bp = Blueprint('agent', __name__)


@agent_bp.route('/agent/run', methods=['POST'])
@login_required
def agent_run():
    data = request.json or {}
    message = (data.get("message") or "").strip()
    history = data.get("history", [])

    if not message:
        return {"success": False, "error": "Message is required"}, 400

    result = run_agent(g.user_id, message, conversation_history=history)
    return result
