import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AiStudioHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
      <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
        <h1 className="text-3xl font-medium text-pink-500">
          {t('navigation.aiStudio')}
        </h1>
      </div>
      
      <div className="relative flex flex-col justify-center items-center lg:w-[85%] h-full mx-auto">
        <div className="md:col-span-4 rounded-lg p-6 flex flex-col mx-auto">
          <div className="flex">
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 md:gap-4 gap-3 md:h-[35vh] h-[150vh] lg:h-[45vh] w-full mx-auto">
              
              {/* Ideas option */}
              <div 
                className="bg-gray-300/50 rounded-xl p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => navigate('/ai-studio/ideas')}
              >
                <div>
                   {/*
                  <img src="/images/viral_ideas_aistudio.webp" alt="Image" className="w-full h-auto object-cover rounded-lg opacity-90" />
                  */}
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateIdeas')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateIdeasDesc')}</p>
                </div>
              </div>

              {/* Create Images option */}
              <div 
                className="bg-gray-300/50 rounded-xl p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => navigate('/ai-studio/images')}
              >
                <div>
                  {/*
                  <img src="/images/generate_images_aistudio.webp" alt="Image" className="w-full h-auto object-cover rounded-lg" />
                  */}
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateImages')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateImagesDesc')}</p>
                </div>
              </div>
              
              {/* Create Text option */}
              <div 
                className="bg-gray-300/50 rounded-xl p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => navigate('/ai-studio/text')}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generateCaptions')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateCaptionsDesc')}</p>
                </div>
              </div>
              
              {/* Create Post option */}
              <div 
                className="bg-gray-300/50 rounded-xl p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => navigate('/ai-studio/post')}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.option.generatePost')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generatePostDesc')}</p>
                </div>
              </div>

              {/* Create Ad option */}
              <div 
                className="bg-gray-300/50 rounded-xl p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full"
                onClick={() => navigate('/ai-studio/ad-type-selector')}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mt-2">{t('aiStudio.createAd.title')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('aiStudio.createAd.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiStudioHome; 