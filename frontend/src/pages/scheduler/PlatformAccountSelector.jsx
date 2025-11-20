import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const PlatformAccountSelector = ({ platform, socialAccounts, postData, setPostData }) => {
    const { t } = useTranslation();

    const platformColors = {
        facebook: 'bg-blue-500',
        instagram: 'bg-purple-500', 
        youtube: 'bg-red-500',
        linkedin: 'bg-blue-700',
        tiktok: 'bg-black',
        threads: 'bg-gray-800'
    };

    const AccountAvatar = ({ account, platform }) => {
        const displayName = account.name || account.username || 'Account';
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        return account.profilePicture ? (
            <img src={account.profilePicture} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold ${platformColors[platform] || 'bg-black'}`}>
                {firstLetter}
            </div>
        );
    };

    const getPlatformAccounts = (platform) => {
        if (!socialAccounts[platform]) return [];
        return socialAccounts[platform].accounts || [];
    };

    if (platform === '') return null;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                {t('social.selectPlatformAccount')}
            </label>           
              
                <div className="space-y-1">
                    {getPlatformAccounts(platform).length > 0 ? (
                        <Select 
                            value={postData?.platforms?.[platform]?.accountId?.toString() || ''} 
                            onValueChange={(value) => {
                                setPostData(prev => ({
                                    ...prev,
                                    platforms: {
                                        ...prev.platforms,
                                        [platform]: {
                                            ...prev.platforms[platform],
                                            accountId: value
                                        }
                                    }
                                }));
                            }}
                        >
                            <SelectTrigger className="border rounded-lg px-3 bg-white">
                                <SelectValue placeholder={t('social.chooseAccount', { platform: platform })} />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-lg">
                                {getPlatformAccounts(platform).map((account) => (
                                    <SelectItem 
                                        key={account.id} 
                                        value={account.account_id.toString()} 
                                        className="py-2 px-8 cursor-pointer bg-white"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <AccountAvatar account={account} platform={platform} />
                                            <span>{account.name || account.username || 'Account'}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center justify-center text-gray-600 space-x-1 text-sm">
                            <span>{t('social.noAccountsConnected')}</span>
                            <Link to="/integrations" className="text-pink-500 hover:text-pink-600 font-normal">
                                {t('social.connectAccount')} →
                            </Link>
                        </div>
                    )}
                </div>
     
        </div>
    );
};

export default PlatformAccountSelector;

