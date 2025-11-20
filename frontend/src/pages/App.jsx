import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Outlet, Navigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import Login from "./auth/Login";
import Integrations from "./integrations/Integrations.jsx";
import PostCreator from "./scheduler/PostCreator"; 
import SideBar from "./sidebar/SideBar";
import Register from "./auth/Register";
import Profile from "@components/Profile";
import Home from "./home/Home";
import Calendar from "./calendar/Calendar";
import BrandIdentity from "./brands/Brands.jsx";
import Brand from "./brands/Brand";
import Brand2 from "./brands/BrandProfile";
import Products from "./brands/Products";
import DeletionConfirmation from './auth/DeletionConfirmation';

import CreateText from "./CreatePost/createText/CreateText";
import EditImage from "./CreatePost/editImage/EditImage"; 
import CreateVideo from "./CreatePost/CreateVideo/CreateVideo";
import CreateAd from "./AiStudio/createAds/CreateAd";
import ImageLibrary from './ImageLibrary/ImageLibrary';
import Onboarding from './onboarding/Onboarding';

import PrivacyPolicy from "@components/legal/PrivacyPolicy";
import PrivacyPolicyES from "@components/legal/PrivacyPolicy_es";
import TermsConditions from "@components/legal/TermsConditions";
import TermsConditionsES from "@components/legal/TermsConditions_es";
import TokenLimitModal from "@components/TokenLimitModal";

import PricingTiers from '@components/pricing_tiers/pricing_tiers';

import "../styles/App.css";

function App() {
  const { i18n } = useTranslation();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('user');
  });

  // Calculate trial expired from user.has_access
  const trialExpired = user ? !user.has_access : false;

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user_logged_out'));
    navigate('/login');
  };

  useEffect(() => {
    const syncAuthState = () => {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!user);
      setUser(userData);
      if (userData?.language) {
        i18n.changeLanguage(userData.language);
      }
    };

    const handleSubscriptionRequired = () => {
      syncAuthState(); // Refresh user state
      navigate('/trial-end');
    };

    syncAuthState();

    window.addEventListener('user_logged_out', syncAuthState);
    window.addEventListener('user_logged_in', syncAuthState);
    window.addEventListener('subscription_required', handleSubscriptionRequired);

    return () => {
      window.removeEventListener('user_logged_out', syncAuthState);
      window.removeEventListener('user_logged_in', syncAuthState);
      window.removeEventListener('subscription_required', handleSubscriptionRequired);
    };
  }, [i18n, navigate]);

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        {isLoggedIn ? (
          <>
            <Route path="/" element={<Navigate to="/home" replace />}/>
            <Route path="/login" element={
              trialExpired ? 
                <Navigate to="/trial-end" replace /> : 
                <Navigate to="/home" replace />
            } />
         
          </>
        ) : (
          <>
          <Route path="/" element={<Navigate to="/login" replace />}/>
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register />} />
    
          </>
        )}
        {/* Public Legal Pages - Accessible without login */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />}/>
        <Route path="/privacy-policy-es" element={<PrivacyPolicyES />}/>
        <Route path="/terms-conditions" element={<TermsConditions />}/>
        <Route path="/terms-conditions-es" element={<TermsConditionsES />}/>
        <Route path="/pricing" element={<PricingTiers />}/>
        <Route path="/deletion-confirmation" element={<DeletionConfirmation />} /> 

        {/* Trial End - Accessible when logged in but no access */}
        {isLoggedIn && (
          <Route path="/trial-end" element={<TokenLimitModal 
                    isOpen={true} 
                    onClose={() => navigate('/pricing')} 
                    isTrialExpired={true}
                    onLogout={handleLogout}
          />} />
        )}

        {/* Onboarding - Accessible when logged in, no sidebar */}
        {isLoggedIn && (
          <Route path="/onboarding" element={<Onboarding />} />
        )}

        <Route element={
          !isLoggedIn ? 
            <Navigate to="/login" replace /> :
            trialExpired ? 
              <Navigate to="/trial-end" replace /> : 
              <div className="bg-primary min-h-screen flex relative">
                <SideBar user={user} />
                <div className="bg-primary flex-1 w-full lg:ml-60 pb-20 sm:pb-0 sm:pt-16 lg:pt-0 relative">
                  <Outlet />
                </div>
              </div>
        }>

          <Route path="/home" element={<Home />} />
          <Route path="/scheduler" element={<PostCreator />}/>
          <Route path="/calendar" element={< Calendar />}/>
          
          <Route path="/edit-image" element={<EditImage />} />
          <Route path="/create-text" element={<CreateText />} />
          <Route path="/create-video" element={<CreateVideo />} />
          <Route path="/create-ad" element={<CreateAd/>} />

          <Route path="/integrations" element={<Integrations />}/>
          <Route path="/image-library" element={<ImageLibrary />} />
          <Route path="/profile" element={<Profile user={user} />}/>
          <Route path="/pricing-tiers" element={<PricingTiers />}/>
          <Route path="/brands" element={<BrandIdentity /> }/>
          <Route path="/brand2" element={<Brand2 /> }/>

          
          <Route path="/brands/:brandId" element={<Brand />} />
          <Route path="/brands/products" element={<Products />} />

        </Route>
      </Routes>
    </>
  );
}

export default App;