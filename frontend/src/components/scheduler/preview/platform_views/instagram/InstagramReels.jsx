import { useTranslation } from 'react-i18next';
import { FaRegHeart } from 'react-icons/fa';

const InstagramReels = ({ 
  activePage,
  content,
  imageUrl,
  videoUrl,
  isGeneratingImage,
  scale,
  setContainerRef,
  formatContent
}) => {
  const { t } = useTranslation();
    return (
      <div 
        ref={setContainerRef}
        className="w-full max-w-sm mx-auto bg-black shadow-md rounded-lg" 
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0',
          aspectRatio: '9/16', // Instagram reels use 9:16 aspect ratio
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Reel content - video is preferred but show image if no video */}
        {videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover" 
              preload="metadata"
              playsInline
              loop
              autoPlay  
              muted /* Add autoPlay to start playing automatically */
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            />
            
           
          </div>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
            <p className="text-center p-4">
              {t('postPreview.uploadVideoForReel')}
            </p>
          </div>
        )}

        {/* Reel UI overlay - Using absolute positioning for all elements */}
        <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: 'none' }}>
          {/* Action buttons - add pointer-events-auto to make these elements clickable */}
          <div className="absolute bottom-20 right-2 w-16 flex flex-col items-center space-y-6 pointer-events-auto">
            <button className="text-white">
              <FaRegHeart className="w-7 h-7" />
              <span className="text-xs block mt-1">435K</span>
            </button>
            <button className="text-white">
              <svg aria-label="Comment" className="w-7 h-7 fill-none stroke-white" viewBox="0 0 24 24">
                <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="text-xs block mt-1">1,024</span>
            </button>
            <button className="text-white">
              <svg aria-label="Share" className="w-7 h-7 fill-none stroke-white" viewBox="0 0 24 24">
                <line fill="none" stroke="white" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
                <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="white" strokeLinejoin="round" strokeWidth="2"></polygon>
              </svg>
              <span className="text-xs block mt-1">Share</span>
            </button>
            <button className="text-white">
              <svg aria-label="More options" className="w-6 h-6 fill-none stroke-white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
              </svg>
            </button>
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
              <img 
                src={activePage?.profile_picture || "https://via.placeholder.com/50"} 
                alt="Music" 
                className="w-full h-full object-cover rounded" 
              />
            </div>
          </div>

          {/* User info and caption at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center space-x-2">
              {activePage?.profile_picture ? (
                <img 
                  src={activePage.profile_picture} 
                  alt={activePage.name} 
                  className="w-8 h-8 rounded-full border-2 border-white" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold border-2 border-white">
                  {activePage.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm text-white">{activePage.name}</span>
              <button className="text-white text-xs bg-transparent border border-white rounded px-2 py-1 ml-2">
                Follow
              </button>
            </div>
            
            {/* Caption */}
            {content && (
              <div className="mt-2 text-white text-sm line-clamp-2">
                {formatContent(content)}
              </div>
            )}
            
            {/* Audio track */}
            <div className="mt-2 flex items-center text-white text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <span className="mr-1">Original Audio</span>
              
            </div>
          </div>
        </div>
      </div>
    );
  };

export default InstagramReels;