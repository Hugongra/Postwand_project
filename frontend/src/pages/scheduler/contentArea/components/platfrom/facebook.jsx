import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Facebook = ({
    textareaPlatform,
    socialAccounts,
    selectedAccounts,
    postData,
    setPostData
}) => { 
    const { t } = useTranslation();
    return (
        <>

        <div>
         <button
         type="button"
         className={` flex items-center justify-center cursor-pointer py-2 px-3 rounded-lg text-sm  bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm`}
         onClick={() => {
           // Find the selected Facebook account
           const selectedFacebookId = selectedAccounts["facebook"];
           const selectedFacebookAccount = socialAccounts.find(account => 
             account.platform === 'facebook' && account.id === selectedFacebookId
           );
           
           if (selectedFacebookAccount) {
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

           console.log('facebook location', selectedFacebookAccount?.accountId)
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
    )
}

export default Facebook;


    