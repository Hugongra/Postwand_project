import { API_BASE_URL } from './config_url.js';

const api = async (url, method, body) => {
    try {
      const options = {
        method: method,
        credentials: 'include'
      };

      // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
      const isFormData = body instanceof FormData;
      
      if (!isFormData) {
        options.headers = {
          'Content-Type': 'application/json',
        };
      }

      if (method !== 'GET' && method !== 'HEAD') {
        if (isFormData) {
          options.body = body; // FormData is sent as-is
        } else {
          options.body = JSON.stringify(body); // JSON is stringified
        }
      }

      const response = await fetch(API_BASE_URL + url, options);

      const data = await response.json();

      // Check if session expired
      if (response.status === 401 && data.code === 'session_expired') {
        localStorage.removeItem('user');
        // Notify app that user was logged out
        window.dispatchEvent(new Event('user_logged_out'));
      }

      if (response.status === 403 && data.code === 'subscription_required') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user) {
          user.has_access = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
        window.dispatchEvent(new CustomEvent('subscription_required'));
      }
      
      return { ok: response.ok, status: response.status, data: data };
 
    } catch (error) {
      console.error('API error:', error);
      return { ok: false, status: 0, data: null };
    }
  }; 

const GoogleSignIn = (response) => {
    return api(`/api/auth/google-sign-in`, 'POST', { credential: response.credential });
};

const Login = (email, password) => {
    return api(`/api/auth/login`, 'POST', { email, password });     
};


const Register = (name, email, password, plan) => {
      return api(`/api/auth/register`, 'POST', { name, email, password, plan });
};

const SendVerificationCode = (email) => {
    return api(`/api/send-verification-code`, 'POST', { email });
};

const VerifyCode = (email, code) => {
    return api(`/api/verify-code`, 'POST', { email, code });
};

const Logout = async () => {
    return api(`/api/auth/logout`, 'POST', {});  
};




// Brand
const GetBrands = () => {
  return api(`/api/brands`, 'GET', {});
};


const ExtractBrand = async (url, onProgress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-brand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { ok: false, data: errorData };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = JSON.parse(line.slice(6));
        console.log('SSE data received:', data);
        
        if (data.error) throw { ok: false, data };
        
        if (onProgress) onProgress(data);
        
        if (data.step === 'complete') finalData = data.data;
      }
    }

    return { ok: true, data: finalData };
  } catch (error) {
    console.error('ExtractBrand error:', error);
    throw error;
  }
};

