import React from "react";

const SideBarSkeleton = () => {
  return (
    <div className="w-64 m-0 fixed top-0 left-0 h-screen bg-[#F8F5FA] z-10 animate-pulse hidden md:block">
      <div className="p-2 flex flex-col h-full">
        {/* Logo placeholder */}
        <div className="flex items-center h-14 justify-start">
          <div className="w-[7vw] h-7 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* New Post button placeholder */}
        <div className="mt-2 w-full h-10 bg-gray-200 rounded-lg"></div>
        
        {/* Navigation items */}
        <div className="flex flex-col mt-4 flex-grow space-y-2">
          {/* Calendar */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Messages */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Recent Drafts */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-28 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          <div className="h-4"></div> {/* Spacer */}
          
          {/* Brand Identity */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-28 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* AI Studio */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Image Editor */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-28 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Image Library */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-28 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          
          <div className="h-4"></div> {/* Spacer */}
          
          {/* Social Accounts */}
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-32 h-4 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* User profile and logout */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-7 h-7 bg-gray-300 rounded-full"></div>
            <div className="w-20 h-4 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="flex items-center h-10 gap-3 p-3 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-4 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBarSkeleton; 