import React from "react";
import { LogOut, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

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

// Mobile Bottom Navigation Component
export const MobileBottomNav = ({ 
  user, 
  navigationItems, 
  currentPath, 
  handleCreateNewPost, 
  handleLogout 
}) => {
  const { t } = useTranslation();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
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
            <button onClick={handleLogout}>
              <BottomNavItem
                icon={<LogOut size={16} strokeWidth={1.5}/>}
                text={t('navigation.logout')}
                active={false}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;

