import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Upload, Image as ImageIcon, Loader2, ArrowRight, Pencil, Wand2, Plus, ArrowDown, SquareBottomDashedScissors} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { SiOpenai } from "react-icons/si";
import fluxLogo from '/images/flux_logo.svg';
import { API_BASE_URL } from '../config_url.js';

const CHAT_MODES = {
  GENERATE: 'generate',
  EDIT: 'edit'
};

export const CreatePost = () => {
  const { t } = useTranslations();
  
  const [input, setInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [chatMode, setChatMode] = useState(CHAT_MODES.GENERATE);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loadingDimensions, setLoadingDimensions] = useState({ width: 0, height: 0 });
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [chatModel, setChatModel] = useState('OpenAI');
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const modeSelectorRef = useRef(null);
  const modelSelectorRef = useRef(null);
  const hideMenuTimer = useRef(null);
  const navigate = useNavigate();

  const createId = async (chatId) => {
    if(!chatId) {
    try {
      // Generate a unique chat ID if one doesn't exist
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
      return newChatId;
    } catch (error) {
      console.error('Error creating image chat ID:', error);
      return null;
    }
  } else {
    setChatId(chatId);
    return chatId;
  }
  }
 
  useEffect(() => {
    createId(null);
  }, []);

   useEffect(() => {
    loadChatSessions();
   }, [uploadedImage, selectedImage]);

  // Click outside handler for mode selector and chat history
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target)) {
        setShowModeSelector(false);
      }
      
      // Close chat history if clicking outside
      if (showChatHistory && !event.target.closest('.chat-history-panel, .history-button')) {
        setShowChatHistory(false);
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChatHistory]);

 

  // Smooth scroll when editing starts or new content appears
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [isEditing, generatedImages.length]);


  const loadChatSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-images`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.chats) {
        setChatSessions(data.chats);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadChatSession = async (chatId) => {
    setGeneratedImages([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setInput('');
    setIsEditing(false);
    setChatMode(CHAT_MODES.GENERATE);
    setShowModeSelector(false);
    setShowChatHistory(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-images/${chatId}`, { credentials: 'include' });
      const data = await response.json();
      
      if(data.chat_id) {
        setChatId(data.chat_id);
      }
      if (data.images) {
        const images = data.images.map((url, index) => ({
          url,
          prompt: data.prompt,
          type: 'loaded',
          id: `loaded-${index}`
        }));
        setGeneratedImages(images);
        setSelectedImage(images[0] || null);
      }
      setShowChatHistory(false);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };


  const createNewChat = () => {
    createId(null);
    setChatSessions([]);
    setShowChatHistory(false);
    setGeneratedImages([]);
    setSelectedImage(null);
    setUploadedImage(null);
    setInput('');
    setIsEditing(false);
    setChatMode(CHAT_MODES.GENERATE);
    setShowModeSelector(false);
  };




  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
      
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
      setSelectedImage({ url: preview, prompt: 'Uploaded image', id: 'uploaded' });
      
      // Convert to data URL and save to backend, then use the Supabase URL
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target.result;
          
          const response = await fetch(`${API_BASE_URL}/api/save-chat-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              image_url: dataUrl,
              image_type: 'uploaded',
              chat_id: chatId
            })
          });
          
          const result = await response.json();

          if(result.success && result.image_data) {
            // Use the Supabase URL from the backend response
            const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
            setUploadedImage({ file, preview: supabaseUrl });
            setSelectedImage({ url: supabaseUrl, prompt: 'Uploaded image', id: 'uploaded' });
          }
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleImageGeneration = async () => {
    if (!input.trim()) return;

    setIsEditing(true);
    
    // Small delay to ensure loading state shows
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-image-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: input, chat_id: chatId, model: chatModel })
      });

      const result = await response.json();

      if (result.success && result.image_data) {
        // Get the latest image URL from the Supabase response
        const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
        const newImage = {
          url: supabaseUrl,
          prompt: input,
          type: 'generated',
          id: Date.now()
        };
        
        setGeneratedImages(prev => [...prev, newImage]);
        setSelectedImage(newImage);
        setInput('');
      } else {
        console.error('Image generation failed:', result.error || 'Unknown error');
        alert(t('messages.failedToGenerateImage') + ': ' + (result.error || t('common.unknownError')));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(t('messages.failedToGenerateImage') + ': ' + error.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveImage = async (image_url) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/save-chat-image-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          image_url: image_url, 
          prompt: 'Saved image' 
        })
      });

      const result = await response.json();
      if (result.success) {
    
        console.log('Image saved to library successfully');
      } else {
        console.error('Error saving image:', result.error || 'Unknown error');
        alert(t('messages.errorOccurred') + ': ' + (result.error || t('common.unknownError')));
      } 
    } catch (error) {
      console.error('Error saving image:', error);
      alert(t('messages.errorOccurred') + ': ' + error.message);
    }
  };
  const handleRemoveBackground = async (image_url) => {
  

    setIsEditing(true);

    try {
        const formData = new FormData();
        if (image_url) {
          const response = await fetch(image_url);
          const blob = await response.blob();
          formData.append('image', blob, 'selected_image.jpg');
        } 

        formData.append('chat_id', chatId);
      
        const response = await fetch(`${API_BASE_URL}/api/remove-background`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      
          const result = await response.json();
          if (result.success && result.image_data) {
            const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
            const newImage = { 
              url: supabaseUrl, 
              prompt: 'Removed background', 
              type: 'edited', 
              id: Date.now() 
            }
            setGeneratedImages(prev => [...prev, newImage]);
            setSelectedImage(newImage);
            setIsEditing(false);
          } else {
            console.error('Error removing background:', result.error || 'Unknown error');
            alert(t('messages.errorOccurred') + ': ' + (result.error || t('common.unknownError')));
          }
    } catch (error) {
      console.error('Error removing background:', error);
      alert(t('messages.errorOccurred') + ': ' + error.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleImageEdit = async () => {
    if ((!uploadedImage && !selectedImage) || !input.trim()) return;

    setIsEditing(true);
    
    try {
      const formData = new FormData();
      
      if (selectedImage && selectedImage.id !== 'uploaded') {
        const response = await fetch(selectedImage.url);
        const blob = await response.blob();
        formData.append('image', blob, 'selected_image.jpg');
      } else {
        formData.append('image', uploadedImage.file);
      }
      
      formData.append('prompt', input);
      formData.append('chat_id', chatId);
      formData.append('model', chatModel);

      const response = await fetch(`${API_BASE_URL}/api/edit-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success && result.image_data) {
        // Get the latest image URL from the Supabase response
        const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
        const newImage = {
          url: supabaseUrl,
          prompt: input,
          type: 'edited',
          id: Date.now()
        };
        
        setGeneratedImages(prev => [...prev, newImage]);
        setSelectedImage(newImage);
        setInput('');
      } else {
        console.error('Image editing failed:', result.error || 'Unknown error');
        alert(t('messages.errorOccurred') + ': ' + (result.error || t('common.unknownError')));
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert(t('messages.errorOccurred') + ': ' + error.message);
    } finally {
      setIsEditing(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (chatMode === CHAT_MODES.EDIT) {
      if (uploadedImage || selectedImage) {
        await handleImageEdit();
      } else {
        alert(t('messages.errorOccurred'));
      }
    } else {
      await handleImageGeneration();
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setLoadingDimensions({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    // Remove the automatic cleanup of uploaded image when clicking other images
    // This was causing uploaded images to disappear when clicking on edited versions
  };

  const handleImageHover = (imageId) => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    setShowMenu(imageId);
  };

  const handleImageLeave = () => {
    hideMenuTimer.current = setTimeout(() => setShowMenu(null), 300);
  };

  const handleMenuHover = () => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
  };

  const hasImages = generatedImages.length > 0 || uploadedImage || isEditing;
  const showCenterLayout = (!uploadedImage && generatedImages.length === 1) || 
                          (uploadedImage && generatedImages.length === 0) ||
                          (isEditing && !uploadedImage && generatedImages.length === 0);

  return (
    <div className="w-full h-screen flex flex-col bg-primary relative">
      {/* Chat History Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowChatHistory(!showChatHistory)}
          className="history-button flex items-center gap-2 hover:bg-white rounded-lg px-3 py-1.5 transition-all duration-200 text-gray-700 hover:text-gray-900"
        >
          <span className="font-medium">{t('common.history')}</span>
        </button>
      </div>

      {/* Continue to text button */}
      {(selectedImage || uploadedImage) && (
        <div className="absolute top-4 right-10 z-10">
          <button
            onClick={() => {
              const imageUrl = selectedImage?.url || uploadedImage?.preview;
              if (imageUrl) {
                navigate(`/create-text?image=${encodeURIComponent(imageUrl)}`);
              }
            }}
            className="top-4 left-4 z-10 flex items-center gap-2  hover:bg-white  rounded-lg px-3 py-1.5  transition-all duration-200 text-gray-700 hover:text-gray-900"          >
            <span className="font-medium">{t('common.createText')} </span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Chat History Sidebar */}
      {showChatHistory && (
        <div className="chat-history-panel absolute top-16 left-4 w-56 max-h-120 bg-white rounded-lg shadow-lg border z-20 overflow-hidden">
          <div className="border-b p-1">
            <button onClick={() => createNewChat()} className="flex items-center justify-center w-full py-3 hover:bg-gray-100 rounded-lg  transition-all duration-200">
              <Plus size={16} className="mr-2" />{t('common.newChat')}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {chatSessions.length === 0 ? (
              <div className="flex items-center justify-center w-full py-3  rounded-lg  transition-all duration-200">{t('createPost.noPastChats')}</div>
            ) : (
              chatSessions.map((chat) => (
                <button
                  key={chat.chat_id}
                  onClick={() => loadChatSession(chat.chat_id)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {chat.last_prompt || t('createPost.untitledSession')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('createPost.imagesCount', { count: chat.image_count })} • {new Date(chat.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
        {!hasImages ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('createPost.editPlaceholder')}</p>
              <p className="text-sm mt-2">{t('createPost.generatePlaceholder')}</p>
            </div>
          </div>
        ) : (
          <div className={showCenterLayout ? "flex flex-col items-center justify-center min-h-full space-y-16" : "max-w-4xl mx-auto space-y-16"}>
            {/* Uploaded image */}
            {uploadedImage && (
              <div className="text-center relative">
                <div 
                  style={{
                    width: loadingDimensions.width > 0 ? `${loadingDimensions.width}px` : '384px',
                    height: loadingDimensions.height > 0 ? `${loadingDimensions.height}px` : '384px'
                  }}
                  className="bg-gray-200 animate-pulse rounded-lg mx-auto absolute inset-0"
                ></div>
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => handleImageHover('uploaded')}
                  onMouseLeave={handleImageLeave}
                >
                  <img 
                    src={uploadedImage.preview} 
                    alt="Uploaded image" 
                    onLoad={(e) => {
                      handleImageLoad(e);
                      // Find the loading div which is a sibling of the image's parent container
                      const loadingDiv = e.target.closest('.text-center').querySelector('.bg-gray-200');
                      if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                      }
                    }}
                    onClick={() => setSelectedImage({ url: uploadedImage.preview, prompt: 'Uploaded image', id: 'uploaded' })}
                    onError={(e) => {
                      console.error('Failed to load uploaded image');
                      e.target.style.display = 'none';
                    }}
                    className={`w-full max-w-sm h-auto shadow-lg rounded-lg cursor-pointer transition-all duration-200 hover:shadow-xl relative z-10 ${
                      selectedImage?.id === 'uploaded' ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  />
                  {showMenu === 'uploaded' && (
                    <div 
                      className="absolute top-0 left-full w-40 ml-2 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-20"
                      onMouseEnter={handleMenuHover}
                      onMouseLeave={handleImageLeave}
                    >
                      <button 
                      className="flex items-center gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      onClick={() => handleSaveImage(uploadedImage.preview)}
                      >
                        <ArrowDown size={16} />{t('common.saveImage')}
                        </button>
                      <button 
                      className="flex items-center gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      onClick={() => handleRemoveBackground(uploadedImage.preview)}
                      > 

                        <SquareBottomDashedScissors size={16} />{t('common.removeBg')}
                        </button>
                    </div>
                  )}
                </div>
                {selectedImage?.id === 'uploaded' && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">{t('messages.selectedForEditing')}</p>
                )}
              </div>
            )}
            
            {/* Generated images */}
            {generatedImages.map((image) => (
              <div key={image.id} className="text-center relative">
                <div 
                  style={{
                    width: loadingDimensions.width > 0 ? `${loadingDimensions.width}px` : '384px',
                    height: loadingDimensions.height > 0 ? `${loadingDimensions.height}px` : '384px'
                  }}
                  className="bg-gray-200 animate-pulse rounded-lg mx-auto absolute inset-0"
                ></div>
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => handleImageHover(image.id)}
                  onMouseLeave={handleImageLeave}
                >
                  <img 
                    src={image.url} 
                    alt={image.prompt} 
                    onLoad={(e) => {
                      handleImageLoad(e);
                      // Find the loading div which is a sibling of the image's parent container
                      const loadingDiv = e.target.closest('.text-center').querySelector('.bg-gray-200');
                      if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                      }
                    }}
                    onClick={() => handleImageClick(image)}
                    onError={(e) => {
                      console.error('Failed to load generated image:', image.prompt);
                      // Remove the failed image from the list
                      setGeneratedImages(prev => prev.filter(img => img.id !== image.id));
                      // Clear selection if this was the selected image
                      if (selectedImage?.id === image.id) {
                        setSelectedImage(null);
                      }
                    }}
                    className={`w-full max-w-sm h-auto shadow-lg rounded-lg cursor-pointer transition-all duration-200 hover:shadow-xl relative z-10 ${
                      selectedImage?.id === image.id ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  />
                  {showMenu === image.id && (
                    <div 
                      className="absolute top-0 left-full w-40 ml-2 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-20"
                      onMouseEnter={handleMenuHover}
                      onMouseLeave={handleImageLeave}
                    >
                      <button 
                      className="flex items-center  gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      onClick={() => handleSaveImage(image.url)}
                      >
                        <ArrowDown size={16} />{t('common.saveImage')}</button>
                      <button 
                      className="flex items-center gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      onClick={() => handleRemoveBackground(image.url)}
                      >    
                      <SquareBottomDashedScissors size={16} />{t('common.removeBg')}</button>
                    </div>
                  )}
                </div>
                {selectedImage?.id === image.id && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">{t('messages.selectedForEditing')}</p>
                )}
              </div>
            ))}
            
            {/* Loading placeholder */}
            {isEditing && (
              <div className="text-center">
                <div 
                  style={{
                    width: loadingDimensions.width > 0 ? `${loadingDimensions.width}px` : '384px',
                    height: loadingDimensions.height > 0 ? `${loadingDimensions.height}px` : '384px'
                  }}
                  className="mx-auto bg-gray-200 rounded-lg animate-pulse flex items-center justify-center"
                >
                  
                </div>
                <div className="mt-4 mx-auto" style={{ width: loadingDimensions.width > 0 ? `${loadingDimensions.width}px` : '384px' }}>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full animate-loading-bar"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{t('createPost.processingImage')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky input area */}
      <div className="shrink-0 bg-primary p-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                chatMode === CHAT_MODES.EDIT 
                  ? t('createPost.editPlaceholder')
                  : t('createPost.generatePlaceholder')
              }
              className="w-full text-sm min-h-[112px] max-h-[300px] p-4 pr-24 shadow-lg bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
              
            />
            
            {/* Buttons wrapper */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-white pointer-events-none rounded-b-2xl ">
              {/* Mode Selector */}
              <div ref={modeSelectorRef} className="absolute left-3 bottom-3 pointer-events-auto">
                <button 
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  <span>{chatMode === CHAT_MODES.GENERATE ? <Wand2 size={16} /> : <Pencil size={16} />}</span>
                  <span className="font-medium">
                    {chatMode === CHAT_MODES.GENERATE ? t('createPost.generateMode') : t('createPost.editMode')}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showModeSelector && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                    <button
                      onClick={() => {
                        setChatMode(CHAT_MODES.GENERATE);
                        setShowModeSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatMode === CHAT_MODES.GENERATE ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <Wand2 size={16} />
                      <span>{t('createPost.generateMode')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setChatMode(CHAT_MODES.EDIT);
                        setShowModeSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatMode === CHAT_MODES.EDIT ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <Pencil size={16} />  
                      <span>{t('createPost.editMode')}</span>
                    </button>
                  </div>
                )}
              </div>

              <div ref={modelSelectorRef} className="absolute left-[120px] bottom-3 pointer-events-auto">
                <button 
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                
                  <span className="font-medium">
                    {chatModel}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showModelSelector && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                    <button
                      onClick={() => {
                          setChatModel('OpenAI');
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatModel === 'OpenAI' ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <SiOpenai size={16} />
                      <span>OpenAI</span>
                    </button>
                    <button
                      onClick={() => {
                        setChatModel('Flux');
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        chatModel === 'Flux' ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                      }`}
                    >
                      <img src={fluxLogo} alt="Flux" className="w-4 h-4" />  
                      <span>Flux</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Upload button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-14 bottom-3 text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-xl transition-colors pointer-events-auto"
                title={t('createPost.uploadImage')}
              >
                <Upload size={20} />
              </button>
              
              {/* Submit button */}
              <button 
                onClick={handleSubmit}
                disabled={!input.trim() || isEditing} 
                className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-xl p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
              >
                {isEditing ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;