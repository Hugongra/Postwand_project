import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import SocialPlatformSelector from './SocialPlatformSelector';
import Header from '@components/header';
import PlatformAccountSelector from './PlatformAccountSelector';
import ImageUploader from '../../components/uploaders/ImageUploader';
import VideoUploader from '../../components/uploaders/VideoUploader';
import PostType from './platform/PostType';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ContentArea2 from './contentArea/ContentArea2';
import Timepicker from './Timepicker';
import * as api from '@services/api/api';

const PostScheduler = ({
  postType,
  postData,
  setPostData,
  selectedPlatforms,
  setSelectedPlatforms,
  socialAccounts,
}) => {
  const { t } = useTranslation();
  const [imageInputRef, setImageInputRef] = useState(null);
  const [videoInputRef, setVideoInputRef] = useState(null);

  const scheduleFuturePost = async () => {
    const formData = new FormData();
    
    // Handle media array - append files OR include URLs in postData
    postData.media?.forEach((mediaItem) => {
      if (mediaItem.type === 'image' && mediaItem.file) {
        formData.append('images', mediaItem.file);
      } else if (mediaItem.type === 'video' && mediaItem.file) {
        formData.append('video', mediaItem.file);
      }
    });

    const updatedPostData = { ...postData, selectedPlatforms };
    setPostData(updatedPostData);
    
    formData.append('postData', JSON.stringify(updatedPostData));
    
    const response = await api.SchedulePost(formData);
    
    if (response.ok) {
      // Post scheduled successfully
    } else {
      console.error('Failed to schedule post:', response.data);
    }
  }

  // Handler for image changes - convert to media array format
  const handleImagesChange = (newImages) => {
    const mediaArray = newImages.map(img => ({
      type: 'image',
      file: img instanceof File ? img : null,
      url: typeof img === 'string' ? img : null
    }));
    setPostData({ ...postData, media: mediaArray });
  };

  return (
    <div>
      <Header title={t('social.createPost')} />

      <div className="w-full rounded-lg mx-auto bg-[#FDFDFD] border-none relative p-4 space-y-4 mb-6">
        <SocialPlatformSelector
          postType={postType}
          socialAccounts={socialAccounts}
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
        />
        
        {postType === 'image' && (
          <>
            <div className="text-sm font-medium text-gray-700 mt-10">
              {t('social.uploadMedia')}
            </div>    
            <ImageUploader
              images={postData.media?.map(m => m.file) || []}
              onImagesChange={handleImagesChange}
              imageInputRef={imageInputRef}
              showLibraryButton={true}
            />
          </>
        )}
        
        {postType === 'video' && (
          <>
            <div className="text-sm font-medium text-gray-700 mt-10">
              {t('social.uploadMedia')}
            </div>   
            <VideoUploader
              videoInputRef={videoInputRef}
              post={postData}
              setPost={setPostData}
            />
          </>
        )}  

        {selectedPlatforms.length > 0 && (
          <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
            <TabsList>
              {selectedPlatforms.map(platform => (
                <TabsTrigger key={platform} value={platform} className="flex items-center gap-2">
                  <span className="capitalize">{platform}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {selectedPlatforms.map(platform => (
              <TabsContent key={platform} value={platform}>
                <div className="space-y-3">
                  <PlatformAccountSelector
                    platform={platform}
                    socialAccounts={socialAccounts}
                    postData={postData}
                    setPostData={setPostData}
                  />
                  
                  <PostType  
                    platform={platform}
                    post={postData}
                    postType={postType}
                    setPostData={setPostData}
                  />

                  <ContentArea2 
                    platform={platform}
                    socialAccounts={socialAccounts}
                    setPostData={setPostData}
                    postData={postData}
                  />
                  
                  <Timepicker postData={postData} setPostData={setPostData} />
                  <button 
                    onClick={() => scheduleFuturePost(postData)} 
                    className='bg-pink-500 text-white px-3 py-1.5 rounded-lg w-full'
                  >
                    {postData.scheduleNow ? (
                      <span className='text-sm font-medium'>{t('social.publishNow')}</span>
                    ) : (
                      <span className='text-sm font-medium'>{t('social.scheduleFuturePost')}</span>
                    )}
                  </button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default PostScheduler;