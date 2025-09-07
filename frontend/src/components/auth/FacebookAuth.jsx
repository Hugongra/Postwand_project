import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import { IoWarningOutline } from "react-icons/io5";
import { IoPersonAddOutline } from "react-icons/io5";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { useTranslation } from 'react-i18next';

const FB_APP_ID = import.meta.env.VITE_FB_APP_ID
const INSTAGRAM_BUSINESS_APP_ID = import.meta.env.VITE_INSTAGRAM_BUSINESS_APP_ID
const INSTAGRAM_BUSINESS_REDIRECT_URI = import.meta.env.VITE_INSTAGRAM_BUSINESS_REDIRECT_URI
const LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI
const LINKEDIN_APP_ID = import.meta.env.VITE_LINKEDIN_APP_ID

const TIKTOK_APP_ID = import.meta.env.VITE_TIKTOK_APP_ID || "your_tiktok_app_id";
const TIKTOK_REDIRECT_URI = import.meta.env.VITE_TIKTOK_REDIRECT_URI || "https://app.postwand.io/api/auth/tiktok/callback";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || "https://app.postwand.io/api/auth/youtube";

const SocialMediaAuth = ({ onAuth, facebookPages, instagramAccounts, threadsAccounts, linkedinAccounts, youtubeChannels, tiktokAccounts}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState({
    facebook: false,
    instagram: false,
    threads: false,
    instagramBusiness: false,
    tiktok: false,
    linkedin: false,
    youtube: false,

    facebookAccounts: {},
    instagramAccounts: {},
    tiktokAccounts: {},
    linkedinAccounts: {},
    youtubeAccounts: {}
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  

  const [showInfoBadge, setShowInfoBadge] = useState({
    facebook: false,
    instagram: false,
    threads: false,
    instagramBusiness: false,
    tiktok: false,
    linkedin: false,
    youtube: false  
  });

  const [showInfoBadgeConnectAnotherPage, setShowInfoBadgeConnectAnotherPage] = useState({
    facebook: false,
    instagram: false,
    threads: false,
    instagramBusiness: false,
    tiktok: false,
    linkedin: false,
    youtube: false
  });

  

  useEffect(() => {
    const loadFacebookSDK = () => {
      if (window.FB) return;

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v22.0'
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();

    const checkThreadsCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const error_description = urlParams.get('error_description');
      
      // If we have Threads callback parameters
      if ((code || error) && localStorage.getItem('threadsAuthPending') === 'true') {
        // Handle authentication completion
        handleThreadsCallback(code, state, error, error_description);
      }
    };
    
    checkThreadsCallback();



  }, []);

  // Handle auto-opening platform modals from Home navigation
  useEffect(() => {
    if (location.state?.selectedPlatform) {
      const platform = location.state.selectedPlatform;
      
      // Check if we have existing accounts for the platform
      const hasAccounts = {
        facebook: facebookPages.length > 0,
        instagram: instagramAccounts.length > 0,
        linkedin: linkedinAccounts.length > 0,
        youtube: youtubeChannels?.length > 0,
        tiktok: tiktokAccounts?.length > 0,
        threads: threadsAccounts?.length > 0
      };

      if (hasAccounts[platform]) {
        // Show connected accounts modal
        setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, [platform]: true }));
      } else {
        // Show connect new account modal
        setShowInfoBadge(prev => ({ ...prev, [platform]: true }));
      }
      
      // Clear the navigation state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, facebookPages, instagramAccounts, linkedinAccounts, youtubeChannels, tiktokAccounts, threadsAccounts]);

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data === 'threads_auth_success') {
    
        onAuth('threads', { connected: true });

        setIsLoading(prev => ({ ...prev, threads: false }));
  
        setError(null);

        setSuccessMessage("Accounts connected!");
      } else if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        // Handle YouTube auth success
        setIsLoading(prev => ({ ...prev, youtube: false }));
        setError(null);
        setSuccessMessage("YouTube account connected!");
        
        // Notify parent component to refresh auth status
        onAuth('youtube', { connected: true });
        
        // Optional: Still do a delayed reload as backup
        setTimeout(() => window.location.reload(), 2000);
      } else if (event.data?.type === 'YOUTUBE_AUTH_ERROR') {
        // Handle YouTube auth error
        setIsLoading(prev => ({ ...prev, youtube: false }));
        setError(`YouTube authentication failed: ${event.data.error}`);
      } else if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        // Handle TikTok auth success
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        setError(null);
        setSuccessMessage(`TikTok account connected! Welcome ${event.data.user_name || 'User'}!`);
        
        // Notify parent component to refresh auth status
        onAuth('tiktok', { connected: true });
        
        // Reload to update parent state
        setTimeout(() => window.location.reload(), 2000);
      } else if (event.data?.type === 'TIKTOK_AUTH_ERROR') {
        // Handle TikTok auth error
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        setError(`TikTok authentication failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [onAuth]);

  const handleThreadsCallback = async (code, state, error, error_description) => {
    try {
  
      if (error) {
        setError(`Threads authentication failed: ${error_description || error}`);
        localStorage.removeItem('threadsAuthPending');
        localStorage.removeItem('threadsAuthState');
        return;
      }
      

      const savedState = localStorage.getItem('threadsAuthState');
      if (state !== savedState) {
        setError('Threads security verification failed');
        localStorage.removeItem('threadsAuthPending');
        localStorage.removeItem('threadsAuthState');
        return;
      }
      
      // Exchange code for token via backend
      const response = await fetch(`${THREADS_REDIRECT_URI}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with Threads');
      }
      
      // Set standardized success message
      setSuccessMessage("Accounts connected!");
      
      // Notify parent component
      onAuth('threads', { connected: true });
      
      // Force page reload to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
      // Clean browser history to remove auth parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError(error.message);
      console.error('Threads authentication error:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, threads: false }));
      localStorage.removeItem('threadsAuthPending');
      localStorage.removeItem('threadsAuthState');
    }
  };

  const handleLinkedinCallback = async (code, state, error, error_description) => {
    try {
      // Check for errors from OAuth redirect
      if (error) {
        setError(`LinkedIn authentication failed: ${error_description || error}`);
        localStorage.removeItem('linkedinAuthPending');
        localStorage.removeItem('linkedinAuthState');
        setIsLoading(prev => ({ ...prev, linkedin: false }));
        return;
      }
      
      // Verify state to prevent CSRF
      const savedState = localStorage.getItem('linkedinAuthState');
      if (state !== savedState) {
        setError('LinkedIn security verification failed');
        localStorage.removeItem('linkedinAuthPending');
        localStorage.removeItem('linkedinAuthState');
        setIsLoading(prev => ({ ...prev, linkedin: false }));
        return;
      }
      
      // Use the correct API endpoint for code exchange
      const apiEndpoint = 'https://app.postwand.io/api/auth/linkedin';
   
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with LinkedIn');
      }
      
      // Extract user profile from response
      const userProfile = data.data?.profile || {};
      
      // Set standardized success message
      setSuccessMessage("LinkedIn account connected!");
      
      // Notify parent component
      onAuth('linkedin', { 
        connected: true,
        profile: userProfile,
        access_token: data.data?.access_token
      });
      
      // Force page reload to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
      // Clean browser history to remove auth parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError(error.message);
      console.error('LinkedIn authentication error:', error);
    } finally {
      // Ensure the loading state is always reset
      setIsLoading(prev => ({ ...prev, linkedin: false }));
      localStorage.removeItem('linkedinAuthPending');
      localStorage.removeItem('linkedinAuthState');
    }
  };

  const handleYoutubeCallback = async (code, state, error, error_description) => {
    try {
      // Check for errors from OAuth redirect
      if (error) {
        setError(`YouTube authentication failed: ${error_description || error}`);
        localStorage.removeItem('youtubeAuthPending');
        localStorage.removeItem('youtubeAuthState');
        setIsLoading(prev => ({ ...prev, youtube: false }));
        return;
      }
      
      // Verify state to prevent CSRF
      const savedState = localStorage.getItem('youtubeAuthState');
      if (state !== savedState) {
        setError('YouTube security verification failed');
        localStorage.removeItem('youtubeAuthPending');
        localStorage.removeItem('youtubeAuthState');
        setIsLoading(prev => ({ ...prev, youtube: false }));
        return;
      }
      
      // Exchange code for tokens via backend
      const response = await fetch('https://app.postwand.io/api/auth/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          code: code,
          redirectUri: YOUTUBE_REDIRECT_URI
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with YouTube');
      }
      
      // Set standardized success message
      setSuccessMessage("YouTube account connected!");
      
      // Notify parent component
      onAuth('youtube', { 
        connected: true,
        channels: data.data?.channels || [],
        access_token: data.data?.access_token
      });
      
      // Force page reload to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
      // Clean browser history to remove auth parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError(error.message);
      console.error('YouTube authentication error:', error);
    } finally {
      // Ensure the loading state is always reset
      setIsLoading(prev => ({ ...prev, youtube: false }));
      localStorage.removeItem('youtubeAuthPending');
      localStorage.removeItem('youtubeAuthState');
    }
  };

  useEffect(() => {
    // Clear error message after 10 seconds
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      
      // Clean up timer when component unmounts or error changes
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Add similar effect for success messages
  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Clean up timer when component unmounts or success message changes
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
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

  // Facebook authentication
  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded');
      return;
    }

    setIsLoading(prev => ({ ...prev, facebook: true }));
    setError(null);

    window.FB.login(function(response) {
      (async () => {
        if (response.authResponse) {
          try {
            // Send token to backend for processing
            console.log("DEBUG: About to call Facebook auth endpoint:", "https://app.postwand.io/api/auth/facebook");
            const backendResponse = await fetch(`https://app.postwand.io/api/auth/facebook`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                accessToken: response.authResponse.accessToken
              })
            });

            const data = await backendResponse.json();
            
            if (!backendResponse.ok) {
              throw new Error(data.error || 'Failed to authenticate with Facebook');
            }

            // Update connected accounts with pages from response
            if (data.success) {
              // Use standardized success message
              setSuccessMessage("Accounts connected!");
              
              // Notify parent component
              onAuth('facebook', {
                accessToken: response.authResponse.accessToken,
                pages: data.data?.pages || []
              });
              
              // Force page reload to update parent state
              setTimeout(() => window.location.reload(), 1000);
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(prev => ({ ...prev, facebook: false }));
          }
        } else {
          setError('Facebook login failed');
          setIsLoading(prev => ({ ...prev, facebook: false }));
        }
      })();
    }, {
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts, business_management',
      auth_type: 'rerequest',
      locale: 'en_US'
    });
  };

  // Instagram authentication
  const handleInstagramLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded');
      return;
    }

    setIsLoading(prev => ({ ...prev, instagram: true }));
    setError(null);

    window.FB.login(function(response) {
      (async () => {
        if (response.authResponse) {
          try {
            // Send token to backend for processing
              const backendResponse = await fetch(`https://app.postwand.io/api/auth/instagram`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                accessToken: response.authResponse.accessToken
              })
            });

            const data = await backendResponse.json();
            
            if (!backendResponse.ok) {
              throw new Error(data.error || 'Failed to authenticate with Instagram');
            }

            // Update connected accounts with accounts from response
            if (data.success) {
              // Use standardized success message
              setSuccessMessage("Accounts connected!");

              // Notify parent component
              onAuth('instagram', {
                accessToken: response.authResponse.accessToken,
                accounts: data.data?.accounts || []
              });
              
              // Force page reload to update parent state
              setTimeout(() => window.location.reload(), 1000);
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(prev => ({ ...prev, instagram: false }));
          }
        } else {
          setError('Instagram login failed');
          setIsLoading(prev => ({ ...prev, instagram: false }));
        }
      })();
    }, {
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,instagram_manage_insights,pages_read_engagement, business_management',
      auth_type: 'rerequest',
      locale: 'en_US'
    }); 
  };
       

  // Threads authentication
  const handleThreadsLogin = () => {
      // Reset state and clear previous auth data
      setIsLoading(prev => ({ ...prev, threads: true }));
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('threadsAuthPending');
      localStorage.removeItem('threadsAuthState');
      
      // Clean URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in localStorage to verify when we return
      localStorage.setItem('threadsAuthState', state);
      localStorage.setItem('threadsAuthPending', 'true');
      
      // Construct the authorization URL with proper parameters
        const REDIRECT_URI = encodeURIComponent(THREADS_REDIRECT_URI);
      const SCOPES = encodeURIComponent("threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies");
      
      const authUrl = `https://www.threads.net/oauth/authorize?` +
        `client_id=${THREADS_APP_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `scope=${SCOPES}&` +
        `response_type=code&` +
        `state=${state}`;
      
      // Open the authorization window
      window.open(authUrl, 'authWindow', 'width=600,height=700');
    };

    const handleLinkedinLogin = () => {
      setIsLoading(prev => ({ ...prev, linkedin: true }));
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('linkedinAuthPending');
      localStorage.removeItem('linkedinAuthState');
      
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in localStorage to verify when we return
      localStorage.setItem('linkedinAuthState', state);
      localStorage.setItem('linkedinAuthPending', 'true');

      const REDIRECT_URI = encodeURIComponent(LINKEDIN_REDIRECT_URI);
      // Remove r_emailaddress scope which is causing unauthorized_scope_error
      const SCOPES = encodeURIComponent("openid profile email w_member_social");
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_APP_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `scope=${SCOPES}&` +
        `state=${state}`;

      const authWindow = window.open(authUrl, 'authWindow', 'width=600,height=700');
      
      // Add an interval to check if the window was closed without completing auth
      const checkClosed = setInterval(() => {
        if (authWindow && authWindow.closed) {
          clearInterval(checkClosed);
          // Reset loading state if window was closed without completing auth
          setIsLoading(prev => ({ ...prev, linkedin: false }));
          localStorage.removeItem('linkedinAuthPending');
          localStorage.removeItem('linkedinAuthState');
        }
      }, 1000);
    }

    // YouTube authentication
    const handleYouTubeLogin = () => {
      setIsLoading(prev => ({ ...prev, youtube: true }));
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('youtubeAuthPending');
      localStorage.removeItem('youtubeAuthState');
      
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in localStorage to verify when we return
      localStorage.setItem('youtubeAuthState', state);
      localStorage.setItem('youtubeAuthPending', 'true');

      const REDIRECT_URI = encodeURIComponent(YOUTUBE_REDIRECT_URI);
      const SCOPES = encodeURIComponent("https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=code&` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `scope=${SCOPES}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

      const authWindow = window.open(authUrl, 'youtubeAuthWindow', 'width=600,height=700');
      
      // Add an interval to check if the window was closed without completing auth
      const checkClosed = setInterval(() => {
        if (authWindow && authWindow.closed) {
          clearInterval(checkClosed);
          // Reset loading state if window was closed without completing auth
          setIsLoading(prev => ({ ...prev, youtube: false }));
          localStorage.removeItem('youtubeAuthPending');
          localStorage.removeItem('youtubeAuthState');
        }
      }, 1000);
    }



  // Show info badge or connected accounts dialog
  const showFacebookInfo = () => {
    if(facebookPages.length === 0) {
      setShowInfoBadge(prev => ({ ...prev, facebook: true }));
    } else {
      setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, facebook: true }));
    }
  };

  const showInstagramInfo = () => {
    if(instagramAccounts.length === 0) {
      setShowInfoBadge(prev => ({ ...prev, instagram: true }));
    } else {
      setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, instagram: true }));
    }
  };

  const showTikTokInfo = () => {
    if(tiktokAccounts?.length === 0) {
      setShowInfoBadge(prev => ({ ...prev, tiktok: true }));
    } else {
      setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, tiktok: true }));
    }
  };

  const showLinkedinInfo = () => {
    if(linkedinAccounts.length === 0) {
      setShowInfoBadge(prev => ({ ...prev, linkedin: true }));
    } else {
      setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, linkedin: true }));
    }
  };

  const showYoutubeInfo = () => {
    if(youtubeChannels?.length === 0) {
      setShowInfoBadge(prev => ({ ...prev, youtube: true }));
    } else {
      setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, youtube: true }));
    }
  };

  // Close info badge
  const closeInfoBadge = (platform) => {
    setShowInfoBadge(prev => ({ ...prev, [platform]: false }));
  };

  const closeInfoBadgeConnectAnotherPage = (platform) => {
    setShowInfoBadgeConnectAnotherPage(prev => ({ ...prev, [platform]: false }));
  };
  

  // Update this existing useEffect to make sure it's correctly detecting the code
  useEffect(() => {
    const checkInstagramBusinessCallback = () => {
   
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
 
      
      // If we have Instagram Business callback parameters
      if (code && localStorage.getItem('instagramBusinessAuthPending') === 'true') {
       
        // Handle authentication completion
        handleInstagramBusinessCallback(code, state);
      }
    };
    
    checkInstagramBusinessCallback();
  }, []);

  // Add Instagram Business callback handler
  const handleInstagramBusinessCallback = async (code, state) => {
    try {
      // Verify state to prevent CSRF
      const savedState = localStorage.getItem('instagramBusinessAuthState');
      if (state !== savedState) {
        setError('Instagram Business security verification failed');
        localStorage.removeItem('instagramBusinessAuthPending');
        localStorage.removeItem('instagramBusinessAuthState');
        return;
      }
      
      // Exchange code for token via backend
      const response = await fetch(`https://app.postwand.io/api/auth/instagram-business/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with Instagram Business');
      }
      
      // Set standardized success message
      setSuccessMessage("Accounts connected!");
      
      // Notify parent component
      onAuth('instagramBusiness', { 
        connected: true,
        accounts: data.data?.accounts || [] 
      });
      
      // Force page reload to update parent state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setError(error.message);
      console.error('Instagram Business authentication error:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, instagramBusiness: false }));
      localStorage.removeItem('instagramBusinessAuthPending');
      localStorage.removeItem('instagramBusinessAuthState');
    }
  };

  // Add Instagram Business login handler
  const handleInstagramBusinessLogin = () => {
    // Reset state and clear previous auth data
    setIsLoading(prev => ({ ...prev, instagramBusiness: true }));
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('instagramBusinessAuthPending');
    localStorage.removeItem('instagramBusinessAuthState');
    
    // Clean URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage to verify when we return
    localStorage.setItem('instagramBusinessAuthState', state);
    localStorage.setItem('instagramBusinessAuthPending', 'true');
    
    // Construct the authorization URL with proper parameters
    const REDIRECT_URI = encodeURIComponent(INSTAGRAM_BUSINESS_REDIRECT_URI);
    const SCOPES = encodeURIComponent("instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights");
    
    const authUrl = `https://www.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_BUSINESS_APP_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=${SCOPES}&` +
      `state=${state}&` +
      `force_authentication=1`;
    
    
    
    // Open the authorization window
    const authWindow = window.open(authUrl, 'instagramAuthWindow', 'width=600,height=700');
    
    // Add an interval to check for the redirect and code
    const checkRedirect = setInterval(() => {
      try {
        // If we can't access the window location, it means it's on a different domain (during auth)
        // This will throw an error, which we can safely ignore
        if (authWindow.closed) {
          clearInterval(checkRedirect);
          setIsLoading(prev => ({ ...prev, instagramBusiness: false }));
          return;
        }
        
        // Try to access the URL - this will succeed after redirect back to our domain
        const currentUrl = authWindow.location.href;
        
        // Check if we've been redirected back to our redirect URI
        if (currentUrl.startsWith(INSTAGRAM_BUSINESS_REDIRECT_URI)) {
          clearInterval(checkRedirect);
          
          // Extract the code and state from the URL
          const urlParams = new URLSearchParams(authWindow.location.search);
          const code = urlParams.get('code');
          const returnedState = urlParams.get('state');
          const error = urlParams.get('error');
          
         
          
          // Close the popup window
          authWindow.close();
          
          // Process the authorization response
          if (code) {
            handleInstagramBusinessCallback(code, returnedState);
          } else if (error) {
            setError(`Instagram Business authentication failed: ${error}`);
            setIsLoading(prev => ({ ...prev, instagramBusiness: false }));
          }
        }
      } catch (e) {
        // Ignore cross-origin errors - this is expected during the auth flow
        // when the user is on the Instagram domain
      }
    }, 500);
  };

  // Add function to show Instagram Business info badge
  const showInstagramBusinessInfo = () => {
    setShowInfoBadge(prev => ({ ...prev, instagramBusiness: true }));
  };

  // Add these functions to handle disconnecting accounts
  const handleFacebookDisconnect = async (accountId) => {
    try {
      // Set loading state only for the specific account being disconnected
      const loadingAccountId = accountId;
      setIsLoading(prev => ({ 
        ...prev, 
        facebookAccounts: { ...(prev.facebookAccounts || {}), [loadingAccountId]: true } 
      }));
      
      const response = await fetch('https://app.postwand.io/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'facebook',
          account_id: accountId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Facebook account');
      }
      
      // Update the parent component's state through onAuth callback
      onAuth('facebook', { disconnected: accountId });
      
      // Set success message
      setSuccessMessage("Facebook account disconnected successfully!");
      
      // Reload page to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      // Clear loading state for the specific account
      setIsLoading(prev => ({ 
        ...prev, 
        facebookAccounts: { ...(prev.facebookAccounts || {}), [accountId]: false } 
      }));
    }
  };

  const handleInstagramDisconnect = async (accountId) => {
    try {
      // Set loading state only for the specific account being disconnected
      const loadingAccountId = accountId;
      setIsLoading(prev => ({ 
        ...prev, 
        instagramAccounts: { ...(prev.instagramAccounts || {}), [loadingAccountId]: true } 
      }));
      
      const response = await fetch('https://app.postwand.io/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'instagram',
          account_id: accountId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Instagram account');
      }
      
      // Update the parent component's state through onAuth callback
      onAuth('instagram', { disconnected: accountId });
      
      // Set success message
      setSuccessMessage("Instagram account disconnected successfully!");
      
      // Reload page to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      // Clear loading state for the specific account
      setIsLoading(prev => ({ 
        ...prev, 
        instagramAccounts: { ...(prev.instagramAccounts || {}), [accountId]: false } 
      }));
    }
  };

  // Add TikTok login handler
  const handleTikTokLogin = async () => {
    // Reset state and clear previous auth data
    setIsLoading(prev => ({ ...prev, tiktok: true }));
    setError(null);
    
    try {
      // Get TikTok auth URL from our backend - use localhost since that's where we're logged in
        const response = await fetch(`https://app.postwand.io/api/auth/tiktok`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate TikTok authentication');
      }
      
      const data = await response.json();
      
      // Store state in localStorage for verification after redirect
      localStorage.setItem('tiktokAuthState', data.state);
      localStorage.setItem('tiktokAuthPending', 'true');
      
      // Open the authorization window
      const authWindow = window.open(data.auth_url, 'tiktokAuthWindow', 'width=600,height=700');
      
      // Add an interval to check for the redirect and code
      const checkRedirect = setInterval(() => {
        try {
          // If we can't access the window location, it means it's on a different domain (during auth)
          // This will throw an error, which we can safely ignore
          if (authWindow.closed) {
            clearInterval(checkRedirect);
            setIsLoading(prev => ({ ...prev, tiktok: false }));
            return;
          }
          
          // Try to access the URL - this will succeed after redirect back to our domain
          const currentUrl = authWindow.location.href;
          
          // Check if we've been redirected back to our redirect URI
          if (currentUrl.includes('/social-accounts')) {
            clearInterval(checkRedirect);
            
            // Extract the success/error parameters from the URL
            const urlParams = new URLSearchParams(authWindow.location.search);
            const tiktokSuccess = urlParams.get('tiktok_success');
            const tiktokError = urlParams.get('tiktok_error');
            const tiktokUser = urlParams.get('tiktok_user');
            const errorMessage = urlParams.get('error_message');
            
            // Close the popup window
            authWindow.close();
            
            // Handle the result
            handleTikTokResult(tiktokSuccess, tiktokError, tiktokUser, errorMessage);
          }
        } catch (e) {
          // Ignore cross-origin errors - this is expected during the auth flow
        }
      }, 500);
      
    } catch (error) {
      setError(error.message);
      setIsLoading(prev => ({ ...prev, tiktok: false }));
    }
  };
  
  const handleTikTokResult = async (tiktokSuccess, tiktokError, tiktokUser, errorMessage) => {
    try {
      // Check for errors from backend redirect
      if (tiktokError) {
        const errorMsg = errorMessage || tiktokError;
        setError(`TikTok authentication failed: ${errorMsg}`);
        setIsLoading(prev => ({ ...prev, tiktok: false }));
        localStorage.removeItem('tiktokAuthPending');
        localStorage.removeItem('tiktokAuthState');
        return;
      }
      
      // Check for success
      if (tiktokSuccess === 'true') {
        // Set standardized success message
        setSuccessMessage(`TikTok account connected! Welcome ${tiktokUser || 'User'}!`);
        
        // Notify parent component - the backend has already saved the account
        onAuth('tiktok', { 
          connected: true,
          accounts: [{display_name: tiktokUser || 'TikTok User'}]
        });
        
        // Force page reload to update parent state
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setError('TikTok authentication failed: Unknown error');
      }
      
    } catch (error) {
      setError(`TikTok authentication error: ${error.message}`);
      console.error('TikTok authentication error:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, tiktok: false }));
      localStorage.removeItem('tiktokAuthPending');
      localStorage.removeItem('tiktokAuthState');
    }
  };

  const handleTikTokDisconnect = async (accountId) => {
    try {
      // Set loading state only for the specific account being disconnected
      const loadingAccountId = accountId;
      setIsLoading(prev => ({ 
        ...prev, 
        tiktokAccounts: { ...(prev.tiktokAccounts || {}), [loadingAccountId]: true } 
      }));
      
      const response = await fetch('https://app.postwand.io/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'tiktok',
          account_id: accountId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect TikTok account');
      }
      
      // Update the parent component's state through onAuth callback
      onAuth('tiktok', { disconnected: accountId });
      
      // Set success message
      setSuccessMessage("TikTok account disconnected successfully!");
      
      // Reload page to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      // Clear loading state for the specific account
      setIsLoading(prev => ({ 
        ...prev, 
        tiktokAccounts: { ...(prev.tiktokAccounts || {}), [accountId]: false } 
      }));
    }
  };

  const handleLinkedinDisconnect = async (accountId) => {
    try {
      // Set loading state only for the specific account being disconnected
      const loadingAccountId = accountId;
      setIsLoading(prev => ({ 
        ...prev, 
        linkedinAccounts: { ...(prev.linkedinAccounts || {}), [loadingAccountId]: true } 
      }));
      
      const response = await fetch('https://app.postwand.io/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'linkedin',
          account_id: accountId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect LinkedIn account');
      }
      
      // Update the parent component's state through onAuth callback
      onAuth('linkedin', { disconnected: accountId });
      
      // Set success message
      setSuccessMessage("LinkedIn account disconnected successfully!");
      
      // Reload page to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      // Clear loading state for the specific account
      setIsLoading(prev => ({ 
        ...prev, 
        linkedinAccounts: { ...(prev.linkedinAccounts || {}), [accountId]: false } 
      }));
    }
  };

  const handleYoutubeDisconnect = async (channelId) => {
    try {
      // Set loading state only for the specific account being disconnected
      const loadingAccountId = channelId;
      setIsLoading(prev => ({ 
        ...prev, 
        youtubeAccounts: { ...(prev.youtubeAccounts || {}), [loadingAccountId]: true } 
      }));
      
      const response = await fetch('https://app.postwand.io/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'youtube',
          account_id: channelId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect YouTube channel');
      }
      
      // Update the parent component's state through onAuth callback
      onAuth('youtube', { disconnected: channelId });
      
      // Set success message
      setSuccessMessage("YouTube channel disconnected successfully!");
      
      // Reload page to update parent state
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      // Clear loading state for the specific account
      setIsLoading(prev => ({ 
        ...prev, 
        youtubeAccounts: { ...(prev.youtubeAccounts || {}), [channelId]: false } 
      }));
    }
  };

  return (
    <div className="w-full h-full bg-primary ">
      
      
      {error && (
        <div className="w-100px mb-6 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="w-100px mb-6 p-4 bg-green-50 text-green-700 rounded-lg border-l-4 border-green-500 flex items-center">
          <IoCheckmarkCircleOutline className="mr-2 h-5 w-5" />
          {successMessage}
        </div>
      )}
      
      <div className="w-full p-4  grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3  bg-primary">
        {/* Facebook Login */}
        <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
            <img src={FacebookIcon} alt="Facebook" className="h-5 w-5 flex-shrink-0 mb-3" />
            <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.facebook')}</span>
            <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourFacebookPage')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showFacebookInfo}
              disabled={isLoading.facebook}
                className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.facebook ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.facebook ? t('FacebookAuth.connecting') : facebookPages.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
            
          </div>
        </div>
        
        {/* Instagram Login */}
        <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
            <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 flex-shrink-0 mb-3" />
              <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.instagram')}</span>
              <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourInstagramBusinessOrCreatorAccount')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showInstagramInfo}
              disabled={isLoading.instagram}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.instagram ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.instagram ? t('FacebookAuth.connecting') : instagramAccounts.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
           
          </div>
        </div>
        
        {/* Threads Login */}
            <div className="hidden w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
            <img src={ThreadsIcon} alt="Threads" className="h-5 w-5 flex-shrink-0 mb-3" />
                  <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.threads')}</span>
              <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourThreadsAccount')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={handleThreadsLogin}
              disabled={isLoading.threads}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.threads ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.threads ? t('FacebookAuth.connecting') : threadsAccounts.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
          
          </div>
        </div>

        {/* LinkedIn Login */}
          <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
            <img src={LinkedinIcon} alt="LinkedIn" className="h-5 w-5 flex-shrink-0 mb-3" />
                  <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.linkedin')}</span>
              <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourLinkedInAccount')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showLinkedinInfo}
              disabled={isLoading.linkedin}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.linkedin ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.linkedin ? t('FacebookAuth.connecting') : linkedinAccounts.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
          
          </div>
        </div>

        {/* YouTube Login */}
        <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
            <img src={YouTubeIcon} alt="YouTube" className="h-5 w-5 flex-shrink-0 mb-3" />
            <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.youtube')}</span>
            <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourYouTubeChannel')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showYoutubeInfo}
              disabled={isLoading.youtube}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.youtube ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.youtube ? t('FacebookAuth.connecting') : youtubeChannels?.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
          </div>
        </div>
        
        {/* Instagram Business Login - New component */}
        <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col hidden">
          <div>
              <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 flex-shrink-0 mb-3" />
              <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.instagramAccount')}</span>
            <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourInstagramBusinessOrCreatorAccount')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showInstagramBusinessInfo}
              disabled={isLoading.instagramBusiness}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.instagramBusiness ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.instagramBusiness ? t('FacebookAuth.connecting') : instagramAccounts.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
          
          </div>
          
        </div>

        {/* TikTok Login - New component */}
      <div className="w-full max-w-48 h-48 mx-auto bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div>
              <img src={TikTokIcon} alt="TikTok" className="h-5 w-5 flex-shrink-0 mb-3" />
              <span className="font-semibold text-lg text-gray-700">{t('FacebookAuth.tiktokAccount')}</span>
            <p className="text-[14px] text-gray-700">
              {t('FacebookAuth.postToYourTikTokAccount')}
            </p>
          </div>
          
          <div className="mt-auto">
            <button 
              type="button"
              onClick={showTikTokInfo}
              disabled={isLoading.tiktok}
              className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                isLoading.tiktok ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
              }`}
            >
              {isLoading.tiktok ? t('FacebookAuth.connecting') : tiktokAccounts?.length > 0 ? t('FacebookAuth.myAccounts') : t('FacebookAuth.connect')}
            </button>
            {/* TikTok accounts will be displayed here when implemented */}
          </div>
        </div>
    
      </div>

      


      
      {/* Facebook Info Badge */}
      {showInfoBadge.facebook  && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-center mb-4">
              <img src={FacebookIcon} alt="Facebook" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToFacebookPage')}</h3>
              <button 
                onClick={() => closeInfoBadge('facebook')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
            
          
            <h4 className="font-medium mb-2 flex items-center">
              <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
            </h4>
              
              <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                <li>{t('FacebookAuth.youCanOnlyConnectToAFacebookPageAndNotAPersonalProfile')}</li>
                <li>{t('FacebookAuth.aFacebookTabWillOpenWhereYouCanAuthorizeAccessToYourFacebookPage')}</li>
                <li>{t('FacebookAuth.weOnlyRequestAccessToDataNeededToHelpYouManageYourContentAndInsights')}</li>
                <li>{t('FacebookAuth.afterConnectingYouWillBeAbleToPostAndManageYourFacebookPage')}</li>
              </ul>
             
            </div>
            
             
        
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  closeInfoBadge('facebook');
                  handleFacebookLogin();
                }}
                className="px-4 py-2 bg-[#1877F2] text-white font-medium rounded-lg hover:bg-[#0e6fea] transition-colors"
              >
                {t('FacebookAuth.connectToFacebook')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoBadgeConnectAnotherPage.facebook && (
       <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
       <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
         <div className="flex items-center mb-4">
           <img src={FacebookIcon} alt="Facebook" className="h-5 w-5 mr-2" />
           <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectedFacebookPages')}</h3>
           <button 
             onClick={() => closeInfoBadgeConnectAnotherPage('facebook')} 
             className="ml-auto text-gray-500 hover:text-gray-700"
           >
             ✕
           </button>
         </div>

         <div className="flex flex-wrap gap-2">
           {facebookPages.map(page => (
             <div key={page.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
              <img src={page.profile_picture || '/images/no-photos.svg'} 
              alt={page.username} 
              className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
              onError={(e) => {
                e.target.src = '/images/no-photos.svg';
              }}
              />
              <p className="text-gray-700 text-md font-medium">{page.name}</p>
              <p className="text-gray-400 text-sm mt-1 truncate">ID: {page.page_id}</p>
              <div className="mt-auto">
                <button 
                  type="button"
                  onClick={() => handleFacebookDisconnect(page.page_id)}
                  disabled={isLoading.facebookAccounts?.[page.page_id]}
                  className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                    isLoading.facebookAccounts?.[page.page_id] ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                  }`}
                >
                  {isLoading.facebookAccounts?.[page.page_id] ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                </button>
              </div>
             </div>
           ))}
           <div 
           className="flex items-center justify-center bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
           onClick={() => {
             closeInfoBadgeConnectAnotherPage('facebook');
             setTimeout(() => {
               setShowInfoBadge(prev => ({ ...prev, facebook: true }));
             }, 0);
           }}
           >
            <IoPersonAddOutline className="w-6 h-6 mb-1" />
            <p className="text-gray-700 text-sm font-medium">{t('FacebookAuth.connectAnotherFacebookPage')}</p>
           
           </div>
         </div>
         
    
       </div>
     </div>
      )}
      
      {/* Instagram Info Badge */}
      {showInfoBadge.instagram && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-center mb-4">
              <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToInstagramLinkedToAFacebookPage')}</h3>
              <button 
                onClick={() => closeInfoBadge('instagram')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium mb-2 flex items-center">
              <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
            </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-800 text-sm">
                <li>{t('FacebookAuth.youCanOnlyConnectToAnInstagramBusinessOrCreatorAccountThatIsLinkedToAFacebookPage')}</li>
                <li>{t('FacebookAuth.anInstagramLoginWindowWillOpenWhereYouCanAuthorizeAccessToYourInstagramAccount')}</li>
                <li>{t('FacebookAuth.weOnlyRequestAccessToDataNeededToHelpYouManageYourContentAndInsights')}</li>
                <li>{t('FacebookAuth.afterConnectingYouWillBeAbleToPostAndManageYourInstagramAccount')}</li>
              </ul>
               
               
                <span className="text-gray-500 text-sm mt-3">{t('FacebookAuth.note')}
                  <a href="https://www.facebook.com/business/help/502981923235522" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm hover:underline"> Switch to Business<ArrowRight className="w-3 h-3 inline-block items-center" /></a>
                </span>
              
            </div>
            
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  closeInfoBadge('instagram');
                  handleInstagramLogin();
                }}
                className="px-4 py-2 bg-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('FacebookAuth.connectToInstagram')}
              </button>
            </div>
          </div>
        </div>
      )}
     { showInfoBadgeConnectAnotherPage.instagram && (
       <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
       <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
         <div className="flex items-center mb-4">
           <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 mr-2" />
           <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectedFacebookPages')}</h3>
           <button 
             onClick={() => closeInfoBadgeConnectAnotherPage('instagram')} 
             className="ml-auto text-gray-500 hover:text-gray-700"
           >
             ✕
           </button>
         </div>

         <div className="flex flex-wrap gap-2">
           {instagramAccounts.map(account => (
             <div key={account.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
              <img src={account.profile_picture || '/images/no-photos.svg'} 
              alt={account.username} 
              className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
              onError={(e) => {
                e.target.src = '/images/no-photos.svg';
              }}
              />
              <p className="text-gray-700 text-md font-medium">{account.name}</p>
              <p className="text-gray-300 text-sm mt-1 font-medium truncate">ID: {account.account_id}</p>
              <div className="mt-auto">
                <button 
                  type="button"
                  onClick={() => handleInstagramDisconnect(account.account_id)}
                  disabled={isLoading.instagramAccounts?.[account.account_id]}
                  className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                    isLoading.instagramAccounts?.[account.account_id] ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                  }`}
                >
                  {isLoading.instagramAccounts?.[account.account_id] ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                </button>
              </div>
             </div>
           ))}
           <div 
           className="flex items-center justify-center bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
           onClick={() => {
             closeInfoBadgeConnectAnotherPage('instagram');
             setTimeout(() => {
               setShowInfoBadge(prev => ({ ...prev, instagram: true }));
             }, 0);
           }}
           >
            <IoPersonAddOutline className="w-6 h-6 mb-1" />
            <p className="text-gray-700 text-sm font-medium">{t('FacebookAuth.connectAnotherInstagramAccount')}</p>
           
           </div>
         </div>
         
    
       </div>
     </div>
      )}
      {/* Instagram Business Info Badge */}
      {showInfoBadge.instagramBusiness && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-center mb-4">
                  <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToInstagramBusinessOrCreatorAccount')}</h3>
              <button 
                onClick={() => closeInfoBadge('instagramBusiness')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
              <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium mb-2 flex items-center">
              <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
            </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-800 text-sm">
                <li>{t('FacebookAuth.youAreUsingAnInstagramBusinessOrCreatorAccountThatIsNotLinkedToAFacebookPage')}</li>
                <li>{t('FacebookAuth.anInstagramLoginWindowWillOpenWhereYouCanAuthorizeAccessToYourInstagramAccount')}</li>
                <li>{t('FacebookAuth.weOnlyRequestAccessToDataNeededToManageYourContent')}</li>
                <li>{t('FacebookAuth.afterConnectingYouWillBeAbleToPostAndManageYourInstagramAccount')}</li>
              </ul>
               
                
                <span className="text-gray-500 text-sm mt-6 ">{t('FacebookAuth.note')}
                  <a href="https://www.facebook.com/business/help/502981923235522" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm hover:underline"> Switch to Business<ArrowRight className="w-3 h-3 inline-block items-center" /></a>
                </span>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('FacebookAuth.connectToInstagramBusiness')}
              </button>
            </div>
          </div>
        </div>
      )}

   
        {showInfoBadge.tiktok && (
                <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
                    <div className="flex items-center mb-4">
                      <img src={TikTokIcon} alt="TikTok" className="h-5 w-5 mr-2" />
                      <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToTikTok')}</h3>
                      <button 
                        onClick={() => closeInfoBadge('tiktok')} 
                        className="ml-auto text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium mb-2 flex items-center">
                        <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                        <li>{t('FacebookAuth.youWillBeRedirectedToTikTokToAuthorizeAccessToYourAccount')}</li>
                        <li>{t('FacebookAuth.weOnlyRequestPermissionsNeededToHelpYouManageYourContentAndSchedulePosts')}</li>
                        <li>{t('FacebookAuth.youCanRevokeAccessAtAnyTimeFromYourTikTokSettings')}</li>
                        <li>{t('FacebookAuth.afterConnectingYouWillBeAbleToPostAndManageYourTikTokContent')}</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => {
                          closeInfoBadge('tiktok');
                          handleTikTokLogin();
                        }}
                        className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
                      >
                        {t('FacebookAuth.connectToTikTok')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

      {showInfoBadgeConnectAnotherPage.tiktok && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center mb-4">  
              <img src={TikTokIcon} alt="TikTok" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectedTikTokAccounts')}</h3>
              <button 
                onClick={() => closeInfoBadgeConnectAnotherPage('tiktok')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tiktokAccounts?.map(account => (
                <div key={account.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
                  <img src={account.avatar_url || '/images/no-photos.svg'} 
                  alt={account.display_name} 
                  className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
                  onError={(e) => {
                    e.target.src = '/images/no-photos.svg';
                  }}
                  />
                  <p className="text-gray-700 text-md font-medium">{account.display_name}</p>
                  <p className="text-gray-400 text-sm mt-1 truncate">ID: {account.tiktok_id}</p>
                  <div className="mt-auto">
                    <button 
                      type="button"
                      onClick={() => handleTikTokDisconnect(account.tiktok_id)}
                        disabled={isLoading.tiktokAccounts?.[account.tiktok_id]}
                        className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                        isLoading.tiktokAccounts?.[account.tiktok_id] ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                      }`}
                    >
                      {isLoading.tiktokAccounts?.[account.tiktok_id] ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                    </button>
                  </div>
                </div>
              ))}
              <div 
                className="flex items-center justify-center bg-white p-6 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
                onClick={() => {
                  closeInfoBadgeConnectAnotherPage('tiktok');
                  setTimeout(() => {
                    setShowInfoBadge(prev => ({ ...prev, tiktok: true }));
                  }, 0);
                }}
              >
                <IoPersonAddOutline className="w-6 h-6 mb-1" />
                <p className="text-gray-700 text-sm font-medium">{t('FacebookAuth.connectAnotherTikTokAccount')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
   
      {/* LinkedIn Info Badge */}
      {showInfoBadge.linkedin && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-center mb-4">
              <img src={LinkedinIcon} alt="LinkedIn" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToLinkedIn')}</h3>
              <button 
                onClick={() => closeInfoBadge('linkedin')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button> 
            </div>
            <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium mb-2 flex items-center">
                <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                <li>{t('FacebookAuth.youWillBeRedirectedToLinkedInToAuthorizeAccessToYourAccount')}</li>
              </ul>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  closeInfoBadge('linkedin');
                  handleLinkedinLogin();
                }}
                className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"  
              >
                {t('FacebookAuth.connectToLinkedIn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoBadgeConnectAnotherPage.linkedin && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <img src={LinkedinIcon} alt="LinkedIn" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectedLinkedInAccounts')}</h3>
              <button 
                onClick={() => closeInfoBadgeConnectAnotherPage('linkedin')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {linkedinAccounts?.map(account => (
                <div key={account.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
                  <img src={account.picture || '/images/no-photos.svg'} 
                  alt={account.name} 
                  className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
                  onError={(e) => {
                    e.target.src = '/images/no-photos.svg';
                  }}
                  />
                  <p className="text-gray-700 text-md font-medium">{account.name}</p>
                  <p className="text-gray-400 text-sm mt-1 truncate">ID: {account.linkedin_id}</p>
                  <div className="mt-auto">
                    <button 
                      type="button"
                      onClick={() => handleLinkedinDisconnect(account.linkedin_id)}
                      disabled={isLoading.linkedinAccounts?.[account.linkedin_id]}
                      className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                        isLoading.linkedinAccounts?.[account.linkedin_id] ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                      }`}
                    >
                      {isLoading.linkedinAccounts?.[account.linkedin_id] ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                    </button>
                  </div>
                </div>
              ))}
              <div 
                className="flex items-center justify-center bg-white p-6 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
                onClick={() => {
                  closeInfoBadgeConnectAnotherPage('linkedin');
                  setTimeout(() => {
                    setShowInfoBadge(prev => ({ ...prev, linkedin: true }));
                  }, 0);
                }}
              >
                <IoPersonAddOutline className="w-6 h-6 mb-1" />
                <p className="text-gray-700 text-sm font-medium">{t('FacebookAuth.connectAnotherLinkedInAccount')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Info Badge */}
      {showInfoBadge.youtube && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
            <div className="flex items-center mb-4">
              <img src={YouTubeIcon} alt="YouTube" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectToYouTube')}</h3>
              <button 
                onClick={() => closeInfoBadge('youtube')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 bg-yellow-200/70 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium mb-2 flex items-center">
                <IoWarningOutline className="w-5 h-5 mr-2 text-yellow-500" /> {t('FacebookAuth.important')}
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                <li>{t('FacebookAuth.youWillBeRedirectedToGoogleToAuthorizeAccessToYourYouTubeChannel')}</li>
                <li>{t('FacebookAuth.weOnlyRequestPermissionsNeededToHelpYouManageYourContentAndUploadVideos')}</li>
                <li>{t('FacebookAuth.youCanRevokeAccessAtAnyTimeFromYourGoogleAccountSettings')}</li>
                <li>{t('FacebookAuth.afterConnectingYouWillBeAbleToPostAndManageYourYouTubeContent')}</li>
              </ul>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  closeInfoBadge('youtube');
                  handleYouTubeLogin();
                }}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('FacebookAuth.connectToYouTube')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoBadgeConnectAnotherPage.youtube && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <img src={YouTubeIcon} alt="YouTube" className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">{t('FacebookAuth.connectedYouTubeChannels')}</h3>
              <button 
                onClick={() => closeInfoBadgeConnectAnotherPage('youtube')} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {youtubeChannels?.map(channel => (
                  <div key={channel.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
                  <img src={channel.profile_picture || '/images/no-photos.svg'} 
                  alt={channel.title} 
                  className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
                  onError={(e) => {
                    e.target.src = '/images/no-photos.svg';
                  }}
                  />
                  <p className="text-gray-700 text-md font-medium">{channel.title}</p>
                  <p className="text-gray-400 text-sm mt-1 truncate">ID: {channel.channel_id}</p>
                  <div className="mt-auto">
                    <button 
                      type="button"
                      onClick={() => handleYoutubeDisconnect(channel.channel_id)}
                      disabled={isLoading.youtubeAccounts?.[channel.channel_id]}
                      className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                        isLoading.youtubeAccounts?.[channel.channel_id] ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                      }`}
                    >
                      {isLoading.youtubeAccounts?.[channel.channel_id] ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                    </button>
                  </div>
                </div>
              ))}
              <div 
                className="flex items-center justify-center bg-white p-6 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
                onClick={() => {
                  closeInfoBadgeConnectAnotherPage('youtube');
                  setTimeout(() => {
                    setShowInfoBadge(prev => ({ ...prev, youtube: true }));
                  }, 0);
                }}
              >
                <IoPersonAddOutline className="w-6 h-6 mb-1" />
                <p className="text-gray-700 text-sm font-medium">{t('FacebookAuth.connectAnotherYouTubeChannel')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaAuth;


