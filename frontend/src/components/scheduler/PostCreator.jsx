import React, { useState, useEffect } from 'react';
import { MessageSquare, Image } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PostScheduler from './PostScheduler';
import PostPreview from './preview/Postpreview';
import { IoTextOutline } from "react-icons/io5";
import { CiImageOn } from "react-icons/ci";
import { FaPhotoVideo } from "react-icons/fa";
const PostCreator = ({
  facebookData,
  instagramData,    
  threadsData,
  tiktokData,
  linkedinData,
  youtubeData,
  videoUrl,
  updateVideoUrl,
  postContent,
  selectedPlatforms,
  setSelectedPlatforms,
  selectedPages,
  setSelectedPages,
  onStateChange,
  imageUrls,
  youtubeMetadata
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [postType, setPostType] = useState(null); // null, 'text', 'image', 'video', 'all'
  const [shouldReset, setShouldReset] = useState(false);

  // Function to clear all post data
  const clearPostData = () => {
    setPostType(null);
    setSelectedPlatforms([]);
    setSelectedPages({});
    updateVideoUrl(null);
    
    // Trigger reset in PostScheduler
    setShouldReset(true);
    
    // Notify parent to clear content and images
    if (typeof onStateChange === 'function') {
      onStateChange({
        isGeneratingPost: false,
        generationProgress: 0,
        content: '',
        imageUrls: [],
        youtubeMetadata: {
          title: '',
          tags: '',
          description: ''
        }
      });
    }
    
    // Clear localStorage and sessionStorage data
    localStorage.removeItem('videoUrl');
    sessionStorage.removeItem('selectedDate');
    
    // Reset the shouldReset flag after a brief delay
    setTimeout(() => setShouldReset(false), 100);
  };

  // Clear data when component mounts
  useEffect(() => {
    clearPostData();
    
    const handleClear = () => clearPostData();
    window.addEventListener('clearPost', handleClear);
    return () => window.removeEventListener('clearPost', handleClear);
  }, []);




  // Post Type Selection Component
  const PostTypeSelector = () => (
    <div className="flex-1 h-screen overflow-x-hidden overflow-y-auto bg-primary">
      <div className="mt-2 px-2 md:px-3 max-w-full">
        <div className="w-full h-28 mb-1 mx-auto bg-gray-100/80 p-4 rounded-lg">
          <h1 className="text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            {t('social.createPost')}
          </h1>
        </div>
        
        <Card className="w-full mx-auto bg-primary border-none">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-gray-800 mb-2">
                {t('social.selectPostType')}
              </h2>
             
            </div>
            
            <div className="  grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Text Post */}
              <div 
                onClick={() => setPostType('text')}
                    className="bg-gray-300/50 hover:bg-gray-200/60 cursor-pointer group p-6 rounded-xl transition-all duration-200 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-2  rounded-full flex items-center justify-center ">
                  <IoTextOutline size={32} className="text-black"/>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {t('social.textPost')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('social.textPostDesc')}
                </p>
              
              </div>

              {/* Image Post */}
              <div 
                onClick={() => setPostType('image')}
                    className="bg-gray-300/50 hover:bg-gray-200/60 cursor-pointer group p-6 rounded-xl transition-all duration-200 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-2  rounded-full flex items-center justify-center ">
                  <CiImageOn size={32} className="text-black font-bold"/>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {t('social.imagePost')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('social.imagePostDesc')}
                </p>
               
              </div>

              {/* Video Post */}
              <div 
                onClick={() => setPostType('video')}
                        className="bg-gray-300/50 hover:bg-gray-200/60 cursor-pointer group p-6 rounded-xl transition-all duration-200 text-center"
              >
                    <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center  ">
                  <FaPhotoVideo size={32} className="text-black"/>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {t('social.videoPost')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('social.videoPostDesc')}
                </p>
              
              </div>
            </div>

        
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Show post type selector if no type is selected
  if (!postType) {
    return <PostTypeSelector />;
  }

  // Show full scheduler + preview interface after post type is selected
  return (
    <div className="flex-1 h-screen overflow-x-hidden overflow-y-auto bg-primary">
      <div className="mt-2 px-2 md:px-3 max-w-full">
        <div className="flex flex-col md:flex-row gap-2 w-full">
          <div className="w-full md:w-[65%]">
            <PostScheduler 
              facebookData={facebookData} 
              instagramData={instagramData}
              threadsData={threadsData}
              tiktokData={tiktokData}
              linkedinData={linkedinData}
              youtubeData={youtubeData}
              videoUrl={videoUrl}
              updateVideoUrl={updateVideoUrl}
              postContent={postContent}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPages={selectedPages}
              setSelectedPages={setSelectedPages}
              onStateChange={onStateChange}
              postType={postType}
              onChangePostType={clearPostData}
              shouldReset={shouldReset}
            />
          </div>
          <div className="w-full md:w-[35%] md:sticky md:top-2 md:self-start mt-2 md:mt-0">
            <PostPreview 
              facebookData={facebookData}
              instagramData={instagramData}
              threadsData={threadsData}
              tiktokData={tiktokData}     
              linkedinData={linkedinData} 
              youtubeData={youtubeData}
              imageUrls={imageUrls}
              videoUrl={videoUrl}
              content={postContent}
              selectedPlatforms={selectedPlatforms}
              selectedPages={selectedPages}
              youtubeMetadata={youtubeMetadata}
              postType={postType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
