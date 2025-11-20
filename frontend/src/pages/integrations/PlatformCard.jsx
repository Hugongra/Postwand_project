import { useTranslation } from 'react-i18next';

const PlatformCard = ({ platform, isLoading, onClick }) => {
  const { t } = useTranslation();
  
  return (
    <div className="w-full max-w-48 aspect-square mx-auto bg-white rounded-lg shadow-md p-3.5 flex flex-col">
      <div>
        <img src={platform.icon} alt={platform.name} className="h-5 w-5 flex-shrink-0 mb-3" />
        <span className="font-semibold text-md text-gray-700">{platform.name}</span>
        <p className="text-sm text-gray-700">
          {platform.description}
        </p>
      </div>
      
      <div className="mt-auto">
        <button 
          type="button"
          onClick={onClick}
          disabled={isLoading}
          className={`w-full text-sm bg-gray-100 text-gray-600 py-1.5 px-2 rounded-lg font-medium transition-all duration-200 transform hover:bg-gray-200 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.2'
          }`}
        >
          {isLoading 
            ? t('FacebookAuth.connecting') 
            : platform.hasAccounts() 
              ? t('FacebookAuth.myAccounts') 
              : t('FacebookAuth.connect')
          }
        </button>
      </div>
    </div>
  );
};

export default PlatformCard;

