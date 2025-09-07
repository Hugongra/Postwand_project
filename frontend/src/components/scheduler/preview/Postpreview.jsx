import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';

import FacebookPost from './platform_views/facebook/FacebookPost';
import InstagramStory from './platform_views/instagram/InstagramStory';
import InstagramReels from './platform_views/instagram/InstagramReels';
import InstagramPost from './platform_views/instagram/InstagramPost';
import FacebookStory from './platform_views/facebook/FacebookStory';
import FacebookReel from './platform_views/facebook/FacebookReel';
import ThreadsPost from './platform_views/ThreadsPost';
import TikTokPost from './platform_views/TikTokPost';
import LinkedinPost from './platform_views/linkedin/LinkedinPost';
import YouTubeVideo from './platform_views/youtube/YouTubeVideo';
import YouTubeShorts from './platform_views/youtube/YouTubeShorts';

const PostPreview = ({ 
  facebookData, 
  instagramData, 
  threadsData, 
  tiktokData,
  linkedinData,
  youtubeData,
  selectedPlatforms, 
  selectedPages = {}, 
  imageUrls = [], 
  content,
  videoUrl,
  youtubeMetadata = {},
  postType
}) => {
  const { t } = useTranslation();

  const [activePlatform, setActivePlatform] = useState('');
  const [containerRef, setContainerRef] = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (selectedPlatforms?.length > 0) {
      setActivePlatform(selectedPlatforms[0]);
    } else {
      setActivePlatform('');
    }
  }, [selectedPlatforms]);

  // Debug post types changes
  useEffect(() => {
    console.log('PostPreview selectedPages changed:', selectedPages);
  }, [selectedPages]);

  // Scale calculation effect
  useEffect(() => {
    if (!containerRef) return;
    
    const calculateScale = () => {
      const containerHeight = containerRef.scrollHeight;
      const viewportHeight = window.innerHeight * 0.85; // Use 85% of viewport height
      
      if (containerHeight > viewportHeight) {
        const newScale = viewportHeight / containerHeight;
        setScale(Math.max(0.5, newScale)); // Don't scale below 50%
      } else {
        setScale(1);
      }
    };
    
    calculateScale();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    
    // Create a new resize observer
    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(containerRef);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      resizeObserver.disconnect();
    };
  }, [containerRef, imageUrls, content, activePlatform]);

  // Combine all social accounts
  const socialAccounts = [
    ...(facebookData?.pages?.map(page => ({
      id: page.id,
      name: page.name,
      profile_picture: page.profile_picture,
      platform: 'facebook'
    })) || []),
    ...(instagramData?.accounts?.map(account => ({
      id: account.id,
      name: account.name,
      profile_picture: account.profile_picture,
      platform: 'instagram'
    })) || []),
    ...(threadsData?.accounts?.map(account => ({
      id: account.id,
      name: account.name,
      profile_picture: account.profilePicture,
      platform: 'threads'
    })) || []),
    ...(linkedinData?.accounts?.map(account => ({
      id: account.id,
      name: account.name,
      profile_picture: account.picture,
      platform: 'linkedin'
    })) || []),
    ...(youtubeData?.channels?.map(channel => ({
      id: channel.id,
      name: channel.title,
      profile_picture: channel.profile_picture,
      platform: 'youtube'
    })) || []),
    ...(tiktokData?.accounts?.map(account => ({
      id: account.id,
      name: account.display_name,
      profile_picture: account.avatar_url,
      platform: 'tiktok'
    })) || [])
  ];

  // Find the active page for the current platform
  const activePage = socialAccounts.find(account => 
    account.platform === activePlatform && account.id.toString() === selectedPages[activePlatform]?.toString()
  );


  

  

  // Update getPlatformIcon to use img tags
  const getPlatformIcon = (platform, isActive) => {
    const baseIconClass = "w-5 h-5";
    
    switch (platform) {
      case 'facebook':
        return <img src={FacebookIcon} alt="Facebook" className={`${baseIconClass} ${isActive ? 'text-[#3b5998]' : 'text-gray-500'}`} />;
      case 'instagram':
        return <img src={InstagramIcon} alt="Instagram" className={`${baseIconClass} text-gray-500`} />;
      case 'threads':
        return <img src={ThreadsIcon} alt="Threads" className={`${baseIconClass} ${isActive ? 'text-black' : 'text-gray-500'}`} />;
      case 'linkedin':
        return <img src={LinkedinIcon} alt="LinkedIn" className={`${baseIconClass} ${isActive ? 'text-black' : 'text-gray-500'}`} />;
      case 'youtube':
        return <img src={YouTubeIcon} alt="YouTube" className={`${baseIconClass} ${isActive ? 'text-red-600' : 'text-gray-500'}`} />;
      case 'tiktok':
        return <img src={TikTokIcon} alt="TikTok" className={`${baseIconClass} ${isActive ? 'text-black' : 'text-gray-500'}`} />;
      default:
        return null;
    }
  };

  // Platform selector tabs
  const renderPlatformTabs = () => {
    if (selectedPlatforms.length <= 1) return null;
    
    return (
      <div className="flex mb-3" >
        {selectedPlatforms.map(platform => {
          const isActive = activePlatform === platform;
          return (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex items-center justify-center gap-2 px-4 min-w-20 py-2 rounded-t-lg transition-colors ${
                isActive 
                  ? 'bg-white' 
                  : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              {getPlatformIcon(platform, isActive)}
                {selectedPlatforms.length < 4 && (
                  <span className={`${isActive ? 'text-black' : 'text-gray-500'}`}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                )}
              
              
            </button>
          );
        })}
      </div>
    );
  };

 

  // Helper function to format text with line breaks
  const formatContent = (text) => {
    if (!text) return '';
    // Ensure text is a string
    const textString = String(text);
    return textString.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== textString.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  

  const renderFacebookPreview = () => { 
    const selectedPostType = selectedPages.meta_post_type || (postType === 'text' ? 'post' : null);
    console.log('Facebook render - postType:', selectedPostType);
    
    if(selectedPostType === 'post'){
      return <FacebookPost 
        activePage={activePage}
        content={content}
        imageUrls={imageUrls}
        videoUrl={videoUrl}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if(selectedPostType === 'story'){
      return <FacebookStory
        activePage={activePage}
        content={content}
        imageUrls={imageUrls}
        videoUrl={videoUrl}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if(selectedPostType === 'reel'){
      return <FacebookReel
        activePage={activePage}
        content={content}
        videoUrl={videoUrl}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    }
    
    // Fallback: no post type selected
    return null;
  }
  
  const renderInstagramPreview = () => {
    const selectedPostType = selectedPages.meta_post_type || (postType === 'text' ? 'post' : null);
    console.log('Instagram render - postType:', selectedPostType);
    
    if (selectedPostType === 'story') {
      return <InstagramStory 
        activePage={activePage}
        content={content}
        imageUrls={imageUrls}
        videoUrl={videoUrl}
  
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if (selectedPostType === 'reel') {
      return <InstagramReels 
        activePage={activePage}
        content={content}
        imageUrls={imageUrls}
        videoUrl={videoUrl}
        
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if(selectedPostType === 'post'){
      return <InstagramPost 
        activePage={activePage}
        content={content}
        imageUrls={imageUrls}
        videoUrl={videoUrl}
        
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    }
    
    // Fallback: no post type selected
    return null;
  };

  const renderThreadsPreview = () => (
    <ThreadsPost
      activePage={activePage}
      content={content}
      imageUrls={imageUrls}
      videoUrl={videoUrl}
      
      scale={scale}
      setContainerRef={setContainerRef}
      formatContent={formatContent}

    />
  );

  const renderLinkedinPreview = () => {
    return <LinkedinPost
      activePage={activePage}
      content={content}
      imageUrls={imageUrls}
      videoUrl={videoUrl}
      
      scale={scale}
      setContainerRef={setContainerRef}
      formatContent={formatContent}

    />
  }

  const renderYouTubePreview = () => {
    const postType = selectedPages.youtube_post_type;
    console.log('YouTube render - postType:', postType);
    
    if (postType === 'short') {
      return <YouTubeShorts
        activePage={activePage}
        content={content}
        videoUrl={videoUrl}
        youtubeMetadata={youtubeMetadata}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if (postType === 'video') {
      return <YouTubeVideo
        activePage={activePage}
        content={content}
        videoUrl={videoUrl}
        youtubeMetadata={youtubeMetadata}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    } else if (postType === 'post') {
      return <YouTubeVideo
        activePage={activePage}
        content={content}
        videoUrl={null}
        youtubeMetadata={youtubeMetadata}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    }
    
    // Fallback: no post type selected
    return null;
  }

  const renderTikTokPreview = () => {
    const postType = selectedPages.tiktok_post_type;
    
    
    return <TikTokPost
      activePage={activePage}
      content={content}
      imageUrls={imageUrls}
      videoUrl={videoUrl}
      postType={postType}
      scale={scale}
      setContainerRef={setContainerRef}
      formatContent={formatContent}
    />
  }

  // Helper function to check if media should be uploaded first
  const needsMedia = () => {
    const hasNoMedia = imageUrls.length === 0 && !videoUrl;
    
    // If postType is 'text', only require media for platforms that absolutely need it
    if (postType === 'text') {
      switch (activePlatform) {
        case 'tiktok':
          return true; // TikTok always requires media
        case 'youtube':
          return true; // YouTube always requires video
        case 'facebook':
        case 'instagram':
        case 'linkedin':
        case 'threads':
          return false; // These platforms support text-only posts
        default:
          return false;
      }
    }
    
    // For image posts, only require media for platforms that absolutely need it
    if (postType === 'image') {
      switch (activePlatform) {
        case 'tiktok':
          return hasNoMedia; // TikTok requires media
        case 'youtube':
          return true; // YouTube doesn't support image posts
        case 'facebook':
        case 'instagram':
        case 'linkedin':
          return false; // These platforms can show preview without media
        default:
          return false;
      }
    }
    
    // For video posts, require video for all platforms except text-only platforms
    if (postType === 'video') {
      switch (activePlatform) {
        case 'tiktok':
        case 'youtube':
        case 'facebook':
        case 'instagram':
        case 'linkedin':
          return !videoUrl; // All these platforms require video for video posts
        default:
          return false;
      }
    }
    
    // Default case (should not happen with new logic)
    return false;
  };

  // Helper function to check if post type is needed and selected for current platform
  const hasPostTypeSelected = () => {
    // For text posts, auto-select 'post' type for platforms that support text-only posts

    switch(postType){
      case 'text':
        if(activePlatform === 'facebook'  || activePlatform === 'linkedin' || activePlatform === 'threads'){
          return true;
        } else {
          return false;
        }
      case 'image':
        // For Facebook and Instagram, check if meta_post_type is selected
        if(activePlatform === 'facebook' || activePlatform === 'instagram'){
          return !!selectedPages.meta_post_type;
        }
        // For LinkedIn, check if linkedin_post_type is selected
        if(activePlatform === 'linkedin'){
          return !!selectedPages.linkedin_post_type;
        }
        // For TikTok, check if tiktok_post_type is selected
        if(activePlatform === 'tiktok'){
          return !!selectedPages.tiktok_post_type;
        }
        // YouTube doesn't support image posts
        if(activePlatform === 'youtube'){
          return false;
        }
        return false;
      case 'video':
        // For Facebook and Instagram, check if meta_post_type is selected
        if(activePlatform === 'facebook' || activePlatform === 'instagram'){
          return !!selectedPages.meta_post_type;
        }
        // For LinkedIn, check if linkedin_post_type is selected
        if(activePlatform === 'linkedin'){
          return !!selectedPages.linkedin_post_type;
        }
        // For YouTube, check if youtube_post_type is selected
        if(activePlatform === 'youtube'){
          return !!selectedPages.youtube_post_type;
        }
        // For TikTok, check if tiktok_post_type is selected
        if(activePlatform === 'tiktok'){
          return !!selectedPages.tiktok_post_type;
        }
        return false;
      default:
        return false;
    }
  }

    
    
   


  // If no platforms are selected
  if (!selectedPlatforms?.length) {
    return (
      <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
        <p className="text-gray-700">{t('postPreview.selectPlatform')}</p>
      </div>
    );
  }

  // If no page is selected for the active platform
  if (!activePage) {
    return (
      <div>
        {renderPlatformTabs()}
        <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
          <p className="text-gray-700">{t('postPreview.selectPage', { platform: activePlatform })}</p>
        </div>
      </div>
    );
  }

  // If media is required but not provided
  if (needsMedia()) {
    let mediaMessage;
    switch (activePlatform) {
      case 'youtube':
        mediaMessage = 'Upload video content';
        break;
      case 'tiktok':
        mediaMessage = 'Upload media content';
        break;
      default:
        mediaMessage = 'Upload media content';
        break;
    }
    
    return (
      <div>
        {renderPlatformTabs()}
        <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
          <p className="text-gray-700">{mediaMessage} for {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}</p>
        </div>
      </div>
    );
  }

  // If no post type is selected
  if(!hasPostTypeSelected()){
    return (
      <div>
        {renderPlatformTabs()}
        <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
          <p className="text-gray-700">Select post type for {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container">
      {renderPlatformTabs()}
      <div className="transform-container" style={{ minHeight: '400px' }}>
        {activePlatform === 'facebook' && renderFacebookPreview()}
        {activePlatform === 'instagram' && renderInstagramPreview()}
        {activePlatform === 'threads' && renderThreadsPreview()}
        {activePlatform === 'tiktok' && renderTikTokPreview()}
        {activePlatform === 'linkedin' && renderLinkedinPreview()}
        {activePlatform === 'youtube' && renderYouTubePreview()}
      </div>
    </div>
  );
};

export default PostPreview;