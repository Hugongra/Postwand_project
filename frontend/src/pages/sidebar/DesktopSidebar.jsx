import React from "react";
import { LogOut, Plus, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import PostwandLogo from '/images/postwand_logo_color.png';

// Desktop Sidebar Item Component
const SidebarItem = ({ icon, customIcon, text, active, onClick, rightButton }) => (
  <div
    onClick={onClick}
    className={`flex items-center h-10 gap-3 p-3 rounded-lg cursor-pointer transition-all 
      ${active 
        ? "bg-sidebar-bg text-sidebar-text shadow-inner" 
        : "hover:bg-gray-200/50 text-gray-600 hover:text-gray-900"
      }`} 
  >
    <div className="flex-shrink-0 flex items-center justify-center">
      {customIcon || icon}
    </div>
    <span className="whitespace-nowrap text-sm font-normal flex-1" >
      {text} 
    </span>
    {rightButton && (
      <div onClick={(e) => e.stopPropagation()}>
        {rightButton}
      </div>
    )}
  </div>
);

// Desktop Sidebar Component
export const DesktopSidebar = ({ 
  user, 
  navigationItems, 
  currentPath, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  handleCreateNewPost, 
  handleLogout 
}) => {
  const { t } = useTranslation();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

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
      <div className={`hidden sm:block fixed top-0 left-0 h-screen bg-primary z-40 transition-transform duration-300 w-60 ${
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
            {navigationItems.map((item, index) => (
              <React.Fragment key={item.path}>
                <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <SidebarItem
                    icon={item.icon}
                    text={item.text}
                    active={currentPath === item.path}
                  />
                </Link>
                {/* Add spacing after Brands item */}
                {index === 2 && <br />}
                {index === 6 && <br />}
              </React.Fragment>
            ))}
          </nav>

          <div className="mt-auto">
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}> 
              <SidebarItem
                customIcon={
                  <div className="w-7 h-7 p-0 m-0 text-[12px] rounded-full bg-purple-800 flex items-center justify-center text-white ">
                    {firstLetter}
                  </div>
                }
                text={user.name }
                active={currentPath === "/profile"}
                rightButton={
                  <Link 
                    to="/trial-end" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-1.5 text-xs text-gray-700 hover:text-black font-medium bg-white border-purple-600 rounded-md transition-colors whitespace-nowrap"
                  >
                    Plan
                  </Link>
                }
              />
            </Link>
            <SidebarItem
              icon={<LogOut size={18} strokeWidth={1.5}/>}
              text={t('navigation.logout')}
              active={false}
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopSidebar;

