import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import VerifyCode from './VerifyCode';
import { useTranslation } from 'react-i18next';
import PostwandLogoColor from '/images/postwand_logo_color.png';
import { API_BASE_URL } from '../config_url.js';

const Register = ({ onLogin }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState('free'); // Default to free plan
  
  // Extract plan from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const planParam = searchParams.get('plan');
    if (planParam && ['free', 'creator', 'manager', 'business'].includes(planParam.toLowerCase())) {
      setPlan(planParam.toLowerCase());
    }
  }, [location]);

  useEffect(() => {
    // Load Google One Tap script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initializeGoogleOneTap;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleOneTap = () => {
    if (window.google) {
      // Make callback globally accessible
      window.handleSignUpWithGoogle = handleSignUpWithGoogle;
      
      window.google.accounts.id.initialize({
        client_id: '571535075302-87ga0u6mdta81cvbif83cul5834sg8fv.apps.googleusercontent.com',
        callback: handleSignUpWithGoogle,
        ux_mode: 'popup',             // Force popup mode
        use_fedcm_for_prompt: false,  // Disable FedCM to avoid COOP issues
        auto_select: false,           // Disable auto-select to prevent popup issues
        cancel_on_tap_outside: false
      });
    }
  };

  const handleSignUpWithGoogle = async (response) => {
    setFormError('');
    setIsLoading(true);

    try {
      const result = await fetch(`${API_BASE_URL}/api/auth/google-sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: response.credential,
        }),
        credentials: 'include'
      });

      const data = await result.json();

      if (!result.ok) {
        setFormError(data.error || t('auth.googleAuthFailed'));
        throw new Error(data.error || t('auth.googleAuthFailed'));
      }

      // Google users are already verified, so login directly
      onLogin(data);
    } catch (error) {
      console.error('Google registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = t('auth.nameRequired');
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }
    
    // Password validation
    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, plan }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setFormError(t('auth.emailAlreadyInUse'));
        } else {
          setFormError(data.error || t('auth.registrationFailed'));
        }
        throw new Error(data.error || t('auth.registrationFailed'));
      }

      // Send verification code after successful registration
      try {
        await fetch(`${API_BASE_URL}/api/send-verification-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          credentials: 'include'
        });
      } catch (verifyError) {
        console.error('Failed to send verification code:', verifyError);
      }

      // Show verification form instead of navigating
      setRegisteredEmail(email);
      setShowVerification(true);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    // Log in the user directly after successful verification
    loginUser(registeredEmail, password);
  };

  // Add a new function to log in the user
  const loginUser = async (email, password) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || t('auth.authenticationFailed'));
        throw new Error(data.error || t('auth.authenticationFailed'));
      }

      // Call the onLogin handler passed from App.jsx to update app state
      onLogin(data);
    } catch (error) {
      console.error('Auto-login error after verification:', error);
      // If auto-login fails, redirect to login page as fallback
      navigate('/login', { state: { verified: true, email: registeredEmail } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setShowVerification(false);
    setRegisteredEmail('');
  };

  return (
    <div className="flex w-full h-full">
      <div className="lg:w-1/2 w-full bg-white flex items-center justify-center relative">
        <img src={PostwandLogoColor} alt="Postwand Logo" className="absolute top-6 right-6 w-[8vw] min-w-[100px] h-auto object-cover" />
        
        {!showVerification ? (
          // Registration Form
          <div className="w-full max-w-md mx-auto p-6 bg-white mt-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('auth.signUpForTrial')}
            </h2>
            
            <div className="mt-6 w-full justify-center">

        {/* One Tap Configuration - only these attributes belong here */}
        <div
          id="g_id_onload"
          data-client_id="571535075302-87ga0u6mdta81cvbif83cul5834sg8fv.apps.googleusercontent.com"
          data-context="signin"
          data-ux_mode="popup"
          data-callback="handleSignUpWithGoogle"
          data-auto_select="false"
          data-itp_support="true"
          data-use_fedcm_for_prompt="false"
          data-cancel_on_tap_outside="false"
        ></div>
        
        {/* Button Configuration - shape goes here, not in g_id_onload */}
        <div
          className="g_id_signin"
          data-type="standard"
          data-shape="square"
          data-theme="outline"
          data-text="signin_with"
          data-size="large"
          data-logo_alignment="left"
          style={{ width: '100%' }}
  >
      </div>
            </div>
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  {t('auth.name')}
                </label>
                <div className="relative">
                  <input
                    placeholder="John Doe"
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors({...errors, name: ''});
                      }
                    }}
                    className={`pl-10 px-3 py-3 text-sm w-full border-2 ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pink-200`}
                    disabled={isLoading}
                  />
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    errors.name ? 'text-red-400' : 'text-gray-400'
                  }`} />
                </div>
                {errors.name && (
                  <p className="mt-1 text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    placeholder="contact@gmail.com"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({...errors, email: ''});
                      }
                    }}
                    className={`pl-10 px-3 py-3 text-sm w-full border-2 ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pink-200`}
                    disabled={isLoading}
                  />
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    errors.email ? 'text-red-400' : 'text-gray-400'
                  }`} />
                </div>
                {errors.email && (
                  <p className="mt-1 text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors({...errors, password: ''});
                      }
                    }}
                    className={`pl-10 pr-10 px-3 py-3 text-sm w-full border-2 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pink-200`}
                    disabled={isLoading}
                  />
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    errors.password ? 'text-red-400' : 'text-gray-400'
                  }`} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={isLoading}
                  >
                    {!showPassword ? 
                      <EyeOff className="w-4 h-4 text-gray-400" /> : 
                      <Eye className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.register')}
              </button>
            </form>

            <div className="mt-6 text-center">
              {t('auth.alreadyHaveAccount')} <Link to="/login" className="text-pink-600 hover:underline">{t('auth.login')}</Link>
            </div>
          </div>
        ) : (
          // Verification Form
          <div className="w-full max-w-md mx-auto p-6 bg-white">
            <VerifyCode 
              email={registeredEmail}
              onVerificationSuccess={handleVerificationSuccess}
              onBackToRegister={handleBackToRegister}
              embedded={true}
              password={password}
              onLogin={onLogin}
            />
          </div>
        )}
      </div>
      
      <div className="lg:w-1/2 hidden lg:flex bg-white bg-gradient-to-br from-pink-50 to-purple-50 items-center justify-center h-full">
  <h1 className="text-3xl md:text-5xl font-bold text-black mb-6 text-center">
    {t('auth.welcomeTo')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] to-[#a855f7]">Postwand</span>!
  </h1>
</div>
    </div>
  );
};

export default Register;