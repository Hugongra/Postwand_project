import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import VerifyCode from './VerifyCode';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';

import * as api from '@services/api/api';
import { persistSessionFromApiResponse } from '@services/api/authTokens';

const Register = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState('free');

  // Extract plan from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const planParam = searchParams.get('plan');
    if (planParam && ['free', 'creator', 'manager', 'business'].includes(planParam.toLowerCase())) {
      setPlan(planParam.toLowerCase());
    }
  }, [location]);

  const handleSignUpWithGoogle = async (credentialResponse) => {
    setFormError('');
    setIsLoading(true);

    if (!credentialResponse?.credential) {
      setFormError(t('auth.googleAuthNoCredential'));
      setIsLoading(false);
      return;
    }

    const response = await api.GoogleSignIn(credentialResponse);

    if (!response.ok) {
      const d = response.data;
      const serverMsg =
        (typeof d?.error === 'string' && d.error) ||
        (typeof d?.msg === 'string' && d.msg) ||
        (typeof d?.message === 'string' && d.message) ||
        null;
      setFormError(serverMsg || t('auth.googleAuthFailed'));
      setIsLoading(false);
      return;
    }
    await persistSessionFromApiResponse(response.data);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    window.dispatchEvent(new Event('user_logged_in'));
    setIsLoading(false);
    navigate('/onboarding');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!validateForm()) {
      return;
    }
    let response;
    response = await api.Register(name, email, password, plan);

    if (!response.ok) {
      setFormError(t('auth.invalidCredentials'));
      setIsLoading(false);
      return;
    }

    await persistSessionFromApiResponse(response.data);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setIsLoading(true);

    response = await api.SendVerificationCode(email);

    setIsLoading(false);
    if (!response.ok) {
      setFormError(response.data?.error || t('auth.failedToSendVerificationCode'));
      return;
    }
    setShowVerification(true);
  };


  return (
    <div className="flex w-full h-full">
      <div className="lg:w-1/2 w-full bg-white flex items-center justify-center relative">


        {!showVerification ? (
          // Registration Form
          <div className="w-full max-w-md mx-auto p-16 bg-white shadow-lg">
            <h2 className="text-3xl  mb-4">
              {t('auth.signUpForTrial')}
            </h2>

            <div className="mt-4 w-full">
              <div className="w-full flex justify-center" style={{ minHeight: '44px' }}>
                <GoogleLogin
                  onSuccess={handleSignUpWithGoogle}
                  onError={() => {
                    setFormError(t('auth.googleAuthClientError'));
                    setIsLoading(false);
                  }}
                  useOneTap={false}
                  text="signup_with"
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

            <form onSubmit={handleRegister} className="mt-2">
              <div className="mb-4">
                <label className="text-sm block text-gray-700 mb-2" htmlFor="name">
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
                        setErrors({ ...errors, name: '' });
                      }
                    }}
                    className={`pl-10 p-3 text-sm w-full border ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } rounded-lg bg-white focus:outline-none focus:border-gray-300`}
                    disabled={isLoading}
                  />
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${errors.name ? 'text-red-400' : 'text-gray-400'
                    }`} />
                </div>
                {errors.name && (
                  <p className="mt-1 text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="text-sm block text-gray-700 mb-2" htmlFor="email">
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
                className={`w-full bg-pink-600 text-white p-3 rounded-lg hover:bg-pink-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.register')}
              </button>
            </form>

            <div className="mt-4 text-center">
              {t('auth.alreadyHaveAccount')} <Link to="/login" className="text-pink-600 hover:underline">{t('auth.login')}</Link>
            </div>
          </div>
        ) : (
          // Verification Form
          <div className="w-full max-w-md mx-auto p-16 bg-white mt-8 shadow-lg">
            <VerifyCode email={email} />
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