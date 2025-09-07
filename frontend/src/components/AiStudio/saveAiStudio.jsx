import React, { useState, useEffect, useMemo } from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdOutlineContentCopy } from "react-icons/md";

import { Plus } from "lucide-react";
import { IoPricetagsOutline } from "react-icons/io5";
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import XIcon from '/SM_icons/x.svg';
import TiktokIcon from '/SM_icons/tiktok.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import EmailIcon from '/SM_icons/gmail.svg';
import YoutubeIcon from '/SM_icons/youtube.svg';
import WordpressIcon from '/SM_icons/wordpress.svg';

import { 
  Wand2,  
  RefreshCw, 
  Image, 
  Palette,
  MessageSquare,
  TabletSmartphone, 
  Settings,
} from 'lucide-react';
import { PiThreadsLogoFill } from "react-icons/pi";
import PostPreview from "@/components/scheduler/preview/Postpreview";
import TokenLimitModal from "@/components/TokenLimitModal";



// Add these imports for tone icons
import {  FaBriefcase, FaTshirt, FaSmile, FaLaughSquint, FaFire } from "react-icons/fa";
import { BsEmojiNeutral } from "react-icons/bs";

import CustomDropdown from "./CustomDropdown";
import SettingsMenu from "./SettingsMenu";




import ViralChatSession from '../ViralChat/ViralChatSession';

