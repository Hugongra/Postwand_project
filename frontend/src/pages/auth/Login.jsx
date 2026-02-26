import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import PostwandLogoColor from '/images/postwand_logo_color.png';
import * as api from '@services/api/api';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const handleSignInWithGoogle = async (credentialResponse) => {
    setFormError('');
    setIsLoading(true);

    const response = await api.GoogleSignIn(credentialResponse);

    console.log('Google Sign-In Response:', response);

    if (!response.ok) {
      setFormError(t('auth.googleAuthFailed'));
      setIsLoading(false);
      return;
    }

    console.log('Is new user?', response.data.is_new_user);

    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('user_logged_in'));

    // If this is a new user, redirect to onboarding
    if (response.data.is_new_user) {
      console.log('Redirecting to onboarding');
      navigate('/onboarding');
    } else {
      console.log('Redirecting to home');
      navigate('/home');
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    const response = await api.Login(email, password);

    if (!response.ok) {
      setFormError(t('auth.invalidCredentials'));
      setIsLoading(false);
      return;
    }
    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('user_logged_in'));
    navigate('/home');
  };

  return (
    <Suspense fallback="loading">
      <div className="flex w-full h-full">
        <div className="w-full bg-white flex items-center justify-center relative ">
          <img src={PostwandLogoColor} alt="Postwand Logo" className="absolute top-6 right-6 w-[8vw] min-w-[100px] h-auto object-cover" />
          <div className="w-full max-w-md mx-auto p-16 bg-white mt-8 shadow-lg">
            <h2 className="text-3xl  mb-4 text-center">
              {t('auth.welcomeBack')}
            </h2>

            <div className="mt-6 w-full">
              <div className="w-full flex justify-center" style={{ minHeight: '44px' }}>
                <GoogleLogin
                  onSuccess={handleSignInWithGoogle}
                  onError={() => {
                    setFormError(t('auth.googleAuthFailed'));
                    setIsLoading(false);
                  }}
                  useOneTap={false}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </div>

            <div className="mt-4 relative">
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

            <form onSubmit={handleLogin} className="mt-2">
              <div className="mb-4">
                <label className="text-sm block text-gray-700 mb-2" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    required
                    placeholder="contact@gmail.com"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({ ...errors, email: '' });
                      }
                    }}
                    className={`pl-10 p-3 text-sm w-full border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } rounded-lg bg-white focus:outline-none focus:border-gray-300`}
                    disabled={isLoading}
                  />
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${errors.email ? 'text-red-400' : 'text-gray-400'
                    }`} />
                </div>
                {errors.email && (
                  <p className="mt-1 text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="text-sm block text-gray-700 mb-2" htmlFor="password">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    required
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors({ ...errors, password: '' });
                      }
                    }}
                    className={`pl-10 pr-10 p-3 text-sm w-full border ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } rounded-lg bg-white focus:outline-none focus:border-gray-300`}
                    disabled={isLoading}
                  />
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${errors.password ? 'text-red-400' : 'text-gray-400'
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
                className={`w-full bg-pink-600 text-white p-3 rounded-lg hover:bg-pink-700 transition-colors mb-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
              <div className="mt-2">
                <Link to="/forgot-password" className="text-sm text-pink-600 hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </form>


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