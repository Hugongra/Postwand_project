import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const getUserLanguage = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const { language } = JSON.parse(user);
    if (language) return language;
  }
  return null; 
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: getUserLanguage(),
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n; 