const DeleteBrand = (brandId) => {  
    return api(`/api/brands/${brandId}`, 'DELETE', {});
  };


  const GetBrand = (brandId) => {
    return api(`/api/brand/${brandId}`, 'GET', {});
  };

  const UpdateBrand = (brandId, formData) => {
    return api(`/api/brand/${brandId}`, 'PUT', formData);
  };



  const GetPosts = () => {
    return api(`/api/posts`, 'GET', {});
  };


  const FacebookLogin = (accessToken) => {
    return api(`/api/auth/facebook`, 'POST', { accessToken });
  };

  const InstagramLogin = (accessToken) => {
    return api(`/api/auth/instagram`, 'POST', { accessToken });
  };

  const LinkedinLogin = (code) => {
    return api(`/api/auth/linkedin`, 'POST', { code });
  };

  const YoutubeLogin = (code, redirectUri) => {
    return api(`/api/auth/youtube`, 'POST', { code, redirectUri });
  };

  const TikTokLogin = () => {
    return api(`/api/auth/tiktok`, 'GET', {});
  };

  const PlatformDisconnect = (platform, accountId) => {
    return api(`/api/auth/disconnect/${platform}/${accountId}`, 'DELETE', {});
  };


  const getImages = () => {
    return api(`/api/images`, 'GET', {});
  };

  const DeleteImage = (imageId) => {
    return api(`/api/image/${imageId}`, 'DELETE', {});
  };


  const checkUploadStatus = (taskId) => {
      return api(`/api/upload-status/${taskId}`, 'GET', {});
  };

  const checkTaskStatus = (taskId) => {
    return api(`/api/task/${taskId}`, 'GET', {});
  };

 
  const SchedulePost = (postDataOrFormData, selectedPlatforms) => {
      if (postDataOrFormData instanceof FormData) {
        return api(`/api/schedule`, 'POST', postDataOrFormData);
      }
      return api(`/api/schedule`, 'POST', { postData: postDataOrFormData, selectedPlatforms });
  };

    const ChatAction = (action, currentContent, textareaPlatform, selectedPlatforms) => {
    return api(`/api/chat/action`, 'POST', {
      action: action,
      content: currentContent,
      platform: textareaPlatform || selectedPlatforms[0] || 'facebook'
    });
  }


  const SocialAccounts = () => {
    return api(`/api/social-accounts`, 'GET', {});
  }



  const ChatSessions = () => {
    return api(`/api/chat-sessions`, 'GET', {});
  }

  const ChatSession = (chatId) => {

     return api(`/api/chat-session/${chatId}`, 'GET', {});
  }

  const SendChatMessage = (message, mode, platforms) => {
    return api(`/api/chat/send`, 'POST', { message, mode, platforms });
  }

  const GetChatHistory = () => {
    return api(`/api/chat/history`, 'GET', {});
  }

  const ClearChatHistory = () => {
    return api(`/api/chat/clear`, 'POST', {});
  }

  // Image editing and generation
  const EditImage = (model, formData) => {
    return api(`/api/edit-image/${model}`, 'POST', formData);
  }

  const GenerateImage = (model, formData) => {
    return api(`/api/generate-image/${model}`, 'POST', formData);
  }

  const RemoveBackground = (formData) => {
    return api(`/api/remove-background`, 'POST', formData);
  }

 

  // User Profile Management
  const CreatePortalSession = () => {
    return api(`/api/create-portal-session`, 'POST', {});
  }

  const UpdateUserProfile = (name) => {
    return api(`/api/user/update-profile`, 'POST', { name });
  }

  const DeleteUserData = () => {
    return api(`/api/user/delete-data`, 'POST', {});
  }

  const UpdateUserLanguage = (language) => {
    return api(`/api/user/update-language`, 'POST', { language });
  }


  const GenerateAd = (formData) => {
    return api(`/api/ads/create_ad`, 'POST', formData);
  }

  const GenerateAdCopy = (adType, brandId) => {
    return api(`/api/ads/generate-copy`, 'POST', { ad_type: adType, brand_id: brandId });
  }

  const CreateAdWithCopy = (formData) => {
    return api(`/api/ads/create-ad-with-copy`, 'POST', formData);
  }

  const AutoGenerateAd = (formData) => {
    return api(`/api/ads/auto-generate`, 'POST', formData);
  }


export { Login, 
  GoogleSignIn, 
  Register, 
  SendVerificationCode, 
  Logout, 
  VerifyCode, 
  GetBrands, 
  ExtractBrand, 
  DeleteBrand, 
  GetBrand,
  UpdateBrand,
  GetPosts,
  FacebookLogin,
  InstagramLogin,
  LinkedinLogin,
  YoutubeLogin,
  TikTokLogin,
  PlatformDisconnect,
  DeleteImage,
  getImages,
  checkUploadStatus,
  checkTaskStatus,
  SchedulePost,
  ChatAction,
  SocialAccounts,
  ChatSessions,
  ChatSession,
  SendChatMessage,
  GetChatHistory,
  ClearChatHistory,
  EditImage,
  GenerateImage,
  RemoveBackground,
  CreatePortalSession,
  UpdateUserProfile,
  DeleteUserData,
  UpdateUserLanguage,
  GenerateAd,
  GenerateAdCopy,
  CreateAdWithCopy,
  AutoGenerateAd,
};