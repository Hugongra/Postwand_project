import { useEffect, useRef, useState } from 'react';
import ChatInput from '@/pages/CreatePost/editImage/ChatInput';
import * as api from '@services/api/api';
import { X } from 'lucide-react';

const GenerateAds = ({ type }) => {
  const [adType, setAdType] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null); // Store the actual file
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);



  const handleGenerateAd = async (uploadedImage, prompt, aspectRatio) => {
    setIsGenerating(true);
    setSelectedImage(null);
    
    const formData = new FormData();
    formData.append('image', uploadedImage);
    formData.append('prompt', prompt);
    formData.append('ad_type', adType);
    formData.append('aspect_ratio', aspectRatio);
    const response = await api.GenerateAd(formData);
    const data = response.data; 
    
    if (response.ok) {
      const newImageUrl = data.image_url;
      setImages(prev => [...prev, newImageUrl]);
    }
    
    setIsGenerating(false);
  };

  const handleImageUpload = async (imageFile) => {
    if (!imageFile) return;

    const url = URL.createObjectURL(imageFile);
    setSelectedImage(url); // This is just for preview
    setSelectedImageFile(imageFile); // Store the actual file

    await api.ImageUpload(imageFile);
  };

  useEffect(() => {
    setAdType(type);
  }, [type]);

  const shouldBeAtBottom = isLoading || images.length > 0 || isGenerating;

  return (
    <div className="w-full h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      {/* Heading at the top */}
      {!shouldBeAtBottom && (
        <div className="absolute top-32 left-0 w-full flex justify-center items-center">
          <h1 className="text-4xl font-bold text-gray-900">Create ads</h1>
        </div>
      )}

      {/* Spacer when content is at bottom */}
      {shouldBeAtBottom && (
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            {isGenerating && (
                 <div className="w-80 h-auto animate-pulse bg-gray-200 rounded-lg">
                    </div>
            )}
          {images.length > 0 && (
            <div className="w-80 h-auto">
              <img
                src={images[images.length - 1]}
                alt="Edited result"
                className="w-full h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Input container */}
      <div
        className={`w-full flex justify-center transition-all duration-500 ease-in-out ${
          shouldBeAtBottom ? 'pb-0' : 'flex-1 items-center'
        }`}
      >
        <div className="w-[90%] sm:w-[85%] md:w-[70%] lg:w-[60%] xl:w-[60%]">
          {/* Container for ChatInput and thumbnail */}
          <div className="relative w-full">
            {/* Thumbnail overlay above ChatInput */}
            {selectedImage && (
              <div className="absolute -top-16 left-0 z-10">
                <div className="relative w-14 h-14">
                  <img
                    src={selectedImage}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover rounded-md border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedImageFile(null);
                      setImages([]);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 hover:bg-gray-200 shadow"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* ChatInput */}
            <ChatInput
              mode="ad"
              onGenerateAd={handleGenerateAd}
              onImageUpload={handleImageUpload}
              isGenerating={isGenerating}
              selectedImage={selectedImage}
              uploadedImageFile={selectedImageFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAds;