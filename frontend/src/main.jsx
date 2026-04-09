import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './pages/App'
import { AuthProvider } from './context/AuthContext'
import './styles/index.css'
import './styles/globals.css'
import './services/translator/i18n' // Import i18n configuration

const googleClientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() ||
  '571535075302-87ga0u6mdta81cvbif83cul5834sg8fv.apps.googleusercontent.com'

// StrictMode double-mounts effects and breaks Google Identity Services (button / callback).
ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
)
