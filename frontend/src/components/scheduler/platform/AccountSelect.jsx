import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const AccountSelect = ({ platform, selectedPages, setSelectedPages, socialAccounts }) => {
    // Filter accounts for the current platform
    const platformAccounts = socialAccounts.filter(account => account.platform === platform);
    const hasAccounts = platformAccounts.length > 0;
    const { t } = useTranslation();
    
   
    return (
        <div className="space-y-1">
          
        {hasAccounts ? (
          <Select 
            value={selectedPages[platform]?.toString() || ''} 
            onValueChange={(value) => {
              if (platform === 'youtube') {
                console.log('YouTube account selected:', { platform, value, selectedPages });
              }
              setSelectedPages(prev => ({
                ...prev,
                [platform]: value
              }));
            }}
          >
              <SelectTrigger className="w-full border rounded-md h-10 px-3 bg-white">
                <SelectValue placeholder={t('social.chooseAccount', { platform: platform })} />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-md">
              {platformAccounts.map((account) => {
                  const displayName = account.name || account.username || 'Account';
                  const firstLetter = displayName.charAt(0).toUpperCase();
                  
                  return (
                    <SelectItem key={account.id_} value={account.id_.toString()} className="py-2 px-8 cursor-pointer bg-white">
                      <div className="flex items-center space-x-3">
                        {account.profile_picture ? (
                          <img 
                            src={account.profile_picture}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            platform === 'facebook' ? 'bg-blue-500' :
                            platform === 'instagram' ? 'bg-purple-500' :
                            platform === 'youtube' ? 'bg-red-500' :
                            platform === 'linkedin' ? 'bg-blue-700' :
                            'bg-black'
                          }`}
                          style={{ display: account.profile_picture ? 'none' : 'flex' }}
                        >
                          {firstLetter}
                        </div>
                        <span>{displayName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-full border rounded-md h-10 px-3 flex items-center justify-center space-x-1 text-gray-600 bg-gray-50">
            <span>{t('social.noAccountsConnected')}</span>
            <Link to="/social-accounts" className="text-pink-500 hover:text-pink-600 font-medium">
              {t('social.connectAccount')} →
            </Link>
          </div>
        )}
      </div>
    )
}

export default AccountSelect;