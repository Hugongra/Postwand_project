import React, { useState } from "react";
import { Edit, CalendarDays, LogOut, Image, MessageSquareText, Share2, PencilRuler, Images, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const SideBar = ({ user, onLogout }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;
  console.log(currentPath);

  return (
    <div 
      className={`${expanded ? 'w-64' : 'w-20'} fixed top-0 left-0 h-screen bg-white border-r transition-all duration-300 ease-in-out overflow-hidden z-50`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="p-4 flex flex-col h-full">
        <div className={`flex items-center h-14 ${expanded ? 'justify-start' : 'justify-center'}`}>
          {expanded ? (
            <img src="/postwand_logo_color.png" alt="Postwand Logo" className="w-[10vw] h-auto object-cover" />
          ) : (
            
            <img src="/postwand_wand_logo_color.png" alt="Postwand Logo" className="w-[60px] h-[60px] object-cover" />
         
          )}
        </div>
        
        <nav className="flex flex-col mt-6 flex-grow">
          <Link 
            to="/scheduler"
          >
            <SidebarItem 
              icon={<Edit size={20} strokeWidth={1.8}/>} 
              text="Create Post" 
              active={currentPath === "/scheduler"}
              expanded={expanded}
            />
          </Link>
          <Link 
            to="/calendar"
          >
            <SidebarItem
              icon={<CalendarDays size={20} strokeWidth={1.8}/>}
              text="Calendar"
              active={currentPath === "/calendar"}
              expanded={expanded}
            />
          </Link>
          <Link 
            to="/messages"
          >
            <SidebarItem
              icon={<MessageSquareText size={20} strokeWidth={1.8}/>}
              text="Messages"
              active={currentPath === "/messages"}
              expanded={expanded}
            />
          </Link>
          <Link 
            to="/ai-studio"
          >
            <SidebarItem
              icon={<Image size={20} strokeWidth={1.8}/>}
              text="AI Studio"
              active={currentPath === "/ai-studio"}
              expanded={expanded}
            />
          </Link>
          
          <Link 
            to="/image-editor"
          >
            <SidebarItem
                icon={<PencilRuler size={20} strokeWidth={1.8}/>}
              text="Image Editor"
              active={currentPath === "/image-editor"}
              expanded={expanded}
            />
          </Link>
          <Link 
            to="/image-library"
          >
            <SidebarItem
                icon={<Images size={20} strokeWidth={1.8}/>}
              text="Image Library"
              active={currentPath === "/image-library"}
              expanded={expanded}
            />
          </Link>
          <Link 
            to="/social-accounts"
          >
            <SidebarItem
              icon={<Share2 size={20} strokeWidth={1.8}/>}
              text="Social Accounts"
              active={currentPath === "/social-accounts"}
              expanded={expanded}
            />
          </Link>
          
        </nav>

        <div  className="mt-auto">
          <Link to="/profile"> 
          <SidebarItem
            icon={<User size={20} strokeWidth={1.8}/>}
            text={user.name}
            active={currentPath === "/profile"}
            expanded={expanded}
          />
          </Link>
          <SidebarItem
            icon={<LogOut size={20} strokeWidth={1.8}/>}
            text="Logout"
            active={false}
            expanded={expanded}
            onClick={onLogout}
          />
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, expanded, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center h-10   ${expanded ? 'gap-3' : 'gap-0'} p-3 rounded-lg cursor-pointer transition-all duration-300
      ${active 
        ? "bg-pink-100 text-pink-600" 
        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      }`} 
  >
    <div className="flex-shrink-0 flex items-center justify-center text-[14px]">
      {icon}
    </div>
    {expanded && (
      <span className="font-medium whitespace-nowrap transition-opacity duration-200 text-[15px]">
        {text}
      </span>
    )}
  </div>
);

export default SideBar;