import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const VerifyCode = ({ email: propEmail, onVerificationSuccess, onBackToRegister, embedded = false, password = null, onLogin = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = propEmail || location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePaste(e);
    }
  };

  const handlePaste = async (e) => {
    const pastedData = e.clipboardData?.getData('text') || await navigator.clipboard.readText();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits) {
      const newCode = [...code];
      digits.split('').forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      
      // Focus the input after the last pasted digit
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setLoading(true);
    setError('');
        
    try {
      const response = await fetch('https://localhost:5001/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Call success callback if embedded, otherwise navigate
        setTimeout(() => {
          if (embedded && onVerificationSuccess) {
            onVerificationSuccess();
          } else if (password && onLogin) {
            // If password and onLogin are provided, attempt to login directly
            loginUser(email, password, onLogin);
          } else {
            navigate('/login', { state: { verified: true, email } });
          }
        }, 2000);
      } else {
        setError(data.error || 'Invalid verification code');
        if (data.attempts_remaining) {
          setError(prev => `${prev}. ${data.attempts_remaining} attempts remaining`);
        }
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to log in the user directly
  const loginUser = async (email, password, onLogin) => {
    try {
      const response = await fetch(`https://app.postwand.io/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Call the onLogin callback to update app state
      onLogin(data);
    } catch (error) {
      console.error('Auto-login error after verification:', error);
      // If auto-login fails, redirect to login page as fallback
      navigate('/login', { state: { verified: true, email } });
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://app.postwand.io/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
        setResendCooldown(60); // 60 second cooldown
        // Show success message
        setError('');
        setSuccess(false);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Get email provider name for display
  const getEmailProviderName = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const providerNames = {
      'gmail.com': 'Gmail',
      'googlemail.com': 'Gmail',
      'outlook.com': 'Outlook',
      'hotmail.com': 'Outlook',
      'live.com': 'Outlook',
      'yahoo.com': 'Yahoo',
      'ymail.com': 'Yahoo',
      'aol.com': 'AOL',
      'icloud.com': 'iCloud',
      'me.com': 'iCloud',
      'protonmail.com': 'ProtonMail',
      'proton.me': 'Proton'
    };
    
    return providerNames[domain] || 'My Email';
  };

  const getEmailProvider = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const providers = {
      'gmail.com': 'https://mail.google.com',
      'googlemail.com': 'https://mail.google.com',
      'outlook.com': 'https://outlook.live.com',
      'hotmail.com': 'https://outlook.live.com',
      'live.com': 'https://outlook.live.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'ymail.com': 'https://mail.yahoo.com',
      'aol.com': 'https://mail.aol.com',
      'icloud.com': 'https://www.icloud.com/mail',
      'me.com': 'https://www.icloud.com/mail',
      'protonmail.com': 'https://mail.protonmail.com',
      'proton.me': 'https://mail.proton.me'
    };
    
    
    
    return providers[domain] || `mailto:${email}`;
  };

  const handleOpenEmail = () => {
    const url = getEmailProvider();
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No email address provided</p>
          <button
            onClick={() => navigate('/register')}
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Back to Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4"}>
      <div className={embedded ? "w-full" : "w-full max-w-md"}>
        <div className={embedded ? "" : "bg-white rounded-2xl shadow-xl p-8"}>
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Enter verification code
            </h2>
            <p className="text-gray-600 text-sm">
              We've sent a verification code to <span className="font-medium">{email}</span>
            </p>
            {/* Open Email */}
            <button
              onClick={handleOpenEmail}
              className="mt-6 w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <span className="flex items-center justify-center">
                <Mail className="w-4 h-4 mr-2" />
                Open {getEmailProviderName()}
                <ExternalLink className="w-3 h-3 ml-1" />
              </span>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Email verified successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Code Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Enter 6-digit code
            </label>
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="\d{1}"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`
                    w-12 h-14 text-center text-xl font-semibold
                    border-2 rounded-lg transition-all
                    ${digit ? 'border-pink-300' : 'border-gray-200'}
                    focus:border-pink-300 focus:outline-none
                    ${error ? 'border-red-300' : ''}
                  `}
                  disabled={loading || success}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || success || code.some(d => !d)}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all
              ${loading || success || code.some(d => !d)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </span>
            ) : success ? (
              'Verified ✓'
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Additional Actions */}
          <div className="mt-6 space-y-3">
            {/* Resend Code */}
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className={`
                w-full py-2 px-4 rounded-lg border transition-all
                ${resendLoading || resendCooldown > 0
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {resendLoading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </span>
              )}
            </button>
          </div>

          {/* Back to Register */}
          {embedded && (
            <div className="mt-8 text-center">
              <button
                onClick={onBackToRegister}
                className="text-pink-600 hover:underline"
              >
                ← Back to Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCode; 