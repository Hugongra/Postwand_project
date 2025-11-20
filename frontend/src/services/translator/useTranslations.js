import { useTranslation } from 'react-i18next';

/**
 * Custom hook for translations with additional utilities
 * @returns {Object} Translation utilities
 */
export const useTranslations = () => {
  const { t, i18n } = useTranslation();

  // Get current language
  const currentLanguage = i18n.language;
  
  // Check if current language is Spanish
  const isSpanish = currentLanguage === 'es';
  
  // Check if current language is English
  const isEnglish = currentLanguage === 'en';

  // Format date based on current language
  const formatDate = (date) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const locale = isSpanish ? 'es-ES' : 'en-US';
    return new Date(date).toLocaleDateString(locale, options);
  };

  // Format time based on current language
  const formatTime = (date) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const locale = isSpanish ? 'es-ES' : 'en-US';
    return new Date(date).toLocaleTimeString(locale, options);
  };

  // Format currency based on current language
  const formatCurrency = (amount) => {
    const locale = isSpanish ? 'es-ES' : 'en-US';
    const currency = 'USD'; // Change this based on your needs
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format numbers based on current language
  const formatNumber = (number) => {
    const locale = isSpanish ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(locale).format(number);
  };

  return {
    t,
    i18n,
    currentLanguage,
    isSpanish,
    isEnglish,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber
  };
};

export default useTranslations; 