import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Wand2, ArrowUp, Loader2, Trash2, Copy, Check, X, Send } from 'lucide-react';
import { FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateText } from '@/context/CreateTextContext';
import { useState } from 'react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, gradient: 'from-purple-500 to-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: FaFacebookF, gradient: 'from-blue-600 to-blue-400' },
  { id: 'threads', label: 'Threads', icon: SiThreads, gradient: 'from-gray-800 to-gray-600' },
  { id: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, gradient: 'from-blue-700 to-blue-500' },
];

const MODES = [
  { value: 'write_post', icon: Pencil, label: 'Write Post' },
  { value: 'ask', icon: Wand2, label: 'Ask' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-100"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
}

function PostCard({ post, onUseInPost, onPublishNow }) {
  const platform = PLATFORMS.find((p) => p.id === post.platform?.toLowerCase());
  const Icon = platform?.icon;

  return (
    <div className="group relative rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className={`h-1 w-full bg-gradient-to-r ${platform?.gradient || 'from-gray-400 to-gray-300'}`} />
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-gray-500" size={13} />}
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {platform?.label || post.platform}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton text={post.content_with_hashtags} />
          </div>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content_with_hashtags}
        </p>
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-50">
          {onPublishNow && (
            <button
              onClick={(e) => { e.stopPropagation(); onPublishNow(post); }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
            >
              <Send size={12} /> Publish
            </button>
          )}
          {onUseInPost && (
            <button
              onClick={(e) => { e.stopPropagation(); onUseInPost(post); }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={12} /> Edit & Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onUseInPost, onPublishNow, attachedImage }) {
  const isUser = msg.role === 'user';
  const hasPosts = msg.structured_posts?.length > 0;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%]`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gray-900 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        </div>

        {hasPosts && (
          <div className="mt-2.5 space-y-2">
            {attachedImage && (
              <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <img
                  src={attachedImage}
                  alt="Post image"
                  className="w-full max-h-72 object-cover"
                />
              </div>
            )}
            {msg.structured_posts.map((post, i) => (
              <PostCard key={i} post={post} onUseInPost={onUseInPost} onPublishNow={onPublishNow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateText() {
  const {
    chatHistory,
    isLoading,
    mode,
    setMode,
    selectedPlatforms,
    togglePlatform,
    input,
    setInput,
    sendMessage,
    clearHistory,
    attachedImage,
    setAttachedImage,
  } = useCreateText();

  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const img = location.state?.attachedImage;
    if (img) {
      setAttachedImage(img);
      setInput('Write a caption for this image');
      window.history.replaceState({}, '');
    }
  }, [location.state, setAttachedImage, setInput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseInPost = (post) => {
    navigate('/scheduler', {
      state: {
        preloadedImage: attachedImage || null,
        preloadedContent: post.content_with_hashtags,
      },
    });
  };

  const handlePublishNow = (post) => {
    navigate('/scheduler', {
      state: {
        preloadedImage: attachedImage || null,
        preloadedContent: post.content_with_hashtags,
        publishNow: true,
      },
    });
  };

  return (
    <div className="w-full h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      {/* Top bar — matches ChatMenu position in EditImage */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 text-sm">
        {chatHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center justify-center px-2 py-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} className="mr-1" /> Clear
          </button>
        )}
      </div>

      {/* Attached image strip */}
      {attachedImage && (
        <div className="shrink-0 mx-4 mt-12 flex items-center gap-3 bg-white rounded-xl shadow-sm p-2.5 border border-gray-100">
          <img src={attachedImage} alt="Attached" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Image attached</p>
            <p className="text-xs text-gray-400">Captions will be generated for this image</p>
          </div>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Empty state / Chat area */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden px-4 ${attachedImage ? 'pt-4' : 'pt-14'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {chatHistory.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Text</h1>
              <p className="text-gray-500">
                {attachedImage
                  ? 'Generate captions for your image'
                  : 'Describe what you want to post about'}
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md mx-auto">
                {(attachedImage
                  ? [
                    'Write engaging captions for this image',
                    'Create a product showcase caption',
                    'Write a storytelling caption',
                    'Generate hashtags for this post',
                  ]
                  : [
                    'Product launch announcement',
                    'Behind the scenes content',
                    'Tips and educational post',
                    'Customer success story',
                  ]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-xs px-3 py-2 rounded-full border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4 pb-4">
            {chatHistory.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onUseInPost={handleUseInPost}
                onPublishNow={handlePublishNow}
                attachedImage={attachedImage}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-gray-400 ml-1">Generating...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input — same structure as EditImage ChatInput */}
      <div className="shrink-0 bg-primary pb-3">
        <div className="max-w-3xl mx-auto relative">
          {/* Platform chips above the textarea when write_post */}
          {mode === 'write_post' && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="text-[11px] text-gray-400 mr-0.5">Platforms:</span>
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const active = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? 'border-pink-300 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-sm'
                        : 'border-gray-200 text-gray-400 hover:border-pink-200 hover:text-pink-400'
                    }`}
                  >
                    <Icon size={10} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full text-sm min-h-[112px] max-h-[300px] p-4 pr-24 shadow-lg bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
            placeholder={
              mode === 'write_post'
                ? 'Describe what you want to post about...'
                : 'Ask anything about social media content...'
            }
          />

          {/* Bottom bar inside textarea — matches EditImage ChatInput exactly */}
          <div className="absolute inset-x-0 bottom-0 h-11 bg-white pointer-events-none rounded-b-2xl">
            <div className="flex items-center space-x-2 pointer-events-auto px-3">
              <Select value={mode} onValueChange={setMode} disabled={isLoading}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center space-x-2">
                          <Icon size={15} />
                          <span>{m.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-lg p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
