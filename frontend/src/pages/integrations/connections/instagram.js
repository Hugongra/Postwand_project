import * as api from '@services/api/api';
 
const InstagramLogin = () => {
  return new Promise((resolve, reject) => {
    window.FB.login(function(response) {
      (async () => {
        try {
          if (response.authResponse) {
            const apiResponse = await api.InstagramLogin(response.authResponse.accessToken);
    
            if (!apiResponse.ok) {
              const errorMessage = apiResponse.data?.error || 'Failed to authenticate with Instagram';
              resolve({error: errorMessage});
              return;
            }
            
            resolve({success: "Accounts connected!"});

          } else {
            // User cancelled the login or didn't grant permissions
            resolve({error: 'Instagram login was cancelled or permissions were not granted'});
          }
        } catch (error) {
          resolve({error: error.message || 'Failed to authenticate with Instagram'});
        }
      })();
    }, {
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,instagram_manage_insights,pages_read_engagement, business_management',
      auth_type: 'rerequest',
      locale: 'en_US'
    }); 
  });
};

export { InstagramLogin };
export default InstagramLogin;