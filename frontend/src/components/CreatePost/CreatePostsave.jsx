import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Upload, Image as ImageIcon, Loader2, ArrowRight, Pencil, Wand2, Plus, ArrowDown, Brush} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHAT_MODES = {
  GENERATE: 'generate',
  EDIT: 'edit'
};

const CreatePost = () => {
  const [input, setInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [chatMode, setChatMode] = useState(CHAT_MODES.GENERATE);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingDimensions, setLoadingDimensions] = useState({ width: 0, height: 0 });
  const [chatSessions, setChatSessions] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  // Add brush states
  const [brushMode, setBrushMode] = useState(null); // null, 'uploaded', or image.id
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const modeSelectorRef = useRef(null);
  const hideMenuTimer = useRef(null);
  const canvasRef = useRef(null); // Add canvas ref
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
   }, [images, selectedImage]);

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

      // Exit brush mode if clicking outside the image area
      if (brushMode && !event.target.closest('.relative.inline-block, .brush-controls')) {
        exitBrushMode();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChatHistory, brushMode]);

  // Add keyboard handler for escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && brushMode) {
        exitBrushMode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [brushMode]);

  // Exit brush mode when starting to type
  useEffect(() => {
    if (brushMode && input.length > 0) {
      // Don't exit immediately, but show a hint that they can apply the mask
    }
  }, [input, brushMode]);

 

  // Smooth scroll when editing starts or new content appears
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [isEditing,]);


  const loadChatSessions = async () => {
    try {
      const response = await fetch('https://threads-dev.local:5000/api/chat-images', { credentials: 'include' });
      const data = await response.json();
      
      if (data.chats) {
        setChatSessions(data.chats);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadChatSession = async (chatId) => {
    setImages([]);
    setSelectedImage(null);
    setInput('');
    setIsEditing(false);
    setChatMode(CHAT_MODES.GENERATE);
    setShowModeSelector(false);
    setShowChatHistory(false);
    try {
      const response = await fetch(`https://threads-dev.local:5000/api/chat-images/${chatId}`, { credentials: 'include' });
      const data = await response.json();
      
      if(data.chat_id) {
        setChatId(data.chat_id);
      }
      if (data.images) {
        const loadedImages = data.images.map((url, index) => ({
          url,
          prompt: data.prompt,
          type: 'loaded',
          id: `loaded-${index}`
        }));
        setImages(loadedImages);
        setSelectedImage(loadedImages[0] || null);
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
    setImages([]);
    setSelectedImage(null);
    setInput('');
    setIsEditing(false);
    setChatMode(CHAT_MODES.GENERATE);
    setShowModeSelector(false);
  };




  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Remove any existing uploaded image
      setImages(prev => prev.filter(img => img.type !== 'uploaded'));
      
      const preview = URL.createObjectURL(file);
      const uploadedImage = {
        url: preview,
        prompt: 'Uploaded image',
        id: 'uploaded',
        type: 'uploaded',
        file: file
      };
      
      setImages(prev => [uploadedImage, ...prev]);
      setSelectedImage(uploadedImage);
      
      // Convert to data URL and save to backend, then use the Supabase URL
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target.result;
          
          const response = await fetch('https://threads-dev.local:5000/api/save-chat-image', {
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
            // Update the image with the Supabase URL
            const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
            const updatedImage = {
              ...uploadedImage,
              url: supabaseUrl,
              file: file
            };
            
            setImages(prev => prev.map(img => 
              img.id === 'uploaded' ? updatedImage : img
            ));
            setSelectedImage(updatedImage);
            
            // Clean up preview URL
            URL.revokeObjectURL(preview);
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
      const response = await fetch('https://threads-dev.local:5000/api/generate-image-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: input, chat_id: chatId })
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
        
        setImages(prev => [...prev, newImage]);
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
    if (!selectedImage || !input.trim()) return;

    setIsEditing(true);
    
    try {
      const formData = new FormData();
      
      if (selectedImage && selectedImage.type !== 'uploaded') {
        const response = await fetch(selectedImage.url);
        const blob = await response.blob();
        formData.append('image', blob, 'selected_image.jpg');
      } else {
        formData.append('image', selectedImage.file);
      }
      
      formData.append('prompt', input);
      formData.append('chat_id', chatId);

      const response = await fetch('https://threads-dev.local:5000/api/edit-image', {
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
        
        setImages(prev => [...prev, newImage]);
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
      if (selectedImage) {
        await handleImageEdit();
      } else {
        alert('Please select an image to edit');
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

  // Brush functions
  const handleBrushClick = (imageId) => {
    // Exit any existing brush mode first
    if (brushMode && brushMode !== imageId) {
      exitBrushMode();
    }
    setBrushMode(imageId);
    setShowMenu(null);
  };

  const exitBrushMode = () => {
    setBrushMode(null);
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const clearMask = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startDrawing = (e) => {
    if (!brushMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white for visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawing || !brushMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
    }
  };

  const applyMask = async () => {
    if (!brushMode || !input.trim()) {
      alert('Please enter a prompt before applying the mask');
      return;
    }

    setIsEditing(true);
    
    try {
      const canvas = canvasRef.current;
      
      // Create a proper mask with white on transparent background
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      
      // Copy the drawn mask but make it solid white on transparent
      maskCtx.globalCompositeOperation = 'source-over';
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert semi-transparent white to solid white, everything else transparent
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If there's any alpha
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          data[i + 3] = 255; // A
        }
      }
      
      maskCtx.putImageData(imageData, 0, 0);
      
      // Convert mask to blob
      const maskBlob = await new Promise(resolve => {
        maskCanvas.toBlob(resolve, 'image/png');
      });
      
      const formData = new FormData();
      
      // Add the original image
      const targetImage = images.find(img => img.id === brushMode);
      if (targetImage) {
        if (targetImage.type === 'uploaded' && targetImage.file) {
          formData.append('image', targetImage.file);
        } else {
          const response = await fetch(targetImage.url);
          const blob = await response.blob();
          formData.append('image', blob, 'image.jpg');
        }
      }
      
      formData.append('mask', maskBlob, 'mask.png');
      formData.append('prompt', input);
      formData.append('chat_id', chatId);

      const response = await fetch('https://threads-dev.local:5000/api/edit-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (result.success && result.image_data) {
        const supabaseUrl = result.image_data.image_urls[result.image_data.image_urls.length - 1];
        const newImage = {
          url: supabaseUrl,
          prompt: input,
          type: 'masked_edit',
          id: Date.now()
        };
        
        setImages(prev => [...prev, newImage]);
        setSelectedImage(newImage);
        setInput('');
        exitBrushMode();
      } else {
        alert('Failed to edit image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('Error editing image: ' + error.message);
    } finally {
      setIsEditing(false);
    }
  };

  // Single image rendering component
  const renderImage = (image) => (
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
        onMouseEnter={() => !brushMode && handleImageHover(image.id)}
        onMouseLeave={() => !brushMode && handleImageLeave()}
      >
        <img 
          src={image.url} 
          alt={image.prompt}
          draggable={false}
          style={{ userSelect: 'none', pointerEvents: brushMode === image.id ? 'none' : 'auto' }}
          onLoad={(e) => {
            handleImageLoad(e);
            e.target.previousElementSibling.style.display = 'none';
            
            // Initialize canvas if in brush mode
            if (brushMode === image.id && canvasRef.current) {
              const canvas = canvasRef.current;
              canvas.width = e.target.naturalWidth;
              canvas.height = e.target.naturalHeight;
            }
          }}
          onClick={() => !brushMode && setSelectedImage(image)}
          onError={(e) => {
            console.error('Failed to load image:', image.prompt);
            if (image.type !== 'uploaded') {
              setImages(prev => prev.filter(img => img.id !== image.id));
              if (selectedImage?.id === image.id) {
                setSelectedImage(null);
              }
            }
          }}
          className={`w-full max-w-sm h-auto shadow-lg rounded-lg transition-all duration-200 hover:shadow-xl relative z-10 ${
            brushMode === image.id ? 'cursor-crosshair' : 'cursor-pointer'
          } ${
            selectedImage?.id === image.id ? 'ring-2 ring-blue-500 ring-opacity-50' : 'hover:ring-2 hover:ring-gray-300'
          }`}
        />
        
        {/* Canvas overlay for brush mode */}
        {brushMode === image.id && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-crosshair rounded-lg"
            style={{ 
              width: '100%', 
              height: '100%',
              maxWidth: '384px',
              zIndex: 20,
              pointerEvents: 'auto'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        
        {/* Brush controls */}
        {brushMode === image.id && (
          <div className="brush-controls absolute -top-20 left-0 right-0 bg-white border-2 border-orange-300 rounded-lg shadow-xl p-3 z-40">
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-orange-600">🎨 Brush:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-gray-600">{brushSize}px</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearMask}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={applyMask}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium"
                  disabled={!input.trim()}
                >
                  {!input.trim() ? 'Enter prompt first' : 'Apply Mask'}
                </button>
                <button
                  onClick={exitBrushMode}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                >
                  Exit Brush
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Regular menu */}
        {showMenu === image.id && !brushMode && (
          <div 
            className="absolute top-0 left-full w-36 ml-2 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-20"
            onMouseEnter={handleMenuHover}
            onMouseLeave={handleImageLeave}
          >
            <button className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"><ArrowDown size={16} />Save image</button>
            <button 
              onClick={() => handleBrushClick(image.id)}
              className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              <Brush size={16} />Use brush
            </button>
          </div>
        )}
      </div>
      {selectedImage?.id === image.id && !brushMode && (
        <p className="text-sm text-blue-600 mt-2 font-medium">Selected for editing</p>
      )}
    </div>
  );

  const hasImages = images.length > 0 || isEditing;
  const showCenterLayout = images.length === 1 || (isEditing && images.length === 0);

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

      

      {/* Continue to text button */}
      {selectedImage && (
        <div className="absolute top-4 right-10 z-10">
          <button
            onClick={() => {
              if (selectedImage?.url) {
                navigate(`/create-text?image=${encodeURIComponent(selectedImage.url)}`);
              }
            }}
            className="top-4 left-4 z-10 flex items-center gap-2  hover:bg-white  rounded-lg px-3 py-1.5  transition-all duration-200 text-gray-700 hover:text-gray-900"          >
            <span className="font-medium">Create Text </span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

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
            {/* Render all images using unified component */}
            {images.map(renderImage)}
            
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
              onChange={handleTextareaChange}
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

export default CreatePost;