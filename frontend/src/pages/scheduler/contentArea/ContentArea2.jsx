import { Textarea } from '@/components/ui/textarea';
import TikTokCompliance from './components/TikTokCompliance';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Youtube from './components/platfrom/youtube';
const ContentArea2 = ({
    platform,
    socialAccounts,
    setPostData,
    postData
}) => {
    const { t } = useTranslation();
    const content = postData.platforms?.[platform]?.specificContent || postData.content || '';
  
    return (
        <div>
        <Textarea
         className='h-96 text-gray-900 p-4 resize-none'
         value={content}
         onChange={(e) => setPostData({ 
           ...postData,
           platforms: {
             ...postData.platforms,
             [platform]: {
               ...postData.platforms[platform],
               specificContent: e.target.value
             }
           }
         })}
         placeholder={t('social.writeYourPost')}
        />
        {platform === 'facebook' && (
           <>

           <div className='mt-3'>
            <button
            type="button"
            className={` flex items-center justify-center cursor-pointer py-2 px-3 rounded-lg text-sm  bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm`}
            onClick={() => {
              // Find the selected Facebook account from postData
              const selectedFacebookAccountId = postData.platforms.facebook.accountId;
              const selectedFacebookAccount = socialAccounts.facebook.accounts.find(account => 
                account.account_id === selectedFacebookAccountId
              );
                
              if (selectedFacebookAccount?.accountId) {
                setPostData(prev => ({
                  ...prev,
                  platforms: {
                    ...prev.platforms,
                    facebook: {
                      ...prev.platforms.facebook,
                      locationId: selectedFacebookAccount.accountId,
                      locationName: selectedFacebookAccount.name
                    }
                  }
                }));
              }
            }}
            >
            <MapPin className="w-4 h-4 mr-2" />
            {t('social.addLocation')}
            </button>
   
           </div>
        
           {postData.platforms.facebook.locationName && postData.platforms.facebook.locationName.length > 0 && (
           <div className="flex justify-between items-center">
             <div className="flex items-center">
               <MapPin className="w-4 h-4 mr-2 text-gray-500" />
               <span className="text-sm ">{postData.platforms.facebook.locationName}</span>
             </div>
           </div>
           )}      
           
           </>
        )}
        
        {platform === 'tiktok' && (
            <TikTokCompliance
                selectedAccount={socialAccounts.tiktok?.accounts?.find(
                    acc => acc.account_id === postData.platforms.tiktok.accountId
                )}
            />
        )}
        

        {platform === 'youtube' && (
            <Youtube postData={postData} setPostData={setPostData} />  
        )}
   
        </div>
    )
}

export default ContentArea2;