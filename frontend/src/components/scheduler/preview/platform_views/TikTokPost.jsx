import React from 'react';
import { FaCommentDots } from "react-icons/fa";
import { RiShareForwardFill } from "react-icons/ri";  
import { IoHeart } from "react-icons/io5";
const TikTokPost = ({ 
  activePage, 
  content, 
  imageUrls = [], 
  videoUrl, 
  postType = 'video',
  scale = 1, 
  setContainerRef, 
  formatContent 
}) => {
  
  return (
    <div 
      ref={setContainerRef}
      className="transform origin-top-left mx-auto bg-black rounded-lg overflow-hidden shadow-lg relative"
      style={{ 
        transform: `scale(${scale})`,
        width: '320px',
        height: '568px',
      }}
    >

      {/* Video/Image Content */}
      <div className="w-full h-full relative">
        {postType === 'video' && videoUrl ? (
          <video 
            src={videoUrl} 
            className="w-full h-full object-cover"
            controls={false}
            muted
            autoPlay
            loop
            playsInline
          />
        ) : postType === 'image' && imageUrls.length > 0 ? (
          <img 
            src={imageUrls[0]} 
            alt="Post content" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="text-4xl mb-2">{postType === 'video' ? '🎥' : '📸'}</div>
              <p className="text-sm">Add {postType === 'video' ? 'video' : 'image'} content</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-24 space-y-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={activePage?.profile_picture || '/images/no-photos.svg'} 
              alt={activePage?.name || 'Profile'} 
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
        </div>

        {/* Like */}
        <div className="flex flex-col items-center text-white">
          <div className="p-2 rounded-full mb-1">
            <IoHeart className="w-7 h-7" color="lightgray" opacity={0.8} />
        
          </div>
          <span className="text-xs font-semibold">125.7K</span>
        </div>
        
        {/* Comment */}
        <div className="flex flex-col items-center text-white">
          <div className="p-2 rounded-full mb-1">
            <FaCommentDots className="w-7 h-7 " color="lightgray" opacity={0.8} />

          </div>
          <span className="text-xs font-semibold">2.1K</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center text-white">
          <div className="p-2 rounded-full mb-1">
            <RiShareForwardFill className="w-7 h-7" color="lightgray" opacity={0.8} />

          </div>
          <span className="text-xs font-semibold">Share</span>
        </div>
      </div>

      {/* Bottom Content - Username and Description */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        <div className="space-y-3">
          {/* Username */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-base">@{activePage?.name || 'username'}</span>
          </div>
          
          {/* Description */}
          {content && (
            <div className="text-sm leading-relaxed max-w-xs">
              {formatContent(content)}
            </div>
          )}
        
        </div>
      </div>
    </div>
  );
};

export default TikTokPost;

