import { ImEarth } from 'react-icons/im';
import { FaRegCommentAlt } from 'react-icons/fa';
import { RiShareForwardLine } from 'react-icons/ri';
import { ThumbsUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
const FacebookPost = ({ 
  activePage,
  content,
  imageUrl,
  imageUrls = [],
  videoUrl,
  scale,
  setContainerRef,
  formatContent
}) => {
  // Use imageUrls if available, otherwise fall back to single imageUrl
  const images = imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageAspectRatio(naturalWidth / naturalHeight);
  };

  // Determine if image fits Facebook's preferred ratios (1:1 or 4:5)
  const isPreferredRatio = imageAspectRatio && (
    Math.abs(imageAspectRatio - 1) < 0.1 || // 1:1 (square)
    Math.abs(imageAspectRatio - 0.8) < 0.1   // 4:5 (vertical)
  );

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
      className="max-w-md mx-auto bg-white shadow-sm rounded-lg cursor-default" 
      style={{ 
        fontFamily: 'Helvetica Neue, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0'
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {activePage?.profile_picture ? (
            <img src={activePage.profile_picture} alt={activePage.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {activePage.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">
              <span>{activePage.name}</span> 
            </p>
            <p className="text-xs text-gray-500">Ahora · <ImEarth className="inline w-3 h-3" /></p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-800 text-xl rounded-full p-2">⋯</span>
          <span className="text-gray-800 text-lg rounded-full p-2">✕</span>
        </div>
      </div>
      
      <p className="px-4 text-[15px] leading-normal">
        {content ? formatContent(content) : <span className="text-gray-400">Your post content will appear here...</span>}
      </p>      
      
        {images.length > 0 ? (
        <div className="mt-3 relative flex justify-center bg-black aspect-square">
          <img 
            src={images[currentImageIndex]} 
            alt="Post" 
            className="max-w-full max-h-full object-contain"
            onLoad={handleImageLoad}
          />
          
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
          

              
              {/* Image dots indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : videoUrl ? (
        <div className="mt-3 flex justify-center bg-black relative">
          <video 
            src={videoUrl} 
            className=  "w-full h-full object-contain" 
            preload="metadata"
            playsInline
            loop
            autoPlay  
            muted /* Add autoPlay to start playing automatically */
          />
          
         
        </div>
      ) : null}
      
      <div className="flex justify-around p-4 mt-6 text-gray-500 text-sm border-t">
        <button className="flex items-center space-x-1">
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center space-x-1">
          <FaRegCommentAlt className="w-3 h-3" />
          <span>Comment</span>
        </button>
        <button className="flex items-center space-x-1">
          <RiShareForwardLine className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default FacebookPost;