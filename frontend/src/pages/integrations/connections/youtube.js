const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || "https://app.postwand.io/api/auth/youtube";

const YouTubeLogin = () => {
  localStorage.removeItem('youtubeAuthPending');
  localStorage.removeItem('youtubeAuthState');
  
  const state = Math.random().toString(36).substring(2, 15);

  localStorage.setItem('youtubeAuthState', state);
  localStorage.setItem('youtubeAuthPending', 'true');

  const REDIRECT_URI = encodeURIComponent(YOUTUBE_REDIRECT_URI);
  const SCOPES = encodeURIComponent("https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code&` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=${SCOPES}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return window.open(authUrl, 'youtubeAuthWindow', 'width=600,height=700');
  
};

export { YOUTUBE_REDIRECT_URI, YouTubeLogin };
export default YouTubeLogin;