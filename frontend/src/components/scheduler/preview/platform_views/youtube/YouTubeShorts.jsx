import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaThumbsUp, FaThumbsDown, FaShare, FaComment, FaEllipsisV } from 'react-icons/fa';
import { MdPlayArrow, MdVolumeUp, MdMoreVert } from 'react-icons/md';

const YouTubeShorts = ({ 
  activePage,
  content,
  imageUrl,
  videoUrl,
  isGeneratingImage,
  scale,
  setContainerRef,
  formatContent,
  youtubeMetadata = {}
}) => {
  const { t } = useTranslation();
  const channelName = activePage?.name || 'Your Channel';
  const profilePicture = activePage?.profile_picture;
  
  // Use YouTube metadata if available
  const title = youtubeMetadata.title || t('postPreview.yourShortTitle');
  const description = youtubeMetadata.description || content;
  const tags = youtubeMetadata.tags;

  return (
    <div 
      ref={setContainerRef}
      className="w-full max-w-sm mx-auto bg-black relative overflow-hidden" 
      style={{ 
        fontFamily: 'Roboto, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0',
        aspectRatio: '9/16',
        minHeight: '600px',
        maxHeight: '800px'
      }}
    >
      {/* Video Background */}
      {videoUrl ? (
        <div className="absolute inset-0">
          <video 
            src={videoUrl} 
            className="w-full h-full object-cover" 
            preload="metadata"
            playsInline
            loop
            muted
            autoPlay
          />
          
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-red-900 to-black flex items-center justify-center">
          <div className="text-center text-white">
            <MdPlayArrow className="text-8xl mb-4 mx-auto opacity-40" />
            <p className="opacity-60 text-sm">Upload a video for your Short</p>
          </div>
        </div>
      )}

      {/* Top Overlay - YouTube Shorts branding */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black via-transparent to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="text-white font-semibold text-lg tracking-wide">Shorts</span>
          </div>
          <div className="flex items-center space-x-3">
            <MdVolumeUp className="text-white text-xl" />
            <MdMoreVert className="text-white text-xl" />
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-10 z-20 flex flex-col items-center space-y-4">
      
        

        {/* Like Button */}
        <div className="flex flex-col items-center text-white">
          <button className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-30 transition-all active:scale-95">
            <FaThumbsUp className="text-xl" />
          </button>
          <span className="text-xs font-medium">1.2K</span>
        </div>

        {/* Dislike Button */}
        <div className="flex flex-col items-center text-white">
          <button className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-30 transition-all active:scale-95">
            <FaThumbsDown className="text-xl" />
          </button>
          <span className="text-xs font-medium">Dislike</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center text-white">
          <button className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-30 transition-all active:scale-95">
            <FaComment className="text-xl" />
          </button>
          <span className="text-xs font-medium">89</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center text-white">
          <button className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-30 transition-all active:scale-95">
            <FaShare className="text-xl" />
          </button>
          <span className="text-xs font-medium">Share</span>
        </div>

        {/* More Options */}
        <div className="flex flex-col items-center text-white">
            <button className="w-10 h-10 bg-black bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all active:scale-95">
            <FaEllipsisV className="text-xl" />
          </button>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black to-transparent p-4 pt-12">
        {/* Channel Name and Handle */}
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-white font-semibold text-base">@{channelName.toLowerCase().replace(/\s+/g, '')}</span>
          <button className="text-white text-sm font-semibold px-4 py-1.5 border border-white border-opacity-50 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors">
            Follow
          </button>
        </div>

        {/* Title (if available) */}
        {title && title !== t('postPreview.yourShortTitle') && (
          <div className="text-white text-sm font-semibold mb-2 leading-tight">
            {title}
          </div>
        )}

        {/* Caption/Description */}
        {description && (
          <div className="text-white text-sm mb-3 leading-relaxed">
            <div className="line-clamp-2">
              {formatContent ? formatContent(description) : description}
            </div>
          </div>
        )}

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-blue-300 text-sm font-medium">#Shorts</span>
          {tags ? (
            tags.split(',').slice(0, 2).map((tag, index) => (
              <span key={index} className="text-blue-300 text-sm font-medium">
                #{tag.trim()}
              </span>
            ))
          ) : (
            <>
              <span className="text-blue-300 text-sm font-medium">#YouTube</span>
              <span className="text-blue-300 text-sm font-medium">#Trending</span>
            </>
          )}
        </div>

        {/* Music/Audio Info */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-2 bg-black bg-opacity-30 rounded-full px-3 py-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs">Original audio</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="w-full h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div className="w-2/5 h-full bg-white rounded-full transition-all duration-300"></div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeShorts;