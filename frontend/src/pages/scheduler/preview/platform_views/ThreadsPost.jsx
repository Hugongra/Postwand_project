import { useTranslation } from 'react-i18next';
import { FaRegHeart } from 'react-icons/fa';
import { FaRegCommentAlt } from 'react-icons/fa';
import { RiShareForwardLine } from 'react-icons/ri';
import { Repeat } from 'lucide-react';
const ThreadsPost = ({ 
  activePage,
  postData,
  scale,
  setContainerRef,
  formatContent
}) => {
  const { t } = useTranslation();
  const content = postData?.content?.threads || '';
  const imageUrl = postData?.images?.[0];
  const videoUrl = postData?.videoUrl;
  const isGeneratingImage = false;
  const imagePlaceholder = null;
  
  return (
    <div 
      ref={setContainerRef}
      className="max-w-md mx-auto bg-white shadow-sm rounded-lg" 
      style={{ 
        fontFamily: 'Helvetica Neue, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0'
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {activePage?.profilePicture ? (
            <img src={activePage.profilePicture} alt={activePage.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">
              {activePage.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{activePage.name}</p>
            <p className="text-xs text-gray-500">{t('postPreview.justNow')}</p>
          </div>
        </div>
      </div>
      
      <p className="px-4 text-[15px] leading-normal">
        {content ? formatContent(content) : <span className="text-gray-400">{t('postPreview.threadsPostPlaceholder')}</span>}
      </p>      
      
      {isGeneratingImage ? (
        imagePlaceholder
      ) : imageUrl ? (
        <div className="mt-3 flex justify-center bg-black">
          <img src={imageUrl} alt="Post" className="max-w-full max-h-[400px] object-contain" />
        </div>
      ) : videoUrl ? (
        <div className="mt-3 flex justify-center bg-black relative">
          <video 
            src={videoUrl} 
            autoPlay  
            muted /* Add autoPlay to start playing automatically */
            className="w-full h-full object-contain" 
            preload="metadata"
            playsInline
            loop
          />
          
          {/* Play button overlay for Threads */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="flex pl-4 pt-2 pb-2 mt-2 text-gray-600 text-sm">
        <div className="flex items-center space-x-5">
          <button>
            <FaRegHeart className="w-5 h-5" />
          </button>
          <button>
            <svg aria-label="Comment" className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <button>
            <Repeat className="w-5 h-5" />
          </button>
          <button>
            <svg aria-label="Share Post" className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon>
            </svg>
          </button>
        </div>
        
      </div>
      <div className="flex pb-4 pl-4 items-center space-x-5 text-gray-500"> 
        <span className="text-sm">123 replies · 249 likes</span>
          
        </div>
      
    </div>
  );
};

export default ThreadsPost;