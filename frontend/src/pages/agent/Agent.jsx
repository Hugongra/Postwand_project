import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, CheckCircle2, XCircle, Wrench, Image, FileText, Calendar, Users, Sparkles, Trash2 } from 'lucide-react';
import * as api from '@/services/api/api';

const TOOL_META = {
  generate_content_plan: { icon: FileText, label: 'Generating content plan', color: 'text-blue-500', bg: 'bg-blue-50' },
  generate_caption: { icon: FileText, label: 'Writing caption', color: 'text-purple-500', bg: 'bg-purple-50' },
  generate_image: { icon: Image, label: 'Creating image', color: 'text-pink-500', bg: 'bg-pink-50' },
  get_connected_accounts: { icon: Users, label: 'Checking accounts', color: 'text-green-500', bg: 'bg-green-50' },
  schedule_post: { icon: Calendar, label: 'Scheduling post', color: 'text-orange-500', bg: 'bg-orange-50' },
};

const SUGGESTIONS = [
  "Create a week of Instagram posts for a coffee brand",
  "Plan 5 posts for a fitness coach on Instagram and Facebook",
  "Generate a content calendar for a tech startup launch",
  "Create 3 motivational posts for LinkedIn",
];

export default function Agent() {
  const [messages, setMessages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, steps, loading]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setSteps([]);
    setLoading(true);

    try {
      const res = await api.AgentRun(msg, history);
      if (res.ok && res.data) {
        const agentMessages = res.data.messages || [];
        const agentSteps = res.data.steps || [];
        const finalResponse = res.data.final_response || '';

        setSteps(agentSteps);

        const newHistory = [...history, { role: 'user', content: msg }];
        if (finalResponse) {
          newHistory.push({ role: 'assistant', content: finalResponse });
        }
        setHistory(newHistory);

        setMessages(prev => {
          const updated = [...prev];
          if (agentSteps.length > 0) {
            updated.push({ role: 'steps', steps: agentSteps });
          }
          if (finalResponse) {
            updated.push({ role: 'assistant', content: finalResponse });
          }
          return updated;
        });
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data?.error || 'Something went wrong. Please try again.',
          isError: true,
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, history]);

  const handleClear = () => {
    setMessages([]);
    setSteps([]);
    setHistory([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Agent</h1>
            <p className="text-xs text-gray-500">Autonomous content planning & publishing</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100 transition-all px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell the agent what to create..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            The agent can plan content, generate images, and schedule posts autonomously.
          </p>
        </div>
      </div>
    </div>
  );
}


function EmptyState({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-200/50">
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Planning Agent</h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        Describe what you need and the agent will autonomously plan content, generate images,
        and schedule posts to your connected social media accounts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s)}
            className="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 transition-all text-gray-600 hover:text-gray-900"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}


function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.role === 'steps') {
    return <StepsDisplay steps={msg.steps} />;
  }

  if (msg.role === 'assistant') {
    return (
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mt-0.5">
          <Bot size={14} className="text-white" />
        </div>
        <div className={`max-w-[85%] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed ${msg.isError ? 'text-red-600' : ''}`}>
          <FormattedContent content={msg.content} />
        </div>
      </div>
    );
  }

  return null;
}


function FormattedContent({ content }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
      return (
        <pre key={i} className="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
          {code}
        </pre>
      );
    }

    const lines = part.split('\n');
    return lines.map((line, j) => {
      const boldedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <div key={`${i}-${j}`} className="ml-4" dangerouslySetInnerHTML={{ __html: `• ${boldedLine.slice(2)}` }} />;
      }
      if (/^#{1,3}\s/.test(line)) {
        const text = line.replace(/^#{1,3}\s/, '');
        return <div key={`${i}-${j}`} className="font-semibold mt-2" dangerouslySetInnerHTML={{ __html: text }} />;
      }
      return <span key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: boldedLine + (j < lines.length - 1 ? '\n' : '') }} />;
    });
  });
}


function StepsDisplay({ steps }) {
  const [expanded, setExpanded] = useState({});

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
        <Wrench size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 space-y-2">
        {steps.map((step, i) => {
          const meta = TOOL_META[step.tool] || { icon: Wrench, label: step.tool, color: 'text-gray-500', bg: 'bg-gray-50' };
          const Icon = meta.icon;
          const isExpanded = expanded[i];
          const isSuccess = step.status === 'success';
          const duration = step.finished_at && step.started_at
            ? ((step.finished_at - step.started_at)).toFixed(1)
            : null;

          return (
            <div key={i} className={`rounded-xl border border-gray-100 overflow-hidden ${meta.bg}`}>
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
              >
                <Icon size={14} className={meta.color} />
                <span className="text-sm font-medium text-gray-700 flex-1">{meta.label}</span>
                {duration && <span className="text-xs text-gray-400">{duration}s</span>}
                {isSuccess ? (
                  <CheckCircle2 size={14} className="text-green-500" />
                ) : step.status === 'error' ? (
                  <XCircle size={14} className="text-red-500" />
                ) : (
                  <Loader2 size={14} className="text-gray-400 animate-spin" />
                )}
              </button>
              {isExpanded && step.result && (
                <div className="px-3 pb-2">
                  <ToolResult tool={step.tool} result={step.result} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function ToolResult({ tool, result }) {
  if (tool === 'generate_content_plan' && result.plan?.posts) {
    return (
      <div className="space-y-2 mt-1">
        {result.plan.posts.map((post, i) => (
          <div key={i} className="bg-white rounded-lg p-2.5 text-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-700">Day {post.day || i + 1}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 capitalize">{post.platform}</span>
              {post.post_type && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 capitalize">{post.post_type}</span>
                </>
              )}
            </div>
            <p className="text-gray-600 font-medium mb-1">{post.idea}</p>
            {post.caption && (
              <p className="text-gray-500 line-clamp-2">{post.caption}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (tool === 'generate_image' && result.image_url) {
    const src = result.image_url;
    if (src.startsWith('http')) {
      return <img src={src} alt="Generated" className="rounded-lg max-w-xs mt-1 shadow-sm" />;
    }
    return <img src={src} alt="Generated" className="rounded-lg max-w-xs mt-1 shadow-sm" />;
  }

  if (tool === 'generate_caption' && result.caption) {
    return (
      <div className="bg-white rounded-lg p-2.5 text-xs border border-gray-100 mt-1">
        <p className="text-gray-700 whitespace-pre-wrap">{result.caption}</p>
      </div>
    );
  }

  if (tool === 'get_connected_accounts' && result.accounts) {
    const platforms = Object.keys(result.accounts);
    if (platforms.length === 0) {
      return <p className="text-xs text-gray-500 mt-1">No accounts connected</p>;
    }
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {platforms.map(p => (
          <span key={p} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600 capitalize">
            {p} ({result.accounts[p].length})
          </span>
        ))}
      </div>
    );
  }

  if (tool === 'schedule_post') {
    return (
      <p className="text-xs mt-1 text-green-600 font-medium">
        {result.result?.message || 'Post scheduled successfully'}
      </p>
    );
  }

  return (
    <pre className="text-xs text-gray-500 mt-1 overflow-x-auto max-h-32">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}


function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={14} className="animate-spin" />
        <span>Agent is thinking...</span>
      </div>
    </div>
  );
}
