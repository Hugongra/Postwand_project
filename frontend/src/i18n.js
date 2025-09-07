import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Check browser language
const browserLang = navigator.language || navigator.userLanguage;
console.log('Browser language:', browserLang);

i18n
  .use(LanguageDetector) // Detects user language automatically
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    // Resources - we'll load these from files in production
    resources: {
      en: {
        translation: {
          // We'll load from public/locales/en/translation.json
        }
      },
      es: {
        translation: {
          // We'll load from public/locales/es/translation.json
        }
      }
    },
    
    // Language detection options - DISABLED FOR FORCING ENGLISH
    detection: {
      order: [], // Disable automatic detection
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
      lookupLocalStorage: 'userLanguage',
    },
    
    // Fallback language
    fallbackLng: 'en',
    
    // Available languages
    supportedLngs: ['en', 'es'],
    
    // Debug mode (set to true to diagnose issues)
    debug: true,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  });

// Load translations from JSON files
const loadTranslations = async () => {
  try {
    console.log('Loading translations...');
    
    // Load English translations
    const enResponse = await fetch('/locales/en/translation.json');
    const enTranslations = await enResponse.json();
    i18n.addResourceBundle('en', 'translation', enTranslations);
    console.log('English translations loaded');
    
    // Load Spanish translations
    const esResponse = await fetch('/locales/es/translation.json');
    const esTranslations = await esResponse.json();
    i18n.addResourceBundle('es', 'translation', esTranslations);
    console.log('Spanish translations loaded');
    
    // COMMENTED OUT - Check if user is logged in and has a language preference
    /*
    try {
      const authResponse = await fetch('https://app.postwand.io/api/auth/status', {
        credentials: 'include'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.isLoggedIn && authData.user.preferred_language) {
          console.log('User preferred language:', authData.user.preferred_language);
          // Set language from user preference
          i18n.changeLanguage(authData.user.preferred_language);
          return; // Exit early as we've set the language
        }
      }
    } catch (authError) {
      console.error('Error checking auth status:', authError);
      // Continue with browser language detection
    }
    
    // Log current language
    console.log('Current language:', i18n.language);
    console.log('localStorage language:', localStorage.getItem('userLanguage'));
    console.log('Browser language:', navigator.language);
    
    // If browser language is Spanish but i18n language is not Spanish, set it
    if ((browserLang && browserLang.startsWith('es')) && i18n.language !== 'es') {
      console.log('Browser language is Spanish but i18n language is not. Setting to Spanish.');
      i18n.changeLanguage('es');
    }
    */
    
    // FORCE ENGLISH - Override all language detection
    console.log('Forcing language to English');
    localStorage.setItem('userLanguage', 'es');
    i18n.changeLanguage('es');
    
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
};

loadTranslations();

export default i18n; 