import { useRef, useState, useEffect } from 'react';
import ChatInput from '@/pages/CreatePost/editImage/ChatInput';
import ChatMenu from '@/pages/CreatePost/editImage/ChatMenu';
import ImageCard from '@/pages/CreatePost/editImage/ImageCard';
import * as api from '@services/api/api';
import { Download } from 'lucide-react';

const EditImage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const currentChatIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
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
        if (response.data.images && response.data.images.length > 0) {
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

  const handleEditImage = async (model, imageFile, imageUrl, prompt) => {
    setIsGenerating(true);
    
    // Scroll to bottom when placeholder appears
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    const chatId = currentChatIdRef.current || generateChatId();
    
    const formData = new FormData();
    formData.append(imageFile ? 'image' : 'image_url', imageFile || imageUrl);
    formData.append('prompt', prompt);
    formData.append('chat_id', chatId);
    

      const response = await api.EditImage(model, formData);
      const data = response.data; 
      
      if (response.ok && data.success) {
        const newImageUrl = data.image_url;
        setImages(prev => [...prev, newImageUrl]);
        setSelectedImage(newImageUrl);
        
        // Set the chat ID if it's a new chat
        if (!currentChatIdRef.current) {
          setCurrentChatId(chatId);
          currentChatIdRef.current = chatId;
        }
   
        // Scroll to the new image
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);

        loadChatHistory();
      } else {
        console.error('Failed to edit image:', data.error || 'Unknown error');
      }
 
    
    setIsGenerating(false);
  };

  const handleImageUpload = async (imageFile) => {
    if (!imageFile) return;

    const url = URL.createObjectURL(imageFile);
    setImages(prev => [...prev, url]);
    setSelectedImage(url);
    setSelectedImageFile(imageFile);
  };


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

     

      {/* Scrollable Images Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {images.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Image</h1>
              <p className="text-gray-500">Upload an image to get started</p>
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
          mode="edit"
          onEditImage={handleEditImage}
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
