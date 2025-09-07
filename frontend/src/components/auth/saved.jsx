import React, { useEffect, useState } from 'react';

// Import the environment variable using import.meta.env for Vite
const FB_APP_SECRET = import.meta.env.VITE_FB_APP_SECRET;
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID;
const THREADS_APP_ID = import.meta.env.VITE_THREADS_APP_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const THREADS_REDIRECT_URI = import.meta.env.VITE_THREADS_REDIRECT_URI;

const SocialMediaAuth = ({ onAuth, onContinue }) => {
  const [isLoading, setIsLoading] = useState({
    facebook: false,
    instagram: false,
    threads: false
  });
  const [error, setError] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState({
    facebook: [],
    instagram: [],
    threads: false
  });
  const [threadsAuthPending, setThreadsAuthPending] = useState(false);

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
        setThreadsAuthPending(true);
        
        // Handle authentication completion
        handleThreadsCallback(code, state, error, error_description);
      }
    };
    
    checkThreadsCallback();
  }, []);

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data === 'threads_auth_success') {
        console.log('Threads authentication successful');
        // Call onAuth to update parent state
        onAuth('threads', { connected: true });
        // Reset loading state
        setIsLoading(prev => ({ ...prev, threads: false }));
        // Clear any errors
        setError(null);
        // Update connected accounts
        setConnectedAccounts(prev => ({ ...prev, threads: true }));
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [onAuth]);

  const handleThreadsCallback = async (code, state, error, error_description) => {
    try {
      // Check for errors from OAuth redirect
      if (error) {
        setError(`Threads authentication failed: ${error_description || error}`);
        setThreadsAuthPending(false);
        localStorage.removeItem('threadsAuthPending');
        localStorage.removeItem('threadsAuthState');
        return;
      }
      
      // Verify state to prevent CSRF
      const savedState = localStorage.getItem('threadsAuthState');
      if (state !== savedState) {
        setError('Threads security verification failed');
        setThreadsAuthPending(false);
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
      
      // Update state
      setConnectedAccounts(prev => ({
        ...prev,
        threads: true
      }));
      
      // Notify parent component
      onAuth('threads', { connected: true });
      
      // Clean browser history to remove auth parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError(error.message);
      console.error('Threads authentication error:', error);
    } finally {
      setThreadsAuthPending(false);
      setIsLoading(prev => ({ ...prev, threads: false }));
      localStorage.removeItem('threadsAuthPending');
      localStorage.removeItem('threadsAuthState');
    }
  };

  const saveToBackend = async (platform, authData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(authData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to save ${platform} authentication data`);
        console.log(responseData)
      }

      // Update connected accounts based on platform
      setConnectedAccounts(prev => ({
        ...prev,
        [platform]: platform === 'threads' 
          ? true 
          : authData.instagramAccounts || authData.pages || []
      }));

      // Call onAuth with the platform and data
      onAuth(platform, authData);

      return responseData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Async function to exchange short-lived token for a long-lived token
  const getLongLivedToken = async (shortLivedToken) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
      );
      const data = await response.json();
      if (data.access_token) {
        return { 
          accessToken: data.access_token
        };
      } else {
        throw new Error('Failed to exchange for long-lived token');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

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
            // Exchange for long-lived token
            const longLived = await getLongLivedToken(response.authResponse.accessToken);
            
            // Get Facebook pages
            const pagesResponse = await new Promise((resolve) => {
              window.FB.api('/me/accounts', { access_token: longLived.accessToken }, (result) => resolve(result));
            });

            if (pagesResponse && pagesResponse.data) {
              const pagesData = pagesResponse.data.map(page => ({
                id: page.id,
                name: page.name,
                pageToken: page.access_token,
                profilePicture: `https://graph.facebook.com/${page.id}/picture?type=large`
              }));

             
              // Save Facebook auth data
              await saveToBackend('facebook', {
                accessToken: longLived.accessToken,
                pages: pagesData
              });
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
      scope: 'email,pages_show_list,business_management,pages_manage_cta,pages_messaging,pages_read_engagement,pages_manage_posts'
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
            // Exchange for long-lived token
            const longLived = await getLongLivedToken(response.authResponse.accessToken);
            
            // Get Instagram business accounts
            const instagramAccountsResponse = await new Promise((resolve) => {
              window.FB.api(
                `/me/accounts?fields=instagram_business_account{id,name,username,profile_picture_url}`,
                { access_token: longLived.accessToken },
                (result) => resolve(result)
              );
            });

            if (instagramAccountsResponse && instagramAccountsResponse.data) {
              const instagramAccounts = instagramAccountsResponse.data
                .filter(page => page.instagram_business_account)
                .map(page => ({
                  id: page.instagram_business_account.id,
                  username: page.instagram_business_account.username,
                  profilePicture: page.instagram_business_account.profile_picture_url || 
                                `https://graph.facebook.com/${page.instagram_business_account.id}/picture?type=large`
                }));

              // Save Instagram auth data
              await saveToBackend('instagram', {
                accessToken: longLived.accessToken,
                accounts: instagramAccounts
              });
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
      scope: 'instagram_basic,instagram_content_publish,pages_read_engagement'
    });
  };

  // Threads authentication
  const handleThreadsLogin = () => {
    setIsLoading(prev => ({ ...prev, threads: true }));
    setError(null);
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage to verify when we return
    localStorage.setItem('threadsAuthState', state);
    localStorage.setItem('threadsAuthPending', 'true');
    
    // Construct the authorization URL with proper parameters
    const REDIRECT_URI = encodeURIComponent(THREADS_REDIRECT_URI); // Make sure this matches your app settings
    const SCOPES = encodeURIComponent("threads_basic,threads_content_publish");
    
    const authUrl = `https://www.threads.net/oauth/authorize?` +
      `client_id=${THREADS_APP_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `scope=${SCOPES}&` +
      `response_type=code&` +
      `state=${state}`;
    
    // Open the authorization window
    window.open(authUrl, 'authWindow', 'width=600,height=700');
  };

  // Add this new function
  const resetThreadsAuth = () => {
    // Clear localStorage
    localStorage.removeItem('threadsAuthPending');
    localStorage.removeItem('threadsAuthState');
    
    // Reset state
    setIsLoading(prev => ({ ...prev, threads: false }));
    setError(null);
    setConnectedAccounts(prev => ({ ...prev, threads: false }));
    
    // Clean URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const getConnectedAccountsDisplay = (platform) => {
    const accounts = connectedAccounts[platform];
    
    if (!accounts || (Array.isArray(accounts) && accounts.length === 0)) {
      return null;
    }
    
    if (platform === 'threads' && accounts === true) {
      return <div className="mt-2 text-sm text-green-600">✓ Threads connected</div>;
    }
    
    return (
      <div className="mt-2 text-sm">
        <span className="text-green-600">✓ Connected: </span>
        {Array.isArray(accounts) && accounts.map((account, index) => (
          <span key={account.id} className="text-gray-700">
            {account.name}{index < accounts.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <p className="text-lg mb-8 text-center">Connect your Social Media Accounts</p>
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      <div className="space-y-5">
        {/* Facebook Login */}
        <div>
          <button 
            onClick={handleFacebookLogin}
            disabled={isLoading.facebook}
            className={`w-full bg-blue-500 text-white py-3 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-blue-700 hover:shadow-lg ${
              isLoading.facebook ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
            }`}
          >
            {isLoading.facebook ? 'Connecting...' : 'Connect Facebook Pages'}
          </button>
          {getConnectedAccountsDisplay('facebook')}
        </div>
        
        {/* Instagram Login */}
        <div>
          <button 
            onClick={handleInstagramLogin}
            disabled={isLoading.instagram}
            className={`w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 px-2 rounded-lg font-medium transition-all duration-200 transform hover:from-pink-600 hover:to-purple-700 hover:shadow-lg ${
              isLoading.instagram ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
            }`}
          >
            {isLoading.instagram ? 'Connecting...' : 'Connect Instagram Business'}
          </button>
          {getConnectedAccountsDisplay('instagram')}
        </div>
        
        {/* Threads Login */}
        <div>
          <button 
            onClick={() => {
              resetThreadsAuth();
              handleThreadsLogin();
            }}
            disabled={isLoading.threads}
            className={`w-full bg-black text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-900 hover:shadow-lg ${
              isLoading.threads ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
            }`}
          >
            {isLoading.threads ? 'Connecting...' : 'Connect Threads'}
          </button>
          {getConnectedAccountsDisplay('threads')}
        </div>
   
        {/* Add Continue button */}
        {(connectedAccounts.facebook || 
          connectedAccounts.instagram || 
          connectedAccounts.threads) && (
          <div className="mt-10 pt-6 border-t border-gray-200 flex justify-center">
            <button
              onClick={() => onContinue(true)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm transition-all duration-300 hover:shadow-md group"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 font-medium group-hover:from-pink-600 group-hover:to-purple-600">
                    Continue to App
              </span>
            </button>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-xs text-gray-500 text-center leading-relaxed">
        Note: Instagram Business and Threads accounts must be connected to Facebook Pages.
        Each platform requires separate authorization.
      </p>
    </div>
  );
};

export default SocialMediaAuth;