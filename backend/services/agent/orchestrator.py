"""
AI Content Planning Agent — Agentic orchestrator using OpenAI function calling.

The agent runs in a loop:
1. Send conversation + tools to GPT
2. If GPT returns tool_calls → execute them, append results, loop
3. If GPT returns a text message → done, return to user

This implements a ReAct-style agent with real tool execution.
"""
import os
import json
import logging
import time
from openai import OpenAI
from services.agent.tools import TOOL_SCHEMAS, TOOL_DISPATCH, get_connected_accounts

_log = logging.getLogger(__name__)

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MAX_ITERATIONS = 15
MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = """You are PostWand AI Agent — an autonomous content planning assistant for social media managers.

You can think, plan, and execute multi-step workflows autonomously. You have access to these tools:

1. **generate_content_plan** — Create a full content plan (multiple posts with captions, image prompts, scheduling suggestions)
2. **generate_caption** — Write an optimized caption for a specific platform
3. **generate_image** — Generate an AI image for a post (DALL-E)
4. **get_connected_accounts** — Check which social media accounts are connected
5. **schedule_post** — Publish or schedule a post to social media

## How to work:

- When asked to create content, ALWAYS start by generating a content plan
- If the user wants images, generate them using the image_prompt from the plan
- Before scheduling, ALWAYS check connected accounts first
- Explain your reasoning and what you're doing at each step
- After completing each tool call, summarize what was done
- If something fails, explain the error and suggest alternatives
- ALWAYS respond in the same language the user writes in

## Important:
- You are an AGENT, not a chatbot. Take initiative and execute the full workflow.
- If the user says "create a week of posts for my coffee brand", you should: plan → generate captions → generate images → check accounts → offer to schedule
- Show the user what you've created before scheduling (don't auto-schedule without asking)
- Be concise but informative in your explanations between tool calls
"""


def run_agent(user_id, user_message, conversation_history=None):
    """
    Run the agent loop.

    Returns:
        dict with:
        - messages: full conversation (list of message dicts)
        - steps: list of {tool, args, result} for UI visualization
        - final_response: the agent's final text response
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if conversation_history:
        for msg in conversation_history:
            role = msg.get("role")
            if role in ("user", "assistant"):
                messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_message})

    steps = []
    iteration = 0

    while iteration < MAX_ITERATIONS:
        iteration += 1
        _log.info(f"[AGENT] Iteration {iteration} — sending to {MODEL}")

        try:
            response = _openai.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
                max_completion_tokens=8000,
            )
        except Exception as e:
            _log.error(f"[AGENT] OpenAI API error: {e}")
            return _error_response(messages, steps, f"AI service error: {e}")

        choice = response.choices[0]
        assistant_msg = choice.message

        if assistant_msg.tool_calls:
            messages.append({
                "role": "assistant",
                "content": assistant_msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in assistant_msg.tool_calls
                ],
            })

            for tc in assistant_msg.tool_calls:
                tool_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                _log.info(f"[AGENT] Calling tool: {tool_name}({json.dumps(args)[:200]})")

                step = {"tool": tool_name, "args": args, "status": "running", "started_at": time.time()}
                steps.append(step)

                try:
                    result = _execute_tool(tool_name, args, user_id)
                    step["result"] = result
                    step["status"] = "success" if result.get("success", True) else "error"
                except Exception as e:
                    _log.error(f"[AGENT] Tool {tool_name} failed: {e}")
                    result = {"success": False, "error": str(e)}
                    step["result"] = result
                    step["status"] = "error"

                step["finished_at"] = time.time()

                result_str = json.dumps(result, ensure_ascii=False, default=str)
                if len(result_str) > 12000:
                    result_str = result_str[:12000] + "...(truncated)"

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                })

        else:
            final_text = assistant_msg.content or ""
            messages.append({"role": "assistant", "content": final_text})

            return {
                "success": True,
                "messages": _sanitize_messages(messages),
                "steps": steps,
                "final_response": final_text,
            }

    return _error_response(messages, steps, "Agent reached maximum iterations without completing.")


def _execute_tool(tool_name, args, user_id):
    """Execute a tool by name with the given arguments."""
    if tool_name == "get_connected_accounts":
        return get_connected_accounts(user_id)

    func = TOOL_DISPATCH.get(tool_name)
    if not func:
        return {"success": False, "error": f"Unknown tool: {tool_name}"}

    return func(**args)


def _sanitize_messages(messages):
    """Convert messages to a JSON-safe format for the frontend."""
    safe = []
    for msg in messages:
        if msg["role"] == "system":
            continue
        entry = {"role": msg["role"], "content": msg.get("content", "")}

        if msg.get("tool_calls"):
            entry["tool_calls"] = [
                {"name": tc["function"]["name"], "args": _safe_parse(tc["function"]["arguments"])}
                for tc in msg["tool_calls"]
            ]
        if msg.get("tool_call_id"):
            entry["tool_call_id"] = msg["tool_call_id"]
            try:
                entry["tool_result"] = json.loads(msg["content"])
            except (json.JSONDecodeError, TypeError):
                entry["tool_result"] = msg["content"]

        safe.append(entry)
    return safe


def _safe_parse(s):
    try:
        return json.loads(s)
    except Exception:
        return s


def _error_response(messages, steps, error_msg):
    return {
        "success": False,
        "messages": _sanitize_messages(messages),
        "steps": steps,
        "final_response": error_msg,
        "error": error_msg,
    }
