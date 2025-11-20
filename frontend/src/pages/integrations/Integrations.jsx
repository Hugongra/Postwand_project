import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { useTranslation } from 'react-i18next';

import Header from '@components/header';
import ConnectBadge from './ConnectBadge.jsx';
import AccountBadge from './AccountBadge.jsx';
import PlatformCard from './PlatformCard.jsx';
import * as api from '@services/api/api';
import * as facebook from './connections/facebook.js';
import * as instagram from './connections/instagram.js';
import * as linkedin from './connections/linkedin.js';
import * as tiktok from './connections/tiktok.js';
import * as youtube from './connections/youtube.js';

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'];

const SocialMediaAuth = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [socialData, setSocialData] = useState({});
  const [isLoading, setIsLoading] = useState({
    all: false,
    facebook: false,
    instagram: false,
    tiktok: false,
    linkedin: false,
    youtube: false,

    facebookAccounts: {},
    instagramAccounts: {},
    tiktokAccounts: {},
    linkedinAccounts: {},
    youtubeAccounts: {}
  });
  const [message, setMessage] = useState({ text: null, type: null }); 
  
  const [connectBadge, setConnectBadge] = useState({
    facebook: false,
    instagram: false,
    tiktok: false,
    linkedin: false,
    youtube: false  
  });

  const [accountBadge, setAccountBadge] = useState({
    facebook: false,
    instagram: false,
    tiktok: false,
    linkedin: false,
    youtube: false
  });

  // Fetch social accounts on component mount
  const getSocialAccounts = async () => {
    setIsLoading(prev => ({ ...prev, all: true }));
      const response = await api.SocialAccounts();
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      setSocialData(response.data);
      setIsLoading(prev => ({ ...prev, all: false }));
  };

  useEffect(() => {
    facebook.FacebookSDK();
    getSocialAccounts();
  }, []);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      setMessage({ text: 'Facebook SDK not loaded', type: 'error' });
      return;
    }
    setIsLoading(prev => ({ ...prev, facebook: true }));

    try {
      const result = await facebook.FacebookLogin();
    
      if(result.error) setMessage({ text: result.error, type: 'error' });
      if(result.success) setMessage({ text: result.success, type: 'success' });

      setIsLoading(prev => ({ ...prev, facebook: false }));
      if(result.success) setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to authenticate with Facebook', type: 'error' });
      setIsLoading(prev => ({ ...prev, facebook: false }));
    }
  }; 
  
  const handleInstagramLogin = async () => {
    if (!window.FB) {
      setMessage({ text: 'Facebook SDK not loaded', type: 'error' });
      return;
    }

    setIsLoading(prev => ({ ...prev, instagram: true }));
    setMessage({ text: null, type: null });
    
    try {
      const result = await instagram.InstagramLogin();

      if(result.error) setMessage({ text: result.error, type: 'error' });
      if(result.success) setMessage({ text: result.success, type: 'success' });

      setIsLoading(prev => ({ ...prev, instagram: false }));
      if (result.success) setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to authenticate with Instagram', type: 'error' });
      setIsLoading(prev => ({ ...prev, instagram: false }));
    }
  };
             

  const handleLinkedinLogin = () => {
    setIsLoading(prev => ({ ...prev, linkedin: true }));
    setMessage({ text: null, type: null });
    
    linkedin.LinkedinLogin();
  }

  const handleLinkedinCallback = async (code, state, error, error_description) => {
    try {

      if (error) {
        setMessage({ text: `LinkedIn authentication failed: ${error_description || error}`, type: 'error' });
        localStorage.removeItem('linkedinAuthPending');
        localStorage.removeItem('linkedinAuthState');
        setIsLoading(prev => ({ ...prev, linkedin: false }));
        return;
      }
      
     
      const savedState = localStorage.getItem('linkedinAuthState');
      if (state !== savedState) {
        setMessage({ text: 'LinkedIn security verification failed', type: 'error' });
        localStorage.removeItem('linkedinAuthPending');
        localStorage.removeItem('linkedinAuthState');
        setIsLoading(prev => ({ ...prev, linkedin: false }));
        return;
      }
      
      const response = await api.LinkedinLogin(code);
   
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with LinkedIn');
      }
      
      setMessage({ text: "LinkedIn account connected!", type: 'success' });
    
      setTimeout(() => window.location.reload(), 1000);

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
      console.error('LinkedIn authentication error:', error);
    } finally {
      // Ensure the loading state is always reset
      setIsLoading(prev => ({ ...prev, linkedin: false }));
      localStorage.removeItem('linkedinAuthPending');
      localStorage.removeItem('linkedinAuthState');
    }
  };

    // Effect to check for LinkedIn authentication in URL parameters
    useEffect(() => {
      const checkLinkedinCallback = () => {  
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');
  
        if ((code || error) && localStorage.getItem('linkedinAuthPending') === 'true') {
          handleLinkedinCallback(code, state, error, error_description);
        }
      };
  
      checkLinkedinCallback();
    }, []);
 

  const handleYouTubeLogin = () => {
    setIsLoading(prev => ({ ...prev, youtube: true }));
    setMessage({ text: null, type: null });
    
    const result = youtube.YouTubeLogin();
    
    if (result.authWindow) {
      // Monitor if window is closed without completing auth
      const checkClosed = setInterval(() => {
        if (result.authWindow && result.authWindow.closed) {
          clearInterval(checkClosed);
          setIsLoading(prev => ({ ...prev, youtube: false }));
          localStorage.removeItem('youtubeAuthPending');
          localStorage.removeItem('youtubeAuthState');
        }
      }, 1000);
    }
  }

  const handleYoutubeCallback = async (code, state, error, error_description) => {
    try {
      if (error) {
        setMessage({ text: `YouTube authentication failed: ${error_description || error}`, type: 'error' });
        localStorage.removeItem('youtubeAuthPending');
        localStorage.removeItem('youtubeAuthState');
        setIsLoading(prev => ({ ...prev, youtube: false }));
        return;
      }
      
      const savedState = localStorage.getItem('youtubeAuthState');
      if (state !== savedState) {
        setMessage({ text: 'YouTube security verification failed', type: 'error' });
        localStorage.removeItem('youtubeAuthPending');
        localStorage.removeItem('youtubeAuthState');
        setIsLoading(prev => ({ ...prev, youtube: false }));
        return;
      }
      
      const response = await api.YoutubeLogin(code, youtube.YOUTUBE_REDIRECT_URI);
      
      if (!response.ok) {
        throw new Error(response.data?.error || 'Failed to authenticate with YouTube');
      }
      
      setMessage({ text: "YouTube account connected!", type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
      console.error('YouTube authentication error:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, youtube: false }));
      localStorage.removeItem('youtubeAuthPending');
      localStorage.removeItem('youtubeAuthState');
    }
  };

  const handleTikTokLogin = async () => {
    setIsLoading(prev => ({ ...prev, tiktok: true }));
    setMessage({ text: null, type: null });
    
    try {
      const result = await tiktok.TikTokLogin();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const authWindow = result.authWindow;
      
      // Monitor the popup for redirect back to our domain
      const checkRedirect = setInterval(() => {
        try {
          if (authWindow.closed) {
            clearInterval(checkRedirect);
            setIsLoading(prev => ({ ...prev, tiktok: false }));
            return;
          }
          
          const currentUrl = authWindow.location.href;
          
          if (currentUrl.includes('/social-accounts')) {
            clearInterval(checkRedirect);
            
            const urlParams = new URLSearchParams(authWindow.location.search);
            const tiktokSuccess = urlParams.get('tiktok_success');
            const tiktokError = urlParams.get('tiktok_error');
            const tiktokUser = urlParams.get('tiktok_user');
            const errorMessage = urlParams.get('error_message');
            
            authWindow.close();
            handleTikTokResult(tiktokSuccess, tiktokError, tiktokUser, errorMessage);
          }
        } catch (e) {
          // Ignore cross-origin errors during auth flow
        }
      }, 500);
      
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
      setIsLoading(prev => ({ ...prev, tiktok: false }));
    }
  };
  
  const handleTikTokResult = async (tiktokSuccess, tiktokError, tiktokUser, errorMessage) => {
    try {
      // Check for errors from backend redirect
      if (tiktokError) {
        const errorMsg = errorMessage || tiktokError;
        setMessage({ text: `TikTok authentication failed: ${errorMsg}`, type: 'error' });
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        localStorage.removeItem('tiktokAuthPending');
        localStorage.removeItem('tiktokAuthState');
        return;
      }
      
      // Check for success
      if (tiktokSuccess === 'true') {
        // Set standardized success message
        setMessage({ text: `TikTok account connected! Welcome ${tiktokUser || 'User'}!`, type: 'success' });
        
        // Refresh social accounts data
        await getSocialAccounts();
        
        // Force page reload to update state
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ text: 'TikTok authentication failed: Unknown error', type: 'error' });
      }
      
    } catch (error) {
      setMessage({ text: `TikTok authentication error: ${error.message}`, type: 'error' });
      console.error('TikTok authentication error:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, tiktok: false }));
      localStorage.removeItem('tiktokAuthPending');
      localStorage.removeItem('tiktokAuthState');
    }
  };

  useEffect(() => {
    // Clear message after timeout based on type
    if (message.text) {
      const timeout = message.type === 'error' ? 10000 : 5000;
      const timer = setTimeout(() => {
        setMessage({ text: null, type: null });
      }, timeout);
      
      // Clean up timer when component unmounts or message changes
      return () => clearTimeout(timer);
    }
  }, [message]);
  


  // Effect to check for YouTube authentication in URL parameters
  useEffect(() => {
    const checkYoutubeCallback = () => {  
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const error_description = urlParams.get('error_description');

      if ((code || error) && localStorage.getItem('youtubeAuthPending') === 'true') {
        handleYoutubeCallback(code, state, error, error_description);
      }
    };

    checkYoutubeCallback();
  }, []);

 
 
  useEffect(() => {
    if (location.state?.selectedPlatform) {
      const platform = location.state.selectedPlatform;
      

      const hasAccounts = {
        facebook: socialData?.facebook?.pages?.length > 0,
        instagram: socialData?.instagram?.accounts?.length > 0,
        linkedin: socialData?.linkedin?.accounts?.length > 0,
        youtube: socialData?.youtube?.channels?.length > 0,
        tiktok: socialData?.tiktok?.accounts?.length > 0,
      };

      if (hasAccounts[platform]) {
        setAccountBadge(prev => ({ ...prev, [platform]: true }));
      } else {
        setConnectBadge(prev => ({ ...prev, [platform]: true }));
      }
      
      // Clear the navigation state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, socialData]);

  useEffect(() => {
    const handleAuthMessage = async (event) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        // Handle YouTube auth success
        setIsLoading(prev => ({ ...prev, youtube: false }));
        setMessage({ text: "YouTube account connected!", type: 'success' });
        
        // Refresh social accounts data
        await getSocialAccounts();
        
        // Optional: Still do a delayed reload as backup
        setTimeout(() => window.location.reload(), 2000);
      } else if (event.data?.type === 'YOUTUBE_AUTH_ERROR') {
        // Handle YouTube auth error
        setIsLoading(prev => ({ ...prev, youtube: false }));
        setMessage({ text: `YouTube authentication failed: ${event.data.error}`, type: 'error' });
      } else if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        // Handle TikTok auth success
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        setMessage({ text: `TikTok account connected! Welcome ${event.data.user_name || 'User'}!`, type: 'success' });
        
        // Refresh social accounts data
        await getSocialAccounts();
        
        // Reload to update state
        setTimeout(() => window.location.reload(), 2000);
      } else if (event.data?.type === 'TIKTOK_AUTH_ERROR') {
        // Handle TikTok auth error
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        setMessage({ text: `TikTok authentication failed: ${event.data.error}`, type: 'error' });
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);





  



  // Generic function to show platform info
  const showPlatformInfo = (platform) => {
    const config = platformConfig[platform];
    if (!config.hasAccounts()) {
      setConnectBadge(prev => ({ ...prev, [platform]: true }));
    } else {
      setAccountBadge(prev => ({ ...prev, [platform]: true }));
    }
  };

  // Close badges
  const closeConnectBadge = (platform) => {
    setConnectBadge(prev => ({ ...prev, [platform]: false }));
  };

  const closeAccountBadge = (platform) => {
    setAccountBadge(prev => ({ ...prev, [platform]: false }));
  };

  const handleConnectAnother = (platform) => {
    closeAccountBadge(platform);
    setTimeout(() => {
      setConnectBadge(prev => ({ ...prev, [platform]: true }));
    }, 0);
  };
  


  const handlePlatformDisconnect = async (platform, accountId) => {
    const loadingKey = `${platform}Accounts`;
    
    setIsLoading(prev => ({ 
      ...prev, 
      [loadingKey]: { ...(prev[loadingKey] || {}), [accountId]: true } 
    }));
    
    const response = await api.PlatformDisconnect(platform, accountId);
    
    if (!response.ok) {
      setMessage({ text: response.data?.error || 'Failed to disconnect account', type: 'error' });
      setIsLoading(prev => ({ 
        ...prev, 
        [loadingKey]: { ...(prev[loadingKey] || {}), [accountId]: false } 
      }));
      return;
    }
    
    await getSocialAccounts();
    
  };

  const platformConfig = {
    facebook: {
      icon: FacebookIcon,
      name: t('FacebookAuth.facebook'),
      description: t('FacebookAuth.postToYourFacebookPage'),
      hasAccounts: () => socialData?.facebook?.accounts?.length > 0,
      getAccounts: () => socialData?.facebook?.accounts,
      getLoadingStates: () => isLoading.facebookAccounts,
      handleLogin: handleFacebookLogin,
      handleDisconnect: (accountId) => handlePlatformDisconnect('facebook', accountId)
    },
    instagram: {
      icon: InstagramIcon,
      name: t('FacebookAuth.instagram'),
      description: t('FacebookAuth.postToYourInstagramBusinessOrCreatorAccount'),
      hasAccounts: () => socialData?.instagram?.accounts?.length > 0,
      getAccounts: () => socialData?.instagram?.accounts,
      getLoadingStates: () => isLoading.instagramAccounts,
      handleLogin: handleInstagramLogin,
      handleDisconnect: (accountId) => handlePlatformDisconnect('instagram', accountId)
    },
    tiktok: {
      icon: TikTokIcon,
      name: t('FacebookAuth.tiktokAccount'),
      description: t('FacebookAuth.postToYourTikTokAccount'),
      hasAccounts: () => socialData?.tiktok?.accounts?.length > 0,
      getAccounts: () => socialData?.tiktok?.accounts,
      getLoadingStates: () => isLoading.tiktokAccounts,
      handleLogin: handleTikTokLogin,
      handleDisconnect: (accountId) => handlePlatformDisconnect('tiktok', accountId)
    },
    linkedin: {
      icon: LinkedinIcon,
      name: t('FacebookAuth.linkedin'),
      description: t('FacebookAuth.postToYourLinkedInAccount'),
      hasAccounts: () => socialData?.linkedin?.accounts?.length > 0,
      getAccounts: () => socialData?.linkedin?.accounts,
      getLoadingStates: () => isLoading.linkedinAccounts,
      handleLogin: handleLinkedinLogin,
      handleDisconnect: (accountId) => handlePlatformDisconnect('linkedin', accountId)
    },
    youtube: {
      icon: YouTubeIcon,
      name: t('FacebookAuth.youtube'),
      description: t('FacebookAuth.postToYourYouTubeChannel'),
      hasAccounts: () => socialData?.youtube?.accounts?.length > 0,
      getAccounts: () => socialData?.youtube?.accounts,
      getLoadingStates: () => isLoading.youtubeAccounts,
      handleLogin: handleYouTubeLogin,
      handleDisconnect: (accountId) => handlePlatformDisconnect('youtube', accountId)
    }
  };

  if (isLoading.all) {
    return <div className="w-full h-full bg-primary py-4">
      <Header title={"Integrations"}/>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 bg-primary">
      {Array.from({ length: 5 }).map((_, index) => (
    <div className="w-full max-w-48 aspect-square mx-auto bg-gray-200/80 rounded-lg shadow-sm p-3.5 flex flex-col animate-pulse">
        </div>
      ))}
      </div>
    </div>;
  }

  return (
    <div className="w-full h-full bg-primary py-4">
      <Header title={"Integrations"}/>
      
      {message.text && (
        <div className={`w-100px mb-6 p-4 rounded-lg border-l-4 ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700 border-red-500' 
            : 'bg-green-50 text-green-700 border-green-500'
        } ${message.type === 'success' ? 'flex items-center' : ''}`}>
          {message.type === 'success' && <IoCheckmarkCircleOutline className="mr-2 h-5 w-5" />}
          {message.text}
        </div>
      )}
      
      <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 bg-primary">
        {PLATFORMS.map((platformKey) => (
          <PlatformCard
            key={platformKey}
            platform={platformConfig[platformKey]}
            isLoading={isLoading[platformKey]}
            onClick={() => showPlatformInfo(platformKey)}
          />
        ))}
      </div>
          
      
      {/* Render ConnectBadge for all platforms */}
      {PLATFORMS.map((platformKey) => 
        connectBadge[platformKey] && (
          <ConnectBadge
            key={`connect-${platformKey}`}
            platform={platformKey}
            onClose={() => closeConnectBadge(platformKey)}
            onConnect={platformConfig[platformKey].handleLogin}
          />
        )
      )}

      {/* Render AccountBadge for all platforms */}
      {PLATFORMS.map((platformKey) => 
        accountBadge[platformKey] && (
          <AccountBadge
            key={`account-${platformKey}`}
            platform={platformKey}
            accounts={platformConfig[platformKey].getAccounts()}
            isLoading={platformConfig[platformKey].getLoadingStates()}
            onClose={() => closeAccountBadge(platformKey)}
            onDisconnect={platformConfig[platformKey].handleDisconnect}
            onConnectAnother={() => handleConnectAnother(platformKey)}
          />
        )
      )}
    </div>
  );
};

export default SocialMediaAuth;
