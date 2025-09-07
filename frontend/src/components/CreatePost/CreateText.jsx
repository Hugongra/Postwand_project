import { useState, useEffect, useRef } from 'react';
import { Upload, 
  ArrowUp, 
  Loader2, 
  X, 
  Pencil, 
  MessageSquare, 
  Eye, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Repeat,
  Wand2,
  ScissorsLineDashed,
  CircleFadingArrowUp,
  ScrollText,
  Plus
} from 'lucide-react';
import PostPreview from '../scheduler/preview/Postpreview';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';

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
  const { t } = useTranslations();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAsk, setIsLoadingAsk] = useState(false);
  const [chatMode, setChatMode] = useState(CHAT_MODES.ASK);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDocumentView, setShowDocumentView] = useState(true);
  const [activeDocumentPlatform, setActiveDocumentPlatform] = useState('facebook');

  const [showTextActionsMenu, setShowTextActionsMenu] = useState(false);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  
  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedSentences, setAnimatedSentences] = useState([]);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram', 'linkedin']); // Start with all platforms selected
  const [selectedPages, setSelectedPages] = useState({
    facebook: 'fb_page_1',
    instagram: 'ig_account_1',
    threads: 'threads_account_1',
    linkedin: 'linkedin_account_1',
    post_type: 'post'
  });
  const [content, setContent] = useState('');
  const [platformContent, setPlatformContent] = useState({
    facebook: '',
    instagram: '',
    linkedin: ''
  });
  const [imageUrl, setImageUrl] = useState('');
  
  const messagesEndRef = useRef(null);
  const modeSelectorRef = useRef(null);
  const textActionsRef = useRef(null);
  const hideMenuTimer = useRef(null);
  const platformDropdownRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check for image from query params
  useEffect(() => {
    const imageFromParams = searchParams.get('image');
    if (imageFromParams) {
      setImageUrl(decodeURIComponent(imageFromParams));
    }
  }, [searchParams]);


  const handleActionMessage = async (action) => {
    console.log('Action:', action);
    
    if (action === "Ask") {
      setShowAskDialog(true);
      setShowTextActionsMenu(false);
      return;
    }else{
      setIsAnimating(true);
    }
    
    const currentContent = platformContent[activeDocumentPlatform] || '';
    if (!currentContent.trim()) {
      alert(t('createText.noContentToModify'));
      return;
    }
    
    try {
      const response = await fetch('https://app.postwand.io/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: action,
          content: currentContent,
          platform: activeDocumentPlatform
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlatformContent(prev => ({
          ...prev,
          [activeDocumentPlatform]: data.modified_content
        }));
        setIsAnimating(false);
      } else {
        alert(data.error || t('messages.errorOccurred'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('messages.errorOccurred'));
    }
  };

  const handleAskSubmit = async () => {
    if (!askInput.trim()) return;
    setIsAnimating(true);
    setIsLoadingAsk(true);
    setShowAskDialog(true);

    const currentContent = platformContent[activeDocumentPlatform] || '';
    if (!currentContent.trim()) {
      alert(t('createText.noContentToModify'));
      return;
    }
    
    try {
      const response = await fetch('https://app.postwand.io/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "Ask",
          content: currentContent,
          platform: activeDocumentPlatform,
          user_input: askInput
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlatformContent(prev => ({
          ...prev,
          [activeDocumentPlatform]: data.modified_content
        }));
        setShowAskDialog(false);
        setAskInput('');
        setIsAnimating(false);
        setAskInput('');
        setIsLoadingAsk(false);
      } else {
        alert(data.error || t('messages.errorOccurred'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('messages.errorOccurred'));
    }
  };

  const handleAskTextareaChange = (e) => {
    setAskInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    const newHeight = Math.min(Math.max(e.target.scrollHeight, 48), 200);
    e.target.style.height = newHeight + 'px';
    e.target.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
  };

  const handleSendMessage = async (messageToSend = null) => {
    
    
    const textToSend = messageToSend || input;
    if (!textToSend.trim() || isLoading) {
     
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      text: textToSend,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    

    
    const currentInput = textToSend;
    setInput('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: currentInput,
          mode: chatMode,
          platforms: selectedPlatforms // This will now be the selected platforms only
        })
      });
      
      const data = await response.json();
      
      const aiResponse = {
        id: messages.length + 2,
        text: data.success ? data.message : "Sorry, I'm having trouble responding right now. Please try again.",
        sender: 'ai',
        structuredPosts: data.structured_content?.posts || null
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Populate platform-specific content when in write_post mode with structured content
      if (chatMode === CHAT_MODES.WRITE_POST && data.structured_content?.posts?.length > 0) {
        const posts = data.structured_content.posts;
        const newPlatformContent = { ...platformContent };
        const platformsWithContent = [];
        
        posts.forEach(post => {
          const platform = post.platform?.toLowerCase();
          if (platform && ['facebook', 'instagram', 'linkedin'].includes(platform)) {
            newPlatformContent[platform] = post.content_with_hashtags;
            if (!platformsWithContent.includes(platform)) {
              platformsWithContent.push(platform);
            }
          }
        });
        
        setPlatformContent(newPlatformContent);
        
        // Auto-select platforms that have generated content
        if (platformsWithContent.length > 0) {
          setSelectedPlatforms(prev => {
            const newSelected = [...new Set([...prev, ...platformsWithContent])];
            // Set the first platform with content as active
            if (!newSelected.includes(activeDocumentPlatform)) {
              setActiveDocumentPlatform(platformsWithContent[0]);
            }
            return newSelected;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleAskKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskSubmit();
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
        const response = await fetch('https://app.postwand.io/api/chat/history', { credentials: 'include' });
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle clicking outside mode selector and text actions menu to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target)) {
        setShowModeSelector(false);
      }
      if (textActionsRef.current && !textActionsRef.current.contains(event.target)) {
        setShowTextActionsMenu(false);
      }
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target)) {
        setShowPlatformDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    };
  }, []);

  // Handle platform selection
  const handlePlatformClick = (platform) => {
    // Only allow switching to selected platforms
    if (selectedPlatforms.includes(platform)) {
      setActiveDocumentPlatform(platform);
    }
  };

  const handleRemovePlatform = (platform) => {
    setSelectedPlatforms(prev => {
      const newSelected = prev.filter(p => p !== platform);
      // If removing the active platform, switch to first selected or reset if none
      if (platform === activeDocumentPlatform) {
        if (newSelected.length > 0) {
          setActiveDocumentPlatform(newSelected[0]);
        } else {
          // Reset to first platform if no platforms are selected
          setActiveDocumentPlatform('facebook');
        }
      }
      return newSelected;
    });
  };

  const handleAddPlatform = (platform) => {
    if (!selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(prev => [...prev, platform]);
      setActiveDocumentPlatform(platform);
    }
    setShowPlatformDropdown(false);
  };

  const handleAddAllPlatforms = () => {
    const allPlatformIds = PLATFORMS.map(p => p.id);
    setSelectedPlatforms(allPlatformIds);
    setActiveDocumentPlatform(allPlatformIds[0]);
    setShowPlatformDropdown(false);
  };

  // Get available platforms for the dropdown (not currently selected)
  const getAvailablePlatforms = () => {
    return PLATFORMS.filter(platform => !selectedPlatforms.includes(platform.id));
  };

  // Handle text actions menu hover with delay
  const handleTextActionsHover = () => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    setShowTextActionsMenu(true);
  };

  const handleTextActionsLeave = () => {
    hideMenuTimer.current = setTimeout(() => setShowTextActionsMenu(false), 300);
  };

  const handleTextActionsMenuHover = () => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
  };

  const EmptyState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500 max-w-md">
        <h3 className="text-lg font-medium mb-2">{t('createText.welcomeTitle')}</h3>
        <p className="text-sm mb-4">
          {t('createText.welcomeMessage')}
        </p>
        
      </div>
    </div>
  );

  // Function to get platform-specific styling
  const getPlatformStyling = (platform) => {
    const platformLower = platform?.toLowerCase() || '';
    
    switch (platformLower) {
      case 'instagram':
        return {
          postBg: 'bg-gradient-to-r from-purple-200/50 to-pink-100/50',
          hashtagBg: 'bg-purple-300/50',
          hashtagText: 'text-purple-800',
          hashtagHover: 'text-purple-600 hover:text-purple-800'
        };
      case 'facebook':
        return {
          postBg: 'bg-gradient-to-r from-blue-400/80 to-blue-200/80',
          hashtagBg: 'bg-blue-200/50',
          hashtagText: 'text-blue-900',
          hashtagHover: 'text-blue-700 hover:text-blue-900'
        };
      case 'linkedin':
      default:
        return {
          postBg: 'bg-gradient-to-r from-blue-200/80 to-blue-100/50',
          hashtagBg: 'bg-blue-300/50',
          hashtagText: 'text-blue-800',
          hashtagHover: 'text-blue-600 hover:text-blue-800'
        };
    }
  };

  const StructuredPosts = ({ posts, messageId }) => (
    <div className="flex justify-start">
      <div className="max-w-xs lg:max-w-full space-y-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('createText.postSuggestions')}</h4>
        {posts.map((post, index) => {
          const styling = getPlatformStyling(post.platform);
          return (
            <div
              key={post.id || index}
              className={`relative p-3 ${styling.postBg} rounded-xl cursor-pointer hover:translate-y-[-2px] transition-all duration-200`}
              onClick={() => {
                const platform = post.platform?.toLowerCase();
                if (platform && ['facebook', 'instagram', 'linkedin'].includes(platform)) {
                  setPlatformContent(prev => ({
                    ...prev,
                    [platform]: post.content_with_hashtags
                  }));
                  // Auto-select and switch to this platform
                  if (!selectedPlatforms.includes(platform)) {
                    setSelectedPlatforms(prev => [...prev, platform]);
                  }
                  setActiveDocumentPlatform(platform);
                } else {
                  setContent(post.content_with_hashtags);
                }
              }}
            >
              {/* Platform label */}
              {post.platform && (
                <div className="absolute top-2 left-2 text-xs font-medium text-gray-800 capitalize bg-white/80 px-2 py-1 rounded-md">
                  {post.platform}
                </div>
              )}
             
              <div className="text-md text-gray-800 mb-2 pr-6 pt-6 whitespace-pre-wrap">
                {post.content}
              </div>
              {post.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((hashtag, idx) => (
                    <span 
                      key={idx} 
                      className={`relative inline-flex items-center text-xs px-2 py-1 rounded-lg pr-6 ${styling.hashtagText} ${styling.hashtagBg}`}
                    >
                      {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                                             <button
                         className={`absolute right-1 top-1 ${styling.hashtagHover} p-0.5`}
                         onClick={(e) => {
                           e.stopPropagation();
                           const platform = post.platform?.toLowerCase();
                           if (platform && ['facebook', 'instagram', 'linkedin'].includes(platform)) {
                             if (platformContent[platform] === post.content_with_hashtags || platformContent[platform] === post.content) {
                               const updatedHashtags = post.hashtags.filter((_, hashIdx) => hashIdx !== idx);
                               const newContent = updatedHashtags.length > 0 
                                 ? `${post.content} ${updatedHashtags.join(' ')}`
                                 : post.content;
                               setPlatformContent(prev => ({
                                 ...prev,
                                 [platform]: newContent
                               }));
                             }
                           } else {
                             if (content === post.content_with_hashtags || content === post.content) {
                               const updatedHashtags = post.hashtags.filter((_, hashIdx) => hashIdx !== idx);
                               const newContent = updatedHashtags.length > 0 
                                 ? `${post.content} ${updatedHashtags.join(' ')}`
                                 : post.content;
                               setContent(newContent);
                             }
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
          );
        })}
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
          <span className="font-medium">{t('common.back')}</span>
        </button>

        

        {/* Toggle Button */}
        <button
          onClick={() => setShowDocumentView(!showDocumentView)}
          className="top-4 right-4 z-10  hover:bg-white rounded-lg p-2 transition-all duration-200"
          title={showDocumentView ? t('createText.showPreview') : t('createText.showDocumentView')}
        >
          {showDocumentView ? <Eye size={18} /> : <FileText size={18} />}
        </button>

        {/* Schedule Post Button */}
        <button
          onClick={() => {
            const params = new URLSearchParams();
            const currentContent = platformContent[activeDocumentPlatform] || '';
            if (currentContent) {
              params.set('content', currentContent);
            }
            if (imageUrl) {
              params.set('image', encodeURIComponent(imageUrl));
            }
            navigate(`/scheduler?${params.toString()}`);
          }}
          className="top-4 left-4 z-10 flex items-center gap-2  hover:bg-white  rounded-lg px-3 py-1.5  transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          {t('common.post')} <ArrowRight size={16} />
        </button>
</div>
        {/* Content Area */}
        {showDocumentView ? (
          <div className="w-[90%] bg-white p-4 mx-auto overflow-y-auto rounded-2xl relative mb-10" style={{ minHeight: 'calc(100vh - 120px)' }}>
            {/* Ask Action Dialog */}
            {showAskDialog && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-1 w-96 z-30">
                <button
                  onClick={() => {
                    setShowAskDialog(false);
                    setAskInput('');
                  }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
                <textarea
                  value={askInput}
                  onChange={handleAskTextareaChange}
                  onKeyDown={handleAskKeyPress}
                  placeholder={t('createText.describeModification')}
                  className="w-full min-h-[80px] max-h-[200px] p-3 text-sm rounded-lg focus:outline-none placeholder-sm resize-none overflow-y-auto"
                  autoFocus
                  style={{ height: 'auto', overflowY: 'hidden' }}
                />
                <div className="flex justify-end mt-1">
                  <button
                    onClick={handleAskSubmit}
                    disabled={!askInput.trim()}
                    className="p-1.5 text-sm bg-black text-white rounded-xl  disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingAsk ? <Loader2 className="animate-spin" size={16} /> : <ArrowUp size={16} />}
                  </button>
                </div>
              </div>
            )}
            
            {/* Text Actions Menu */}
            <div ref={textActionsRef} className="absolute top-4 left-4 z-10">
                              {/* Menu Trigger Button */}
                <button
                 onMouseEnter={handleTextActionsHover}
                 onMouseLeave={handleTextActionsLeave}
                 className="flex justify-center items-center text-sm py-2 px-4 border border-gray-200 rounded-lg   text-gray-800 shadow-sm"
               >
               
                 <Wand2 size={16} className='mr-2'/> {t('common.actions')}
                </button>

                              {/* Dropdown Menu */}
                {showTextActionsMenu && (
                 <div onMouseEnter={handleTextActionsMenuHover} onMouseLeave={handleTextActionsLeave} className="absolute top-full mt-1 left-0 flex flex-col gap-1 bg-white rounded-xl p-1 shadow-lg border border-gray-200 w-36">
                  <button 
                    className="flex  items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                    onClick={() => {
                      setShowTextActionsMenu(false);
                      handleActionMessage("Improve");
                    }}
                  >
                    <CircleFadingArrowUp size={16} className='mr-2'/> {t('common.improve')}
                  </button>
                  <button 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                    onClick={() => {
                      setShowTextActionsMenu(false);
                      handleActionMessage("Expand");
                    }}
                  >
                     <ScrollText size={16} className='mr-2'/>{t('common.expand')}
                  </button>
                  <button 
                    className="flex  items-center   px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                    onClick={() => {
                      setShowTextActionsMenu(false);
                      handleActionMessage("Shorten");
                    }}
                  >
                    <ScissorsLineDashed size={16} className='mr-2'/> {t('common.shorten')}
                  </button>
                  <button 
                    className="flex  items-center   px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                    onClick={() => {
                      setShowTextActionsMenu(false);
                      handleActionMessage("Ask");
                    }}
                  >
                    <MessageSquare size={16} className='mr-2'/> {t('common.ask')}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex gap-2 mb-4 justify-end relative">
                {/* Selected Platforms */}
                {selectedPlatforms.map((platformId) => {
                  const platform = PLATFORMS.find(p => p.id === platformId);
                  return (
                    <div key={platformId} className="relative">
                      <button
                        onClick={() => handlePlatformClick(platformId)}
                        className={`px-6 py-2 rounded-lg text-sm capitalize transition-all duration-200 ${
                          activeDocumentPlatform === platformId 
                            ? 'bg-gray-300 text-gray-900' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {platform?.name}
                      </button>
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlatform(platformId);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-full text-xs transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                
                {/* Plus button to add platforms */}
                <div ref={platformDropdownRef} className="relative">
                  <button
                    onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                    className="p-2 rounded-lg transition-all duration-200  text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <Plus size={18} />
                 
                  </button> 
                  
                  {/* Platform dropdown */}
                  {showPlatformDropdown && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20 min-w-32">
                      {/* Add All option */}
                      {getAvailablePlatforms().length > 1 && (
                        <>
                          <button
                            onClick={handleAddAllPlatforms}
                            className="w-full text-center px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            {t('common.addAll')}
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}
                      
                      {/* Individual platforms */}
                      {getAvailablePlatforms().map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => handleAddPlatform(platform.id)}
                          className="w-full text-center px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700 rounded-lg transition-colors capitalize"
                        >
                          {platform.name}
                        </button>
                      ))}
                      
                      {getAvailablePlatforms().length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {t('common.allPlatformsAdded')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedPlatforms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{t('createText.doubleclickPlatforms')}</p>
                </div>
              ) : (
                <div  className="relative"> 
                  <textarea
                    value={platformContent[activeDocumentPlatform] || ''}
                    onChange={(e) => {
                      setPlatformContent(prev => ({
                        ...prev,
                        [activeDocumentPlatform]: e.target.value
                      }));
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder={t('createText.platformPlaceholder', { platform: activeDocumentPlatform })}
                    className={`w-full text-gray-900 p-4 resize-none focus:outline-none focus:border-transparent whitespace-pre-wrap font-sans text-base leading-relaxed ${
                      isAnimating ? 'animate-pulse-text' : ''
                    }`}
                    style={{ height: '600px', minHeight: '600px', overflowY: 'hidden' }}
                  />
                  
             </div>
              )}
            </div>
          </div>
        ) : (
          <div className='w-[90%] mx-auto'>
            {selectedPlatforms.length === 0 ? (
              <div className="flex items-center justify-center h-96 ">

                  <h3 className="text-lg font-medium mb-2">{t('createText.selectPlatforms')}</h3>
              
              </div>
            ) : (
              <PostPreview
                facebookData={SOCIAL_MEDIA_DATA.facebook}
                instagramData={SOCIAL_MEDIA_DATA.instagram}
                threadsData={SOCIAL_MEDIA_DATA.threads}
                linkedinData={SOCIAL_MEDIA_DATA.linkedin}
                selectedPlatforms={selectedPlatforms}
                selectedPages={selectedPages}
                imageUrl={imageUrl}
                content={platformContent[activeDocumentPlatform] || ''}
                isGeneratingImage={false}
                generationProgress={0}
                videoUrl={null}
              />
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Chat Implementation */}
      <div className="w-[40%] h-full flex flex-col bg-gray-50 shadow-md">
        {/* Header */}
        <div className="w-full h-12 flex items-center px-4 bg-gray-50">
          <h2 className="text-md text-gray-800">{t('createText.postGenerator')}</h2>
        </div>
        
        {/* Messages Area - Scrollable with gradient overlay */}
        <div className="flex-1 relative overflow-hidden">
          <div className="h-full overflow-y-auto simple-scrollbar p-4 space-y-4">
            
            {messages.length === 0 && !isLoading && <EmptyState />}
            
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-[90%] px-4 py-2 rounded-xl ${
                    message.sender === 'user' ? 'bg-gray-300' : 'bg-gray-200/50 text-gray-800'
                  }`}>
                    <p className="text-md text-gray-700  whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
                
                                {message.structuredPosts?.length > 0 && (
                  <div>
                    <StructuredPosts posts={message.structuredPosts} messageId={message.id} />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => {
                          const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
                          if (lastUserMessage) {
                            handleSendMessage(lastUserMessage.text);
                          }
                        }}
                        className="flex items-center gap-2 text-xs bg-white border border-gray-800 hover:bg-gray-800 text-black hover:text-white px-2 py-1 rounded-lg transition-colors"
                      >
                        <Repeat size={12} /> {t('createText.repeatPosts')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-100 text-gray-800">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">
                      {chatMode === CHAT_MODES.WRITE_POST 
                                ? t('createText.crafting')
                        : t('createText.thinking')}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                  ? t('createText.writePostPlaceholder')
                  : t('createText.askPlaceholder')
              }
              className="w-full text-sm min-h-[112px] p-4 pt-4 pr-4 pb-12 shadow-lg bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
              style={{ height: '112px' }}
            />
            
            {/* Buttons wrapper */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-white pointer-events-none rounded-b-2xl m-1">
              {/* Mode Selector */}
              <div ref={modeSelectorRef} className="absolute left-3 bottom-3 pointer-events-auto">
                <button 
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  <span>{chatMode === CHAT_MODES.ASK ? <MessageSquare size={16} /> : <Pencil size={16} />}</span>
                  <span className="font-medium">
                    {chatMode === CHAT_MODES.ASK ? t('createText.askMode') : t('createText.writePostMode')}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mode Selector Popup */}
                {showModeSelector && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-36">
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
                      <span>{t('createText.askMode')}</span>
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
                      <span>{t('createText.writePostMode')}</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Upload button 
              <button 
                className="absolute right-14 bottom-3 text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-xl transition-colors pointer-events-auto"
                title={t('createPost.uploadImage')}
              >
                <Upload size={20} />
              </button>
              */}
              {/* Submit button */}
              <button 
                onClick={(e) => {
                  console.log('Submit button clicked!', { input: input.trim(), isLoading }); // Debug log
                  if (!input.trim()) {
                    console.log('Button clicked but input is empty'); // Debug log
                    alert(t('createText.pleaseEnterText'));
                    return;
                  }
                  if (isLoading) {
                    console.log('Button clicked but already loading'); // Debug log
                    return;
                  }
                  handleSendMessage();
                }}
                disabled={!input.trim() || isLoading} 
                className={`absolute right-3 bottom-3 text-white rounded-xl p-1.5 active:scale-95 transition-all duration-200 pointer-events-auto ${
                  !input.trim() || isLoading 
                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                    : 'bg-gray-900 hover:bg-gray-800 cursor-pointer'
                }`}
                title={!input.trim() ? t('createText.enterTextToSend') : isLoading ? t('createText.sending') : t('createText.sendMessage')}
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