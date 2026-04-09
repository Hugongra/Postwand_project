const THREADS_APP_ID = import.meta.env.VITE_THREADS_APP_ID;
const THREADS_REDIRECT_URI = import.meta.env.VITE_THREADS_REDIRECT_URI;

const ThreadsLogin = () => {
  localStorage.removeItem('threadsAuthPending');
  localStorage.removeItem('threadsAuthState');

  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('threadsAuthState', state);
  localStorage.setItem('threadsAuthPending', 'true');

  const scopes = encodeURIComponent('threads_basic,threads_content_publish,threads_manage_insights');
  const redirectUri = encodeURIComponent(THREADS_REDIRECT_URI);
  const authUrl =
    `https://threads.net/oauth/authorize?` +
    `client_id=${THREADS_APP_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scopes}&` +
    `response_type=code&` +
    `state=${state}`;

  const authWindow = window.open(authUrl, 'threadsAuthWindow', 'width=600,height=700');

  const checkClosed = setInterval(() => {
    if (authWindow && authWindow.closed) {
      clearInterval(checkClosed);
      localStorage.removeItem('threadsAuthPending');
      localStorage.removeItem('threadsAuthState');
    }
  }, 1000);
};

export { THREADS_APP_ID, THREADS_REDIRECT_URI, ThreadsLogin };
export default ThreadsLogin;
