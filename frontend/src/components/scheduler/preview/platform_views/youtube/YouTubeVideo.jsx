import React from 'react';
import { FaThumbsUp, FaThumbsDown, FaShare, FaDownload, FaEllipsisH } from 'react-icons/fa';
import { MdPlayArrow } from 'react-icons/md';

const YouTubeVideo = ({ 
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
  const channelName = activePage?.name || 'Your Channel';
  const profilePicture = activePage?.profile_picture;
  
  // Use YouTube metadata if available
  const title = youtubeMetadata.title || (content ? content.split('\n')[0].substring(0, 100) : 'Your Video Title');
  const description = youtubeMetadata.description || content;
  const tags = youtubeMetadata.tags;

  return (
    <div 
      ref={setContainerRef}
      className="w-full max-w-4xl mx-auto bg-white" 
      style={{ 
        fontFamily: 'Roboto, Arial, sans-serif',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        marginBottom: scale < 1 ? `${(1 - scale) * -100}%` : '0'
      }}
    >
      {/* Video Player Area */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        {videoUrl ? (
          <div className="w-full h-full relative">
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover" 
              preload="metadata"
              playsInline
              controls={false}
              autoPlay
              muted
              loop
              style={{ backgroundColor: '#000' }}
            />
            {/* Video duration */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium">
              5:42
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MdPlayArrow className="text-6xl mb-2 mx-auto opacity-70" />
              <p className="text-sm">Upload a video for your YouTube video</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Info Section */}
      <div className="px-6 py-4">
        {/* Title */}
        <h1 className="text-md font-semibold text-gray-900 mb-2 leading-tight">
          {title}
          {title && title.length > 100 && '...'}
        </h1>

        {/* Channel Info */}
        <div className="flex items-start">
          <div className="flex items-start space-x-3">
            {profilePicture ? (
              <img 
                src={profilePicture}
                alt={channelName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {channelName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 text-sm">{channelName}</h3>
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs text-gray-600 mb-3">1.23M subscribers</div>
              
              {/* Description */}
              {description && (
                <div className="text-sm text-gray-800 leading-relaxed">
                  <div className="line-clamp-2">
                    {formatContent ? formatContent(description) : description}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.split(',').slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      #{tag.trim()}
                    </span>
                  ))}
                  {tags.split(',').length > 3 && (
                    <span className="text-xs text-gray-500">+{tags.split(',').length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Subscribe Button */}
          <button className="bg-black text-white px-4 py-1.5 rounded-full text-xs hover:bg-gray-800 transition-colors ml-4">
            Subscribe
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center space-x-2">
            {/* Like Button */}
            <div className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 transition-colors cursor-pointer">
              <FaThumbsUp className="text-xs mr-2" />
              <span className="text-xs font-medium">1.2K</span>
              <div className="w-px h-6 bg-gray-300 mx-3"></div>
              <FaThumbsDown className="text-base" />
            </div>
            
            {/* Share Button */}
            <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 transition-colors">
              <FaShare className="text-xs" />
              <span className="text-xs font-medium">Share</span>
            </button>
            
            {/* Download Button */}
            <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-1.5 transition-colors">
              <FaDownload className="text-xs" />
                  <span className="text-xs font-medium">Download</span>
            </button>
            
            {/* More Button */}
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors">
              <FaEllipsisH className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeVideo;