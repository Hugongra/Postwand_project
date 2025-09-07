import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bell, Shield, CreditCard, Globe, Menu, X, BarChart3 } from 'lucide-react';
import TokenUsage from './TokenUsage';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Languages available in the application
  const languages = [
    { code: 'en', name: t('settings.languages.en'), flag: '🇺🇸' },
    { code: 'es', name: t('settings.languages.es'), flag: '🇪🇸' },
  ];

  // Function to change language
  const changeLanguage = (languageCode) => {
    console.log('Changing language to:', languageCode);
    i18n.changeLanguage(languageCode);
    // Save to localStorage for persistence
    localStorage.setItem('userLanguage', languageCode);
  };

  // Navigation items
  const navItems = [
    { id: 'account', icon: <User className="h-5 w-5" />, label: t('settings.account') },
    { id: 'language', icon: <Globe className="h-5 w-5" />, label: t('settings.language') },
    { id: 'notifications', icon: <Bell className="h-5 w-5" />, label: t('settings.notifications') },
    { id: 'security', icon: <Shield className="h-5 w-5" />, label: t('settings.security') },
    { id: 'billing', icon: <CreditCard className="h-5 w-5" />, label: t('settings.billing') },
    { id: 'usage', icon: <BarChart3 className="h-5 w-5" />, label: t('settings.usage') },
  ];

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('navigation.settings')}</h1>
          <button 
            className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={toggleMobileMenu}></div>
        )}

        {/* Sidebar Navigation */}
        <aside 
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 fixed md:sticky top-0 z-50 md:z-0 h-full w-64 bg-white border-r border-gray-200
            transition-transform duration-300 ease-in-out
          `}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors
                  ${activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'}
                `}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span className={`mr-3 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.account')}</h2>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                    <input 
                      type="email" 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                      disabled 
                      value="user@example.com" 
                    />
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    {t('settings.changePassword')}
                  </button>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.language')}</h2>
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.timezone')}
                  </label>
                  <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>America/New_York (Eastern Time)</option>
                    <option>America/Chicago (Central Time)</option>
                    <option>America/Denver (Mountain Time)</option>
                    <option>America/Los_Angeles (Pacific Time)</option>
                    <option>Europe/London (GMT)</option>
                    <option>Europe/Paris (Central European Time)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.notifications')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{t('messages.postPublished')}</p>
                      <p className="text-sm text-gray-500">Get notified when your post is published</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{t('messages.postScheduled')}</p>
                      <p className="text-sm text-gray-500">Get notified when your post is scheduled</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.security')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{t('settings.twoFactorAuth')}</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      {t('common.enable')}
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="font-medium text-gray-700">{t('settings.connectedAccounts')}</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t('social.platforms.facebook')}</span>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          {t('settings.disconnect')}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t('social.platforms.instagram')}</span>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          {t('settings.connectAccount')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.billing')}</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">Free Plan</p>
                        <p className="text-sm text-gray-500">Basic features</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    {t('settings.subscription')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Usage Settings */}
            {activeTab === 'usage' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.apiUsage')}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('settings.apiUsageDescription', 'Monitor your API token usage for this billing period. Your usage resets at the beginning of each billing cycle.')}
                </p>
                <TokenUsage />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings; 