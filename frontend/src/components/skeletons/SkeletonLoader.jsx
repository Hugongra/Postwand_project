import React from "react";
import SideBarSkeleton from "./SideBarSkeleton";

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen flex bg-[#F8F5FA]">
      {/* Sidebar Skeleton */}
      <SideBarSkeleton />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-60">
        <div className="p-2 mt-2">
          <div className="flex gap-1">
            {/* Post Scheduler Area (65%) */}
            <div className="w-[65%]">
              {/* Header */}
              <div className="w-full h-28 max-w-[98%] mb-1 mx-auto bg-[#F8F9FA] border-white p-4 rounded-lg animate-pulse">
                <div className="w-48 h-8 bg-gray-200 rounded-md"></div>
              </div>
              
              {/* Main Card */}
              <div className="w-full max-w-[98%] mx-auto bg-[#FDFDFD] rounded-lg shadow p-6 animate-pulse">
                {/* Platform Selection */}
                <div className="space-y-2 mb-6">
                  <div className="w-40 h-5 bg-gray-200 rounded-md"></div>
                  <div className="flex space-x-2">
                    <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                    <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                    <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                
                {/* Account Selection */}
                <div className="space-y-2 mb-6">
                  <div className="w-48 h-5 bg-gray-200 rounded-md"></div>
                  <div className="flex space-x-2">
                    <div className="w-48 h-12 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                
                {/* Post Type */}
                <div className="space-y-2 mb-6">
                  <div className="w-36 h-5 bg-gray-200 rounded-md"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 bg-gray-200 rounded-md"></div>
                    <div className="h-10 bg-gray-200 rounded-md"></div>
                    <div className="h-10 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                
                {/* Media Upload Area */}
                <div className="w-full h-40 bg-gray-200 rounded-md mb-6"></div>
                
                {/* Caption Area */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <div className="w-20 h-5 bg-gray-200 rounded-md"></div>
                    <div className="flex space-x-2">
                      <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                      <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                  <div className="w-full h-64 bg-gray-200 rounded-md"></div>
                </div>
                
                {/* Date Time Picker */}
                <div className="space-y-2 mb-6">
                  <div className="w-40 h-5 bg-gray-200 rounded-md"></div>
                  <div className="flex justify-between">
                    <div className="w-1/2 h-10 bg-gray-200 rounded-md mr-2"></div>
                    <div className="w-1/2 h-10 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                
                {/* Schedule Button */}
                <div className="w-full h-10 bg-gray-200 rounded-md"></div>
              </div>
            </div>
            
            {/* Post Preview Area (35%) - More compact version */}
            <div className="w-[35%] sticky top-4 self-start">
              <div className="rounded-lg bg-white p-3 shadow animate-pulse">
                {/* Platform tabs - shorter */}
                <div className="flex mb-2 border-b">
                  <div className="w-20 h-7 bg-gray-200 rounded-t-lg"></div>
                  <div className="w-20 h-7 bg-gray-200 rounded-t-lg ml-2"></div>
                </div>
                
                {/* Post Preview Placeholder - more compact */}
                <div className="flex flex-col items-center">
                  {/* Header with profile pic and name - smaller */}
                  <div className="w-full flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="ml-2">
                      <div className="w-24 h-3 bg-gray-200 rounded-md"></div>
                      <div className="w-16 h-2 bg-gray-200 rounded-md mt-1"></div>
                    </div>
                  </div>
                  
                  {/* Post image - slightly smaller aspect ratio */}
                  <div className="w-full aspect-[4/3] bg-gray-200 rounded-md mb-2"></div>
                  
                  {/* Post actions - smaller */}
                  <div className="w-full flex space-x-3 mb-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                  
                  {/* Post caption - shorter */}
                  <div className="w-full h-12 bg-gray-200 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader; 