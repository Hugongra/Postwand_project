import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, Share2, Target, Zap, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IoCloudUploadOutline } from "react-icons/io5";
import { X } from "lucide-react";   
const CreateAd = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adType = searchParams.get('type'); // 'generate' or 'copy'
  const [adConcept, setAdConcept] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [referenceAd, setReferenceAd] = useState(null);
  const [referenceAdPreview, setReferenceAdPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Redirect to selector if no type is specified
  useEffect(() => {
    if (!adType || (adType !== 'generate' && adType !== 'copy')) {
      navigate('/ai-studio/ad-type-selector');
    }
  }, [adType, navigate]);

  const handleProductImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReferenceAdUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReferenceAd(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceAdPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = async (adType) => {
    if (!productImage) {
      alert('Please upload a product image first');
      return;
    }

    setIsGenerating(true);
    try {
      // Here you would implement the actual ad creation logic
      // For now, we'll just simulate the process
      console.log('Creating ad:', { adType, customPrompt, productImage, referenceAd });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`${adType} ad created successfully!`);
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Error creating ad. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const adShortcuts = [
    {
      id: 'photoshoot',
      title: t('aiStudio.createAd.photoshoot'),
      icon: Camera,
      color: 'bg-blue-500',
      action: () => handleCreateAd('Photoshoot')
    },
    {
      id: 'facebook-ad',
      title: t('aiStudio.createAd.facebookAd'),
      icon: Share2,
      color: 'bg-blue-600',
      action: () => handleCreateAd('Facebook Ad')
    },
    {
      id: 'instagram-story',
      title: t('aiStudio.createAd.instagramStory'),
      icon: ImageIcon,
      color: 'bg-purple-500',
      action: () => handleCreateAd('Instagram Story')
    },
    {
      id: 'banner-ad',
      title: t('aiStudio.createAd.bannerAd'),
      icon: Target,
      color: 'bg-green-500',
      action: () => handleCreateAd('Banner Ad')
    },
    {
      id: 'video-ad',
      title: t('aiStudio.createAd.videoAd'),
      icon: Zap,
      color: 'bg-red-500',
      action: () => handleCreateAd('Video Ad')
    },
    {
      id: 'carousel-ad',
      title: t('aiStudio.createAd.carouselAd'),
      icon: ImageIcon,
      color: 'bg-yellow-500',
      action: () => handleCreateAd('Carousel Ad')
    }
  ];

  if (!adType || (adType !== 'generate' && adType !== 'copy')) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
      <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/ai-studio/ad-type-selector')}
            className="p-2 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-medium text-pink-500">
            {adType === 'generate' 
              ? (t('aiStudio.createAd.generateFromImage') || 'Generate Ad from Image')
              : (t('aiStudio.createAd.copyFromReference') || 'Copy Ad from Reference')
            }
          </h1>
        </div>
        <p className="text-gray-600 mt-2 ml-12">
          {adType === 'generate' 
            ? (t('aiStudio.createAd.generateFromImageDesc') || 'Upload a product image and let AI create stunning ads')
            : (t('aiStudio.createAd.copyFromReferenceDesc') || 'Upload your product and reference ad to create similar styled advertisements')
          }
        </p>
      </div>

      <div className="relative flex flex-col lg:max-w-2xl mx-auto">
        {/* Main Form Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {t('aiStudio.createAd.formTitle')}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0">
            {/* Image Upload Section */}
            <div className={`grid ${adType === 'copy' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6 mb-6`}>
              
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('aiStudio.createAd.productImage')} <span className="text-red-500">*</span>
                </label>
                <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                  <label className={`${productImage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} flex flex-col items-center justify-center h-full w-full`}>
                    <div className="flex flex-col items-center text-gray-400 hover:text-gray-500 text-sm transition-all duration-300">
                      <IoCloudUploadOutline className="w-6 h-6 mb-1" />
                      {productImage ? 'Product Image Uploaded' : t('social.chooseImage')}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                      disabled={!!productImage}
                    />
                  </label>
                </div>
                
                {/* Product Image Preview */}
                {productImagePreview && (
                  <div className="mt-3">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                      <img
                        src={productImagePreview}
                        alt="Product preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                        onClick={() => {
                          setProductImage(null);
                          setProductImagePreview(null);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Ad Upload - Only show for copy type */}
              {adType === 'copy' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Ad <span className="text-red-500">*</span>
                  </label>
                <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                  <label className={`${referenceAd ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} flex flex-col items-center justify-center h-full w-full`}>
                    <div className="flex flex-col items-center text-gray-400 hover:text-gray-500 text-sm transition-all duration-300">
                      <IoCloudUploadOutline className="w-6 h-6 mb-1" />
                      {referenceAd ? 'Reference Ad Uploaded' : 'Upload Reference'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceAdUpload}
                      className="hidden"
                      disabled={!!referenceAd}
                    />
                  </label>
                </div>
                
                {/* Reference Ad Preview */}
                {referenceAdPreview && (
                  <div className="mt-3">
                    <div className="relative w-full aspect-square  rounded-lg overflow-hidden">
                      <img
                        src={referenceAdPreview}
                        alt="Reference ad preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                        onClick={() => {
                          setReferenceAd(null);
                          setReferenceAdPreview(null);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>

            {/* Ad Type Shortcuts - Only show for generate type */}
            {adType === 'generate' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('aiStudio.createAd.shortcuts')}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {t('aiStudio.createAd.shortcutsDesc')}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {adShortcuts.map((shortcut) => {
                    return (
                      <div
                        key={shortcut.id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-pink-300 rounded-lg p-4 bg-gray-50 hover:bg-white"
                        onClick={shortcut.action}
                      >
                        <div className="text-center space-y-2">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {shortcut.title}
                            </h4>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Prompt Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adType === 'copy' ? 'Additional Instructions' : 'Custom Prompt'} <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={adType === 'copy' 
                  ? "Enter any specific modifications or style preferences for your ad..."
                  : "Enter any specific instructions or modifications for your ad creation..."
                }
                className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* Generate Ad Button */}
            <div className="mt-6">
              <Button
                onClick={() => handleCreateAd(adType === 'copy' ? 'Copy from Reference' : 'Custom')}
                disabled={isGenerating || !productImage || (adType === 'copy' && !referenceAd)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('aiStudio.creating')}</span>
                  </div>
                ) : (
                  adType === 'copy' 
                    ? (t('aiStudio.copyAd') || 'Copy Ad Style')
                    : (t('aiStudio.generateAd') || 'Generate Ad')
                )}
              </Button>
            </div>
           
          </CardContent>
        </div>

        
      </div>
    </div>
  );
};

export default CreateAd;
