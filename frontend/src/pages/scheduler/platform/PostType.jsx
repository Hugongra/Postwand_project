import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';


const PostType = ({ platform, post, postType, setPostData }) => {
  const { t } = useTranslation();

  const getPostTypes = (platform) => {
    switch(postType){
      case 'video':
        if (platform === 'facebook' || platform === 'instagram') return ['Post', 'Story', 'Reel'];
        if (platform === 'youtube') return ['Video', 'Short'];
        if (platform === 'tiktok') return ['Video'];
        if (platform === 'linkedin') return ['Video'];
        if (platform === 'threads') return ['Post'];
        return [];
      case 'image':
        if (platform === 'facebook' || platform === 'instagram') return ['Post', 'Story'];
        if (platform === 'linkedin') return ['Post'];
        if (platform === 'tiktok') return ['Image'];
        if (platform === 'threads') return ['Post'];
        return [];
      case 'text':
        if (platform === 'facebook' || platform === 'instagram') return ['Post'];
        if (platform === 'linkedin') return ['Post'];
        if (platform === 'threads') return ['Post'];
        return [];
      default:
        return [];
    }
  };
  
  const postTypes = getPostTypes(platform);
  const currentPostType = post?.platforms?.[platform]?.postType;

  const handlePostTypeSelect = (type) => {
    const newPostType = type.toLowerCase();
    setPostData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          postType: newPostType
        }
      }
    }));
  };

  useEffect(() => {
    if (postTypes.length === 1 && !currentPostType) {
      handlePostTypeSelect(postTypes[0]);
    } else if (postType === 'text' && !currentPostType && postTypes.includes('Post')) {
      handlePostTypeSelect('Post');
    }
  }, [platform, postTypes, currentPostType, postType]);

  // If no post types available, don't render anything
  if (postTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Post type
      </div>
      <div className="flex gap-2 flex-wrap">
        {postTypes.map(type => {
          const typeValue = type.toLowerCase();
          const isSelected = currentPostType === typeValue;
          
          return (
            <button
              key={type}
              type="button"
              onClick={() => handlePostTypeSelect(type)}
              className={`px-2 py-1.5 rounded-lg w-24 text-sm ${
                isSelected
                  ? 'bg-gray-300 text-gray-800'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PostType;