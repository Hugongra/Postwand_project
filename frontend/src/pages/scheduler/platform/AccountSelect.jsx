import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const AccountSelect = ({ platform, selectedAccounts, setSelectedAccounts, socialAccounts }) => {
    const { t } = useTranslation();
    
    // Get platform data
    const platformData = socialAccounts[platform] || {};
    
    // Extract accounts array - different platforms use different key names
    const platformAccounts = platformData.pages || platformData.accounts || platformData.channels || [];
    
    const platformColors = {
        facebook: 'bg-blue-500',
        instagram: 'bg-purple-500', 
        youtube: 'bg-red-500',
        linkedin: 'bg-blue-700'
    };

    const AccountAvatar = ({ account }) => {
        const displayName = account.name || account.username || 'Account';
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        return account.profilePicture ? (
            <img src={account.profilePicture} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${platformColors[platform] || 'bg-black'}`}>
                {firstLetter}
            </div>
        );
    };

    return (
        <div className="space-y-1">
            {platformAccounts.length > 0 ? (
                <Select 
                    value={selectedAccounts[platform]?.toString() || ''} 
                    onValueChange={(value) => {
                       setSelectedAccounts(prev => ({ ...prev, [platform]: value }));
                    }}
                >
                    <SelectTrigger className="w-full border rounded-lg h-10 px-3 bg-white">
                        <SelectValue placeholder={t('social.chooseAccount', { platform })} />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-lg">
                        {platformAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()} className="py-2 px-8 cursor-pointer bg-white">
                                <div className="flex items-center space-x-3">
                                    <AccountAvatar account={account} />
                                    <span>{account.name || account.username || 'Account'}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <div className="flex items-center justify-center text-gray-600 space-x-1">
                    <span>{t('social.noAccountsConnected')}</span>
                    <Link to="/integrations" className="text-pink-500 hover:text-pink-600 font-medium">
                        {t('social.connectAccount')} →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default AccountSelect;