const LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
const LINKEDIN_APP_ID = import.meta.env.VITE_LINKEDIN_APP_ID;

const LinkedinLogin = () => {
  // Clear old auth data
  localStorage.removeItem('linkedinAuthPending');
  localStorage.removeItem('linkedinAuthState');
  
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in localStorage to verify when we return
  localStorage.setItem('linkedinAuthState', state);
  localStorage.setItem('linkedinAuthPending', 'true');

  const REDIRECT_URI = encodeURIComponent(LINKEDIN_REDIRECT_URI);
  const SCOPES = encodeURIComponent("openid profile email w_member_social");
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${LINKEDIN_APP_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=${SCOPES}&` +
    `state=${state}`;

  // Open LinkedIn OAuth in popup window
  const authWindow = window.open(authUrl, 'linkedinAuthWindow', 'width=600,height=700');
  
  // Monitor if window is closed without completing auth
  const checkClosed = setInterval(() => {
    if (authWindow && authWindow.closed) {
      clearInterval(checkClosed);
      localStorage.removeItem('linkedinAuthPending');
      localStorage.removeItem('linkedinAuthState');
    }
  }, 1000);
};

export { LINKEDIN_REDIRECT_URI, LINKEDIN_APP_ID, LinkedinLogin };
export default LinkedinLogin;