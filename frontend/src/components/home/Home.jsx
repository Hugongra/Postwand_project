import { ArrowRight } from 'lucide-react';
import { FaChevronRight } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeSkeletonLoader } from '../skeletons';
import InstagramIcon from '/SM_icons/instagram.svg';
import FacebookIcon from '/SM_icons/facebook.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YoutubeIcon from '/SM_icons/youtube.svg';
import HomeBanner from '/images/home_banner.webp';
import HomeBannerLight from '/images/home_banner_light.webp';
import HomeBannerMobile from '/images/home_banner_mobile.webp';
import HomeBannerMobileLight from '/images/home_banner_mobile_light.webp';
import TiktokIcon from '/SM_icons/tiktok.svg';
  
const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [imagesLoaded, setImagesLoaded] = useState(false);

  
  // Get current theme and determine banner images
  const currentTheme = localStorage.getItem('active-theme') || 'default';
  const isLightTheme = currentTheme === 'light';
  
  const bannerImages = {
    desktop: isLightTheme ? HomeBannerLight : HomeBanner,
    mobile: isLightTheme ? HomeBannerMobileLight : HomeBannerMobile
  };
  
  useEffect(() => {
    const loadImages = async () => {
      try {
        const desktopPromise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.src = bannerImages.desktop;
        });
        
        const mobilePromise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.src = bannerImages.mobile;
        });
        
        await Promise.all([desktopPromise, mobilePromise]);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        setImagesLoaded(true); // Show content anyway if there's an error
      }
    };
    
    loadImages();
  }, []);
  
  const handlePlatformConnect = (platform) => {
    navigate('/social-accounts', { state: { selectedPlatform: platform } });
  };

  if (!imagesLoaded) {
    return <HomeSkeletonLoader />;
  }

  return (
    <div className="w-full h-full m-auto p-2 md:px-0 md:pr-2 bg-primary">
      {/* Hero Banner Section */}
      <div className="grid grid-cols-1 relative w-full h-auto rounded-lg overflow-hidden">
        <div className="absolute z-5 p-5 space-y-3 max-w-md  h-full flex flex-col justify-start md:justify-end">
          <h1 className="text-3xl font-bold text-gray-700 mt-2 md:mt-4 lg:mt-6">
            {t('brands.startNewBrandTitle')}
          </h1>
                      <p className="text-gray-700">{t('brands.startNewBrandDescription')}</p>
          <button 
            onClick={() => navigate('/brand-identity', { state: { openDialog: true } })}
            className="text-sm flex items-center gap-1 border shadow-lg px-4 h-9 rounded-lg w-fit home-button"
          >
            {t('brands.newBrandIdentity')} <ArrowRight size={20} />
          </button>
        </div>
        
        <img src={bannerImages.desktop} alt="logo" className="w-full h-[35vh] min-h-[240px] object-cover rounded-lg hidden md:block mx-auto" />
        <img src={bannerImages.mobile} alt="logo" className="w-full h-auto object-cover rounded-lg block md:hidden mx-auto" />
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 min-h-[25rem]">
        
        {/* AI Content Generation Section */}
        <div className="md:col-span-2 bg-white rounded-lg p-3 md:p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 text-sm">{t('common.create')} {t('social.content')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-grow">
            {/* Generate Ideas */}
            <div 
              onClick={() => navigate('/ai-studio', { state: { activeStep: 'image' } })}
              className="bg-gray-100 rounded-md p-3 hover:bg-gray-100/60 transition-all duration-200 flex flex-col relative cursor-pointer"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-800">{t('aiStudio.option.generateIdeas')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateIdeasDesc')}</p>
              </div>
              <div className="absolute bottom-3 right-3">
                <ArrowRight className="h-6 w-6 text-accent" />
              </div>
            </div>
            
            {/* Generate Caption */}
            <div 
              onClick={() => navigate('/ai-studio', { state: { activeStep: 'caption' } })}
              className="bg-gray-100 rounded-md p-3 hover:bg-gray-100/60 transition-all duration-200 flex flex-col relative cursor-pointer"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-800">{t('aiStudio.option.generateCaptions')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateCaptionsDesc')}</p>
              </div>
              <div className="absolute bottom-3 right-3">
                <ArrowRight className="h-6 w-6 text-accent" />
              </div>
            </div>
            
            {/* Generate Image */}
            <div 
              onClick={() => navigate('/ai-studio', { state: { activeStep: 'image' } })}
              className="bg-gray-100 rounded-md p-3 hover:bg-gray-100/60 transition-all duration-200 flex flex-col relative cursor-pointer"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-800">{t('aiStudio.option.generateImages')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('aiStudio.option.generateImagesDesc')}</p>
              </div>
              <div className="absolute bottom-3 right-3">
                <ArrowRight className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-1 bg-white rounded-lg p-6 h-auto min-h-[20rem]">
          <h2 className="text-xl font-bold mb-4 text-sm">{t('social.connectSocialAccount')}</h2>
          <div className="space-y-1">
            {/* Facebook Connection Row */}
            <button 
              onClick={() => handlePlatformConnect('facebook')}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <img src={FacebookIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.facebook')}</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            
            {/* Instagram Connection Row */}
            <button 
              onClick={() => handlePlatformConnect('instagram')}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <img src={InstagramIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.instagram')}</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            
            {/* Twitter/X Connection Row 
            <button 
              onClick={() => setShowModal({...showModal, twitter: true})}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <FaTwitter size={24} style={{ color: '#1DA1F2' }} className="mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.twitter')}</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            */}
             {/* Threads Connection Row 
             <button 
              onClick={() => setShowModal({...showModal, threads: true})}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <img src={ThreadsIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} Threads</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            */}
            {/* LinkedIn Connection Row */}
            <button 
              onClick={() => handlePlatformConnect('linkedin')}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <img src={LinkedinIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.linkedin')}</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            
            {/* YouTube Connection Row */}  
            <button 
              onClick={() => handlePlatformConnect('youtube')}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <img src={YoutubeIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.youtube')}</span> 
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            
            {/* TikTok Connection Row */}
            <button 
              onClick={() => handlePlatformConnect('tiktok')}
              className="w-full px-3 py-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                  <img src={TiktokIcon} className="h-5 w-5 flex-shrink-0 mr-3" />
                <span className="font-medium text-sm">{t('social.connectAccount')} {t('social.platforms.tiktok')}</span>
              </div>
              <FaChevronRight size={15} className="text-gray-400" />
            </button>
            
           
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default Home;
