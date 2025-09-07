import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation, useSearchParams, useNavigate, Outlet, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import FacebookAuth from "./components/auth/FacebookAuth";
import PostCreator from "./components/scheduler/PostCreator"; 
import SideBar from "./components/sidebar/SideBar";
import PostPreview from "./components/scheduler/preview/Postpreview";
import CustomCalendar from "./components/calendar/Calendar";
import AiStudio from "./components/AiStudio/AiStudio";
import AiStudioHome from "./components/AiStudio/AiStudioHome";
import Register from "./components/auth/Register";
import VerifyCode from "./components/auth/VerifyCode";
import Profile from "./components/Profile";
import Home from "./components/home/Home";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import PrivacyPolicyES from "./components/legal/PrivacyPolicy_es";
import TermsConditions from "./components/legal/TermsConditions";
import TermsConditionsES from "./components/legal/TermsConditions_es";
import TokenLimitModal from "./components/TokenLimitModal";
import ViralChatSession from "./components/ViralChat/ViralChatSession";
import ViralChatSkeletonLoader from "./components/skeletons/ViralChatSkeletonLoader";
import SkeletonLoader from "./components/skeletons/SkeletonLoader";
import CalendarSkeletonLoader from "./components/skeletons/CalendarSkeletonLoader";
import AiStudioSkeletonLoader from "./components/skeletons/AiStudioSkeletonLoader";
import MessagesSkeletonLoader from "./components/skeletons/MessagesSkeletonLoader";

import BrandStyleSkeletonLoader from "./components/skeletons/BrandStyleSkeletonLoader";
import AIStudio2 from "./components/skeletons/AIStudio2";
import CreateText from "./components/CreatePost/CreateText";
import CreatePost from "./components/CreatePost/CreatePost"; 
import CreateImages from "./components/CreatePost/CreateImages";
import "./App.css";
import Messages from "./components/messages/Messages";
import { CardTitle } from "./components/ui/card";
import ImageEditor from './components/ImageEditor/ImageEditor';
import ImageLibrary from './components/ImageLibrary/ImageLibrary';
import ImageLibrarySkeletonLoader from "./components/skeletons/ImageLibrarySkeletonLoader";
import ImageEditorFabric from './CanvasImageEditor';
import Fabric from './components/Fabric';

import { loadStripe } from '@stripe/stripe-js';
import {
  CheckoutProvider
} from '@stripe/react-stripe-js';
import CheckoutForm from './components/checkout/CheckoutForm';
import PricingTiers from './components/pricing_tiers/pricing_tiers';

import BrandIdentity from "./components/brands/BrandIdentity";
import DeletionConfirmation from './components/auth/DeletionConfirmation';
import InstagramInsights from "./components/insights/Insights";
import Settings from "./components/Settings";

