import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import GenerateAd from './CopyAds';
import Header from '@components/header';
import CopyAd from './GenerateAds';
import * as api from '@services/api/api';


const  AdSelector = ({ setAdType, brands, loadingBrands, onAutoGenSelect }) => {
  const { t } = useTranslation();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleBrandClick = (brandId) => {
    setSelectedBrand(brandId);
    // Don't close the dropdown
  };

  const handleProceedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedBrand) {
      onAutoGenSelect(selectedBrand);
      setIsDropdownOpen(false);
      setSelectedBrand(''); // Reset selection after proceeding
    }
  };

  return (  
  <div className="py-2">
  <Header title={t('aiStudio.createAd.title')} />
  <div className="relative h-full flex flex-col w-full mx-auto px-4">
    <div className="flex gap-4 justify-end items-start">
      
      {/* Custom generation Button */}
      <button 
        className="bg-gray-300/50 text-sm rounded-lg px-3 py-2 hover:bg-gray-200/60 transition-all duration-200 font-medium"
        onClick={() => setAdType('copy')}
      >
        Custom generation
      </button>
      
      {/* Guided generation Button */}
      <button 
        className="bg-gray-300/50 text-sm rounded-lg px-3 py-2 hover:bg-gray-200/60 transition-all duration-200 font-medium"
        onClick={() => setAdType('generate')}
      >
        Guided generation
      </button>

      {/* Auto generation - Custom Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-gray-300/50 text-sm rounded-lg px-3 py-2 hover:bg-gray-200/60 transition-all duration-200 font-medium flex items-center gap-2"
        >
          Auto generation
          <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="max-h-[300px] overflow-y-auto p-1">
              {loadingBrands ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading brands...</div>
              ) : brands.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No brands available</div>
              ) : (
                brands.map((brand) => (
                  <div
                    key={brand.id}
                    onClick={() => handleBrandClick(brand.id)}
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedBrand === brand.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    {brand.name || brand.domain}
                  </div>
                ))
              )}
            </div>
            
            {/* Proceed button inside dropdown */}
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={handleProceedClick}
                disabled={!selectedBrand}
                className="w-full bg-blue-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  </div>
);
};


const CreateAd = () => {

  const [adType, setAdType] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  
  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      const response = await api.GetBrands();
      if (response.ok) {
        setBrands(response.data.brands || []);
      }
      setLoadingBrands(false);
    };
    fetchBrands();
  }, []);

  const handleAutoGenSelect = async (brandId) => {
    setIsGenerating(true);
    
      const formData = new FormData();
      formData.append('ad_type', 'product'); // You can make this dynamic if needed
      formData.append('brand_id', brandId);
      // Note: Backend will automatically use the brand's first image
      
      const response = await api.AutoGenerateAd(formData);
      
      if (response.ok) {
        console.log('Auto-generated ad:', response.data);
        // Handle the successful response here
        // You might want to show the generated ad in a modal or new view
      } else {
        console.error('Failed to generate ad:', response.data);
        alert('Failed to generate ad. Please try again.');
      }
   
  };

  return (
    <div className="w-full mx-auto bg-primary min-h-screen overflow-x-hidden">
      
      {!adType && <AdSelector 
        setAdType={setAdType} 
        brands={brands}
        loadingBrands={loadingBrands}
        onAutoGenSelect={handleAutoGenSelect}
      />}
      {adType === 'generate' && (<GenerateAd type={adType}/>
      )}
      {adType === 'copy' && (<CopyAd type={adType}/>
      )}
    </div>
  );
};

export default CreateAd;
