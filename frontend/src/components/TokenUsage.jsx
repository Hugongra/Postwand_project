import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '@services/api/config_url.js';
import { getAuthorizationHeaderAsync } from '@services/api/authTokens';

const TokenUsage = () => {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState({
    grok: { tokens_used: 0, max_tokens: 50000, percentage: 0 },
    image: { tokens_used: 0, max_tokens: 50, percentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        const authHeaders = await getAuthorizationHeaderAsync();
        const response = await fetch(`${API_BASE_URL}/api/usage/tokens`, {
          headers: { ...authHeaders },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch token usage');
        }
        
        const data = await response.json();
        setUsageData(data);
      } catch (err) {
        console.error('Error fetching token usage:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenUsage();
    const interval = setInterval(fetchTokenUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500">{t('profile.usage.errorTitle') || 'Unable to load usage data'}</p>
      </div>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getTextColor = (percentage) => {
    if (percentage >= 90) return 'text-red-700';
    if (percentage >= 75) return 'text-orange-700';
    return 'text-gray-700';
  };

  const UsageBar = ({ label, data, color }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${getTextColor(data?.percentage || 0)}`}>
          {data?.percentage || 0}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor(data?.percentage || 0)}`}
            style={{ width: `${Math.min(data?.percentage || 0, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 min-w-[120px] text-right">
          {formatNumber(data?.tokens_used)} / {formatNumber(data?.max_tokens)}
        </span>
      </div>
    </div>
  );

  const maxPercentage = Math.max(
    usageData.grok?.percentage || 0,
    usageData.image?.percentage || 0
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('profile.usage.tokenUsage') || 'Token Usage'}</h3>
        {maxPercentage >= 75 && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            maxPercentage >= 90 
              ? 'bg-red-100 text-red-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {maxPercentage >= 90 ? t('profile.usage.nearLimit') || 'Near Limit' : t('profile.usage.approachingLimit') || 'High Usage'}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <UsageBar 
          label={t('profile.usage.textTokens') || 'Text Tokens'}
          data={usageData.grok}
          color="blue"
        />
        <UsageBar 
          label={t('profile.usage.imageTokens') || 'Image Tokens'}
          data={usageData.image}
          color="green"
        />
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {t('profile.usage.resetsMonthly') || 'Usage resets monthly'}
        </p>
      </div>
    </div>
  );
};

export default TokenUsage; 