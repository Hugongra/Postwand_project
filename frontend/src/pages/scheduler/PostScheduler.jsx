import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

/**
 * Subida de medios: este flujo envía FormData al backend (SchedulePost).
 * El servidor ya escribe en Storage bajo post-videos/{userId}/... (TUS).
 *
 * Si pasas a subir desde el navegador con supabase-js + RLS, usa siempre:
 *   import { uploadFileToUserFolder, getLoggedInUserIdFromStorage, getSupabaseBrowserClient } from '@services/supabase'
 *   const userId = getLoggedInUserIdFromStorage()
 *   await uploadFileToUserFolder({ supabase, bucket: 'post-videos', userId, file })
 * y asegúrate de tener sesión Supabase en el cliente (setSession con tokens del backend).
 */

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

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  const scheduleFuturePost = async () => {
    setPublishing(true);
    setPublishResult(null);

    try {
      const platforms = [];
      for (const plat of selectedPlatforms) {
        const pd = postData.platforms?.[plat];
        if (pd?.accountId) {
          const customContent = pd.specificContent || null;
          const entry = { platform: plat, accountId: pd.accountId };
          if (customContent) entry.customContent = customContent;
          platforms.push(entry);
        }
      }

      if (platforms.length === 0) {
        setPublishResult({ type: 'error', text: 'Select at least one account' });
        setPublishing(false);
        return;
      }

      // Use general content, or fall back to the first platform's specificContent
      const content = postData.content
        || platforms.find(p => p.customContent)?.customContent
        || '';

      const mediaFiles = (postData.media || [])
        .filter(m => m.file instanceof File)
        .map(m => m.file);

      const mediaUrls = (postData.media || [])
        .filter(m => m.url && !m.file)
        .map(m => ({ url: m.url, type: m.type || 'image' }));

      const response = await api.ZernioPublishPost(
        content,
        platforms,
        mediaFiles.length ? mediaFiles : null,
        mediaUrls.length ? mediaUrls : null,
        postData.scheduleNow ? null : postData.scheduledTime,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        !!postData.scheduleNow,
      );

      if (response.ok && response.data?.success) {
        setPublishResult({ type: 'success', text: postData.scheduleNow ? 'Post published!' : 'Post scheduled!' });
      } else {
        setPublishResult({ type: 'error', text: response.data?.error || 'Failed to publish' });
      }
    } catch (err) {
      setPublishResult({ type: 'error', text: err.message || 'Failed to publish' });
    } finally {
      setPublishing(false);
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
              images={postData.media?.map(m => m.file || m.url).filter(Boolean) || []}
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

                  {publishResult && (
                    <div className={`p-3 rounded-lg text-sm ${
                      publishResult.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {publishResult.text}
                    </div>
                  )}

                  <button 
                    onClick={() => scheduleFuturePost(postData)}
                    disabled={publishing}
                    className={`bg-pink-500 text-white px-3 py-1.5 rounded-lg w-full transition-colors ${
                      publishing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-pink-600'
                    }`}
                  >
                    {publishing ? (
                      <span className='text-sm font-medium flex items-center justify-center gap-2'>
                        <Loader2 size={14} className="animate-spin" /> Publishing...
                      </span>
                    ) : postData.scheduleNow ? (
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