import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedInIcon from '/SM_icons/linkedin.svg';

const PostType = ({ selectedPlatforms, selectedPages, setSelectedPages, post, postType }) => {
  const { t } = useTranslation();
  
  const hasImage = post.images && post.images.length > 0;
  const hasVideo = post.video || post.videoUrl;
  const hasNoMedia = !hasImage && !hasVideo;

  // Post types based on media type
  const getPostTypes = (platform) => {
    switch(postType){
      case 'video':
        if (platform === 'meta') return ['Post', 'Story', 'Reel'];
        if (platform === 'youtube') return ['Video', 'Short'];
        if (platform === 'tiktok') return ['Video'];
        if (platform === 'linkedin') return ['Video'];
        return []; // No video support for other platforms
      case 'image':
        if (platform === 'meta') return ['Post', 'Story'];
        if (platform === 'linkedin') return ['Post'];
        if (platform === 'tiktok') return ['Image'];
        return []; // No image support for other platforms (like YouTube)
      case 'text':
        if (platform === 'meta') return ['Post'];
        if (platform === 'linkedin') return ['Post'];
        return []; // No text-only support for other platforms (like YouTube, TikTok)
      
      default:
        return [];
    }
  };
  
    

  const handlePostTypeSelect = (platform, type) => {
    const newPostType = type.toLowerCase();
    console.log('PostType - selecting:', { platform, type, newPostType });
    
    setSelectedPages(prev => {
      const updated = {
        ...prev,
        [`${platform}_post_type`]: newPostType
      };
      console.log('PostType - updated selectedPages:', updated);
      return updated;
    });
  };

  // Auto-select post type when only one option is available
  useEffect(() => {
    selectedPlatforms.forEach(platform => {
      const postTypes = getPostTypes(platform);
      const currentPostType = selectedPages[`${platform}_post_type`];
      
      // If there's exactly one post type available and none is selected yet
      if (postTypes.length === 1 && !currentPostType) {
        console.log(`Auto-selecting ${postTypes[0]} for ${platform}`);
        handlePostTypeSelect(platform, postTypes[0]);
      }
    });
  }, [selectedPlatforms, post.images, post.video, post.videoUrl]); // Re-run when media changes

  const renderPostTypes = (platform, postTypes) => {
    const currentPostType = selectedPages[`${platform}_post_type`];
    
    return postTypes.map(type => {
      const typeValue = type.toLowerCase();
      // If there's only one post type and no current selection, auto-select it visually
      const isSelected = currentPostType === typeValue || (postTypes.length === 1 && !currentPostType);
      
      return (
        <button
          key={type}
          type="button"
          onClick={() => handlePostTypeSelect(platform, type)}
          className={`rounded-lg text-sm py-1.5 px-2 w-24 ${
            isSelected
              ? 'bg-gray-300 text-gray-800'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          {type}
        </button>
      );
    });
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-4">
        {(selectedPlatforms.includes('facebook') || selectedPlatforms.includes('instagram')) && (
          <div>
            <label className="text-md font-medium text-gray-700 block mb-2">
              {t('social.postType')} 
              {selectedPlatforms.includes('facebook') && (
                <img src={FacebookIcon} alt="Facebook" className="w-4 h-4 inline-block ml-2" />
              )}
              {selectedPlatforms.includes('instagram') && (
                <img src={InstagramIcon} alt="Instagram" className="w-4 h-4 inline-block ml-2" />
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {renderPostTypes('meta', getPostTypes('meta'))}
            </div>
          </div>
        )}
        
        {selectedPlatforms.includes('youtube') && (
          <div>
            <label className="text-md font-medium text-gray-700 block mb-2">
              {t('social.postType')} <img src={YouTubeIcon} alt="YouTube" className="w-4 h-4 inline-block ml-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              {renderPostTypes('youtube', getPostTypes('youtube'))}
            </div>
          </div>
        )}
        
        {selectedPlatforms.includes('tiktok') && (
          <div>
            <label className="text-md font-medium text-gray-700 block mb-2">
              {t('social.postType')} <img src={TikTokIcon} alt="TikTok" className="w-4 h-4 inline-block ml-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              {renderPostTypes('tiktok', getPostTypes('tiktok'))}
            </div>
          </div>
        )}
        
        {selectedPlatforms.includes('linkedin') && (
          <div>
            <label className="text-md font-medium text-gray-700 block mb-2">
              {t('social.postType')} <img src={LinkedInIcon} alt="LinkedIn" className="w-4 h-4 inline-block ml-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              {renderPostTypes('linkedin', getPostTypes('linkedin'))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostType;