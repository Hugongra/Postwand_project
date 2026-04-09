import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Sparkles } from 'lucide-react';
import ChatInput from '@/pages/CreatePost/editImage/ChatInput';
import ChatMenu from '@/pages/CreatePost/editImage/ChatMenu';
import ImageCard from '@/pages/CreatePost/editImage/ImageCard';
import * as api from '@services/api/api';

const EditImage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('create');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const currentChatIdRef = useRef(null);
  const [images, setImages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState([]);
  const scrollContainerRef = useRef(null);

  const generateChatId = () => crypto.randomUUID();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    const response = await api.ChatSessions();
    if (response.ok && response.data.chats) {
      setChats(response.data.chats);
    }
  };

  const loadChatSession = async (chatId) => {
    const response = await api.ChatSession(chatId);
    if (response.ok && response.data.images) {
      setImages(response.data.images || []);
      setCurrentChatId(chatId);
      currentChatIdRef.current = chatId;
      if (response.data.images.length > 0) {
        setSelectedImage(response.data.images[response.data.images.length - 1]);
      }
    }
  };

  const startNewChat = () => {
    setImages([]);
    setSelectedImage(null);
    setSelectedImageFile(null);
    setCurrentChatId(null);
    currentChatIdRef.current = null;
    setShowHistory(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const handleProcessResult = (data, chatId) => {
    const newImageUrl = data.image_url;
    setImages((prev) => [...prev, newImageUrl]);
    setSelectedImage(newImageUrl);

    if (!currentChatIdRef.current) {
      setCurrentChatId(chatId);
      currentChatIdRef.current = chatId;
    }

    scrollToBottom();
    loadChatHistory();
  };

  const handleEditImage = async (model, imageFile, imageUrl, prompt) => {
    setIsGenerating(true);
    scrollToBottom();

    const chatId = currentChatIdRef.current || generateChatId();
    const formData = new FormData();
    formData.append(imageFile ? 'image' : 'image_url', imageFile || imageUrl);
    formData.append('prompt', prompt);
    formData.append('chat_id', chatId);

    const response = await api.EditImage(model, formData);
    if (response.ok && response.data.success) {
      handleProcessResult(response.data, chatId);
    } else {
      console.error('Failed to edit image:', response.data?.error || 'Unknown error');
    }

    setIsGenerating(false);
  };

  const handleGenerateImage = async (model, prompt, aspectRatio) => {
    setIsGenerating(true);
    scrollToBottom();

    const chatId = currentChatIdRef.current || generateChatId();
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('chat_id', chatId);
    formData.append('aspect_ratio', aspectRatio);

    const response = await api.GenerateImage(model, formData);
    if (response.ok && response.data.success) {
      handleProcessResult(response.data, chatId);
    } else {
      console.error('Failed to generate image:', response.data?.error || 'Unknown error');
    }

    setIsGenerating(false);
  };

  const handleImageUpload = async (imageFile) => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImages((prev) => [...prev, url]);
    setSelectedImage(url);
    setSelectedImageFile(imageFile);
    setActiveTab('edit');
  };

  useEffect(() => {
    const editUrl = location.state?.editImageUrl;
    if (editUrl) {
      setImages((prev) => [...prev, editUrl]);
      setSelectedImage(editUrl);
      setActiveTab('edit');
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSaveToLibrary = useCallback(async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });
      const response = await api.UploadImage(file);
      return response.ok && response.data?.success;
    } catch {
      return false;
    }
  }, []);

  const handleCreateCaption = useCallback((imageUrl) => {
    navigate('/create-text', { state: { attachedImage: imageUrl } });
  }, [navigate]);

  const handleUseInPost = useCallback((imageUrl) => {
    navigate('/scheduler', { state: { preloadedImage: imageUrl } });
  }, [navigate]);

  return (
    <div className="w-full h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      {/* Chat Menu */}
      <ChatMenu
        startNewChat={startNewChat}
        setShowHistory={setShowHistory}
        showHistory={showHistory}
        chats={chats}
        loadChatSession={loadChatSession}
      />

      {/* Tab Toggle */}
      <div className="flex justify-center pt-3 pb-1 px-4">
        <div className="inline-flex bg-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles size={15} />
            Create
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Pencil size={15} />
            Edit
          </button>
        </div>
      </div>

      {/* Scrollable Images Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {images.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {activeTab === 'create' ? 'Create Image' : 'Edit Image'}
              </h1>
              <p className="text-gray-500">
                {activeTab === 'create'
                  ? 'Describe the image you want to generate'
                  : 'Upload an image to get started'}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-sm mx-auto">
          {images.map((image, index) => (
            <ImageCard
              key={index}
              image={image}
              index={index}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              onSaveToLibrary={handleSaveToLibrary}
              onCreateCaption={handleCreateCaption}
              onUseInPost={handleUseInPost}
            />
          ))}

          {isGenerating && (
            <div className={`w-full mb-20 rounded-lg shadow-sm overflow-hidden ${images.length === 0 ? 'mt-[15vh]' : ''}`}>
              <div className="w-full aspect-square animate-pulse bg-gray-200 rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div className="w-full">
        <ChatInput
          mode={activeTab}
          onEditImage={handleEditImage}
          onGenerateImage={handleGenerateImage}
          onImageUpload={handleImageUpload}
          isGenerating={isGenerating}
          selectedImage={selectedImage}
          uploadedImageFile={selectedImageFile}
        />
      </div>
    </div>
  );
};

export default EditImage;
