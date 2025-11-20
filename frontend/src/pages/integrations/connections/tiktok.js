import * as api from '@services/api/api';

const TikTokLogin = async () => {
    const response = await api.TikTokLogin();
    
    if (!response.ok) return { error: 'Failed to initiate TikTok authentication' };
    localStorage.setItem('tiktokAuthState', response.data.state);
    localStorage.setItem('tiktokAuthPending', 'true');
    
    return window.open(response.data.auth_url, 'tiktokAuthWindow', 'width=600,height=700');
    
  
};

export default TikTokLogin;