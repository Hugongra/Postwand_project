import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const AdTypeSelector = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleAdTypeSelection = (type) => {
    navigate(`/ai-studio/create-ad?type=${type}`);
  };

  return (
    <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
      <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
        <h1 className="text-3xl font-medium text-pink-500">
          {t('aiStudio.createAd.selectType') || 'Select Ad Type'}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('aiStudio.createAd.selectTypeDesc') || 'Choose how you want to create your ad'}
        </p>
      </div>

      <div className="relative flex flex-col lg:max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          {/* Generate Ad from Image */}
          <div 
            className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => handleAdTypeSelection('generate')}
          >
            <div className="text-center space-y-4">
              
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {t('aiStudio.createAd.generateFromImage') || 'Generate Ad from Image'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('aiStudio.createAd.generateFromImageDesc') || 'Upload a product image and let AI create stunning ads with various templates and shortcuts'}
                </p>
              </div>
              
             
              
           
            </div>
          </div>

          {/* Copy Ad from Reference */}
          <div 
            className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => handleAdTypeSelection('copy')}
          >
            <div className="text-center space-y-4">
           
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {t('aiStudio.createAd.copyFromReference') || 'Copy Ad from Reference'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('aiStudio.createAd.copyFromReferenceDesc') || 'Upload your product image and a reference ad to create similar styled advertisements'}
                </p>
              </div>
              
           
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdTypeSelector;
