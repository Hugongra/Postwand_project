import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedInIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import { X } from 'lucide-react'; 
import FacebookAuth from '../auth/FacebookAuth';
import { useTranslation } from 'react-i18next';

const SocialPlatformSelector = ({ 
  platforms = ['facebook', 'instagram', 'threads', 'tiktok', 'linkedin', 'youtube'], 
  selectedPlatforms = [], 
  onSelectPlatform 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectDialogAnimation, setConnectDialogAnimation] = useState(false);

  const handlePlatformClick = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      // Remove platform if already selected
      onSelectPlatform(selectedPlatforms.filter(p => p !== platform));
    } else {
      // Add platform if not selected
      onSelectPlatform([...selectedPlatforms, platform]);
    }
  };

  const openConnectDialog = () => {
    setShowConnectDialog(true);
    setTimeout(() => setConnectDialogAnimation(true), 10);
  };

  const closeConnectDialog = () => {
    setConnectDialogAnimation(false);
    setTimeout(() => setShowConnectDialog(false), 200);
  };
  
  const handleAuthSuccess = (platform, data) => {
    closeConnectDialog();
    window.location.reload();
  };

  const noPlatformsAvailable = platforms.length === 0;

  return (
    <div className="w-full">
      {noPlatformsAvailable ? (
        <div className="flex flex-col items-center justify-center p-5 text-center">
          <p className="mb-3 text-gray-600">{t('social.noAccountsConnected')}</p>
          <button 
            type="button"
            onClick={() => navigate('/social-accounts')}
            className="px-3 py-1.5 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            {t('social.connectAccount')}
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center gap-4 h-12">
          {platforms.includes('facebook') && (
            <button 
              type="button"
              aria-label="Facebook"
              onClick={() => handlePlatformClick('facebook')}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={FacebookIcon}
                alt="Facebook"
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('facebook') ? 'opacity-50 grayscale' : ''}`}
              />
            </button>
          )}
          
          {platforms.includes('instagram') && (
            <button 
              type="button"
              aria-label="Instagram"
              onClick={() => handlePlatformClick('instagram')}
              onMouseEnter={() => setHoveredPlatform('instagram')}
              onMouseLeave={() => setHoveredPlatform(null)}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={InstagramIcon}
                alt="Instagram"
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('instagram') ? 'opacity-50 grayscale' : ''}`}
              />
            </button>
          )}
          
          {platforms.includes('threads') && (
            <button 
              type="button"
              aria-label="Threads"
              onClick={() => handlePlatformClick('threads')}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={ThreadsIcon}
                alt="Threads"
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('threads') ? 'opacity-50 grayscale' : ''}`}
              />
            </button>
                    )}
          
          {platforms.includes('tiktok') && (
            <button 
              type="button"
              aria-label="TikTok"
              onClick={() => handlePlatformClick('tiktok')}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={TikTokIcon}
                alt="TikTok"
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('tiktok') ? 'opacity-50 grayscale' : ''}`}
              />
            </button>
          )}

          {platforms.includes('linkedin') && (
            <button 
              type="button"
              aria-label="LinkedIn"
              onClick={() => handlePlatformClick('linkedin')}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={LinkedInIcon} 
                alt="LinkedIn" 
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('linkedin') ? 'opacity-50 grayscale' : ''}`} 
              />
            </button>
          )}

          {platforms.includes('youtube') && (
            <button 
              type="button"
              aria-label="YouTube"
              onClick={() => handlePlatformClick('youtube')}
              className="flex items-center justify-center w-10 h-10 rounded-md transition-all bg-white hover:bg-gray-100"
            >
              <img 
                src={YouTubeIcon} 
                alt="YouTube" 
                className={`w-6 h-6 md:w-7 md:h-7 ${!selectedPlatforms.includes('youtube') ? 'opacity-50 grayscale' : ''}`} 
              />
            </button>
          )}
          </div>
      

      )}

      {/* Connect Account Dialog */}
      {showConnectDialog && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div 
            className={`bg-primary rounded-lg w-[95%] max-w-[80vw] h-[90vh] overflow-y-auto shadow-xl transition-all duration-200 ${
              connectDialogAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <div className="p-4 flex justify-between items-center sticky top-0 z-10 bg-primary">
              <h2 className="text-xl font-medium text-gray-800">{t('social.connectSocialAccount')}</h2>
              <button type="button" onClick={closeConnectDialog} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 h-[70vh] bg-primary overflow-y-none">
              {/* Integrate the FacebookAuth component */}
              <FacebookAuth onAuth={handleAuthSuccess} />
            </div>
            
            <div className="p-4 sticky bottom-0 bg-primary rounded-b-lg">
              <div className="flex justify-start">
                <button 
                  type="button"
                  onClick={closeConnectDialog}
                  className="bg-gray-200 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPlatformSelector;
