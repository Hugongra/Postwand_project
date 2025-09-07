import { useTranslation } from 'react-i18next';
import { Globe, MessageCircle,ThumbsUp, Heart, Lightbulb } from 'lucide-react';
import { SlLike } from "react-icons/sl";
import { FaRegCommentDots } from "react-icons/fa";
import { FaEarthAmericas } from "react-icons/fa6";
const LinkedInPost = ({ 
  activePage,
  content,
  imageUrl,
  videoUrl,
  isGeneratingImage,
  scale,
  setContainerRef,
  formatContent,
  imagePlaceholder
}) => {
  const { t } = useTranslation();
  return (
    <div 
      ref={setContainerRef}
      className="max-w-md mx-auto bg-white shadow-sm rounded-lg cursor-default" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3">
        <div className="flex items-start space-x-2">
          {activePage?.profile_picture ? (
            <img src={activePage.profile_picture} alt={activePage.name} className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
              {activePage.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <p className="font-semibold text-sm text-gray-900">
                {activePage.name}
              </p>
              <span className="text-gray-500">• You</span>
            </div>
            
            
              
            
              <FaEarthAmericas className="w-3 h-3 text-gray-500" />
           
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button className="text-gray-600 rounded-full p-2">
            <span className="text-lg">⋯</span>
          </button>
          <button className="text-gray-600 rounded-full p-2">
            <span className="text-lg">✕</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-3 pb-3">
        <p className="text-sm leading-relaxed text-gray-900">
          {content ? formatContent(content) : <span className="text-gray-400">{t('postPreview.postContentPlaceholder')}</span>}
        </p>
      </div>
      
      {/* Media */}
      {isGeneratingImage ? (
        imagePlaceholder
      ) : imageUrl ? (
        <div className="bg-gray-50">
          <img src={imageUrl} alt="Post" className="w-full max-h-[400px] object-cover" />
        </div>
      ) : videoUrl ? (
        <div className="bg-black relative">
          <video 
            src={videoUrl} 
            className="w-full h-full object-contain max-h-[400px]" 
            preload="metadata"
            playsInline
            loop
            autoPlay  
            muted
          />
        </div>
      ) : null}
      
      {/* Engagement Stats */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <Lightbulb className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <span>12</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>3 comments</span>
            <span>1 repost</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-around py-2 px-3">
        <button className="flex items-center justify-center space-x-2  py-2 px-3 flex-1 text-gray-700 text-sm font-medium">
          <SlLike className="w-4 h-4 font-extrabold transform scale-x-[-1]" />
          <span>Like</span>
        </button>
        <button className="flex items-center justify-center space-x-2  py-2 px-3 flex-1 text-gray-700 text-sm font-medium">
          <FaRegCommentDots className="w-4 h-4 font-extrabold" />
          <span>Comment</span>
        </button>
        
      </div>
    </div>
  );
};

export default LinkedInPost;