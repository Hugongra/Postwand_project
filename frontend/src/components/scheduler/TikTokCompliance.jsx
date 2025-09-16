import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config_url.js';

const TikTokCompliance = ({ 
  selectedAccount, 
  onPrivacyChange, 
  onInteractionChange,
  onCommercialContentChange,
  postType = 'video',
  videoUrl = null
}) => {
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
  const [interactions, setInteractions] = useState({
    allowComment: false,
    allowDuet: false,
    allowStitch: false
  });
  const [commercialContent, setCommercialContent] = useState({
    enabled: false,
    yourBrand: false,
    brandedContent: false
  });

  // Stable API fetch function
  const fetchCreatorInfo = useCallback(async () => {
    if (!selectedAccount?.account_id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tiktok/creator-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ account_id: selectedAccount.account_id })
      });

      const data = await response.json();
      if (data.success) {
        setCreatorInfo(data.data);
      } else {
        setError(data.error || 'Failed to fetch creator info');
      }
    } catch (err) {
      setError('Network error while fetching creator info');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount?.account_id]);

  // Fetch creator info when account changes
  useEffect(() => {
    if (selectedAccount?.account_id) {
      fetchCreatorInfo();
    }
  }, [selectedAccount?.account_id, fetchCreatorInfo]);

  // Stable parent communication effects
  useEffect(() => {
    if (onPrivacyChange) {
      onPrivacyChange(privacyLevel);
    }
  }, [privacyLevel, onPrivacyChange]);

  useEffect(() => {
    if (onInteractionChange) {
      onInteractionChange(interactions);
    }
  }, [interactions, onInteractionChange]);

  useEffect(() => {
    if (onCommercialContentChange) {
      onCommercialContentChange(commercialContent);
    }
  }, [commercialContent, onCommercialContentChange]);

  const getConsentText = () => {
    if (commercialContent.enabled) {
      if (commercialContent.brandedContent) {
        return "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.";
      }
    }
    return "By posting, you agree to TikTok's Music Usage Confirmation.";
  };

  if (!selectedAccount) return null;

  return (
    <div className="space-y-4 rounded-lg p-4">
      <h3 className="font-medium text-gray-900">TikTok Settings</h3>
      
      {/* Creator Info Display */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading creator info...</div>
      ) : error ? (
        <div className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      ) : creatorInfo ? (
        <div className="text-sm text-gray-700">
          <div className="font-medium">Posting to: @{creatorInfo.display_name}</div>
          {!creatorInfo.can_post && (
            <div className="text-red-600 mt-1">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Cannot post at this time. Try again later.
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          Selected account: {selectedAccount.name}
        </div>
      )}

      {/* Privacy Level Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Privacy Level <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPrivacyDropdownOpen(!isPrivacyDropdownOpen)}
            className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md text-sm flex items-center justify-between"
          >
            <span className={privacyLevel ? "text-gray-900" : "text-gray-500"}>
              {privacyLevel || "Select privacy level..."}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isPrivacyDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isPrivacyDropdownOpen && creatorInfo?.privacy_level_options && (
            <div className="absolute z-1 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {creatorInfo.privacy_level_options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPrivacyLevel(option);
                    setIsPrivacyDropdownOpen(false);
                    
                    // Handle branded content privacy restrictions
                    if (option === 'SELF_ONLY' && commercialContent.brandedContent) {
                      setCommercialContent(prev => ({ ...prev, brandedContent: false }));
                    }
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  {option.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Interaction Settings</label>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={interactions.allowComment}
              onChange={(e) => setInteractions(prev => ({ ...prev, allowComment: e.target.checked }))}
              disabled={creatorInfo?.comment_disabled}
              className="mr-2"
            />
            <span className={`text-sm ${creatorInfo?.comment_disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              Allow Comments
            </span>
          </label>
          
          {postType === 'video' && (
            <>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={interactions.allowDuet}
                  onChange={(e) => setInteractions(prev => ({ ...prev, allowDuet: e.target.checked }))}
                  disabled={creatorInfo?.duet_disabled}
                  className="mr-2"
                />
                <span className={`text-sm ${creatorInfo?.duet_disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  Allow Duet
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={interactions.allowStitch}
                  onChange={(e) => setInteractions(prev => ({ ...prev, allowStitch: e.target.checked }))}
                  disabled={creatorInfo?.stitch_disabled}
                  className="mr-2"
                />
                <span className={`text-sm ${creatorInfo?.stitch_disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  Allow Stitch
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Commercial Content Disclosure */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={commercialContent.enabled}
            onChange={(e) => setCommercialContent(prev => ({ 
              ...prev, 
              enabled: e.target.checked,
              yourBrand: e.target.checked ? prev.yourBrand : false,
              brandedContent: e.target.checked ? prev.brandedContent : false
            }))}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Content Disclosure - Promote brand, product or service
          </span>
        </label>

        {commercialContent.enabled && (
          <div className="ml-6 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={commercialContent.yourBrand}
                onChange={(e) => setCommercialContent(prev => ({ ...prev, yourBrand: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Your brand</span>
            </label>
            {commercialContent.yourBrand && (
              <div className="text-xs text-blue-600 ml-5">
                Your photo/video will be labeled as 'Promotional content'
              </div>
            )}
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={commercialContent.brandedContent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCommercialContent(prev => ({ ...prev, brandedContent: checked }));
                  
                  // Auto-switch privacy if selecting branded content with private privacy
                  if (checked && privacyLevel === 'SELF_ONLY') {
                    const publicOptions = creatorInfo?.privacy_level_options?.filter(opt => opt !== 'SELF_ONLY');
                    if (publicOptions?.length > 0) {
                      setPrivacyLevel(publicOptions[0]);
                    }
                  }
                }}
                disabled={privacyLevel === 'SELF_ONLY'}
                className="mr-2"
              />
              <span className={`text-sm ${privacyLevel === 'SELF_ONLY' ? 'text-gray-400' : 'text-gray-700'}`}>
                Branded content
              </span>
            </label>
            {commercialContent.brandedContent && (
              <div className="text-xs text-blue-600 ml-5">
                Your photo/video will be labeled as 'Paid partnership'
              </div>
            )}
            {privacyLevel === 'SELF_ONLY' && (
              <div className="text-xs text-gray-500 ml-5">
                Branded content visibility cannot be set to private
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consent Declaration */}
      <div className="p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          {getConsentText()}
        </p>
      </div>

      {/* Video Duration Info */}
      {postType === 'video' && creatorInfo?.max_video_duration_sec && (
        <div className="text-xs text-gray-500">
          Maximum video duration: {creatorInfo.max_video_duration_sec} seconds
        </div>
      )}
    </div>
  );
};

export default TikTokCompliance;