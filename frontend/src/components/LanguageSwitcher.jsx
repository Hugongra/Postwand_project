import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('settings.languages.en'), flag: '🇺🇸' },
    { code: 'es', name: t('settings.languages.es'), flag: '🇪🇸' },
  ];

  // Log current language on component mount
  React.useEffect(() => {
    console.log('LanguageSwitcher - Current language:', i18n.language);
    console.log('LanguageSwitcher - localStorage language:', localStorage.getItem('userLanguage'));
  }, [i18n.language]);

  const changeLanguage = (languageCode) => {
    console.log('Changing language to:', languageCode);
    i18n.changeLanguage(languageCode);
    // Save to localStorage for persistence
    localStorage.setItem('userLanguage', languageCode);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t('settings.language')}</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {t('settings.selectLanguage')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`
              flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-all
              ${i18n.language === lang.code
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          {t('messages.changesSaved')}
        </p>
      </div>
    </div>
  );
};

export default LanguageSwitcher; 