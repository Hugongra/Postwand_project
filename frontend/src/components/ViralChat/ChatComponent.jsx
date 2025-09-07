import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, ArrowUp, Loader2 } from 'lucide-react';
import { useTranslations } from '../../hooks/useTranslations';

// Optimized markdown parser for Claude API responses
const parseMarkdown = (text, t) => {
  if (!text) return <div className="text-gray-800">{t('viralChat.noContent')}</div>;
  
  // Process inline formatting
  const processInline = (str) => {
    if (!str) return str;
    
    // Handle **bold** text - Claude uses this frequently
    const parts = str.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      // Handle *italic* text
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      // Handle `code` text
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 mb-4 space-y-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm font-mono">{codeBlockContent.join('\n')}</code>
        </pre>
      );
      codeBlockContent = [];
    }
  };

  lines.forEach((line, i) => {
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }
    
    const trimmed = line.trim();
    
    // Empty lines
    if (!trimmed) {
      flushList();
      if (elements.length > 0) {
        elements.push(<div key={`space-${i}`} className="h-3" />);
      }
      return;
    }
    
    // Handle headings (Claude often uses these)
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">
          {processInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">
          {processInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
          {processInline(trimmed.substring(2))}
        </h1>
      );
    } 
    // Handle numbered lists (Claude uses these often)
    else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      if (currentList.length === 0) {
        // Start new numbered list
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 mb-4 space-y-1">
          </ol>
        );
      }
      const content = trimmed.replace(/^\d+\.\s/, '');
      elements[elements.length - 1] = React.cloneElement(
        elements[elements.length - 1],
        {},
        ...elements[elements.length - 1].props.children,
        <li key={i} className="text-gray-800 leading-relaxed">
          {processInline(content)}
        </li>
      );
    }
    // Handle bullet points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(
        <li key={i} className="text-gray-800 leading-relaxed">
          {processInline(trimmed.substring(2))}
        </li>
      );
    }
    // Handle blockquotes (Claude sometimes uses these)
    else if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700">
          {processInline(trimmed.substring(2))}
        </blockquote>
      );
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={i} className="mb-3 text-gray-800 leading-relaxed">
          {processInline(trimmed)}
        </p>
      );
    }
  });
  
  // Flush any remaining content
  flushList();
  flushCodeBlock();
  
  return <div className="space-y-1">{elements}</div>;
};

const ChatComponent = ({ isOpen, onClose, whiteboardName }) => {
  const { t } = useTranslations();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Add CSS animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes waterDropExpand {
        0% {
          transform: scale(0) translateX(100px) translateY(100px);
          opacity: 0;
        }
        100% {
          transform: scale(1) translateX(0) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (!isLoading && isOpen) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading, isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`https://app.postwand.io/api/viral-chat`, {
        method: 'POST',
        headers: {  
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          whiteboardName: whiteboardName || 'Untitled Whiteboard'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || 'No response received' 
      }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 lg:left-64 bg-primary z-50 flex flex-col h-screen overflow-hidden ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    style={{
      animation: isOpen ? 'waterDropExpand 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : '',
      transformOrigin: 'bottom right',
    }}>
      {/* Header */}
      <div className="flex items-center justify-end p-4">
      
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
        >
          <X size={24} />
        </button>
      </div>

      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto bg-primary">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="py-16 text-center text-gray-500">
             
              <h2 className="text-2xl font-semibold mb-2">{t('viralChat.welcomeTitle')}</h2>
              <p className="text-lg">{t('viralChat.welcomeMessage')}</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`py-6 ${
                msg.role === 'user' 
                  ? 'bg-white' 
                  : 'bg-gray-50'
              }`}
            >
              <div className="max-w-3xl mx-auto px-4 flex">
                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0 bg-pink-500 text-white`}>
                    A
                  </div>
                )}
                <div className="flex-1">
                  {msg.role === 'assistant' ? (
                    <div className="leading-relaxed">
                      {parseMarkdown(msg.content, t)}
                    </div>
                  ) : (
                    <div className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="py-6 bg-gray-50">
              <div className="max-w-3xl mx-auto px-4 flex">
                <div className="text-gray-800">
                  <div className="flex items-center">
                    <div className="animate-pulse text-base">{t('viralChat.thinking')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
      
      {/* Input area */}
      <div className="shrink-0 bg-primary p-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t('viralChat.messagePlaceholder')}
              className="w-full text-sm min-h-[112px] max-h-[300px] p-4 pr-24 shadow-lg bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
            />
            
            {/* Buttons wrapper */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-white pointer-events-none rounded-b-2xl">
              {/* Submit button */}
              <button 
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading} 
                className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-xl p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
              >
                {isLoading ? <Loader2 size={20} /> : <ArrowUp size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;