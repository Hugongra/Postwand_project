import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Upload, Image as ImageIcon, Loader2, ArrowRight, Pencil, Wand2, Plus, Image, Palette} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IoPricetagsOutline } from "react-icons/io5";

const CHAT_MODES = {
  GENERATE: 'generate',
  EDIT: 'edit'
};

export const CreateImages = () => {
  const [input, setInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [chatMode, setChatMode] = useState(CHAT_MODES.GENERATE);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Add new settings state
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState(1);
  const [brandStyle, setBrandStyle] = useState('No brand');
  
  // Add new dropdown states
  const [showAspectRatioSelector, setShowAspectRatioSelector] = useState(false);
  const [showNumImagesSelector, setShowNumImagesSelector] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loadingDimensions, setLoadingDimensions] = useState({ width: 0, height: 0 });
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatId, setChatId] = useState(null);
  
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const modeSelectorRef = useRef(null);
  const aspectRatioSelectorRef = useRef(null);
  const numImagesSelectorRef = useRef(null);
  const brandSelectorRef = useRef(null);
  const navigate = useNavigate();

  // Add options arrays
  const aspectRatioOptions = [
    { value: '1:1', label: 'Square', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> },
    { value: '16:9', label: 'Landscape', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="8" width="18" height="8" rx="2" /></svg> },
    { value: '3:4', label: 'Portrait', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="4" width="10" height="16" rx="2" /></svg> },
    { value: '9:16', label: 'Story', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="2" width="8" height="20" rx="2" /></svg> }
  ];

  const numImagesOptions = [
    { value: 1, label: '1 Image', icon: <Image size={16} /> },
    { value: 2, label: '2 Images', icon: <Image size={16} /> },
    { value: 3, label: '3 Images', icon: <Image size={16} /> }
  ];

  const brandOptions = [
    { value: 'No brand', label: 'No Brand', icon: <IoPricetagsOutline size={16} /> },
    { value: 'Auto', label: 'Auto Style', icon: <Palette size={16} /> }
  ];

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
      if (aspectRatioSelectorRef.current && !aspectRatioSelectorRef.current.contains(event.target)) {
        setShowAspectRatioSelector(false);
      }
      if (numImagesSelectorRef.current && !numImagesSelectorRef.current.contains(event.target)) {
        setShowNumImagesSelector(false);
      }
      if (brandSelectorRef.current && !brandSelectorRef.current.contains(event.target)) {
        setShowBrandSelector(false);
      }
      
      // Close chat history if clicking outside
      if (showChatHistory && !event.target.closest('.chat-history-panel, .history-button')) {
        setShowChatHistory(false);
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
      const response = await fetch('https://app.postwand.io/api/chat-images', { credentials: 'include' });
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
      const response = await fetch(`https://app.postwand.io/api/chat-images/${chatId}`, { credentials: 'include' });
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
          
          const response = await fetch('https://app.postwand.io/api/save-chat-image', {
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
      const response = await fetch('https://app.postwand.io/api/generate-image-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          prompt: input, 
          chat_id: chatId,
          aspectRatio: aspectRatio,
          numImages: numImages,
          brand: brandStyle
        })
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
        alert('Failed to generate image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image: ' + error.message);
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

        const response = await fetch('https://app.postwand.io/api/edit-image', {
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
        alert('Failed to edit image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('Error editing image: ' + error.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (chatMode === CHAT_MODES.EDIT) {
      if (uploadedImage || selectedImage) {
        await handleImageEdit();
      } else {
        alert('Please select or upload an image to edit');
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
    if (uploadedImage && image.id !== 'uploaded') {
      if (uploadedImage.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
      setUploadedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <span className="font-medium">History</span>
        </button>
      </div>


      {/* Chat History Sidebar */}
      {showChatHistory && (
        <div className="chat-history-panel absolute top-16 left-4 w-48 max-h-96 bg-white rounded-lg shadow-lg border z-20 overflow-hidden">
          <div className="border-b p-1">
            <button onClick={() => createNewChat()} className="flex items-center justify-center w-full py-3 hover:bg-gray-100 rounded-lg  transition-all duration-200">
              <Plus size={16} className="mr-2" />New Chat
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {chatSessions.length === 0 ? (
              <div className="py-3 text-gray-500 text-sm">No past chats</div>
            ) : (
              chatSessions.map((chat) => (
                <button
                  key={chat.chat_id}
                  onClick={() => loadChatSession(chat.chat_id)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {chat.last_prompt || 'Untitled Session'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {chat.image_count} images • {new Date(chat.updated_at).toLocaleDateString()}
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
              <p>Upload an image and describe how you want to edit it by selecting the edit mode.</p>
              <p className="text-sm mt-2">Or type a prompt to generate new content by selecting the generate mode.</p>
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
                <img 
                  src={uploadedImage.preview} 
                  alt="Uploaded image" 
                  onLoad={(e) => {
                    handleImageLoad(e);
                    e.target.previousElementSibling.style.display = 'none';
                  }}
                  onClick={() => setSelectedImage({ url: uploadedImage.preview, prompt: 'Uploaded image', id: 'uploaded' })}
                  onError={(e) => {
                    console.error('Failed to load uploaded image');
                    e.target.style.display = 'none';
                  }}
                  className={`w-full max-w-sm h-auto shadow-lg mx-auto rounded-lg cursor-pointer transition-all duration-200 hover:shadow-xl relative z-10 ${
                    selectedImage?.id === 'uploaded' ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                />
                {selectedImage?.id === 'uploaded' && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">Selected for editing</p>
                )}
              </div>
            )}
            
            {/* Generated images */}
            {generatedImages.map((image) => (
              <div key={image.id} className="text-center relative">
                <div className="bg-gray-200 animate-pulse rounded-lg w-full max-w-sm h-64 mx-auto absolute inset-0"></div>
                <img 
                  src={image.url} 
                  alt={image.prompt} 
                  onLoad={(e) => {
                    handleImageLoad(e);
                    e.target.previousElementSibling.style.display = 'none';
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
                  className={`w-full max-w-sm h-auto shadow-lg mx-auto rounded-lg cursor-pointer transition-all duration-200 hover:shadow-xl relative z-10 ${
                    selectedImage?.id === image.id ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                />
                {selectedImage?.id === image.id && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">Selected for editing</p>
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
                  <p className="text-xs text-gray-500 mt-2">Processing image...</p>
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                chatMode === CHAT_MODES.EDIT 
                  ? "Describe how you want to edit the image..." 
                  : "Describe the image you want to generate..."
              }
              className="w-full text-sm min-h-[112px] p-4 pr-24 shadow-lg bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
              style={{ height: '112px' }}
            />
            
            {/* Buttons wrapper */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-white pointer-events-none rounded-b-2xl m-2">
              {/* Settings Row */}
              <div className="absolute left-3 bottom-3 flex space-x-2 pointer-events-auto">
                {/* Mode Selector */}
                <div ref={modeSelectorRef} className="relative">
                  <button 
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    <span>{chatMode === CHAT_MODES.GENERATE ? <Wand2 size={16} /> : <Pencil size={16} />}</span>
                    <span className="font-medium">
                      {chatMode === CHAT_MODES.GENERATE ? 'Generate' : 'Edit'}
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
                        <span>Generate</span>
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
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Selector */}
                <div ref={aspectRatioSelectorRef} className="relative">
                  <button 
                    onClick={() => setShowAspectRatioSelector(!showAspectRatioSelector)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    <span>{aspectRatioOptions.find(opt => opt.value === aspectRatio)?.icon}</span>
                    <span className="font-medium">{aspectRatio}</span>
                    <svg className={`w-3 h-3 transition-transform ${showAspectRatioSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAspectRatioSelector && (
                    <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                      {aspectRatioOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setAspectRatio(option.value);
                            setShowAspectRatioSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            aspectRatio === option.value ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                          }`}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Number of Images Selector */}
                <div ref={numImagesSelectorRef} className="relative">
                  <button 
                    onClick={() => setShowNumImagesSelector(!showNumImagesSelector)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    <Image size={16} />
                    <span className="font-medium">{numImages}</span>
                    <svg className={`w-3 h-3 transition-transform ${showNumImagesSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showNumImagesSelector && (
                    <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                      {numImagesOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setNumImages(option.value);
                            setShowNumImagesSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            numImages === option.value ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                          }`}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Selector */}
                <div ref={brandSelectorRef} className="relative">
                  <button 
                    onClick={() => setShowBrandSelector(!showBrandSelector)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    <span>{brandOptions.find(opt => opt.value === brandStyle)?.icon}</span>
                    <span className="font-medium">{brandStyle}</span>
                    <svg className={`w-3 h-3 transition-transform ${showBrandSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showBrandSelector && (
                    <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10 min-w-32">
                      {brandOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setBrandStyle(option.value);
                            setShowBrandSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            brandStyle === option.value ? 'bg-gray-100 text-gray-700' : 'text-gray-700'
                          }`}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Upload button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-14 bottom-3 text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-xl transition-colors pointer-events-auto"
                title="Upload image"
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

export default CreateImages;