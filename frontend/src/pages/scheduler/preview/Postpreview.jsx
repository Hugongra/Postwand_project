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
  postType, 
  postData,
  selectedPlatforms,
  socialAccounts
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
  }, [containerRef, postData?.images, postData?.content, activePlatform]);


  // Helper function to get platform accounts
  const getPlatformAccounts = (platform) => {
    if (!socialAccounts?.[platform]) return [];
    const platformData = socialAccounts[platform];
    return platformData.accounts || [];
  };


  const platformAccounts = getPlatformAccounts(activePlatform);
  const activePage = platformAccounts.find(account => 
    account.account_id.toString() === postData?.platforms?.[activePlatform]?.accountId?.toString()
  );

  // Convert media array and content for preview
  const previewData = React.useMemo(() => {
    let data = { ...postData };
    
    // Convert media array to images and video for backward compatibility
    if (postData?.media && postData.media.length > 0) {
      const images = postData.media
        .filter(m => m.type === 'image')
        .map(m => {
          if (m.url) return m.url;
          if (typeof m.file === 'string') return m.file;
          return URL.createObjectURL(m.file);
        });
      
      const videoItem = postData.media.find(m => m.type === 'video');
      if (videoItem) {
        if (videoItem.url) {
          data.videoUrl = videoItem.url;
        } else if (typeof videoItem.file !== 'string') {
          data.videoUrl = URL.createObjectURL(videoItem.file);
        } else {
          data.videoUrl = videoItem.file;
        }
      }
      
      data.images = images;
    }
    
    // Create content object for backward compatibility with preview components
    // Use specificContent if available, otherwise fall back to shared content
    data.content = {};
    ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'threads'].forEach(platform => {
      const platformData = postData.platforms?.[platform];
      data.content[platform] = platformData?.specificContent || postData.content || '';
    });
    
    return data;
  }, [postData]);


  

  // Update getPlatformIcon to use img tags
  const getPlatformIcon = (platform, isActive) => {
    const baseIconClass = "w-4 h-4";
    
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
              className={`flex text-sm items-center justify-center gap-2 px-4 min-w-20 py-2 rounded-t-lg transition-colors ${
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
    const selectedPostType = postData?.platforms?.facebook?.postType;
    console.log('Facebook render - postType:', selectedPostType);
    
    switch(selectedPostType){
      case 'post':
      return <FacebookPost 
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'story':
      return <FacebookStory
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'reel':
      return <FacebookReel
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      default:
        return null;
    }
  }
  
  const renderInstagramPreview = () => {
    const selectedPostType = postData?.platforms?.instagram?.postType;
    console.log('Instagram render - postType:', selectedPostType);
    
    switch(selectedPostType){
      case 'story':
      return <InstagramStory 
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'reel':
      return <InstagramReels 
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'post':
      return <InstagramPost 
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      default:
        return null;
    }
  };

  const renderThreadsPreview = () => {
    return (
      <ThreadsPost
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
    );
  };

  const renderLinkedinPreview = () => {
    return <LinkedinPost
      activePage={activePage}
      postData={previewData}
      scale={scale}
      setContainerRef={setContainerRef}
      formatContent={formatContent}
    />
  }

  const renderYouTubePreview = () => {
    const youtubePostType = postData?.platforms?.youtube?.postType;
    console.log('YouTube render - postType:', youtubePostType);
    
    switch(youtubePostType){
      case 'short':
      return <YouTubeShorts
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'video':
      return <YouTubeVideo
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      case 'post':
      return <YouTubeVideo
        activePage={activePage}
        postData={previewData}
        scale={scale}
        setContainerRef={setContainerRef}
        formatContent={formatContent}
      />
      default:
        return null;
    }
  }

  const renderTikTokPreview = () => {
    const tiktokPostType = postData?.platforms?.tiktok?.postType;
    
    return <TikTokPost
      activePage={activePage}
      postData={previewData}
      postType={tiktokPostType}
      scale={scale}
      setContainerRef={setContainerRef}
      formatContent={formatContent}
    />
  }

  // Helper function to check if media should be uploaded first
  const needsMedia = () => {
    const hasNoMedia = !postData?.media || postData.media.length === 0;
    const videoOnlyPlatforms = ['tiktok', 'youtube'];
    
    // Get the actual postType for this platform
    const platformPostType = postData?.platforms?.[activePlatform]?.postType || postType;
    
    // Text posts on video-only platforms need media
    if (platformPostType === 'text' && videoOnlyPlatforms.includes(activePlatform)) {
      return true;
    }
    
    // Image posts on TikTok need media, YouTube doesn't support image posts
    if (platformPostType === 'image') {
      return activePlatform === 'tiktok' ? hasNoMedia : activePlatform === 'youtube';
    }
    
    // Video posts need video file
    if (platformPostType === 'video') {
      const hasVideo = postData?.media?.some(m => m.type === 'video');
      return !hasVideo;
    }
    
    return false;
  };

  const hasPostTypeSelected = () => {
    return !!postData?.platforms?.[activePlatform]?.postType;
  };

    
    
   
  if (!selectedPlatforms?.length) {
    return (
      <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
        <p className="text-gray-700">{t('postPreview.selectPlatform')}</p>
      </div>
    );
  }

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
        mediaMessage = t('postPreview.uploadVideoContent');
        break;
      case 'tiktok':
        mediaMessage = t('postPreview.uploadMediaContent');
        break;
      default:
        mediaMessage = t('postPreview.uploadMediaContent');
        break;
    }
    
    return (
      <div>
        {renderPlatformTabs()}
        <div className="h-28 max-w-md mx-auto bg-gray-200/50 shadow-sm rounded-lg p-4">
          <p className="text-gray-700">{mediaMessage} {t('postPreview.for')} {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}</p>
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
          <p className="text-gray-700">{t('postPreview.selectPostTypeFor', { platform: activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1) })}</p>
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