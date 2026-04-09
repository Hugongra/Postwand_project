import React, { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PostScheduler from './PostScheduler';
import PostPreview from './preview/Postpreview';
import { IoTextOutline } from "react-icons/io5";
import { CiImageOn } from "react-icons/ci";
import { FaPhotoVideo } from "react-icons/fa";
import * as api from '@services/api/api';

const PostCreator = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [postType, setPostType] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const getSocialAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.ZernioGetAccounts();
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      setSocialAccounts(response.data || {});
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    getSocialAccounts();
  }, []);
  

  const getPostData = (type) => ({
    content: '',
    scheduledTime: new Date(),
    media: [],
    scheduleNow: true,
    platforms: {
      youtube: { 
        postType: null,
        accountId: null,
        specificContent: '',
        title: '', 
        tags: '', 
        description: '', 
        category: '' 
      },
      tiktok: {
        postType: null,
        accountId: null,
        specificContent: '',
        privacyLevel: '',
        interactions: { allowComment: false, allowDuet: false, allowStitch: false },
        commercialContent: { enabled: false, yourBrand: false, brandedContent: false }
      },
      facebook: { 
        postType: null,
        accountId: null,
        specificContent: '',
        locationId: '', 
        locationName: '' 
      },
      instagram: {
        postType: null,
        accountId: null,
        specificContent: ''
      },
      linkedin: {
        postType: null,
        accountId: null,
        specificContent: ''
      },
      threads: {
        postType: null,
        accountId: null,
        specificContent: ''
      }
    }
  });
  
  const [postData, setPostData] = useState(() => getPostData(postType));




  const clearPostData = () => {
    setPostType(null);
    setSelectedPlatforms([]);
    setPostData(getPostData(null));
    sessionStorage.removeItem('selectedDate');
  };

  useEffect(() => {
    clearPostData();
    const handleClear = () => clearPostData();
    window.addEventListener('clearPost', handleClear);
    return () => window.removeEventListener('clearPost', handleClear);
  }, []);

  useEffect(() => {
    const preloadedImage = location.state?.preloadedImage;
    const preloadedContent = location.state?.preloadedContent;
    const publishNow = location.state?.publishNow;
    if (preloadedImage || preloadedContent) {
      if (preloadedImage) {
        setPostType('image');
        setPostData(prev => ({
          ...prev,
          media: [{ type: 'image', file: null, url: preloadedImage }],
          content: preloadedContent || prev.content,
          scheduleNow: publishNow ? true : prev.scheduleNow,
        }));
      } else if (preloadedContent) {
        setPostType('text');
        setPostData(prev => ({
          ...prev,
          content: preloadedContent,
          scheduleNow: publishNow ? true : prev.scheduleNow,
        }));
      }
      window.history.replaceState({}, '');
    }
  }, [location.state]);



  const PostTypeSelector = () => (
    <Suspense fallback="loading">
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
              <h2 className="text-2xl text-gray-800 mb-2">
                {t('social.selectPostType')}
              </h2>
             
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="bg-gray-200 h-52 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { type: 'text', icon: IoTextOutline, titleKey: 'social.textPost', descKey: 'social.textPostDesc' },
                { type: 'image', icon: CiImageOn, titleKey: 'social.imagePost', descKey: 'social.imagePostDesc' },
                { type: 'video', icon: FaPhotoVideo, titleKey: 'social.videoPost', descKey: 'social.videoPostDesc' }
              ].map(({ type, icon: Icon, titleKey, descKey }) => (
                <div 
                  key={type}
                  onClick={() => setPostType(type)}
                  className="h-52 bg-gray-300/50 hover:bg-gray-200/60 cursor-pointer group p-6 rounded-lg transition-all duration-200 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center">
                    <Icon size={28} className="text-black" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t(descKey)}
                  </p>
                </div>
              ))}
            </div>

            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </Suspense>
  );


  if (!postType) {
    return <PostTypeSelector />;
  }

  return (
    <div className="flex-1 h-screen overflow-x-hidden overflow-y-auto bg-primary">
      <div className="mt-2 px-2 md:px-3 max-w-full">
        <div className="flex flex-col md:flex-row gap-2 w-full">
          <div className="w-full md:w-[65%]">
            <PostScheduler
              postType={postType} 
              postData={postData}
              setPostData={setPostData}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              socialAccounts={socialAccounts}
            />
          </div>
          <div className="w-full md:w-[35%] md:sticky md:top-2 md:self-start mt-2 md:mt-0">
            <PostPreview 
              postType={postType} 
              postData={postData}
              selectedPlatforms={selectedPlatforms}
              socialAccounts={socialAccounts}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
