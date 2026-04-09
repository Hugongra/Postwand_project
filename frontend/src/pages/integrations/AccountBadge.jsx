import { IoPersonAddOutline } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TikTokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import YouTubeIcon from '/SM_icons/youtube.svg';

const platformIcons = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedinIcon,
  youtube: YouTubeIcon
};

const AccountBadge = ({ platform, accounts, isLoading, onClose, onDisconnect, onConnectAnother }) => {
  const { t } = useTranslation();
  
  const platformConfig = {
    facebook: {
      title: t('FacebookAuth.connectedFacebookPages'),
      connectAnotherText: t('FacebookAuth.connectAnotherFacebookPage'),
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.name,
      getAccountPicture: (account) => account.profile_picture
    },
    instagram: {
      title: t('FacebookAuth.connectedInstagramAccounts'),
      connectAnotherText: t('FacebookAuth.connectAnotherInstagramAccount'),
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.name,
      getAccountPicture: (account) => account.profile_picture
    },
    tiktok: {
      title: t('FacebookAuth.connectedTikTokAccounts'),
      connectAnotherText: t('FacebookAuth.connectAnotherTikTokAccount'),
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.display_name,
      getAccountPicture: (account) => account.avatar_url
    },
    linkedin: {
      title: t('FacebookAuth.connectedLinkedInAccounts'),
      connectAnotherText: t('FacebookAuth.connectAnotherLinkedInAccount'),
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.name,
      getAccountPicture: (account) => account.picture
    },
    youtube: {
      title: t('FacebookAuth.connectedYouTubeChannels'),
      connectAnotherText: t('FacebookAuth.connectAnotherYouTubeChannel'),
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.title || account.name,
      getAccountPicture: (account) => account.profile_picture
    },
    threads: {
      title: 'Connected Threads Accounts',
      connectAnotherText: 'Connect another Threads account',
      getAccountId: (account) => account.account_id,
      getAccountName: (account) => account.name || account.username,
      getAccountPicture: (account) => account.profile_picture
    }
  };

  const config = platformConfig[platform];
  const icon = platformIcons[platform];

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6 my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <img src={icon} alt={platform} className="h-5 w-5 mr-2" />
          <h3 className="text-xl font-semibold text-gray-800">{config.title}</h3>
          <button 
            onClick={onClose} 
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {accounts?.map(account => {
            const accountId = config.getAccountId(account);
            const isAccountLoading = isLoading?.[accountId];
            
            return (
              <div key={account.id} className="bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col">
                <img 
                  src={config.getAccountPicture(account) || '/images/no-photos.svg'} 
                  alt={config.getAccountName(account)} 
                  className="w-8 h-8 object-cover rounded-full mb-2 border border-gray-500" 
                  onError={(e) => {
                    e.target.src = '/images/no-photos.svg';
                  }}
                />
                <p className="text-gray-700 text-md font-medium">{config.getAccountName(account)}</p>
                <p className="text-gray-400 text-sm mt-1 truncate">ID: {accountId}</p>
                <div className="mt-auto">
                  <button 
                    type="button"
                    onClick={() => onDisconnect(accountId)}
                    disabled={isAccountLoading}
                    className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
                      isAccountLoading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
                    }`}
                  >
                    {isAccountLoading ? t('FacebookAuth.disconnecting') : t('FacebookAuth.disconnect')}
                  </button>
                </div>
              </div>
            );
          })}
          
          <div 
            className="flex items-center justify-center bg-white p-4 w-48 h-48 rounded-lg relative border border-gray-200 flex flex-col text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-gray-300"
            onClick={onConnectAnother}
          >
            <IoPersonAddOutline className="w-6 h-6 mb-1" />
            <p className="text-gray-700 text-sm font-medium">{config.connectAnotherText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBadge;