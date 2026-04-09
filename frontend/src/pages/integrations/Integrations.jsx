import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { useTranslation } from 'react-i18next';

import Header from '@components/header';
import ConnectBadge from './ConnectBadge.jsx';
import AccountBadge from './AccountBadge.jsx';
import PlatformCard from './PlatformCard.jsx';
import * as api from '@services/api/api';

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'threads'];

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
    threads: false,
    facebookAccounts: {},
    instagramAccounts: {},
    tiktokAccounts: {},
    linkedinAccounts: {},
    youtubeAccounts: {},
    threadsAccounts: {},
  });
  const [message, setMessage] = useState({ text: null, type: null }); 
  
  const [connectBadge, setConnectBadge] = useState({
    facebook: false, instagram: false, tiktok: false,
    linkedin: false, youtube: false, threads: false,
  });

  const [accountBadge, setAccountBadge] = useState({
    facebook: false, instagram: false, tiktok: false,
    linkedin: false, youtube: false, threads: false,
  });

  const getSocialAccounts = async () => {
    setIsLoading(prev => ({ ...prev, all: true }));
    try {
      const response = await api.ZernioGetAccounts();
      console.log('[Integrations] ZernioGetAccounts response:', response);
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      setSocialData(response.data || {});
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setSocialData({});
    } finally {
      setIsLoading(prev => ({ ...prev, all: false }));
    }
  };

  // On mount: check for Zernio OAuth redirect params, then load accounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const justConnected = urlParams.has('connected') || urlParams.has('accountId') || urlParams.has('profileId');
    const hasError = urlParams.has('error');

    if (justConnected) {
      const platform = urlParams.get('connected') || 'account';
      const username = urlParams.get('username');
      setMessage({
        text: `${platform}${username ? ` (@${username})` : ''} connected successfully!`,
        type: 'success',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (hasError) {
      setMessage({ text: `Connection failed: ${urlParams.get('error')}`, type: 'error' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    getSocialAccounts();
  }, []);

  // ── Zernio universal connect handler ─────────────────────────
  const handleConnect = async (platform) => {
    setIsLoading(prev => ({ ...prev, [platform]: true }));
    setMessage({ text: null, type: null });

    try {
      const redirectUrl = window.location.origin + '/integrations';
      const response = await api.ZernioGetConnectUrl(platform, redirectUrl);
      console.log('[Integrations] ZernioGetConnectUrl response:', response);

      if (!response.ok || !response.data?.authUrl) {
        throw new Error(response.data?.error || 'Failed to get connect URL');
      }

      window.location.href = response.data.authUrl;
    } catch (err) {
      setMessage({ text: err.message || `Failed to connect ${platform}`, type: 'error' });
      setIsLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  useEffect(() => {
    if (message.text) {
      const timeout = message.type === 'error' ? 10000 : 5000;
      const timer = setTimeout(() => setMessage({ text: null, type: null }), timeout);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (location.state?.selectedPlatform) {
      const platform = location.state.selectedPlatform;
      const hasAccounts = socialData?.[platform]?.accounts?.length > 0;
      if (hasAccounts) {
        setAccountBadge(prev => ({ ...prev, [platform]: true }));
      } else {
        setConnectBadge(prev => ({ ...prev, [platform]: true }));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, socialData]);

  const showPlatformInfo = (platform) => {
    const has = socialData?.[platform]?.accounts?.length > 0;
    if (has) {
      setAccountBadge(prev => ({ ...prev, [platform]: true }));
    } else {
      setConnectBadge(prev => ({ ...prev, [platform]: true }));
    }
  };

  const closeConnectBadge = (platform) => setConnectBadge(prev => ({ ...prev, [platform]: false }));
  const closeAccountBadge = (platform) => setAccountBadge(prev => ({ ...prev, [platform]: false }));

  const handleConnectAnother = (platform) => {
    closeAccountBadge(platform);
    setTimeout(() => setConnectBadge(prev => ({ ...prev, [platform]: true })), 0);
  };

  const handlePlatformDisconnect = async (platform, accountId) => {
    const loadingKey = `${platform}Accounts`;
    setIsLoading(prev => ({
      ...prev,
      [loadingKey]: { ...(prev[loadingKey] || {}), [accountId]: true },
    }));

    try {
      const response = await api.ZernioDisconnectAccount(accountId);
      if (!response.ok) {
        setMessage({ text: response.data?.error || 'Failed to disconnect account', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to disconnect account', type: 'error' });
    }

    setIsLoading(prev => ({
      ...prev,
      [loadingKey]: { ...(prev[loadingKey] || {}), [accountId]: false },
    }));
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
      handleLogin: () => handleConnect('facebook'),
      handleDisconnect: (id) => handlePlatformDisconnect('facebook', id),
    },
    instagram: {
      icon: InstagramIcon,
      name: t('FacebookAuth.instagram'),
      description: t('FacebookAuth.postToYourInstagramBusinessOrCreatorAccount'),
      hasAccounts: () => socialData?.instagram?.accounts?.length > 0,
      getAccounts: () => socialData?.instagram?.accounts,
      getLoadingStates: () => isLoading.instagramAccounts,
      handleLogin: () => handleConnect('instagram'),
      handleDisconnect: (id) => handlePlatformDisconnect('instagram', id),
    },
    tiktok: {
      icon: TikTokIcon,
      name: t('FacebookAuth.tiktokAccount'),
      description: t('FacebookAuth.postToYourTikTokAccount'),
      hasAccounts: () => socialData?.tiktok?.accounts?.length > 0,
      getAccounts: () => socialData?.tiktok?.accounts,
      getLoadingStates: () => isLoading.tiktokAccounts,
      handleLogin: () => handleConnect('tiktok'),
      handleDisconnect: (id) => handlePlatformDisconnect('tiktok', id),
    },
    linkedin: {
      icon: LinkedinIcon,
      name: t('FacebookAuth.linkedin'),
      description: t('FacebookAuth.postToYourLinkedInAccount'),
      hasAccounts: () => socialData?.linkedin?.accounts?.length > 0,
      getAccounts: () => socialData?.linkedin?.accounts,
      getLoadingStates: () => isLoading.linkedinAccounts,
      handleLogin: () => handleConnect('linkedin'),
      handleDisconnect: (id) => handlePlatformDisconnect('linkedin', id),
    },
    youtube: {
      icon: YouTubeIcon,
      name: t('FacebookAuth.youtube'),
      description: t('FacebookAuth.postToYourYouTubeChannel'),
      hasAccounts: () => socialData?.youtube?.accounts?.length > 0,
      getAccounts: () => socialData?.youtube?.accounts,
      getLoadingStates: () => isLoading.youtubeAccounts,
      handleLogin: () => handleConnect('youtube'),
      handleDisconnect: (id) => handlePlatformDisconnect('youtube', id),
    },
    threads: {
      icon: ThreadsIcon,
      name: 'Threads',
      description: 'Post to your Threads account',
      hasAccounts: () => socialData?.threads?.accounts?.length > 0,
      getAccounts: () => socialData?.threads?.accounts,
      getLoadingStates: () => isLoading.threadsAccounts,
      handleLogin: () => handleConnect('threads'),
      handleDisconnect: (id) => handlePlatformDisconnect('threads', id),
    },
  };

  if (isLoading.all) {
    return (
      <div className="w-full h-full bg-primary py-4">
        <Header title="Integrations" />
        <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 bg-primary">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full max-w-48 aspect-square mx-auto bg-gray-200/80 rounded-lg shadow-sm p-3.5 flex flex-col animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-primary py-4">
      <Header title="Integrations" />

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
        {PLATFORMS.map((key) => (
          <PlatformCard
            key={key}
            platform={platformConfig[key]}
            isLoading={isLoading[key]}
            onClick={() => showPlatformInfo(key)}
          />
        ))}
      </div>

      {PLATFORMS.map((key) =>
        connectBadge[key] && (
          <ConnectBadge
            key={`connect-${key}`}
            platform={key}
            onClose={() => closeConnectBadge(key)}
            onConnect={platformConfig[key].handleLogin}
          />
        )
      )}

      {PLATFORMS.map((key) =>
        accountBadge[key] && (
          <AccountBadge
            key={`account-${key}`}
            platform={key}
            accounts={platformConfig[key].getAccounts()}
            isLoading={platformConfig[key].getLoadingStates()}
            onClose={() => closeAccountBadge(key)}
            onDisconnect={platformConfig[key].handleDisconnect}
            onConnectAnother={() => handleConnectAnother(key)}
          />
        )
      )}
    </div>
  );
};

export default SocialMediaAuth;
