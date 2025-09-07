import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next';
import postIcon from '/images/posts_icon.svg';
import impressionsIcon from '/images/views_icon.svg';
import followersIcon from '/images/impressions_icon.svg';

  
const InstagramInsights = ({ instagramData }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState('day');
  const [selectedTab, setSelectedTab] = useState('account');
  const [mediaList, setMediaList] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    // Initialize selected account when instagramData is loaded
    if (instagramData && instagramData.accounts && instagramData.accounts.length > 0) {
      setSelectedAccount(instagramData.accounts[0].account_id);
    }
  }, [instagramData]);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountInsights();
    }
  }, [period, selectedAccount]);

  const fetchAccountInsights = async () => {
    if (!instagramData || !selectedAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://threads-dev.local:5000/api/instagram/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period: period,
          account_id: selectedAccount
        }),
        credentials: 'include'
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram insights');
      }
      
      const data = await response.json();
      console.log("Instagram insights data:", data);
      setInsights(data);
      setMediaList(data.media || []);
      
      // If we have media and no selected media yet, select the first one
      if (data.media && data.media.length > 0 && !selectedMedia) {
        setSelectedMedia(data.media[0].id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching Instagram insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedMediaInsights = () => {
    if (!insights || !insights.media) return null;
    return insights.media.find(m => m.id === selectedMedia);
  };

  const getSelectedAccountName = () => {
    if (insights && insights.username) {
      return insights.username;
    }
    
    if (!instagramData || !instagramData.accounts) return 'Your Account';
    
    const account = instagramData.accounts.find(a => a.account_id === selectedAccount);
    return account ? account.username || account.name : 'Your Account';
  };

  // Get summary metrics for the dashboard
  const getSummaryMetrics = () => {
    const metrics = [
      { 
        icon: postIcon,
        value: mediaList.length || 0, 
        label: "Total Posts",
        color: "bg-white" 
      }
    ];

    // Add metrics from account insights if available
    if (insights && insights.account_insights && insights.account_insights.length > 0) {
      insights.account_insights.forEach(insight => {
        if (insight.name === "reach") {
          const value = insight.values && insight.values[0] ? insight.values[0].value : 0;
          metrics.push({
            icon: impressionsIcon, 
            value: value,
            label: "Impressions",
            percentage: "", // Placeholder percentage
            color: "bg-white"
          });
        }
        if (insight.name === "follower_count") {
          const value = insight.values && insight.values[0] ? insight.values[0].value : 0;
          metrics.push({
            icon: followersIcon, 
            value: value,
            label: "New Followers",
            color: "bg-white"
          });
        }
      });
    }

    // Add profile views metric (placeholder)
    metrics.push({
      icon: "views_icon.svg", 
      value: 0, 
      label: "Profile Views",
      color: "bg-white"
    });

    return metrics;
  };

  const handleRefresh = () => {
    fetchAccountInsights();
  };

  const formatDate = () => {
    const date = new Date();
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="container mx-auto p-4">
      
      
    
      <div className="h-28 flex flex-col py-4 px-4 mb-1 rounded-lg bg-gray-100/80">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-medium text-pink-500">
            {t('insights.insightsTitle')}
          </h1>
     
            <div className="flex space-x-2">
              {/* Account selector */}
              {instagramData && instagramData.accounts && instagramData.accounts.length > 1 && (
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-white w-[180px] p-2">
                    {instagramData.accounts.map(account => (
                      <SelectItem key={account.account_id} value={account.account_id}>
                       <div className="flex items-center space-x-3">
                        {account.profile_picture ? (
                          <img 
                            src={account.profile_picture}
                            alt={account.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            'bg-purple-500' 
                          }`}
                          style={{ display: account.profile_picture ? 'none' : 'flex' }}
                        >
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{account.name}</span>
                      </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Period selector */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-white w-[100px] p-2 text-md">
                  <SelectItem value="day">{t('insights.daily')}</SelectItem>
                  <SelectItem value="week">{t('insights.weekly')}</SelectItem>
                  <SelectItem value="month">{t('insights.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
       
              </div>
        
      </div>

      {!instagramData || !instagramData.accounts || instagramData.accounts.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="text-center p-6">
            <p className="mb-4">{t('insights.connectYourInstagramAccountToViewInsights')}</p>
            <Button>{t('insights.connectInstagram')}</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-red-500 p-4 text-center">{error}</CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Section */}
          <Card className="mb-6 bg-[#FDFDFD] border-none">
            <h2 className="text-2xl font-bold pt-6 pl-6 pb-0 mb-0">{t('insights.summary')}</h2>
            <CardContent className="pt-0 mt-4">
              <div className="w-full flex flex-row rounded-lg"  style={{boxShadow: "0px 0px 6px 0px rgba(0, 0, 0, 0.1)"}}>
                {getSummaryMetrics().map((metric, index) => (
                  <div key={index} className={`px-8 py-4 w-1/3  ${metric.color} flex items-center  ${index === 0 ? "rounded-l-lg" : ""}  ${index === 2 ? "rounded-r-lg" : ""} ${index === 2 ? "border-l" : "border-r"}`}>
                    <img src={metric.icon} alt={metric.label} className={`w-10 h-10  ${index === 0 ? "" : "mr-2"}`} />
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-semibold">{metric.value}</span>
                        {metric.percentage && (
                          <span className="ml-2 text-sm text-green-600">{metric.percentage}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">{metric.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{t('insights.bestPerformingPosts')}</CardTitle>
                <CardDescription>
                  {t('insights.seeWhichPostsHaveTheBestEngagement')}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('insights.refresh')}
              </Button>
            </CardHeader>
            <CardContent>
              {mediaList.length === 0 ? (
                <div className="text-center p-6">
                  <p>{t('insights.noPostsAvailableToDisplay')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {mediaList.slice(0, 5).map((media) => (
                    <div key={media.id} className="relative rounded-sm overflow-hidden bg-black h-auto flex items-center justify-center">
                      {media.media_type === 'VIDEO' ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img 
                            src={media.thumbnail_url || media.media_url} 
                            alt="Instagram video" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <polygon points="5,3 19,12 5,21" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={media.media_url} 
                          alt="Instagram post" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = media.thumbnail_url || '/images/placeholder.png';
                          }}
                        />
                      )}
                     
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default InstagramInsights;