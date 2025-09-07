import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TokenUsage = () => {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState({
    tokens_used: 0,
    max_tokens: 200000,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://app.postwand.io/api/usage/tokens', {
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

  // Format numbers with commas
  const formatNumber = (num) => {
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
  const getProgressColor = () => {
    if (usageData.percentage >= 90) return 'bg-red-500';
    if (usageData.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-2">{t('usage.tokenUsage')}</h3>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{formatNumber(usageData.tokens_used)} / {formatNumber(usageData.max_tokens)} {t('usage.tokens')}</span>
          <span>{usageData.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getProgressColor()}`} 
            style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {usageData.percentage >= 90 && (
        <div className="mt-3 text-sm text-red-600">
          <p>{t('usage.nearLimit')}</p>
        </div>
      )}
      
      {usageData.percentage >= 75 && usageData.percentage < 90 && (
        <div className="mt-3 text-sm text-yellow-600">
          <p>{t('usage.approachingLimit')}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>{t('usage.resetsMonthly')}</p>
      </div>
    </div>
  );
};

export default TokenUsage; 