// Initialize Stripe outside of component render
const stripePromise = loadStripe("pk_test_51RBOY6QMQsRNuG45HnWwJdSwqwHnnZhzD5QnX9WBGmjcWbZofA0StHc73OXvlpLcPnVcN1TsQzM11xBGG8fY7xRR00KTv87rnY");

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSocialLoading, setIsSocialLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [facebookData, setFacebookData] = useState(null);
  const [instagramData, setInstagramData] = useState(null);
  const [threadsData, setThreadsData] = useState(null);
  const [linkedinData, setLinkedinData] = useState(null);
  const [youtubeData, setYoutubeData] = useState(null);
  const [tiktokData, setTiktokData] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [brands, setBrands] = useState(null);
  const [showTokenLimitModal, setShowTokenLimitModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [trialExpired, setTrialExpired] = useState(false);
  
  const handleSaveImage = (imageBase64) => {
    setEditedImage(imageBase64);
    // You can save this to your state or send to a server
  };
  // Initialize postContent from localStorage
  const [postContent, setPostContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  
  // Add videoUrl state with localStorage persistence
  const [videoUrl, setVideoUrl] = useState(() => {
    const saved = localStorage.getItem('videoUrl');
    console.log("App: Initial videoUrl from localStorage:", saved);
    return saved || null;
  });
  
  const location = useLocation();
  const navigate = useNavigate();


  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

 
  const [selectedPages, setSelectedPages] = useState([]);

  // Add YouTube metadata state
  const [youtubeMetadata, setYoutubeMetadata] = useState({});

  // Add updateVideoUrl function
  const updateVideoUrl = React.useCallback((newVideoUrl) => {
    setVideoUrl(prevUrl => {
      // Only update if the value actually changed
      if (prevUrl === newVideoUrl) {
        return prevUrl;
      }
      
      console.log("App: Updating video URL from", prevUrl, "to", newVideoUrl);
      
      if (newVideoUrl) {
        localStorage.setItem('videoUrl', newVideoUrl);
      } else {
        localStorage.removeItem('videoUrl');
      }
      
      return newVideoUrl;
    });
  }, []);
  


  // Update state handler for PostScheduler
  const handlePostSchedulerStateChange = (newState) => {
   
    
    // Add this to update postContent when it's included in the state change
    if (newState.content !== undefined) {
      setPostContent(newState.content);
    }
    
    // Update imageUrls when it's included in the state change
    if (newState.imageUrls !== undefined) {
      setImageUrls(newState.imageUrls);
    }
    
    // Update YouTube metadata when it's included in the state change
    if (newState.youtubeMetadata !== undefined) {
      setYoutubeMetadata(newState.youtubeMetadata);
    }
  };

  const fetchAndUpdateAuthStatus = async () => {
    setIsSocialLoading(true);
    try {
      const response = await fetch(`https://app.postwand.io/api/auth/status`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch auth status');
      }

      const data = await response.json();
      
      if (data.isLoggedIn) {
        setIsLoggedIn(true);
        setUser(data.user);
        
        // Set subscription data
        if (data.subscription) {
          setSubscriptionData(data.subscription);
          setTrialExpired(data.subscription.trial_expired);
          
          // Show token modal if trial is expired
          if (data.subscription.trial_expired) {
            setShowTokenLimitModal(true);
          }
        }
  
        // Handle Facebook data
        if (data.facebook) {
          setFacebookData(data.facebook);
        }
        
        // Handle Instagram data
        if (data.instagram) {
          setInstagramData(data.instagram);
        }

        // Handle Threads data  
        if (data.threads) {
          setThreadsData(data.threads);
        }

        // Handle LinkedIn data
        if (data.linkedin) {
          setLinkedinData(data.linkedin);
        }

        if (data.youtube) {
          setYoutubeData(data.youtube);
        }

        if (data.tiktok) {
          setTiktokData(data.tiktok);
        }

        if (data.brands) {
          setBrands(data.brands);
        }
        
        // Don't reset postContent and imagePreview here!
        // We're already initializing them from localStorage
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
      setIsSocialLoading(false);
    }
  };

  const handleLogin = async (data) => {
    setIsLoggedIn(true);
    setUser(data.user);
    
    // Set subscription data and check if trial is expired
    if (data.subscription) {
      setSubscriptionData(data.subscription);
      setTrialExpired(data.subscription.trial_expired);
      
      // Show token modal if trial is expired
      if (data.subscription.trial_expired) {
        setShowTokenLimitModal(true);
      }
    }
    
    await fetchAndUpdateAuthStatus();
  };

  const handleRegister = async (data) => {
    setIsRegistered(true);
    setIsLoggedIn(true);
    setUser(data.user);
    await fetchAndUpdateAuthStatus();
    navigate('/home');
  };

  const handleSocialAuth = async (platform, authData) => {
    try {
      switch (platform) {
        case 'facebook':
          setFacebookData(authData);
          break;
        case 'instagram':
          setInstagramData(authData);
          break;
        case 'threads':
          setThreadsData(authData);
          break;
        case 'linkedin':
          setLinkedinData(authData);
          break;
        case 'youtube':
          setYoutubeData(authData);
          break;
        case 'tiktok':
          setTiktokData(authData);
          break;
      }
      // Fetch updated auth status after any social login
      await fetchAndUpdateAuthStatus();
    } catch (error) {
      console.error(`Error handling ${platform} auth:`, error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Before clear - localStorage keys:', Object.keys(localStorage));
      
      
      localStorage.clear();
      console.log('After clear - localStorage keys:', Object.keys(localStorage));
      
      // Then call the logout endpoint
      const response = await fetch(`https://app.postwand.io/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Update app state
      setIsLoggedIn(false);
      setUser(null);
      setFacebookData(null);
      setInstagramData(null);
      setThreadsData(null);
      setLinkedinData(null);
      setYoutubeData(null);
      setTrialExpired(false);
      setSubscriptionData(null);
      
      // Check if FB SDK is available and log out from there too
      if (window.FB) {
        window.FB.logout();
      }
      
      
      window.location.href = '/login';
      return; // Stop execution here - the page will reload
      
    
    } catch (error) {
      console.error('Error during logout:', error);
   
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    fetchAndUpdateAuthStatus();
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    // Predefined themes
    const themes = {
      default: {
        name: 'Default',
        colors: {
          '--bg-primary': '#F8F5FA',
          '--bg-secondary': '#faf8fb',
          '--sidebar-button-hover': '#CC00CC',
          '--home-button-hover': '#CC00CC',
          '--home-button-bg': '#CC00CC',
          '--home-button-text': '#FFFFFF',
          '--home-button-hover-text': '#FFFFFF',
          '--brand-button-bg': '#CC00CC',
          '--accent-color': '#CC00CC',
          "--second-accent-color": "#A010C4",
          '--sidebar-bg': '#F5E3F8',
          '--sidebar-text': '#CC00CC'
        }
      },
      
      light: {
        name: 'Light',
        colors: {
          '--bg-primary': 'rgba(246, 246, 246, 0.9)', // Using rgba to control opacity
          '--bg-secondary': '#F5F5F5',
          '--sidebar-button-hover': '#000000',
          '--home-button-hover': '#000000',
          '--home-button-bg': '#FFFFFF',
          '--home-button-text': '#000000',
          '--home-button-hover-text': '#FFFFFF',
          '--brand-button-bg': '#E3E3E3',
          '--accent-color': '#EBEDEC',
          "--second-accent-color": "#3b82f6",
          '--sidebar-bg': '#e3e3e3',
          '--sidebar-text': '#000000'
        }
      }
    };
    
    // First check if a theme is selected
    const savedTheme = localStorage.getItem('active-theme');
    
    if (savedTheme && themes[savedTheme]) {
      // Apply the saved theme
      Object.entries(themes[savedTheme].colors).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    } else {
      // Backward compatibility: check for individual color settings
      const savedPrimaryBg = localStorage.getItem('theme---bg-primary');
      const savedSecondaryBg = localStorage.getItem('theme---bg-secondary');
      const savedAccentColor = localStorage.getItem('theme---accent-color');
      const savedSecondAccentColor = localStorage.getItem('theme---second-accent-color');
      if (savedPrimaryBg) {
        document.documentElement.style.setProperty('--bg-primary', savedPrimaryBg);
      }
      
      if (savedSecondaryBg) {
        document.documentElement.style.setProperty('--bg-secondary', savedSecondaryBg);
      }
      
      if (savedAccentColor) {
        document.documentElement.style.setProperty('--accent-color', savedAccentColor);
      }

      if (savedSecondAccentColor) {
        document.documentElement.style.setProperty('--second-accent-color', savedSecondAccentColor);
      }
    }
  }, []);

  
  // Show loading state based on route
  if (isLoading || (isLoggedIn && isSocialLoading)) {
    const path = location.pathname;
    
    if (path === '/calendar') {
      return <CalendarSkeletonLoader />;
    } else if (path === '/ai-studio') {
      return <AiStudioSkeletonLoader />;
    } else if (path === '/scheduler') {
      return <SkeletonLoader />;
    } else if (path === '/messages') {
      return <MessagesSkeletonLoader />;
    } else if (path === '/image-library') {
      return <ImageLibrarySkeletonLoader />;

    } else if (path === '/brand-identity') {
      return <BrandStyleSkeletonLoader />;
    } else if (path === '/viral-chat') {
      return <ViralChatSkeletonLoader />;
    } else {
      // Default loading state for any other route
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      );
    }
  }

  // Replace the fetchClientSecret function with this improved version
  const fetchClientSecret = async () => {
    try {
      const response = await fetch('https://app.postwand.io/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout session error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      console.log('Checkout session created:', data);
      
      if (!data.clientSecret) {
        throw new Error('No client secret returned from server');
      }
      
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Return a rejected promise so Stripe shows an error
      return Promise.reject(error);
    }
  };

  const stripeOptions = { 
    fetchClientSecret, 
    elementsOptions: { 
      appearance: { theme: 'stripe' } 
    } 
  };

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          isLoggedIn ? 
            (trialExpired ? 
              <Navigate to="/trial-end" replace /> : 
              <Navigate to="/home" replace />) : 
            <div className="w-full h-screen flex items-center justify-center bg-white">
              <Login onLogin={handleLogin} />
            </div>
        } />
        
        <Route path="/register" element={
          isRegistered ? 
            <Navigate to="/home" replace /> : 
            <div className="w-full h-full flex items-center justify-center">
              <Register onLogin={handleRegister} />
            </div>
        } />

        <Route path="/verify" element={
          <VerifyCode onLogin={handleLogin} />
        } />

        {/* Trial End Route - MOVED OUTSIDE protected routes */}
        <Route path="/trial-end" element={
          !isLoggedIn ? 
            <Navigate to="/login" replace /> :
            <div className="min-h-screen flex relative">
              <SideBar user={user} onLogout={handleLogout} />
              <div className="flex-1 w-full lg:ml-64 pb-20 sm:pb-0 sm:pt-16 lg:pt-0 relative">
                <div className="bg-primary h-full flex items-center justify-center">
                  <TokenLimitModal 
                    isOpen={true} 
                    onClose={() => navigate('/pricing')} 
                    isTrialExpired={true}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </div>
        }/>

        {/* Public Legal Pages - Accessible without login */}
        <Route path="/privacy-policy" element={
          <div className="bg-primary min-h-screen p-6">
            <PrivacyPolicy />
          </div>
        }/>

        <Route path="/privacy-policy-es" element={
          <div className="bg-primary min-h-screen p-6">
            <PrivacyPolicyES />
          </div>
        }/>

        <Route path="/terms-conditions" element={
          <div className="bg-primary min-h-screen p-6">
            <TermsConditions />
          </div>
        }/>

        <Route path="/terms-conditions-es" element={
          <div className="bg-primary min-h-screen p-6">
            <TermsConditionsES />
          </div>
        }/>

        {/* Pricing Page - Always accessible */}
        <Route path="/pricing" element={
          <div className="bg-primary min-h-screen p-6">
            <PricingTiers />
          </div>
        }/>

        {/* Main App Routes - Protected by login and trial status */}
        <Route element={
          !isLoggedIn ? 
            <Navigate to="/login" replace /> :
            trialExpired ? 
              <Navigate to="/trial-end" replace /> : 
              <div className="min-h-screen flex relative">
                <SideBar user={user} onLogout={handleLogout} />
                <div className="flex-1 w-full lg:ml-64 pb-20 sm:pb-0 sm:pt-16 lg:pt-0 relative">
                  <Outlet />
                </div>
              </div>
        }>

          <Route path="/home" element={
              <div className="bg-primary h-full">
                <Home />
              </div>
            } />

            <Route path="/ai-studio-2" element={
              <div className="bg-primary h-full">
                <AIStudio2 />
              </div>
            } />

          <Route path="/create-images" element={
            <div className="bg-primary h-full">
              <CreateImages />
            </div>
          } />

          <Route path="/scheduler" element={
            <PostCreator 
              facebookData={facebookData} 
              instagramData={instagramData}
              threadsData={threadsData}
              tiktokData={tiktokData}
              linkedinData={linkedinData}
              youtubeData={youtubeData}
              videoUrl={videoUrl}
              updateVideoUrl={updateVideoUrl}
              postContent={postContent}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPages={selectedPages}
              setSelectedPages={setSelectedPages}
              onStateChange={handlePostSchedulerStateChange}
              imageUrls={imageUrls}
              youtubeMetadata={youtubeMetadata}
            />
          }/>
          
          {/* Add other protected routes here */}
          <Route path="/calendar" element={
            <div className="bg-primary"> 
            <CustomCalendar
              
              isLoggedIn={isLoggedIn}
              facebookData={facebookData}
              instagramData={instagramData}
              threadsData={threadsData}
              tiktokData={tiktokData}
              linkedinData={linkedinData}
              youtubeData={youtubeData}
            />
            </div>
          }/>

          <Route path="/create-post" element={
            <div className="bg-primary h-full">
              <CreatePost />
            </div>
          }/>

          <Route path="/create-text" element={
            <div className="bg-primary h-full">
              <CreateText />
            </div>
          }/>
          
          {/* Add ViralChat route */}
          <Route path="/viral-chat/:id?" element={
            <div className="bg-primary h-full">
              {isLoading ? <ViralChatSkeletonLoader /> : <ViralChatSession />}
            </div>
          }/>
          
          {/* Continue with other routes */}
        
          <Route path="/ai-studio" element={
            <div className="bg-primary ">
              <AiStudio 
                setPostContent={setPostContent}
                brands={brands}
              />
            </div>
          }>
            <Route index element={<AiStudioHome />} />
            <Route path="ideas" element={<ViralChatSession brands={brands} />} />
            <Route path="images" element={<CreatePost />} />
            <Route path="text" element={<CreateText />} />
            <Route path="post" element={<CreatePost />} />
          </Route>
          
          <Route path="/social-accounts" element={
            <div className="py-4 md:pr-2 bg-primary h-full">
                <div className=" h-28 flex flex-col  py-2 px-4 mb-1 rounded-lg bg-gray-100/80 border-white">
                  <h1 className=" text-3xl font-medium text-pink-500">
                    Social Accounts
                  </h1>
                </div>
              <FacebookAuth 
                onAuth={handleSocialAuth}
                facebookPages={facebookData?.pages || []}
                instagramAccounts={instagramData?.accounts || []}
                threadsAccounts={threadsData?.accounts || []}
                linkedinAccounts={linkedinData?.accounts || []} 
                youtubeChannels={youtubeData?.channels || []}
                tiktokAccounts={tiktokData?.accounts || []}
              />
            </div>
          }/>
          
          <Route path="/image-editor" element={
            <div className="py-4 pr-2">
              <ImageEditor 
                initialImage={editedImage} 
                onSave={handleSaveImage} 
                onCancel={() => console.log('Editing cancelled')} 
              />
            </div>
          }/>
          
          <Route path="/image-library" element={
            <div className="bg-primary">
              <ImageLibrary />
            </div>
          } />
          
          <Route path="/profile" element={
            <div className="bg-primary">
              <Profile user={user} />
            </div>
          }/>
          
          <Route path="/pricing-tiers" element={
            <div className="bg-primary">
              <PricingTiers />
            </div>
          }/>
          

          <Route path="/brand-identity" element={
            <div className="bg-primary min-h-screen">
              <BrandIdentity
                facebookData={facebookData}
                instagramData={instagramData}
                threadsData={threadsData}
                linkedinData={linkedinData}
                youtubeData={youtubeData}
                />
            </div>
          }/>
         {/*
          <Route path="/insights" element={
            <div className="bg-primary min-h-screen">
              <InstagramInsights instagramData={instagramData} />
            </div>
          } />
          */}
          
          <Route path="/settings" element={
            <div className="bg-primary min-h-screen">
              <Settings />
            </div>
          } />

          <Route path="/viral-chat" element={
            <div className="bg-primary min-h-screen">
              <ViralChatSession brands={brands} />
            </div>
          } />
        </Route>
        
        {/* Checkout Routes - Add protection but allow access even with expired trial */}
        <Route path="/checkout" element={
          !isLoggedIn ? 
            <Navigate to="/login" replace /> :
            <div className="bg-white">
              <CheckoutProvider stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm />
              </CheckoutProvider>
            </div>
        }/>
        
        <Route path="/checkout/return" element={
          !isLoggedIn ? 
            <Navigate to="/login" replace /> :
            <div className="bg-[#faf8fb] p-6">
              <CardTitle className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
                Payment Status
              </CardTitle>
              <CheckoutReturn />
            </div>
        }/>

        {/* Redirect to login by default if not logged in, otherwise to scheduler */}
        <Route 
          path="*" 
          element={<Navigate to={isLoggedIn ? "/scheduler" : "/login"} replace />} 
        />

        <Route path="/deletion-confirmation" element={<DeletionConfirmation />} />

        <Route path="/image-fabric" element={
            <ImageEditorFabric />
          }/>
      </Routes>
    </>
  );
}

// Add CheckoutReturn component
function CheckoutReturn() {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/checkout');
      return;
    }

    fetch(`https://app.postwand.io/api/session-status?session_id=${sessionId}`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      })
      .catch(err => {
        console.error("Error fetching checkout status:", err);
      });
  }, [searchParams, navigate]);

  if (status === 'open') {
    return <Navigate to="/checkout" replace />;
  }

  if (status === 'complete') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
        <p className="mb-4">
          We appreciate your business! A confirmation email will be sent to <span className="font-medium">{customerEmail}</span>.
        </p>
        <p className="mb-6">
          If you have any questions, please email <a href="mailto:support@threads.com" className="text-blue-500 hover:underline">support@threads.com</a>.
        </p>
        <button 
          onClick={() => navigate('/scheduler')}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
}

export default App;