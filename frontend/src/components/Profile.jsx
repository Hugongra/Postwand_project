import { useState, useEffect } from 'react';
import { BsCreditCard2Front } from "react-icons/bs";
import { User, Globe, BarChart3, ArrowRight } from "lucide-react";
import { FaRegCreditCard } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TokenUsage from '@components/TokenUsage';
import * as api from '@services/api/api.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Profile = ({ user }) => {
  const { t, i18n } = useTranslation();
  
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(user.language || i18n.language || 'en');
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [activeTab, setActiveTab] = useState('account');
  
  const handleManageBilling = async () => {
    setIsLoading(true);
    setError('');
    
      const response = await api.CreatePortalSession();
      if (!response.ok) {
        setError(response.data.error || 'Failed to access billing portal');
        setIsLoading(false);
        return;
      }
      window.location.href = response.data.url;
  };
  


  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const response = await api.UpdateUserProfile(name);
    if (!response.ok) {
      setError(response.data.error || t('profile.errors.failedToUpdateProfile'));
      setIsLoading(false);
      return;
    }
    
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setIsLoading(false);
    window.dispatchEvent(new Event('user_logged_in'));
  };
  
  const handleDataDeletion = async () => {
    if (deleteConfirmText !== 'DELETE MY DATA') {
      setError(t('profile.account.pleaseTypeDeleteMyDataExactly'));
      return;
    }
    
    setIsDeletingAccount(true);
    setError('');
    
    const response = await api.DeleteUserData();
    if (!response.ok) {
      setError(response.data.error || t('profile.errors.failedToDeleteAccountData'));
      setIsDeletingAccount(false);
      setShowDeleteConfirmation(false);
      return;
    }
    window.location.href = '/logout';
   
  };

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    setIsLoading(true);
    setError('');
    
    await i18n.changeLanguage(newLanguage);
    
    const response = await api.UpdateUserLanguage(newLanguage);
    if (!response.ok) {
      setError(response.data.error || t('profile.errors.failedToUpdateLanguagePreference'));
      setIsLoading(false);
      return;
    }
    
    const updatedUser = { ...user, language: newLanguage };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user_logged_in'));
    
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setError('');
      }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const tabs = [
    { id: 'account', icon: User, label: t('profile.tabs.account')},
    { id: 'billing', icon: FaRegCreditCard, label: t('profile.tabs.billing') },
    { id: 'usage', icon: BarChart3, label: t('profile.tabs.usage') },
    { id: 'policy', icon: BsCreditCard2Front, label: t('profile.tabs.policy') }
  ]

  return (
    <div className="w-full mx-auto p-1 bg-primary min-h-screen">
      <h1 className="text-2xl font-semibold p-6">
        {user.name ? t('profile.greeting', { name: user.name }) : t('profile.title')}
      </h1>
      <div className="flex bg-primary gap-2">
      {/* Simple Navbar */}
      <div className="w-1/5 rounded-lg">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-300 bg-white rounded-lg shadow-sm"
        ></div>
       {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              className={`z-10 rounded-lg flex-1 flex items-center w-full px-4 py-1.5 transition-colors duration-300 ${isActive ? 'text-black bg-[#F5E3F8]' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center justify-center gap-2 text-sm">     
                <Icon size={18} className={isActive ? 'text-black' : 'text-gray-500'}/> {tab.label}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="w-4/5 rounded-lg">
      {/* Account Info Section */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {activeTab === 'account' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg text-sm space-y-6">
          <h2 className="text-lg">{t('profile.account.title')}</h2>
         
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
                value={user.email}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">{t('profile.account.emailCannotBeChanged')}</p>
            </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300"
              
            >
              {isLoading ? t('profile.account.updating') : t('profile.account.updateProfile')}
            </button>
          </form>
          
          {/* Language Settings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={18} className="text-gray-500" />
              <label className="text-gray-700">{t('profile.account.preferredLanguage')}</label>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={language}
                onValueChange={handleLanguageChange}
                disabled={isLoading}
              
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                    <SelectContent className="w-[100px]">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        
          {/* Add Data Deletion Section */}
          <div className="space-y-4">
            <h3 className="text-lg">{t('profile.account.deleteAccountData')}</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 mb-2">
                {t('profile.account.deleteWarning')}
              </p>
            
            </div>
            
            {!showDeleteConfirmation ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
              >
                {t('profile.account.deleteMyData')}
              </button>
            ) : (
              <div className="bg-gray-100 p-4 rounded border border-gray-300">
                <p className="text-lg">
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
                    className={`bg-red-600 text-white px-3 py-1.5 rounded ${
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
        <div className="bg-[#FDFDFD] p-6 rounded-lg text-sm ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg">{t('profile.billing.title')}</h2>
           
          </div>
          <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('profile.billing.processing') : 'Manage Billing'}
            </button>
        </div>
      )}

      {/* Usage Section */}
      {activeTab === 'usage' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg text-sm">
          <h2 className="text-lg mb-4">{t('profile.usage.title')}</h2>
          <p className="text-gray-600 mb-4">
            {t('profile.usage.description')}
          </p>
          <TokenUsage />
        </div>
      )}

      {/* Legal Policies Section */}
      {activeTab === 'policy' && (
        <div className="bg-[#FDFDFD] p-6 rounded-lg text-sm">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg">{t('profile.legal.privacyPolicy')}</h2>
              <p className="text-gray-600">{t('profile.legal.privacyPolicyDescription')} </p>
              <Link 
                to="/privacy-policy"
                className="flex items-center gap-1 text-blue-500"
              >
                <span>{t('profile.legal.readPrivacyPolicy')}</span>
                <ArrowRight
                    size={18}
                    className="text-blue-500"
                  />
              </Link>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg">{t('profile.legal.termsConditions')}</h3>
              <p className="text-gray-600">{t('profile.legal.termsConditionsDescription')} </p>
          
                <Link 
                  to="/terms-conditions"
                  className="flex items-center gap-1 text-blue-500"
                >
                  <span>{t('profile.legal.readTermsConditions')}</span>
                  <ArrowRight
                    size={18} 
                  />
                </Link>
         
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
