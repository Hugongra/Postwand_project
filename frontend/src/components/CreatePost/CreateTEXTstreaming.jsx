import { useState, useEffect, useRef } from 'react';
import { Upload, ArrowUp, Loader2, X, Pencil, MessageSquare, Eye, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import PostPreview from '../scheduler/preview/PostPreview';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Constants for fake social media data
const SOCIAL_MEDIA_DATA = {
  facebook: {
    pages: [{ id: 'fb_page_1', name: 'Facebook Page', profile_picture: '/images/no-photos.svg' }]
  },
  instagram: {
    accounts: [{ id: 'ig_account_1', name: 'Instagram Account', profile_picture: '/images/no-photos.svg' }]
  },
  threads: {
    accounts: [{ id: 'threads_account_1', name: 'Threads Account', profilePicture: '/images/no-photos.svg' }]
  },
  linkedin: {
    accounts: [{ id: 'linkedin_account_1', name: 'LinkedIn Account', profile_picture: '/images/no-photos.svg' }]
  }
};

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'linkedin', name: 'LinkedIn' }
];

const CHAT_MODES = {
  ASK: 'ask',
  WRITE_POST: 'write_post'
};

export const CreateText = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState(CHAT_MODES.ASK);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDocumentView, setShowDocumentView] = useState(false);
  const [activeDocumentPlatform, setActiveDocumentPlatform] = useState('facebook');
  
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram', 'linkedin']);
  const [selectedPages, setSelectedPages] = useState({
    facebook: 'fb_page_1',
    instagram: 'ig_account_1',
    threads: 'threads_account_1',
    linkedin: 'linkedin_account_1',
    post_type: 'post'
  });
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const modeSelectorRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check for image from query params
  useEffect(() => {
    const imageFromParams = searchParams.get('image');
    if (imageFromParams) {
      setImageUrl(decodeURIComponent(imageFromParams));
    }
  }, [searchParams]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const currentInput = input;
    setInput('');
    
    // Don't create placeholder - wait for first chunk
    const aiMessageId = messages.length + 2;
    let aiMessageCreated = false;
    
    try {
      // REAL STREAMING with EventSource
      const response = await fetch('https://threads-dev.local:5000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: currentInput,
          mode: chatMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Streaming setup failed');
      }
      
      // Use ReadableStream for real-time processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';
      
      const processChunk = async () => {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsLoading(false);
          return;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                fullResponse += data.content;
                
                // Create AI message on first chunk only
                if (!aiMessageCreated) {
                  const newAiMessage = {
                    id: aiMessageId,
                    text: fullResponse,
                    sender: 'ai',
                    structuredPosts: null
                  };
                  setMessages(prev => [...prev, newAiMessage]);
                  aiMessageCreated = true;
                  setIsLoading(false); // Remove loading as soon as first chunk arrives
                } else {
                  // Update existing AI message
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, text: fullResponse }
                      : msg
                  ));
                }
              } else if (data.type === 'complete') {
                fullResponse = data.full_response;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, text: fullResponse }
                    : msg
                ));
                setIsLoading(false);
                
                // Populate content field when in write_post mode
                if (chatMode === CHAT_MODES.WRITE_POST && fullResponse) {
                  setContent(fullResponse);
                }
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Skip invalid JSON chunks
            }
          }
        }
        
        // Continue reading next chunk
        processChunk();
      };
      
      await processChunk();
      
    } catch (error) {
      console.error('Error with streaming:', error);
      // Fallback to regular API
      try {
        const response = await fetch('https://threads-dev.local:5000/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: currentInput,
            mode: chatMode
          })
        });
        
        const data = await response.json();
        
        const aiResponse = {
          id: aiMessageId,
          text: data.success ? data.message : "Sorry, I'm having trouble responding right now. Please try again.",
          sender: 'ai',
          structuredPosts: data.structured_content?.posts || null
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        if (chatMode === CHAT_MODES.WRITE_POST && data.structured_content?.posts?.length > 0) {
          setContent(data.structured_content.posts[0].content_with_hashtags);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setMessages(prev => [...prev, {
          id: aiMessageId,
          text: "Sorry, I'm having trouble connecting. Please try again.",
          sender: 'ai'
        }]);
      }
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    const newHeight = Math.min(Math.max(e.target.scrollHeight, 112), 200);
    e.target.style.height = newHeight + 'px';
    e.target.style.overflowY = newHeight >= 200 ? 'auto' : 'hidden';
  };

  const removePost = (messageId, postIndex) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, structuredPosts: msg.structuredPosts.filter((_, i) => i !== postIndex) }
        : msg
    ));
  };

  const removeHashtag = (messageId, postIndex, hashtagIndex) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            structuredPosts: msg.structuredPosts.map((p, pIdx) => 
              pIdx === postIndex 
                ? { ...p, hashtags: p.hashtags.filter((_, hIdx) => hIdx !== hashtagIndex) }
                : p
            )
          }
        : msg
    ));
  };

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch('https://threads-dev.local:5000/api/chat/history', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.history.length > 0) {
          const formattedMessages = data.history.map((msg, index) => ({
            id: index + 1,
            text: msg.content,
            sender: msg.role === 'user' ? 'user' : 'ai',
            // Preserve structured posts if they exist
            structuredPosts: msg.structured_posts || null
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  // Scroll to bottom when messages change - only if already at bottom
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const { scrollHeight, scrollTop, clientHeight } = container;
    
    // Check if user is near bottom (within 150px threshold for smoother experience)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // Only scroll if user is already near bottom or it's a new user message
    if (isNearBottom || (messages.length > 0 && messages[messages.length - 1]?.sender === 'user')) {
      // Use scrollTo for smoother experience during streaming
      container.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Handle clicking outside mode selector to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target)) {
        setShowModeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const EmptyState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500 max-w-md">
        <h3 className="text-lg font-medium mb-2">Welcome to Postwand AI Chat</h3>
        <p className="text-sm mb-4">
          I'm here to help you with social media content and answer your questions.
        </p>
        
      </div>
    </div>
  );

  const StructuredPosts = ({ posts, messageId }) => (
    <div className="flex justify-start">
      <div className="max-w-xs lg:max-w-full space-y-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Post Suggestions:</h4>
        {posts.map((post, index) => (
          <div
            key={post.id || index}
            className="relative p-3 bg-gradient-to-r from-blue-200/50 to-blue-100/50 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:translate-y-[-2px] transition-all duration-200"
            onClick={() => setContent(post.content_with_hashtags)}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-1.5"
              onClick={(e) => {
                e.stopPropagation();
                if (content === post.content_with_hashtags || content === post.content) {
                  setContent('');
                }
                removePost(messageId, index);
              }}
            >
              <X size={16} />
            </button>
            <div className="text-md text-gray-800 mb-2 pr-6">
              {post.content}
            </div>
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((hashtag, idx) => (
                  <span 
                    key={idx} 
                    className={`relative inline-flex items-center text-xs px-2 py-1 rounded-xl pr-6 text-blue-800 bg-blue-200`}
                  >
                    {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                    <button
                      className="absolute right-1 top-1 text-blue-600 hover:text-blue-800 p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (content === post.content_with_hashtags || content === post.content) {
                          const updatedHashtags = post.hashtags.filter((_, hashIdx) => hashIdx !== idx);
                          const newContent = updatedHashtags.length > 0 
                            ? `${post.content} ${updatedHashtags.join(' ')}`
                            : post.content;
                          setContent(newContent);
                        }
                        removeHashtag(messageId, index, idx);
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );



  return (
    <div className="w-full h-screen flex bg-primary">
      {/* LEFT SIDE - Post Preview */}
      <div className="w-[60%] h-full overflow-y-auto no-scrollbar relative">
        <div className="w-full flex justify-between items-center p-4">
        {/* Back to Create Post Button */}
        <button
          onClick={() => navigate('/create-post')}
          className="top-4 left-4 z-10 flex items-center gap-2  hover:bg-white  rounded-lg px-3 py-1.5  transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back</span>
        </button>

        

        {/* Toggle Button */}
        <button
          onClick={() => setShowDocumentView(!showDocumentView)}
          className="top-4 right-4 z-10  hover:bg-gray-50 rounded-lg p-2 shadow-sm transition-all duration-200"
          title={showDocumentView ? "Show Preview" : "Show Document View"}
        >
          {showDocumentView ? <Eye size={20} /> : <FileText size={20} />}
        </button>

        {/* Schedule Post Button */}
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (content) {
              params.set('content', content);
            }
            if (imageUrl) {
              params.set('image', encodeURIComponent(imageUrl));
            }
            navigate(`/scheduler?${params.toString()}`);
          }}
          className="top-4 left-4 z-10 flex items-center gap-2  hover:bg-white  rounded-lg px-3 py-1.5  transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          Post <ArrowRight size={16} />
        </button>
</div>
        {/* Content Area */}
        {showDocumentView ? (
          <div className="w-[80%] h-full bg-white p-4 mx-auto   overflow-y-none  rounded-2xl">
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                {selectedPlatforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setActiveDocumentPlatform(platform)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize ${
                      activeDocumentPlatform === platform 
                        ? 'bg-gray-300 text-gray-700 ' 
                        : 'bg-gray-200/50 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
              
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Write your ${activeDocumentPlatform} post content here...`}
                className="w-full h-96 text-gray-900 p-4 resize-none focus:outline-none focus:border-transparent whitespace-pre-wrap font-sans text-base leading-relaxed"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>
        ) : (
          <div className='w-[90%] mx-auto'>
            <PostPreview
              facebookData={SOCIAL_MEDIA_DATA.facebook}
              instagramData={SOCIAL_MEDIA_DATA.instagram}
              threadsData={SOCIAL_MEDIA_DATA.threads}
              linkedinData={SOCIAL_MEDIA_DATA.linkedin}
              selectedPlatforms={selectedPlatforms}
              selectedPages={selectedPages}
              imageUrl={imageUrl}
              content={content}
              isGeneratingImage={false}
              generationProgress={0}
              videoUrl={null}
            />
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Chat Implementation */}
      <div className="w-[40%] h-full flex flex-col bg-gray-50 shadow-md">
        {/* Header */}
        <div className="w-full h-12 flex items-center px-4 bg-gray-50">
          <h2 className="text-md text-gray-800">Post Generator</h2>
        </div>
        
        {/* Messages Area - Scrollable with gradient overlay */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={messagesContainerRef} className="h-full overflow-y-auto simple-scrollbar p-4 space-y-4">
            
            {messages.length === 0 && !isLoading && <EmptyState />}
            
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-full px-4 py-2 rounded-xl ${
                    message.sender === 'user' ? 'bg-gray-200' : 'bg-gray-200/50 text-gray-800'
                  }`}>
                    <p className="text-md text-gray-700  whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
                
                {message.structuredPosts?.length > 0 && (
                  <StructuredPosts posts={message.structuredPosts} messageId={message.id} />
                )}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 via-gray-50/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="shrink-0 bg-gray-50 px-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              placeholder={
                chatMode === CHAT_MODES.WRITE_POST 
                  ? "Describe the content you want to create..."
                  : "Ask me anything about social media..."
              }
              className="w-full text-sm min-h-[112px] p-4 pr-24 shadow-lg bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none  no-scrollbar"
              style={{ height: '112px' }}
            />
            
            {/* Buttons wrapper */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-white pointer-events-none rounded-b-2xl m-2">
              {/* Mode Selector */}
              <div ref={modeSelectorRef} className="absolute left-3 bottom-3 pointer-events-auto">
                <button 
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  <span>{chatMode === CHAT_MODES.ASK ? <MessageSquare size={16} /> : <Pencil size={16} />}</span>
                  <span className="font-medium">
                    {chatMode === CHAT_MODES.ASK ? 'Ask' : 'Write Post'}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mode Selector Popup */}
                {showModeSelector && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                    <button
                      onClick={() => {
                        setChatMode(CHAT_MODES.ASK);
                        setShowModeSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatMode === CHAT_MODES.ASK ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <MessageSquare size={16} />
                      <span>Ask</span>
                    </button>
                    <button
                      onClick={() => {
                        setChatMode(CHAT_MODES.WRITE_POST);
                        setShowModeSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatMode === CHAT_MODES.WRITE_POST ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <Pencil size={16} />  
                      <span>Write Post</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Upload button */}
              <button 
                className="absolute right-14 bottom-3 text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-xl transition-colors pointer-events-auto"
                title="Upload image"
              >
                <Upload size={20} />
              </button>
              
              {/* Submit button */}
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading} 
                className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-xl p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateText;