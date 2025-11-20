import * as api from '@services/api/api';

const FB_APP_ID = import.meta.env.VITE_FB_APP_ID;

const FacebookSDK = () => {
  if (window.FB) return;

  window.fbAsyncInit = function() {
    window.FB.init({
      appId: FB_APP_ID,
      cookie: true,
      xfbml: true,
      version: 'v22.0'
    });
  };

  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
};

const FacebookLogin = () => {
  return new Promise((resolve, reject) => {
    window.FB.login(function(response) {
      (async () => {
        try {
          if (response.authResponse) {
            const apiResponse = await api.FacebookLogin(response.authResponse.accessToken);
            
            if (!apiResponse.ok) {
              const errorMessage = apiResponse.data?.error || 'Failed to authenticate with Facebook';
              resolve({error: errorMessage});
              return;
            }
            
            resolve({success: 'Accounts connected!'});
            
          } else {
            // User cancelled the login or didn't grant permissions
            resolve({error: 'Facebook login was cancelled or permissions were not granted'});
          }
        } catch (error) {
          resolve({error: error.message || 'Failed to authenticate with Facebook'});
        }
      })();
    }, {
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts, business_management',
      auth_type: 'rerequest',
      locale: 'en_US'
    });
  });
};

export { FacebookSDK, FacebookLogin };
export default { FacebookSDK, FacebookLogin };