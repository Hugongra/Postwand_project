import { ArrowRight } from 'lucide-react';
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

const platformColors = {
  facebook: 'bg-[#1877F2] hover:bg-[#0e6fea]',
  instagram: 'bg-pink-500 hover:opacity-90',
  threads: 'bg-black hover:bg-gray-900',
  tiktok: 'bg-black hover:bg-gray-900',
  linkedin: 'bg-black hover:bg-gray-900',
  youtube: 'bg-red-600 hover:bg-red-700'
};

const ConnectBadge = ({ platform, onClose, onConnect }) => {
  const { t } = useTranslation();
  
  const platformConfig = {
    facebook: {
      title: t('FacebookAuth.connectToFacebookPage'),
      buttonText: t('FacebookAuth.connectToFacebook'),
      items: [
        t('FacebookAuth.connectsFacebookPageOnly'),
        t('FacebookAuth.requiresFacebookBusinessPage')
      ]
    },
    instagram: {
      title: t('FacebookAuth.connectToInstagramLinkedToAFacebookPage'),
      buttonText: t('FacebookAuth.connectToInstagram'),
      items: [
        t('FacebookAuth.connectsInstagramThroughFacebookPage'),
        t('FacebookAuth.requiresInstagramBusinessOrCreator'),
        t('FacebookAuth.instagramMustBeLinkedToFacebookPage')
      ],
      note: (
        <span className="text-gray-500 text-sm mt-3">
          {t('FacebookAuth.note')}
          <a href="https://www.facebook.com/business/help/502981923235522" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm hover:underline">
            {' '}Switch to Business<ArrowRight className="w-3 h-3 inline-block items-center" />
          </a>
        </span>
      )
    },
    tiktok: {
      title: t('FacebookAuth.connectToTikTok'),
      buttonText: t('FacebookAuth.connectToTikTok'),
      items: [
        t('FacebookAuth.connectsTikTokAccount'),
        t('FacebookAuth.redirectsToTikTokForAuth')
      ]
    },
    linkedin: {
      title: t('FacebookAuth.connectToLinkedIn'),
      buttonText: t('FacebookAuth.connectToLinkedIn'),
      items: [
        t('FacebookAuth.connectsLinkedInAccount'),
        t('FacebookAuth.redirectsToLinkedInForAuth')
      ]
    },
    youtube: {
      title: t('FacebookAuth.connectToYouTube'),
      buttonText: t('FacebookAuth.connectToYouTube'),
      items: [
        t('FacebookAuth.connectsYouTubeChannel'),
        t('FacebookAuth.redirectsToGoogleForAuth')
      ]
    },
    threads: {
      title: 'Connect to Threads',
      buttonText: 'Connect to Threads',
      items: [
        'Connects your Threads account',
        'Redirects to Threads for authorization'
      ]
    }
  };

  const config = platformConfig[platform];
  const icon = platformIcons[platform];
  const buttonColor = platformColors[platform];

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-6">
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
      
        <div className="mb-4 bg-gray-100/70 p-4 rounded-lg ">
          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
            {config.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {config.note && <div className="mt-3">{config.note}</div>}
        </div>
      
        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              onClose();
              onConnect();
            }}
            className={`px-3 py-1.5 text-white  rounded-lg transition-colors ${buttonColor}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectBadge;