import { useState, useEffect } from 'react';
import { BsCreditCard2Front } from "react-icons/bs";
import { User } from "lucide-react";
import { FaAddressCard } from "react-icons/fa";
import { FaRegCreditCard } from "react-icons/fa6";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import TokenUsage from './TokenUsage';
// Load Stripe outside of a component's render to avoid recreating it on each render
const stripePromise = loadStripe('your_stripe_public_key'); // Replace with your actual key

// Payment Method Form component
const PaymentMethodForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a setup intent
      const setupResponse = await fetch('https://app.postwand.io/api/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!setupResponse.ok) {
        throw new Error(t('profile.errors.failedToCreateSetupIntent'));
      }
      
      const { client_secret } = await setupResponse.json();
      
      // Confirm the setup with card details
      const result = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { /* You can add name, email here */ }
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Update payment method on server
      const updateResponse = await fetch('https://app.postwand.io/api/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ setup_intent_id: result.setupIntent.id })
      });
      
      if (!updateResponse.ok) {
        throw new Error(t('profile.errors.failedToUpdatePaymentMethod'));
      }
      
      // Clear the form and notify parent component
      elements.getElement(CardElement).clear();
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">{t('profile.billing.cardInformation')}</label>
        <div className="p-3 border rounded bg-white">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }} />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? t('profile.billing.processing') : t('profile.billing.addPaymentMethod')}
      </button>
    </form>
  );
};

