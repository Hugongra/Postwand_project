import React from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedInIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import { useTranslation } from 'react-i18next';


const SocialPlatformSelector = ({ 
  postType,
  socialAccounts,
  selectedPlatforms = [], 
  setSelectedPlatforms
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  let availablePlatforms = Object.keys(socialAccounts);
  
  switch(postType){
    case 'text':
      availablePlatforms = availablePlatforms.filter(platform => platform === 'facebook' || platform === 'threads' || platform === 'linkedin');
      break;
    case 'image':
      availablePlatforms = availablePlatforms.filter(platform => platform !== 'youtube' && platform !== 'tiktok');
      break;
   
  }

  const platformConfig = {
    facebook: { icon: FacebookIcon, label: 'Facebook' },
    instagram: { icon: InstagramIcon, label: 'Instagram' },
    threads: { icon: ThreadsIcon, label: 'Threads' },
    tiktok: { icon: TikTokIcon, label: 'TikTok' },
    linkedin: { icon: LinkedInIcon, label: 'LinkedIn' },
    youtube: { icon: YouTubeIcon, label: 'YouTube' }
  };

  const handlePlatformClick = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="w-full">
      {availablePlatforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-5 text-center">
          <p className="mb-3 text-gray-600">{t('social.noAccountsConnected')}</p>
          <button 
            type="button"
            onClick={() => navigate('/integrations')}
            className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            {t('social.connectAccount')}
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center gap-4 h-12">
          {availablePlatforms.map(platform => {
            const config = platformConfig[platform];
            if (!config) return null;
            
            const isSelected = selectedPlatforms.includes(platform);
            
            return (
              <button 
                key={platform}
                type="button"
                aria-label={config.label}
                onClick={() => handlePlatformClick(platform)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all bg-white hover:bg-gray-100"
              >
                <img 
                  src={config.icon}
                  alt={config.label}
                  className={`w-6 h-6 md:w-7 md:h-7 ${!isSelected ? 'opacity-50 grayscale' : ''}`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SocialPlatformSelector;