const AiStudio = ({ setPostContent, setImagePreview, brands }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Combined image-related state
  const [imageSettings, setImageSettings] = useState({
    style: 'Auto',
    brandStyle: 'No brand',
    aspectRatio: '1:1',
    numImages: 1,
    prompt: '',
    selectedImageUrl: null
  });

  // Combined content-related state  
  const [contentSettings, setContentSettings] = useState({
    topic: '',
    tone: 'neutral',
    platformType: 'instagram'
  });

  // Combined loading states
  const [loading, setLoading] = useState({
    content: false,
    image: false,
    save: false
  });

  // Combined UI states
  const [uiState, setUiState] = useState({
    activeStep: null,
    previewPlatform: 'instagram',
    isImageModalOpen: false,
    modalImageUrl: null
  });

  // Combined generated data states
  const [generatedData, setGeneratedData] = useState({
    content: '',
    selectedContent: '',
    imageUrls: [],
    imageUrlExpired: false
  });

  // Combined status messages
  const [statusMessages, setStatusMessages] = useState({
    general: null,
    save: null
  });

  // Token limit modal state
  const [isTokenLimitModalOpen, setIsTokenLimitModalOpen] = useState(false);

  const brandDropdownOptions = useMemo(() => [
    { value: t('aiStudio.brandDropdownOptions.noBrand'), label: t('aiStudio.brandDropdownOptions.noBrand'), icon: <IoPricetagsOutline className="h-5 w-5 flex-shrink-0" style={{ color: '#6B7280' }} /> },
    { value: t('aiStudio.brandDropdownOptions.newBrand'), label: t('aiStudio.brandDropdownOptions.newBrand'), icon: <Plus className="h-5 w-5 flex-shrink-0" style={{ color: 'gray' }} /> },
    ...(brands || []).map(brand => ({
      value: brand.website_url,
      label: brand.website_url,
      icon: <img src={brand.logo_url || '/images/no-photos.svg'} className="h-auto w-5 flex-shrink-0" onError={(e) => {
        e.target.src = '/images/no-photos.svg';
      }} />
    }))
  ], [brands]);

  // Simple effect to set the active step from location state
  useEffect(() => {
    if (location.state?.activeStep) {
      setUiState(prev => ({ ...prev, activeStep: location.state.activeStep }));
    } 
    
  }, [location]);

  useEffect(() => {
    if (imageSettings.brandStyle === 'New Brand') {
      navigate('/brand-identity', { state: { openDialog: true } });
    }
  }, [imageSettings.brandStyle]);


  
  // Memoize static dropdown options
  const numImagesOptions = useMemo(() => [
    { value: 1, label: t('aiStudio.numImagesOptions.oneImage'), icon: <Image className="h-5 w-5 flex-shrink-0" style={{ color: 'black' }} /> },
    { value: 2, label: t('aiStudio.numImagesOptions.twoImages'), icon: <Image className="h-5 w-5 flex-shrink-0" style={{ color: 'black' }} /> },
    { value: 3, label: t('aiStudio.numImagesOptions.threeImages'), icon: <Image className="h-5 w-5 flex-shrink-0" style={{ color: 'black' }} /> },
  ], []);

  const styleDropdownOptions = useMemo(() => [
    { value: 'Auto', label: t('aiStudio.styleDropdownOptions.auto'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#6B7280' }} /> },
    { value: 'General', label: t('aiStudio.styleDropdownOptions.general'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#10B981' }} /> },
    { value: 'Realistic', label: t('aiStudio.styleDropdownOptions.realistic'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#3B82F6' }} /> },
    { value: 'Design', label: t('aiStudio.styleDropdownOptions.design'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#F59E0B' }} /> },
    { value: 'Render 3D', label: t('aiStudio.styleDropdownOptions.render3D'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#EF4444' }} /> },
    { value: 'Anime', label: t('aiStudio.styleDropdownOptions.anime'), icon: <Palette className="h-5 w-5 flex-shrink-0" style={{ color: '#8B5CF6' }} /> },
  ], []);

  const aspectRatioDropdownOptions = useMemo(() => [
    { 
      value: '1:1', 
      label: t('aiStudio.aspectRatioDropdownOptions.square'), 
      sublabel: '1:1',
      icon: (
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="6" width="15" height="15" rx="2" ry="2" style={{ color: '#9CA3AF' }} />
        </svg>
      )
    },
    { 
      value: '16:9', 
      label: t('aiStudio.aspectRatioDropdownOptions.landscape'),  
      sublabel: '16:9',
      icon: (
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="8" width="20" height="10" rx="2" ry="2" style={{ color: '#9CA3AF' }} />
        </svg>
      )
    },
    { 
      value: '3:4', 
      label: t('aiStudio.aspectRatioDropdownOptions.portrait'), 
      sublabel: '3:4',
      icon: (
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="7" y="4" width="12" height="17" rx="2" ry="2" style={{ color: '#9CA3AF' }} />
        </svg>
      )
    },
    { 
      value: '9:16', 
      label: t('aiStudio.aspectRatioDropdownOptions.story'), 
      sublabel: '9:16',
      icon: (
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="2" width="10" height="20" rx="2" ry="2" style={{ color: '#9CA3AF' }} />
        </svg>
      )
    },
  ], []);

  const platformOptions = useMemo(() => [
    { value: 'instagram', label: 'Instagram', icon: <img src={InstagramIcon} className="h-5 w-5 flex-shrink-0"/> },
    { value: 'facebook', label: 'Facebook', icon: <img src={FacebookIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#1877F2' }} /> },
    { value: 'threads', label: 'Threads', icon: <img src={ThreadsIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#000000' }} /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <img src={LinkedinIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#0A66C2' }} /> },
    { value: 'x', label: 'X', icon: <img src={XIcon}className="h-5 w-5 flex-shrink-0" style={{ color: '#000000' }} /> },
    { value: 'blog', label: 'Blog', icon: <img src={WordpressIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#21759B' }} /> },
    { value: 'email', label: 'Email', icon: <img src={EmailIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#D44638' }} /> },
    { value: 'youtube', label: 'YouTube', icon: <img src={YoutubeIcon} className="h-5 w-5 flex-shrink-0" style={{ color: '#FF0000' }} /> },
  ], []);

  const toneOptions = useMemo(() => [
    { value: 'neutral', label: t('aiStudio.toneOptions.neutral'), icon: <BsEmojiNeutral className="h-5 w-5 flex-shrink-0" style={{ color: '#6B7280' }} /> },
    { value: 'formal', label: t('aiStudio.toneOptions.formal'), icon: <FaBriefcase className="h-5 w-5 flex-shrink-0" style={{ color: '#1F2937' }} /> },
    { value: 'casual', label: t('aiStudio.toneOptions.casual'), icon: <FaTshirt className="h-5 w-5 flex-shrink-0" style={{ color: '#3B82F6' }} /> },
    { value: 'friendly', label: t('aiStudio.toneOptions.friendly'), icon: <FaSmile className="h-5 w-5 flex-shrink-0" style={{ color: '#10B981' }} /> },
    { value: 'humorous', label: t('aiStudio.toneOptions.humorous'), icon: <FaLaughSquint className="h-5 w-5 flex-shrink-0" style={{ color: '#F59E0B' }} /> },
    { value: 'roast', label: t('aiStudio.toneOptions.roast'), icon: <FaFire className="h-5 w-5 flex-shrink-0" style={{ color: '#EF4444' }} /> },
  ], []);

  // Save to localStorage when values change
  useEffect(() => {
    if (generatedData.content) {
      localStorage.setItem('generatedContent', JSON.stringify(generatedData.content));
    }
  }, [generatedData.content]);

  useEffect(() => {
    if (generatedData.selectedContent) {
      localStorage.setItem('selectedContent', generatedData.selectedContent);
    }
  }, [generatedData.selectedContent]);


   

  
  useEffect(() => {
    if (generatedData.imageUrls.length > 0) {
      localStorage.setItem('generatedImageUrls', JSON.stringify(generatedData.imageUrls));
      const timer = setTimeout(() => {
        localStorage.clear("generatedImageUrls");
      }, 5000 * 60); // 5 minutes in milliseconds
            
         
    }
  }, [generatedData.imageUrls]);

  const handleGeneratePost = async () => {
    if (!contentSettings.topic) {
      setStatusMessages({ ...statusMessages, general: { type: 'error', message: 'Please enter a topic first' } });
      return;
    }
    
    setLoading({ ...loading, content: true });
    setStatusMessages({ ...statusMessages, general: null });
    
    try {
      const response = await fetch(`https://app.postwand.io/api/generate-posts-variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          topic: contentSettings.topic, 
          platform: contentSettings.platformType,
          tone: contentSettings.tone, 
          contentType: 'post',
          brand: imageSettings.brandStyle
        })
      });

      const data = await response.json();
      console.log("Post variations response:", data);
      
      // Check for token limit exceeded error first
      if (!data.success && data.type === "token_limit_exceeded") {
        console.log("Token limit exceeded detected in post variations");
        setIsTokenLimitModalOpen(true);
        return;
      }
      
      if (!response.ok) throw new Error(data.error || 'Failed to generate post');

      if (data.success && data.data.variations?.length > 0) {
        const newContent = data.data.variations;
        setGeneratedData({ ...generatedData, content: newContent, selectedContent: '' });
        
        // Auto extract a potential text for the image
        if (newContent.length > 10) {
          const firstSentence = newContent.split('.')[0];
          if (firstSentence.length < 50) {
            setImageSettings({ ...imageSettings, prompt: firstSentence });
          }
        }
      }
    } catch (error) {
      console.error("Error generating post:", error);
      // Check if error message contains token limit info
      if (error.message && error.message.toLowerCase().includes("token limit")) {
        console.log("Token limit exceeded in error message");
        setIsTokenLimitModalOpen(true);
      } else {
        setStatusMessages({ ...statusMessages, general: { type: 'error', message: error.message } });
      }
    } finally {
      setLoading({ ...loading, content: false });
    }
  };

  const handleGenerateImage = async () => {
    if (!imageSettings.prompt) {
      setStatusMessages({ ...statusMessages, general: { type: 'error', message: 'Please enter an image prompt first' } });
      return;
    }
    
    setLoading({ ...loading, image: true });
    setStatusMessages({ ...statusMessages, general: null });
    
    try {
      const response = await fetch(`https://app.postwand.io/api/generate-image`, {
        method: 'POST',
        headers: {  
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          style: imageSettings.style.toUpperCase(),
          text: '',
          textPosition: 'none',
          prompt: imageSettings.prompt,
          aspectRatio: imageSettings.aspectRatio,
          numImages: imageSettings.numImages,
          brand: imageSettings.brandStyle
        })
      });

      const data = await response.json();
     
      if (!response.ok) {
        if (data.status === 'error') {
          if (data.message && data.message.includes("token limit exceeded")) {
            setIsTokenLimitModalOpen(true);
            return;
          }
          setStatusMessages({ ...statusMessages, general: { type: 'error', message: data.message } });
          return;
        }
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.imageUrl) {
        const imageUrlArray = Array.isArray(data.imageUrl) ? data.imageUrl : [data.imageUrl];
        
        setGeneratedData({ 
          ...generatedData, 
          imageUrls: imageUrlArray
        });
        
        setImageSettings({ ...imageSettings, selectedImageUrl: imageUrlArray[0] });
        setImagePreview(imageUrlArray[0]);
      } else {
        setStatusMessages({ ...statusMessages, general: { type: 'error', message: 'No image was generated' } });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Check if error is related to token limit
      if (error.message && error.message.includes("token limit exceeded")) {
        setIsTokenLimitModalOpen(true);
      } else {
        setStatusMessages({ ...statusMessages, general: { type: 'error', message: error.message } });
      }
    } finally {
      setLoading({ ...loading, image: false });
    }
  };

  const handleSelectImage = (url) => {
    setImageSettings({ ...imageSettings, selectedImageUrl: url });
    setImagePreview(url);
  };

  const openImageModal = (url) => {
    setUiState({ ...uiState, modalImageUrl: url, isImageModalOpen: true });
  };

  const handleSaveImage = async () => {
    if (!imageSettings.selectedImageUrl) {
      setStatusMessages({ ...statusMessages, save: { type: 'error', message: 'No image selected to save' } });
      return;
    }
    
    setLoading({ ...loading, save: true });
    setStatusMessages({ ...statusMessages, save: null });
    
    try {
      const response = await fetch(`https://app.postwand.io/api/save-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          imageUrl: imageSettings.selectedImageUrl,
          prompt: imageSettings.prompt
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save image');
      }
      
      setStatusMessages({ 
        ...statusMessages,
        save: { 
          type: 'success', 
          message: 'Image saved successfully!' 
        }
      });
      
      setTimeout(() => setStatusMessages({ ...statusMessages, save: null }), 3000);
      
    } catch (error) {
      console.error("Error saving image:", error);
      setTimeout(() => setStatusMessages({ ...statusMessages, save: { type: 'error', message: error.message } }), 3000);
    } finally {
      setLoading({ ...loading, save: false });
    }
  };

  const stepIndicatorSteps = useMemo(() => ['image', 'caption', 'post'], []);
  
  const stepLabels = useMemo(() => ['Image', 'Caption', 'Post'], []);

 
    

  // Fixed step rendering functions with consistent structure and sizing
  const renderImageStep = () => (
    <div className="w-full space-y-4 bg-primary">
      <div className="bg-primary">
        <div className="pb-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">{t('aiStudio.generateImagesTitle')}</h1>
      <p className="text-sm text-gray-500">{t('aiStudio.generateImagesDescription')}</p>
      </div>
        <div className="relative flex gap-2 mt-1">
          <Textarea
            value={imageSettings.prompt}
            onChange={(e) => setImageSettings({ ...imageSettings, prompt: e.target.value })}
            placeholder={t('aiStudio.imagePromptPlaceholder')}
            className="w-full text-md h-52 p-4 bg-white border-shadow-gray-500 shadow-sm resize-none focus:ring-2 focus:ring-pink-200"
          />
          <div className="absolute bottom-3 left-3 flex items-center">
            <CustomDropdown
              options={brandDropdownOptions}
              value={imageSettings.brandStyle}
              onChange={(value) => setImageSettings({ ...imageSettings, brandStyle: value })}
              placeholder={{title: t('aiStudio.brandStylePlaceholder'), icon: <IoPricetagsOutline className="h-5 w-5 flex-shrink-0" style={{ color: '#6B7280' }} />}}
              className="h-10"
              placeholderWidth="w-10 md:w-40"
              width="w-40"  
            />
            
            <SettingsMenu
              options={[
                {
                  key: 'style',
                  label: t('aiStudio.imageStyle'),
                  options: styleDropdownOptions
                },
                {
                  key: 'aspectRatio',
                  label: t('aiStudio.aspectRatio'),
                  options: aspectRatioDropdownOptions
                },
                {
                  key: 'numImages',
                  label: t('aiStudio.numberOfImages'),
                  options: numImagesOptions
                }
              ]}
              currentValues={{
                style: imageSettings.style,
                aspectRatio: imageSettings.aspectRatio,
                numImages: imageSettings.numImages
              }}
              onChange={(key, value) => {
                setImageSettings(prev => ({ ...prev, [key]: value }));
              }}
              position="top-left"
            />
          </div>
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={handleGenerateImage}
              disabled={loading.image || !imageSettings.prompt}
              className="h-10 bg-pink-500 hover:bg-pink-600 text-white whitespace-nowrap"
            >
              {loading.image ? (
                <>
                  <RefreshCw className="w-6 h-4 mr-2 animate-spin" />
                  {t('aiStudio.creating')}
                </>
              ) : (
                <>
                  <Wand2 className="w-8 h-4" />
                  {t('aiStudio.create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading images skeleton */}
      {loading.image ? (
        <div className="space-y-4 bg-primary">
          <div className="flex justify-center gap-4">
            {[...Array(imageSettings.numImages)].map((_, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden bg-gray-200 animate-pulse"
                style={{ 
                  width: imageSettings.numImages === 1 ? '500px' : 
                         imageSettings.numImages === 2 ? '450px' : '400px',
                  height: imageSettings.numImages === 1 ? '600px' : 
                          imageSettings.numImages === 2 ? '450px' : '400px'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : generatedData.imageUrls && !generatedData.imageUrlExpired && Array.isArray(generatedData.imageUrls) && generatedData.imageUrls.length > 0 && (
        <div className="space-y-4 bg-primary">
          <div className="flex justify-center gap-4">
            {generatedData.imageUrls.map((url, index) => (
              <div key={index} className="relative">
                  <button
                    onClick={handleSaveImage}
                    disabled={loading.save}
                    className="bg-transparent  text-gray-500 hover:text-gray-700 py-1 m-1"
                  >
                    

                    <MdOutlineContentCopy className="w-4 h-4 mr-2" />
                   
                      </button>
                      {loading.save&&
                       <span className="text-sm mb-4">
                        {t('aiStudio.saving')}
                      </span>
                      }
                  {statusMessages.save && (
                    <span className={`text-sm mb-4 ${
                      statusMessages.save.type === 'error' ? ' text-red-700' : 'text-gray-700'
                    }`}>
                      
                      {statusMessages.save.message}
                    </span>
                  )}
                <img
                  src={url}
                  alt={`Generated Image ${index + 1}`}
                  className={`rounded-lg object-cover bg-gray-200 cursor-pointer transition-transform duration-200 hover:scale-[1.01] shadow-lg hover:shadow-xl`}
                  style={{
                    width: generatedData.imageUrls.length === 1 ? '500px' :
                           generatedData.imageUrls.length === 2 ? '450px' : 
                           generatedData.imageUrls.length === 3 ? '400px' : '350px',
                    height: generatedData.imageUrls.length === 1 ? '600px' :
                            generatedData.imageUrls.length === 2 ? '450px' : 
                            generatedData.imageUrls.length === 3 ? '400px' : '350px'
                  }}
                  onClick={() => {
                    handleSelectImage(url);
                    openImageModal(url);
                  }}
                />
              
              </div>
            ))}
          </div>
          
          {/* Add next button to go to caption step */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setUiState({ ...uiState, activeStep: 'caption' })}
              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-2"
            >
              {t('aiStudio.nextGenerateCaption')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderContentStep = () => (
    <div className="w-full h-full space-y-4 bg-primary">

      <div className="bg-primary">
        <div className="pb-2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">{t('aiStudio.generateCaptionsTitle')}</h1>
          <p className="text-sm text-gray-500">{t('aiStudio.generateCaptionsDescription')}</p>
          
         
        </div>
      </div>
  
      <div className="relative flex gap-2 mt-1">
        <Textarea
          value={contentSettings.topic}
          onChange={(e) => setContentSettings({ ...contentSettings, topic: e.target.value })}
          placeholder={t('aiStudio.topicPlaceholder')}
          className="w-full h-52 p-4 border-shadow-gray-500 shadow-sm resize-none focus:ring-2 focus:ring-pink-200 bg-white"
        />
                 <div className="absolute bottom-3 left-3 flex items-center">
        <CustomDropdown
              options={brandDropdownOptions}
              value={imageSettings.brandStyle}
              onChange={(value) => setImageSettings({ ...imageSettings, brandStyle: value })}
              placeholder={{title: t('aiStudio.brandStylePlaceholder'), icon: <IoPricetagsOutline className="h-5 w-5 flex-shrink-0" style={{ color: '#6B7280' }} />}}
              className="h-10"
              placeholderWidth="w-10 md:w-40"
              width="w-40"  
            />
            
          <SettingsMenu
            options={[
           
              {
                key: 'platformType',
                label: t('aiStudio.platformType'),
                options: platformOptions
              },
              {
                key: 'tone',
                label: t('aiStudio.tone'),
                options: toneOptions
              }
            ]}
            currentValues={{
              platformType: contentSettings.platformType,
              tone: contentSettings.tone,
            }}
            onChange={(key, value) => {
              setContentSettings(prev => ({ ...prev, [key]: value }));
            }}
            position="top-left"
          />
        </div>
        <div className="absolute bottom-3 right-3">
          <Button
            onClick={handleGeneratePost}
            disabled={loading.content || !contentSettings.topic}
            className="h-10 bg-pink-500 hover:bg-pink-600 text-white whitespace-nowrap"
          >
            {loading.content ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('aiStudio.creating')}
              </>
            ) : (
              <>
                <Wand2 className="w-8 h-4" />
                {t('aiStudio.create')}
              </>
            )}
          </Button>
        </div>
      </div>
   
      
      
   
      {Array.isArray(generatedData.content) && generatedData.content.length > 0 && (
        <div className="mt-4 bg-primary p-4 pb-16 rounded-md">
          <label className="text-lg font-medium text-gray-700 block mb-4">{contentSettings.platformType.charAt(0).toUpperCase() + contentSettings.platformType.slice(1)} generated captions</label>
          <div className="grid grid-cols-2 gap-6">
            {generatedData.content.map((content, index) => (
              <div 
                key={index} 
                className="p-4 pb-16 bg-white h-auto border rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
              >
              
                <div className="text-md text-gray-800">
                  {content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="absolute bottom-4 right-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 transform transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      setGeneratedData({ ...generatedData, selectedContent: content });
                      const button = event.target;
                      button.textContent = 'Selected';
                      setTimeout(() => {
                        button.textContent = 'Select';
                      }, 1500);
                    }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add next button to go to post preview step */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setUiState({ ...uiState, activeStep: 'post' })}
              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-2"
              disabled={!generatedData.selectedContent}
            >
              {t('aiStudio.nextPreviewPost')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="w-full space-y-6 bg-primary rounded-lg pb-8">
      {/* Platform selector buttons and Schedule button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {['instagram', 'facebook', 'threads'].map(platform => (
            <button
              key={platform}
              onClick={() => setUiState({ ...uiState, previewPlatform: platform })}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                uiState.previewPlatform === platform
                  ? "bg-purple-100 text-purple-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>

        <Button
          onClick={handleProceedToScheduler}
          className="px-6 py-2 h-auto text-md bg-white font-medium rounded-md shadow-md"
        >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            {t('aiStudio.continueEditingPost')}
          </span>
          <ArrowRight className="w-4 h-4 ml-2 text-[rgba(219,39,119,1)]" />
        </Button>
      </div>
      
      <div className="bg-primary">
        <PostPreview 
          selectedPlatforms={[uiState.previewPlatform]} 
          selectedPages={{ 
            [uiState.previewPlatform]: 'preview',
            post_type: 'post'
          }}
          imageUrl={imageSettings.selectedImageUrl}
          content={generatedData.selectedContent}
          // Using simplified data for preview
          facebookData={{ 
            pages: [{ 
              id: 'preview', 
              name: 'Facebook Page', 
              profile_picture: null
            }] 
          }}
          instagramData={{ 
            accounts: [{ 
              id: 'preview', 
              name: 'Instagram Account', 
              profile_picture: null
            }] 
          }}
          threadsData={{ 
            accounts: [{ 
              id: 'preview', 
              name: 'Threads Account', 
              profilePicture: null
            }] 
          }}
        />
      </div>
    </div>
  );

  // Update the handleProceedToScheduler function to use navigate
  const handleProceedToScheduler = () => {
    // Save only content and platform to localStorage
    localStorage.setItem('aiStudio_postContent', generatedData.selectedContent || '');
    localStorage.setItem('aiStudio_platform', uiState.previewPlatform || 'instagram');
    
    // Use the navigate function with image as URL param
    const imageUrl = imageSettings.selectedImageUrl ? 
      `?image=${encodeURIComponent(imageSettings.selectedImageUrl)}` : '';
    navigate(`/scheduler${imageUrl}`);
  };

  // Add new function to render selection screen
  const renderSelectionScreen = () => (
    <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
      <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
        <h1 className="text-3xl font-medium text-pink-500">
          {t('navigation.aiStudio')}
        </h1>
        <p className="text-gray-500 text-md mt-1">{t('aiStudio.createWithAiStudio')}</p>
      </div>
      
      <div className="relative flex flex-col justify-center items-center lg:w-[90%] h-full mx-auto">
        <div className="md:col-span-4 rounded-lg p-6 flex flex-col mx-auto">
          <div className="flex">
            <div className="grid grid-cols-1 lg:grid-cols-4 md:gap-4 gap-3 md:h-[40vh] h-[120vh] w-[90%] mx-auto">
              
                {/* Type option 0 */}
                <div 
                className="bg-gray-300/50 rounded-xl p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => setUiState({ ...uiState, activeStep: 'ideas' })}
              >
                <div>
                  <img src="/images/viral_ideas_aistudio.webp" alt="Image" className="w-full h-auto object-cover rounded-lg opacity-90" />
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateIdeas')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateIdeasDesc')}</p>
                </div>
              </div>
              {/* Type option 1 */}
              <div 
                className="bg-gray-300/50 rounded-xl p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => setUiState({ ...uiState, activeStep: 'image' })}
              >
                <div>
                  <img src="/images/generate_images_aistudio.webp" alt="Image" className="w-full h-auto object-cover rounded-lg" />
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateImages')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateImagesDesc')}</p>
                </div>
              </div>
              
              {/* Type option 2 */}
              <div 
                className="bg-gray-300/50 rounded-xl p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => setUiState({ ...uiState, activeStep: 'caption' })}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateCaptions')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateCaptionsDesc')}</p>
                </div>
              </div>
              
              {/* Type option 3 */}
              <div 
                className="bg-gray-300/50 rounded-xl p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => setUiState({ ...uiState, activeStep: 'post' })}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generatePost')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generatePostDesc')}</p>
                </div>
                <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-orange-400/40 border border-orange-600 text-orange-600 text-sm font-bold py-1 px-4 rounded">
                  SOON
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  if(uiState.activeStep === 'ideas'){
    return (
      <div className="w-full min-h-screen bg-primary">
        <ViralChatSession returnToAiStudio={() => setUiState({ ...uiState, activeStep: null })}/>
      </div>
    )
  }
  return (
    <div className="w-full min-h-screen bg-primary">


      {uiState.activeStep === null ? (
        // Show selection screen when no step is selected
        renderSelectionScreen()
      ) : (
        // Show the regular workflow when a step is selected
        <div className="w-full max-w-[95%] mx-auto px-2 py-6 md:p-6 rounded-xl bg-primary">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setUiState({ ...uiState, activeStep: null })}
              variant="ghost"
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              {t('navigation.aiStudio')}
            </CardTitle>
          </div>
          
          <div className="w-full p-0 md:p-6 relative bg-primary">
            
            {statusMessages.general && (
              <div className={`p-3 rounded-lg mb-4 ${
                statusMessages.general.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {statusMessages.general.message}
              </div>
            )}
            
            <div className="w-full bg-primary min-h-[70vh]" style={{ scrollbarGutter: 'stable !important' }}>
              {uiState.activeStep === 'image' && renderImageStep()}
              {uiState.activeStep === 'caption' && renderContentStep()}
              {uiState.activeStep === 'post' && renderPreviewStep()}
          
            </div>
          </div>
          
          {/* Image modal */}
          {uiState.isImageModalOpen && uiState.modalImageUrl && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setUiState({ ...uiState, isImageModalOpen: false })}
            >
              <div 
                className="bg-white rounded-lg p-2 max-w-5xl max-h-[95vh] relative" 
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                  onClick={() => setUiState({ ...uiState, isImageModalOpen: false })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <img 
                  src={uiState.modalImageUrl} 
                  alt="Full size preview" 
                  className="max-w-full max-h-[calc(95vh-8rem)] object-contain"
                />
                
                {/* Add save button */}
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleSaveImage}
                    disabled={loading.save}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6"
                  >
                    {loading.save ? t('aiStudio.saving') : t('aiStudio.saveToLibrary')}
                  </Button>
                </div>
                
                {/* Show save status if present */}
                {statusMessages.save && (
                  <div className={`mt-2 p-2 text-center rounded ${
                    statusMessages.save.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {statusMessages.save.message}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Token limit modal */}
          <TokenLimitModal 
            isOpen={isTokenLimitModalOpen} 
            onClose={() => setIsTokenLimitModalOpen(false)} 
          />
        </div>
      )}
      
      {/* Add a bottom padding div to ensure background extends fully */}
      <div className="w-full h-20 bg-primary"></div>
    </div>
  );
};

export default AiStudio;