export const Profile = ({ user }) => {
  // Add i18n hook
  const { t, i18n } = useTranslation();
  
  // User info states
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState(i18n.language || 'en');
  
  // Theme settings - just track which theme is active
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('active-theme') || 'default');
  
  // Predefined themes
  const themes = {
    default: {
      name: t('profile.account.themes.default'),
      colors: {
        '--bg-primary': '#F8F5FA',
        '--bg-secondary': '#faf8fb',
        '--sidebar-button-hover': '#CC00CC',
        '--home-button-hover': '#CC00CC',
        '--home-button-bg': '#CC00CC',
        '--home-button-text': '#FFFFFF',
        '--home-button-hover-text': '#FFFFFF',
        '--brand-button-bg': '#CC00CC',
        '--accent-color': '#CC00CC',
        "--second-accent-color": "#A010C4",
        '--sidebar-bg': '#F5E3F8',
        '--sidebar-text': '#CC00CC'
      }
    },
   
    light: {
      name: t('profile.account.themes.light'),
      colors: {
        '--bg-primary': 'rgba(246, 246, 246, 0.9)', // Using rgba to control opacity
        '--bg-secondary': '#F5F5F5',
        '--sidebar-button-hover': '#000000',
        '--home-button-hover': '#000000',
        '--home-button-bg': '#FFFFFF',
        '--home-button-text': '#000000',
        '--home-button-hover-text': '#FFFFFF',
        '--brand-button-bg': '#E3E3E3', 
        '--accent-color': '#EBEDEC',
        "--second-accent-color": "#3b82f6",
        '--sidebar-bg': '#e3e3e3',
        '--sidebar-text': '#000000'
      }
    }
  };

  // Function to apply theme - this is the ONLY place that should change the theme
  const applyTheme = (themeKey) => {
    const theme = themes[themeKey];
    if (!theme) return;
    
    // Apply all theme colors
    Object.entries(theme.colors).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
      localStorage.setItem(`theme-${property}`, value);
    });
    
    // Save active theme
    localStorage.setItem('active-theme', themeKey);
    setActiveTheme(themeKey);
  };

  // No need for theme initialization here - App.jsx handles that
  
  // Add deletion confirmation states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Subscription and payment states
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  
  // Data loading state tracking
  const [dataLoaded, setDataLoaded] = useState({
    subscription: false,
    paymentMethods: false,
    billingHistory: false
  });
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('account');
  
  // Define tabs for profile navigation
  const tabs = [
    { id: 'account', label: t('profile.tabs.account') },
    { id: 'billing', label: t('profile.tabs.billing') },
    { id: 'subscription', label: t('profile.tabs.subscription') },
    { id: 'usage', label: t('profile.tabs.usage') },
    { id: 'policy', label: t('profile.tabs.policy') }
  ];
  
  // Load data only when tab is active and data hasn't been loaded yet
  useEffect(() => {
    if (activeTab === 'subscription' && !dataLoaded.subscription) {
      fetchSubscriptionData();
    }
    
    if (activeTab === 'billing') {
      if (!dataLoaded.paymentMethods) {
        fetchPaymentMethods();
      }
      if (!dataLoaded.billingHistory) {
        fetchBillingHistory();
      }
    }
  }, [activeTab, dataLoaded]);
  
  const fetchSubscriptionData = async () => {
    if (isLoadingSubscription) return;
    setIsLoadingSubscription(true);
    
    try {
      const response = await fetch('https://app.postwand.io/api/subscription/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.has_subscription ? data.subscription : null);
        setDataLoaded(prev => ({ ...prev, subscription: true }));
      }
    } catch (err) {
      console.error(t('profile.errors.failedToFetchSubscriptionData'), err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };
  
  const fetchPaymentMethods = async () => {
    if (isLoadingSubscription) return;
    setIsLoadingSubscription(true);
    
    try {
      const response = await fetch('https://app.postwand.io/api/payment-methods', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
        setDataLoaded(prev => ({ ...prev, paymentMethods: true }));
      }
    } catch (err) {
      console.error(t('profile.errors.failedToFetchPaymentMethods'), err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };
  
  const fetchBillingHistory = async () => {
    if (isLoadingSubscription) return;
    setIsLoadingSubscription(true);
    
    try {
      const response = await fetch('https://app.postwand.io/api/billing-history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.invoices || []);
        setDataLoaded(prev => ({ ...prev, billingHistory: true }));
      }
    } catch (err) {
      console.error(t('profile.errors.failedToFetchBillingHistory'), err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle payment method addition success
  const handlePaymentMethodAdded = () => {
    setIsAddingPaymentMethod(false);
    // Mark payment methods as not loaded to trigger a refresh
    setDataLoaded(prev => ({ ...prev, paymentMethods: false }));
    setSuccess(t('profile.billing.paymentMethodAddedSuccessfully'));
  };
  
  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm(t('profile.subscription.cancelConfirmation'))) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('profile.errors.failedToCancelSubscription'));
      }
      
      const data = await response.json();
      setSuccess(data.message);
      
      // Mark subscription as not loaded to trigger a refresh
      setDataLoaded(prev => ({ ...prev, subscription: false }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reactivate subscription
  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('profile.errors.failedToReactivateSubscription'));
      }
      
      const data = await response.json();
      setSuccess(data.message);
      
      // Mark subscription as not loaded to trigger a refresh
      setDataLoaded(prev => ({ ...prev, subscription: false }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update name handler
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('profile.errors.failedToUpdateProfile'));
      }
      
      setSuccess(t('profile.account.profileUpdatedSuccessfully'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    
    if (newPassword.length < 8) {
      setError(t('profile.account.passwordMustBeAtLeast8Characters'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          currentPassword,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('profile.errors.failedToChangePassword'));
      }
      
      setSuccess(t('profile.account.passwordChangedSuccessfully'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add user data deletion handler
  const handleDataDeletion = async () => {
    if (deleteConfirmText !== 'DELETE MY DATA') {
      setError(t('profile.account.pleaseTypeDeleteMyDataExactly'));
      return;
    }
    
    setIsDeletingAccount(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/user/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('profile.errors.failedToDeleteAccountData'));
      }
      
      // Redirect to logout or homepage after successful deletion
      window.location.href = '/logout';
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Language change handler
  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Change language in i18n
      await i18n.changeLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('userLanguage', newLanguage);
      
      // Update language preference on server
      const response = await fetch('https://app.postwand.io/api/user/update-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ language: newLanguage }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('profile.errors.failedToUpdateLanguagePreference'));
      }
      
      setSuccess(t('profile.account.languageUpdatedSuccessfully'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6 bg-[#F8F5FA] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        {user.name ? t('profile.greeting', { name: user.name }) : t('profile.title')}
      </h1>
      <div className="flex bg-[#F8F5FA] gap-4">
      {/* Simple Navbar */}
      <div className="w-1/5 rounded-lg">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-300 bg-white rounded-lg shadow-sm"
        ></div>
        <button 
          className={`z-10 rounded-sm flex-1 flex  items-center w-full px-4 py-1.5 text-gray-600 transition-colors duration-300 ${activeTab === 'account' ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('account')}
        >
          <div className="flex items-center justify-center gap-2">     
            <User size={18} strokeWidth={1.8} className={activeTab === 'account' ? 'text-black' : 'text-gray-500'}/> {t('profile.tabs.account')}
          </div>
        </button>
        <button 
          className={`z-10 rounded-sm flex-1 flex  items-center w-full px-4 py-1.5 text-gray-700 transition-colors duration-300 ${activeTab === 'billing' ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('billing')}
        >
          <div className="flex items-center justify-center gap-2">     
            <FaRegCreditCard size={18} className={activeTab === 'billing' ? 'text-black' : 'text-gray-500'}/> {t('profile.tabs.billing')} 
          </div>
        </button>
        <button 
          className={`z-10 rounded-sm flex-1 flex items-center w-full px-4 py-1.5  text-gray-700 transition-colors duration-300 ${activeTab === 'subscription' ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('subscription')}
        >
          <div className="flex items-center justify-center gap-2">     
            <FaAddressCard size={18} className={activeTab === 'subscription' ? 'text-black' : 'text-gray-500'}/> {t('profile.tabs.subscription')}
          </div>
        </button>
        <button 
          className={`z-10 rounded-sm flex-1 flex items-center w-full px-4 py-1.5 text-gray-700 transition-colors duration-300 ${activeTab === 'usage' ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('usage')}
        >
          <div className="flex items-center justify-center gap-2">     
            <BarChart3 size={18} className={activeTab === 'usage' ? 'text-black' : 'text-gray-500'}/> {t('profile.tabs.usage')}
          </div>
        </button>
        <button 
              className={`z-10 rounded-sm flex-1 flex items-center w-full px-4 py-1.5 text-gray-700 transition-colors duration-300 ${activeTab === 'policy' ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('policy')}
        >
          <div className="flex items-center justify-center gap-2">     
            <BsCreditCard2Front size={18} className={activeTab === 'policy' ? 'text-black' : 'text-gray-500'}/> {t('profile.tabs.policy')}
          </div>
        </button>
      </div>
      
      {/* Success and error messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
   
      <div className="w-4/5">
      {/* Account Info Section */}
      {activeTab === 'account' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('profile.account.title')}</h2>
         
          <form onSubmit={handleNameUpdate}>
            <div className="flex gap-4 w-full">
            <div className="w-1/2">
              <label className="block text-gray-700 mb-2">{t('profile.account.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>

            <div className="w-1/2">
              <label className="block text-gray-700 mb-2">{t('profile.account.email')}</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">{t('profile.account.emailCannotBeChanged')}</p>
            </div>
            </div>

            <button
              type="submit"
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? t('profile.account.updating') : t('profile.account.updateProfile')}
            </button>
          </form>
          
          <hr className="my-6" />
          
          {/* Language Settings */}
          <h3 className="text-lg font-semibold mb-4">{t('profile.account.languageSettings')}</h3>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={18} className="text-gray-500" />
              <label className="text-gray-700">{t('profile.account.preferredLanguage')}</label>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="p-2 border rounded bg-white"
                disabled={isLoading}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              )}
            </div>
          </div>
          
          <hr className="my-6" />
          
          {/* Theme Settings */}
          <h3 className="text-lg font-semibold mb-4">{t('profile.account.themeSettings')}</h3>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(themes).map(([key, theme]) => (
                <div 
                  key={key}
                  onClick={() => applyTheme(key)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    activeTheme === key ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{theme.name}</span>
                    {activeTheme === key && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-200" 
                      style={{ backgroundColor: theme.colors['--bg-primary'] }}
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-200" 
                      style={{ backgroundColor: theme.colors['--bg-secondary'] }}
                    ></div>
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-200" 
                      style={{ backgroundColor: theme.colors['--accent-color'] }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <hr className="my-6" />
          
          <h3 className="text-lg font-semibold mb-4">{t('profile.account.changePassword')}</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="flex gap-4 w-full mb-4">
            <div className="w-1/2">
              <label className="block text-gray-700 mb-2">{t('profile.account.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
            
            <div className="w-1/2">
              <label className="block text-gray-700 mb-2">{t('profile.account.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
            </div>
          
    
            <button
              type="submit"
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? t('profile.account.changing') : t('profile.account.changePassword')}
            </button>
          </form>
          
          <hr className="my-6" />
          
          {/* Add Data Deletion Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">{t('profile.account.deleteAccountData')}</h3>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-700 mb-2">
                {t('profile.account.deleteWarning')}
              </p>
              <p className="text-red-700">
                
              </p>
            </div>
            
            {!showDeleteConfirmation ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                {t('profile.account.deleteMyData')}
              </button>
            ) : (
              <div className="bg-gray-100 p-4 rounded border border-gray-300">
                <p className="font-medium mb-3">
                  {t('profile.account.confirmDeletionText')}
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full p-2 border rounded mb-3"
                  placeholder={t('profile.account.typeDeletMyData')}
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleDataDeletion}
                    disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY DATA'}
                    className={`bg-red-600 text-white px-4 py-2 rounded ${
                      isDeletingAccount || deleteConfirmText !== 'DELETE MY DATA' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-red-700'
                    }`}
                  >
                    {isDeletingAccount ? t('profile.account.deleting') : t('profile.account.confirmDeletion')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setDeleteConfirmText('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    disabled={isDeletingAccount}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Billing Section */}
      {activeTab === 'billing' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('profile.billing.title')}</h2>
          
          {isLoadingSubscription ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">{t('profile.billing.paymentMethod')}</h3>
                
                {paymentMethods.length > 0 ? (
                  <div className="bg-gray-100 p-4 rounded">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="flex items-center">
                        <div className="mr-3">
                          {method.brand === 'visa' ? ' Visa' : 
                           method.brand === 'mastercard' ? ' Mastercard' : 
                           method.brand === 'amex' ? ' Amex' : ''}
                        </div>
                        <div>
                          <div className="capitalize">{method.brand} {t('profile.billing.endingIn')} {method.last4}</div>
                          <div className="text-sm text-gray-500">
                            {t('profile.billing.expires')} {method.exp_month}/{method.exp_year}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded text-gray-500">
                    {t('profile.billing.noPaymentMethodsFound')}
                  </div>
                )}
                
                {isAddingPaymentMethod ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">{t('profile.billing.addNewPaymentMethod')}</h4>
                    <Elements stripe={stripePromise}>
                      <PaymentMethodForm onSuccess={handlePaymentMethodAdded} />
                    </Elements>
                    <button 
                      onClick={() => setIsAddingPaymentMethod(false)}
                      className="text-gray-500 mt-2 text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingPaymentMethod(true)}
                    className="text-blue-500 mt-2 text-sm"
                  >
                    {t('profile.billing.updatePaymentMethod')}
                  </button>
                )}
              </div>
              
              {subscription && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">{t('profile.billing.nextBillingDate')}</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    {formatDate(subscription.current_period_end)}
                    {subscription.cancel_at_period_end && (
                      <div className="text-amber-600 mt-1">
                        {t('profile.billing.subscriptionWillEndOnThisDate')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">{t('profile.billing.billingHistory')}</h3>
                {billingHistory.length > 0 ? (
                  <div className="border rounded">
                    {billingHistory.map(invoice => (
                      <div key={invoice.id} className="flex justify-between p-3 border-b last:border-b-0">
                        <span>{formatDate(invoice.created)}</span>
                        <span>
                          {(invoice.amount_paid).toFixed(2)} 
                          {invoice.currency.toUpperCase()}
                        </span>
                        <a 
                          href={invoice.hosted_invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          {t('profile.billing.view')}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded text-gray-500">
                    {t('profile.billing.noBillingHistoryAvailable')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Subscription Section */}
      {activeTab === 'subscription' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('profile.subscription.title')}</h2>
          
          {isLoadingSubscription ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : subscription ? (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">{t('profile.subscription.currentPlan')}</h3>
                <div className="bg-gray-100 p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <span>{t('profile.subscription.plan')}:</span>
                    <span className="font-semibold">{subscription.plan.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>{t('profile.subscription.price')}:</span>
                    <span className="font-semibold">
                      ${subscription.plan.amount.toFixed(2)}/{subscription.plan.interval}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('profile.subscription.status')}:</span>
                    <span className={`font-semibold ${
                      subscription.cancel_at_period_end 
                        ? 'text-amber-600' 
                        : subscription.status === 'active' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      {subscription.cancel_at_period_end 
                        ? t('profile.subscription.cancelsAtPeriodEnd') 
                        : subscription.status === 'active' 
                          ? t('profile.subscription.active') 
                          : t('profile.subscription.inactive')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Link
                  to="/pricing-tiers"
                  className="bg-blue-500 text-center text-white px-4 py-2 rounded hover:text-white hover:bg-blue-600"
                >
                  {t('profile.subscription.upgradePlan')}
                </Link>
                
                {subscription.cancel_at_period_end ? (
                  <button 
                    onClick={handleReactivateSubscription}
                    className="border border-green-500 text-green-500 px-4 py-2 rounded hover:bg-green-50"
                    disabled={isLoading}
                  >
                    {isLoading ? t('profile.billing.processing') : t('profile.subscription.reactivateSubscription')}
                  </button>
                ) : (
                  <button 
                    onClick={handleCancelSubscription}
                    className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t('profile.billing.processing') : t('profile.subscription.cancelSubscription')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="mb-6">
              <div className="bg-gray-100 p-4 rounded mb-4">
                <p className="text-gray-500">{t('profile.subscription.noActiveSubscription')}</p>
              </div>
              
              <Link
                to="/pricing-tiers"
                className="bg-blue-500 text-center block w-full text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t('profile.subscription.subscribeNow')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Usage Section */}
      {activeTab === 'usage' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('profile.usage.title')}</h2>
          <p className="text-gray-600 mb-4">
            {t('profile.usage.description')}
          </p>
          <TokenUsage />
        </div>
      )}

      {/* Legal Policies Section */}
      {activeTab === 'policy' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">{t('profile.legal.title')}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{t('profile.legal.privacyPolicy')}</h3>
              <p className="text-gray-600 mb-3">
                {t('profile.legal.privacyPolicyDescription')}
              </p>
              <Link 
                to="/privacy-policy"
                className="inline-flex items-center text-blue-500 hover:text-blue-700"
              >
                <span>{t('profile.legal.readPrivacyPolicy')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-2">{t('profile.legal.termsConditions')}</h3>
              <p className="text-gray-600 mb-3">
                {t('profile.legal.termsConditionsDescription')}
              </p>
              <div className="space-y-2">
                <Link 
                  to="/terms-conditions"
                  className="inline-flex items-center text-blue-500 hover:text-blue-700"
                >
                  <span>{t('profile.legal.readTermsConditions')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default Profile;
