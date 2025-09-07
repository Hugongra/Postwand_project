import React, { useState } from "react";
import { Edit, CalendarDays, LogOut, Image, MessageSquareText, Share2, PencilRuler, Images, Clock, Plus, Home, BarChart, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoPricetagsOutline } from "react-icons/io5";
import { ChartColumn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PostwandLogo from '/images/postwand_logo_color.png';

// Add this dialog component
const ConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl text-center">
        <h3 className="text-lg font-normal mb-4 text-center">{t('social.createNewPost')}</h3>
        <p className="text-gray-600 mb-6 text-center">
          {t('social.createNewPostMessage')}
        </p>
        <div className="flex justify-center space-x-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-gray-700 rounded-lg bg-gray-100/80 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2 bg-accent text-white rounded-lg"
          >
            {t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SideBar = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get first letter of user name for the avatar
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  // Function to handle creating a new post - clears storage and navigates
  const handleCreateNewPost = () => {
    // Check if we're already on the scheduler page and might have unsaved changes
    if (currentPath === "/scheduler") {
      // If we're on the scheduler page, show confirmation to create a new post
      setShowConfirmDialog(true);
    } else {
      // Otherwise, just navigate to create a new post
      navigateToNewPost();
    }
  };
  
  // Function to handle actual navigation after confirmation
  const navigateToNewPost = () => {
    // Clear any existing post data from localStorage
    localStorage.removeItem('videoUrl');
    sessionStorage.removeItem('selectedDate');
    
    // Navigate and trigger clear
    navigate('/scheduler');
    window.dispatchEvent(new Event('clearPost'));
    setShowConfirmDialog(false);
  };

  // Navigation items array for reusability
  const navigationItems = [
    { path: "/home", icon: <Home size={26} strokeWidth={1.6}/>, text: t('navigation.home') },
    { path: "/calendar", icon: <CalendarDays size={26} strokeWidth={1.6}/>, text: t('navigation.calendar') },
    { path: "/brand-identity", icon: <IoPricetagsOutline size={26} strokeWidth={2}/>, text: t('navigation.brands') },
    { path: "/ai-studio", icon: <Image size={26} strokeWidth={1.6}/>, text: t('navigation.aiStudio') },
   // { path: "/insights", icon: <ChartColumn size={26} strokeWidth={1.6}/>, text: t('navigation.insights') },
    //{ path: "/recent", icon: <Clock size={26} strokeWidth={1.6}/>, text: t('navigation.drafts') },
    { path: "/image-library", icon: <Images size={26} strokeWidth={1.6}/>, text: t('navigation.imageLibrary') },
    { path: "/social-accounts", icon: <Share2 size={26} strokeWidth={1.6}/>, text: t('navigation.socialAccounts') },
    // Removed viral chat from navigation items
  ];

  return (
    <>
      {/* Mobile Menu Button - Only visible on tablets (medium screens) */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hidden sm:block lg:hidden"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Drawer Overlay - Only on tablets */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 hidden sm:block lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Hidden on mobile, drawer on tablet, fixed on desktop */}
      <div className={`hidden sm:block fixed top-0 left-0 h-screen bg-primary z-40 transition-transform duration-300 w-64 ${
        isMobileMenuOpen ? 'transform translate-x-0' : 'transform -translate-x-full'
      } lg:transform-none lg:translate-x-0`}>
        <div className="px-2 py-1 flex flex-col h-full w-full">
          <div className="flex items-center h-14 justify-start">
            <img src={PostwandLogo} alt="Postwand Logo" className="w-32 h-auto object-cover" />
          </div>
          
          {/* Custom Create Post Button */}
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleCreateNewPost();
            }}
              className="text-sm w-full border shadow-md rounded-lg py-2 px-4 flex items-center justify-center font-normal create-post-button"
          >
            <Plus size={20} className="mr-2" />
            {t('social.newPost')}
          </button>
          
          <nav className="flex flex-col mt-4 flex-grow">
            <Link to="/home" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<Home size={20} strokeWidth={1.4}/>}
                text={t('navigation.home')}
                active={currentPath === "/home"}
              />
            </Link>
            <Link to="/calendar" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<CalendarDays size={20} strokeWidth={1.4}/>}
                text={t('navigation.calendar')}
                active={currentPath === "/calendar"}
              />
            </Link>
            <Link to="/brand-identity" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                  icon={<IoPricetagsOutline size={20} strokeWidth={1.8}/>}
                text={t('navigation.brands')}
                active={currentPath === "/brand-identity"}
              />
            </Link>
          
           
            
            <Link to="/ai-studio" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<Image size={20} strokeWidth={1.4}/>}
                text={t('navigation.aiStudio')}
                active={currentPath === "/ai-studio"}
              />
            </Link>
            {/*
            <Link to="/insights" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<ChartColumn size={20} strokeWidth={1.4}/>}
                text={t('navigation.insights')}
                active={currentPath === "/insights"}
              />
            </Link>
            */}
          
            <br></br>

           
            {/*<Link to="/recent" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<Clock size={20} strokeWidth={1.4}/>}
                text={t('navigation.drafts')}
                active={currentPath === "/recent"}
              />
            </Link>
            {/* Remove this viral chat link */}
            {/*
            <Link to="/viral-chat" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<MessageSquareText size={20} strokeWidth={1.6}/>}
                text="Viral Chat"
                active={currentPath === "/viral-chat"}
              />
            </Link>
            */}
            {/*
            <Link to="/image-editor">
              <SidebarItem
                icon={<PencilRuler size={20} strokeWidth={1.6}/>}
                text={t('navigation.editor')}
                active={currentPath === "/image-editor"}
              />
            </Link>
            */}
            <Link to="/image-library" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                  icon={<Images size={20} strokeWidth={1.4}/>}
                text={t('navigation.imageLibrary')}
                active={currentPath === "/image-library"}
              />
            </Link>
          
            <Link to="/social-accounts" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarItem
                icon={<Share2 size={20} strokeWidth={1.4}/>}
                text={t('navigation.socialAccounts')}
                active={currentPath === "/social-accounts"}
              />
            </Link>
          </nav>

          <div className="mt-auto">
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}> 
              <SidebarItem
                customIcon={
                  <div className="w-7 h-7 p-0 m-0 text-[12px] rounded-full bg-purple-800 flex items-center justify-center text-white ">
                    {firstLetter}
                  </div>
                }
                text={user.name}
                active={currentPath === "/profile"}
              />
            </Link>
            <SidebarItem
              icon={<LogOut size={20} strokeWidth={1.4}/>}
              text={t('navigation.logout')}
              active={false}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only on small mobile screens */}
      <div 
        className="sm:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200" 
        style={{
          position: 'fixed', 
          bottom: '0px', 
          left: '0px', 
          right: '0px',
          zIndex: 9999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="relative">
          {/* Scrollable Navigation Container */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max px-2 py-2">
              {/* 2 items on the LEFT */}
              {navigationItems.slice(0, 2).map((item) => (
                <Link key={item.path} to={item.path}>
                  <BottomNavItem
                    icon={item.icon}
                    text={item.text}
                    active={currentPath === item.path}
                  />
                </Link>
              ))}
              
              {/* Create Post Button - Centered */}
              <button 
                onClick={handleCreateNewPost}
                className="flex flex-col items-center justify-center min-w-[60px] px-2 py-1 mx-2"
              >
                <div className="w-8 h-8 bg-[#CC00CC] rounded-full flex items-center justify-center mb-1 shadow-lg">
                  <Plus size={16} className="text-white" />
                </div>
                <span className="text-[10px] text-gray-600 font-normal">New</span>
              </button>

              {/* 2 items on the RIGHT */}
              {navigationItems.slice(2, 4).map((item) => (
                <Link key={item.path} to={item.path}>
                  <BottomNavItem
                    icon={item.icon}
                    text={item.text}
                    active={currentPath === item.path}
                  />
                </Link>
              ))}

              {/* Remaining items (partially visible to show scroll) */}
              {navigationItems.slice(4).map((item) => (
                <Link key={item.path} to={item.path}>
                  <BottomNavItem
                    icon={item.icon}
                    text={item.text}
                    active={currentPath === item.path}
                  />
                </Link>
              ))}

              {/* Profile Item */}
              <Link to="/profile">
                <BottomNavItem
                  customIcon={
                    <div className="w-5 h-5 text-[8px] rounded-full bg-purple-800 flex items-center justify-center text-white">
                      {firstLetter}
                    </div>
                  }
                  text={t('navigation.profile')}
                  active={currentPath === "/profile"}
                />
              </Link>

              {/* Logout Item */}
              <button onClick={onLogout}>
                <BottomNavItem
                  icon={<LogOut size={16} strokeWidth={1.4}/>}
                  text={t('navigation.logout')}
                  active={false}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog} 
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={navigateToNewPost}
      />
    </>
  );
};

// Desktop Sidebar Item Component
const SidebarItem = ({ icon, customIcon, text, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center h-10 gap-3 p-3 rounded-sm cursor-pointer transition-all 
      ${active 
        ? "bg-sidebar-bg text-sidebar-text shadow-inner" 
        : "hover:bg-gray-200/50 text-gray-600 hover:text-gray-900"
      }`} 
  >
    <div className="flex-shrink-0 flex items-center justify-center">
      {customIcon || icon}
    </div>
    <span className="whitespace-nowrap text-sm font-normal" >
      {text}
    </span>
  </div>
);

// Mobile Bottom Navigation Item Component
const BottomNavItem = ({ icon, customIcon, text, active, onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center justify-center min-w-[20vw] px-0 py-1 cursor-pointer"
  >
    <div className={`mb-1 ${active ? 'text-[#CC00CC]' : 'text-gray-900'}`}>
      {customIcon || React.cloneElement(icon, { size: 16 })}
    </div>
      <span className={`text-[10px] max-w-[50px] font-normal ${active ? 'text-[#CC00CC]' : 'text-gray-900'}`}>
      {text}
    </span>
  </div>

);

export default SideBar;