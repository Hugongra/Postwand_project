import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './config_url.js';

const TokenUsage = () => {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState({
    grok: { tokens_used: 0, max_tokens: 50000, percentage: 0 },
    claude: { tokens_used: 0, max_tokens: 100000, percentage: 0 },
    image: { tokens_used: 0, max_tokens: 50, percentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/usage/tokens`, {
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
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenUsage, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Format numbers with commas - add null/undefined check
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-red-100">
        <h3 className="text-lg font-semibold text-red-600">{t('usage.errorTitle')}</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // Determine color based on usage percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate total usage across all token types
  const getTotalUsage = () => {
    const totalUsed = (usageData.grok?.tokens_used || 0) + 
                     (usageData.claude?.tokens_used || 0) + 
                     (usageData.image?.tokens_used || 0);
    const totalMax = (usageData.grok?.max_tokens || 0) + 
                    (usageData.claude?.max_tokens || 0) + 
                    (usageData.image?.max_tokens || 0);
    const totalPercentage = totalMax > 0 ? Math.round((totalUsed / totalMax) * 100 * 10) / 10 : 0;
    
    return { totalUsed, totalMax, totalPercentage };
  };

  const { totalUsed, totalMax, totalPercentage } = getTotalUsage();

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{t('usage.tokenUsage')}</h3>
      
      {/* Overall Usage Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">{t('usage.totalUsage') || 'Total Usage'}</h4>
        <div className="flex justify-between text-sm mb-1">
          <span>{formatNumber(totalUsed)} / {formatNumber(totalMax)} {t('usage.tokens') || 'tokens'}</span>
          <span>{totalPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getProgressColor(totalPercentage)}`} 
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Individual Token Types */}
      <div className="space-y-3">
        {/* Grok Usage */}
        <div className="border-l-4 border-blue-500 pl-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-700">Grok {t('usage.tokens') || 'Tokens'}</span>
            <span className="text-xs text-gray-500">{usageData.grok?.percentage || 0}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{formatNumber(usageData.grok?.tokens_used)} / {formatNumber(usageData.grok?.max_tokens)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${getProgressColor(usageData.grok?.percentage || 0)}`} 
              style={{ width: `${Math.min(usageData.grok?.percentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Claude Usage */}
        <div className="border-l-4 border-purple-500 pl-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-purple-700">Claude {t('usage.tokens') || 'Tokens'}</span>
            <span className="text-xs text-gray-500">{usageData.claude?.percentage || 0}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{formatNumber(usageData.claude?.tokens_used)} / {formatNumber(usageData.claude?.max_tokens)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${getProgressColor(usageData.claude?.percentage || 0)}`} 
              style={{ width: `${Math.min(usageData.claude?.percentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Image Usage */}
        <div className="border-l-4 border-green-500 pl-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-green-700">Image {t('usage.tokens') || 'Tokens'}</span>
            <span className="text-xs text-gray-500">{usageData.image?.percentage || 0}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{formatNumber(usageData.image?.tokens_used)} / {formatNumber(usageData.image?.max_tokens)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${getProgressColor(usageData.image?.percentage || 0)}`} 
              style={{ width: `${Math.min(usageData.image?.percentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Warning Messages */}
      {totalPercentage >= 90 && (
        <div className="mt-3 text-sm text-red-600">
          <p>{t('usage.nearLimit') || 'You are approaching your usage limit'}</p>
        </div>
      )}
      
      {totalPercentage >= 75 && totalPercentage < 90 && (
        <div className="mt-3 text-sm text-yellow-600">
          <p>{t('usage.approachingLimit') || 'You are approaching your usage limit'}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>{t('usage.resetsMonthly') || 'Usage resets monthly'}</p>
      </div>
    </div>
  );
};

export default TokenUsage; 