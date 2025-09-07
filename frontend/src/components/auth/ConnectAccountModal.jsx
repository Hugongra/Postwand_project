import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TiktokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import TwitterIcon from '/SM_icons/x.svg';

const ConnectAccountModal = ({ platform, onClose, onAuth }) => {
  const { t } = useTranslation();

  const handlePlatformRedirect = () => {
    // Close modal and redirect to social accounts page 
    onClose();
    window.location.href = '/social-accounts';
  };

  const getIcon = () => {
    switch (platform) {
      case 'facebook': return <img src={FacebookIcon} className="h-6 w-6 mr-2" />;
      case 'instagram': return <img src={InstagramIcon} className="h-6 w-6 mr-2" />;
      case 'twitter': return <img src={TwitterIcon} className="h-6 w-6 mr-2" />;
      case 'linkedin': return <img src={LinkedinIcon} className="h-6 w-6 mr-2" />;
      case 'tiktok': return <img src={TiktokIcon} className="h-6 w-6 mr-2" />;
      case 'threads': return <img src={ThreadsIcon} className="h-6 w-6 mr-2" />;
      default: return null;
    }
  };

  const getTitle = () => {
    return t(`Connect to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  };

  const getButtonAction = () => {
    return handlePlatformRedirect;
  };

  const getButtonColor = () => {
    switch (platform) {
      case 'facebook': return 'bg-[#1877F2] hover:bg-[#0e6fea]';
      case 'instagram': return 'bg-pink-500 hover:opacity-90';
      case 'twitter': return 'bg-[#1DA1F2] hover:bg-[#0d8bd7]';
      case 'linkedin': return 'bg-[#0077B5] hover:bg-[#005f93]';
      case 'tiktok': return 'bg-black hover:bg-gray-800';
      case 'threads': return 'bg-black hover:bg-gray-800';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'facebook':
        return (
          <>
            <h4 className="font-medium mb-2">{t('ConnectAccountModal.facebook.whatWillHappen')}</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>{t('ConnectAccountModal.facebook.aFacebookTabWillOpenWhereYouCanAuthorizeAccessToYourFacebookPage')}</li>
              <li>{t('ConnectAccountModal.facebook.weOnlyRequestAccessToDataNeeded')}</li>
              <li>{t('ConnectAccountModal.facebook.afterConnectingYouWillBeAbleToPostAndManageYourFacebookPage')}</li>
            </ul>
            <h4 className="font-medium mb-2 mt-3">{t('ConnectAccountModal.facebook.whatTypeOfAccountsCanYouConnect')}</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>{t('ConnectAccountModal.facebook.facebookBusinessPagesNotPersonalProfiles')}</li>
            </ul>
          </>
        );
      case 'instagram':
        return (
          <>
            <h4 className="font-medium mb-2">{t('ConnectAccountModal.instagram.whatWillHappen')}</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>{t('ConnectAccountModal.instagram.aFacebookTabWillOpenWhereYouCanAuthorizeAccessToYourInstagramAccount')}</li>
              <li>{t('ConnectAccountModal.instagram.weOnlyRequestAccessToDataNeeded')}</li>
              <li>{t('ConnectAccountModal.instagram.afterConnectingYouWillBeAbleToPostAndManageYourInstagramAccount')}</li>
            </ul>
            <h4 className="font-medium mb-2 mt-3">{t('ConnectAccountModal.instagram.whatTypeOfAccountsCanYouConnect')}</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>{t('ConnectAccountModal.instagram.instagramBusinessOrCreatorAccountsLinkedToAFacebookPage')}</li>
              <li className="text-gray-500 text-sm">{t('ConnectAccountModal.instagram.note')}
                <a href="https://www.facebook.com/business/help/502981923235522" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm hover:underline"> Switch to Business<ArrowRight className="w-3 h-3 inline-block items-center" /></a>
              </li>
            </ul>
          </>
        );
        case 'threads':
          return (
            <>
              <h4 className="font-medium mb-2">{t('ConnectAccountModal.threads.whatWillHappen', {platform: t('social.platforms.threads')})}</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>{t('ConnectAccountModal.threads.aFacebookTabWillOpenWhereYouCanAuthorizeAccessToYourThreadsAccount')}</li>
                <li>{t('ConnectAccountModal.threads.weOnlyRequestAccessToDataNeeded')}</li>
                <li>{t('ConnectAccountModal.threads.afterConnectingYouWillBeAbleToPostAndManageYourThreadsAccount')}</li>
              </ul>
              
             
            </>
          );
        case 'tiktok':
          return (
            <>
              <h4 className="mb-2 text-gray-700">{t('ConnectAccountModal.connectYourAccountToPostContent', {platform: t('social.platforms.tiktok')})}</h4>
            </>
          );
        case 'linkedin':
          return (
            <>
              <h4 className=" mb-2 text-gray-700">{t('ConnectAccountModal.connectYourAccountToPostContent', {platform: t('social.platforms.linkedin')})}</h4>
            </>
          );
        case 'twitter':
      default:
        return (
          <p>{t('ConnectAccountModal.connectYourAccountToPostContent')}</p>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center mb-4">
          {getIcon()}
          <h3 className="text-xl font-semibold text-gray-800">{getTitle()}</h3>
          <button 
            onClick={onClose} 
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        

        
        <div className="mb-4 bg-yellow-100 p-4 rounded-lg border border-yellow-200">
          {getPlatformInstructions()}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={getButtonAction()}
            className={`px-4 py-2 ${getButtonColor()} text-white font-medium rounded-lg transition-colors`}
          >
            {t(`Connect to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccountModal; 