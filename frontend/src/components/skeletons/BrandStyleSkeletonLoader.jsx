import React from "react";
import SideBarSkeleton from "./SideBarSkeleton";

const BrandStyleSkeletonLoader = () => {
  return (
    <div className="min-h-screen flex bg-[#F8F5FA]">
      {/* Sidebar Skeleton */}
      <SideBarSkeleton />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        <div className="w-full px-4 py-4 mx-auto bg-[#F8F5FA]">
          {/* Header */}
          <div className="h-28 flex flex-col py-2 px-4 mb-1 rounded-lg bg-[#F8F9FA] border-white relative">
            <div className="w-48 h-9 bg-gray-200 rounded-lg mt-2 animate-pulse"></div>
            
            {/* New Brand Style button placeholder */}
            <div className="absolute bottom-2 right-10">
              <div className="w-40 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Main content card */}
          <div className="bg-[#FAFBFB] rounded-lg min-h-[80vh] py-20 px-16">
            {/* Brand grid skeleton */}
            <div className="w-48 h-8 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {/* Generate 8 brand card skeletons */}
              {[...Array(1)].map((_, index) => (
                <div 
                  key={index} 
                  className="w-full h-48 bg-white border rounded-lg shadow-md animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandStyleSkeletonLoader; 