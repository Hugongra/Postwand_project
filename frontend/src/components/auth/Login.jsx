import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PostwandLogoColor from '/images/postwand_logo_color.png';
import { API_BASE_URL } from '../config_url.js';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '571535075302-87ga0u6mdta81cvbif83cul5834sg8fv.apps.googleusercontent.com',
        callback: handleSignInWithGoogle,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: false
      });

      // Render the sign-in button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          logo_alignment: 'left',
          width: '100%'
        }
      );
    }
  };

  const handleSignInWithGoogle = async (response) => {
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

      // Store login state in localStorage to help with session persistence
      localStorage.setItem('isLoggedIn', 'true');
      
      onLogin(data);
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }
    
    // Password validation
    if (!password) {
      newErrors.password = t('auth.passwordRequired');
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
        if (response.status === 401) {
          setFormError(t('auth.invalidCredentials'));
        } else {
          setFormError(data.error || t('auth.authenticationFailed'));
        }
        throw new Error(data.error || t('auth.authenticationFailed'));
      }

      // Store login state in localStorage to help with session persistence
      localStorage.setItem('isLoggedIn', 'true');
      
      onLogin(data);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback="loading">
    <div className="flex w-full h-full">
      <div className="w-full bg-white flex items-center justify-center relative">
        <img src={PostwandLogoColor} alt="Postwand Logo" className="absolute top-6 right-6 w-[8vw] min-w-[100px] h-auto object-cover" />
        <div className="w-full max-w-md mx-auto p-6 bg-white mt-12">
          <h2 className="text-3xl font-bold mb-4">
            {t('auth.welcomeBack')}
          </h2>
          
          <div className="mt-6 w-full">
            <div 
              id="google-signin-button" 
              className="w-full flex justify-center"
              style={{ minHeight: '44px' }}
            ></div>
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
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-sm text-pink-600 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <div className="mt-4 text-center">
            {t('auth.dontHaveAccount')} <Link to="/register" className="text-pink-600 hover:underline">{t('auth.register')}</Link>
          </div>
        </div>
      </div>
    </div>
    </Suspense>
  );
};

export default Login;