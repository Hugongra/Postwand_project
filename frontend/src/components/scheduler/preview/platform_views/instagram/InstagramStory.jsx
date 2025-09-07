import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
const InstagramStory = ({ 
  activePage,
  content,
  imageUrl,
  imageUrls = [],
  videoUrl,
  isGeneratingImage,
  scale,
  setContainerRef,
  formatContent,
  imagePlaceholder
}) => {
  const { t } = useTranslation();
  // Use imageUrls if available, otherwise fall back to single imageUrl
  const images = imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when images array changes to prevent out-of-bounds errors
  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
 
    return (
      <div 
        ref={setContainerRef}
        className="w-full max-w-sm mx-auto bg-black shadow-md rounded-lg" 
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0',
          aspectRatio: '9/16',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Story content - either image or video */}
        {isGeneratingImage ? (
          imagePlaceholder
        ) : videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover" 
              autoPlay  
              muted /* Add autoPlay to start playing automatically */
              preload="metadata"
              playsInline
              loop
            />
            
           
        
          </div>
        ) : images.length > 0 ? (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            <img 
              src={images[currentImageIndex]} 
              alt="Story" 
              className="w-full h-full object-cover" 
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
            <p>{t('postPreview.addImageOrVideoStory')}</p>
          </div>
        )}

        {/* Story UI overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/50 text-black rounded-full w-7 h-7 flex items-center justify-center z-20"
            >
              <ChevronLeft size={18} /> 
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/50 text-black rounded-full w-7 h-7 flex items-center justify-center z-20"
            >
              <ChevronRight size={18} />
            </button>
            
            
          </>
          )}
          
          {/* Progress bar at top */}
          <div className="p-2 flex">
            {images.length > 1 ? (
              // Multiple progress bars for multiple images
              images.map((_, index) => (
                <div key={index} className="w-full bg-gray-600 bg-opacity-40 rounded-full h-1 mx-0.5">
                  <div 
                    className={`h-1 rounded-full ${index === currentImageIndex ? 'bg-white' : index < currentImageIndex ? 'bg-white' : 'bg-transparent'}`}
                    style={{ width: index === currentImageIndex ? '100%' : index < currentImageIndex ? '100%' : '0%' }}
                  ></div>
                </div>
              ))
            ) : (
              <div className="w-full bg-gray-600 bg-opacity-40 rounded-full h-1">
                <div className="bg-white h-1 rounded-full w-1/3"></div>
              </div>
            )}
          </div>

          {/* User info at top */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activePage?.profile_picture ? (
                <img 
                  src={activePage.profile_picture} 
                  alt={activePage.name} 
                  className="w-8 h-8 rounded-full border-2 border-pink-500" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold border-2 border-white">
                  {activePage.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm text-white">{activePage.name}</span>
              <span className="text-xs text-gray-300">2h</span>
            </div>
            <div className="flex space-x-4">
              <button className="text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                </svg>
              </button>
              <button className="text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

       

          {/* Reply field at bottom */}
          <div className="p-4 mt-auto">
            <div className="bg-gray-800 bg-opacity-70 rounded-full p-2 flex items-center">
              <input 
                type="text" 
                placeholder="Send message" 
                className="bg-transparent border-none text-white w-full focus:outline-none text-sm" 
                disabled 
              />
              <button className="text-white ml-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default InstagramStory;