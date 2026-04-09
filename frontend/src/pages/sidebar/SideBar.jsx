import React, { useState } from "react";
import { CalendarDays, Image, Share2, Images, Home, Type, Video } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoPricetagsOutline } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import * as api from '@services/api/api';
import { clearAuthTokens } from '@services/api/authTokens';
import { getSupabaseBrowserClient } from '@services/supabase/client';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';
import ConfirmDialog from './ConfirmDialog';

// Main SideBar Component
export const SideBar = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items configuration
  const navigationItems = [
    { path: "/home", icon: <Home size={20} strokeWidth={1.5}/>, text: t('navigation.home') },
    { path: "/calendar", icon: <CalendarDays size={18} strokeWidth={1.5}/>, text: t('navigation.calendar') },
    { path: "/brands", icon: <IoPricetagsOutline size={18} strokeWidth={1.5}/>, text: t('navigation.brands') },
    { path: "/edit-image", icon: <Image size={18} strokeWidth={1.5}/>, text: t('aiStudio.option.editImages') },
    { path: "/create-text", icon: <Type size={18} strokeWidth={1.5}/>, text: t('aiStudio.option.createCaptions') },
    //{ path: "/create-video", icon: <Video size={18} strokeWidth={1.5}/>, text: t('aiStudio.option.generatePost') },
    { path: "/image-library", icon: <Images size={18} strokeWidth={1.5}/>, text: t('navigation.imageLibrary') },
    { path: "/integrations", icon: <Share2 size={18} strokeWidth={1.5}/>, text: t('navigation.socialAccounts') },
  ];

  const handleCreateNewPost = () => {
    if (currentPath === "/scheduler") setShowConfirmDialog(true);
    else navigateToNewPost();
  };

  const navigateToNewPost = () => {
    localStorage.removeItem('videoUrl');
    sessionStorage.removeItem('selectedDate');
    navigate('/scheduler');
    window.dispatchEvent(new Event('clearPost'));
    setShowConfirmDialog(false);
  };

  const handleLogout = async () => {
    api.Logout();
    clearAuthTokens();
    const supa = getSupabaseBrowserClient();
    if (supa) {
      try {
        await supa.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user_logged_out'));
    navigate('/login');
  };

  return (
    <>
      <DesktopSidebar
        user={user}
        navigationItems={navigationItems}
        currentPath={currentPath}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleCreateNewPost={handleCreateNewPost}
        handleLogout={handleLogout}
      />

      <MobileBottomNav
        user={user}
        navigationItems={navigationItems}
        currentPath={currentPath}
        handleCreateNewPost={handleCreateNewPost}
        handleLogout={handleLogout}
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog} 
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={navigateToNewPost}
      />
    </>
  );
};

export default SideBar;
