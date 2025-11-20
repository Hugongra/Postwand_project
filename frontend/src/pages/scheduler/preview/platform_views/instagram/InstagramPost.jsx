import { useTranslation } from 'react-i18next';
import { FaRegHeart } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
const InstagramPost = ({ 
  activePage,
  postData,
  scale,    
  setContainerRef,
  formatContent
}) => {
  const { t } = useTranslation(); 
  const content = postData?.content?.instagram || '';
  const images = postData?.images || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageAspectRatio(naturalWidth / naturalHeight);
  };

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
      className="w-full max-w-sm mx-auto bg-white shadow-md rounded-lg cursor-default" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0'
      }}
    >
      {/* Instagram Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-3">
          {activePage?.profilePicture ? (
            <img src={activePage.profilePicture} alt={activePage.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {activePage.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-sm">{activePage.name}</span>
        </div>
        <span className="text-gray-800 text-xl rounded-full p-2">⋯</span>
      </div>

      {/* Image Carousel */}
      {images.length > 0 ? (
        <div className={`relative w-full ${imageAspectRatio && imageAspectRatio < 1 ? 'bg-white' : 'aspect-square bg-black flex items-center justify-center'}`}>
          <img 
            src={images[currentImageIndex]} 
            alt="Post" 
            className={imageAspectRatio && imageAspectRatio < 1 ? "w-full h-auto" : "max-w-full max-h-full object-contain"}
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
            </>
          )}
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
          No image selected
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex items-center space-x-4">
          <button>
            <FaRegHeart className="w-6 h-6" />
          </button>
          <button>
            <svg aria-label="Comment" className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
              <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <button>
            <svg aria-label="Share Post" className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon>
            </svg>
          </button>
        </div>

        {/* Image dots indicator for multiple images */}
        {images.length > 1 && (
          <div className="flex justify-center space-x-1 mt-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Likes */}
        <div className="mt-2 font-semibold text-sm">249 likes</div>

        {/* Caption */}
        <div className="mt-1 text-sm">
          <span className="font-semibold mr-2">{activePage.name}</span>
          {content ? formatContent(content) : <span className="text-gray-400">{t('postPreview.captionPlaceholder')}</span>}
        </div>

        {/* Comments */}
        <div className="mt-2 text-gray-400 text-xs">
          View all 123 comments
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-gray-400 text-xs">
          Add a comment...
        </div>
      </div>
    </div>
  );

};

export default InstagramPost;