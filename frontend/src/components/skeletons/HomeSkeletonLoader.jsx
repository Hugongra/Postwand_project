import React from "react";

const HomeSkeletonLoader = () => {
  return (
    <div className="w-full h-full m-auto p-2 md:px-0 md:pr-2 bg-[#F8F5FA]">
      {/* Hero Banner Section Skeleton */}
      <div className="grid grid-cols-1 relative w-full h-auto rounded-lg overflow-hidden animate-pulse">
        <div className="absolute z-5 p-5 space-y-3 max-w-md">
          <div className="h-10 w-64 bg-gray-200 rounded-md"></div>
          <div className="h-16 w-full bg-gray-200 rounded-md"></div>
          <div className="h-9 w-48 bg-gray-200 rounded-md"></div>
        </div>
        <div className="w-full md:h-60 h-96 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Content Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 min-h-[30rem]">
        
        {/* Left Section - Content Creation */}
        <div className="md:col-span-2 bg-white rounded-lg p-3 md:p-6 flex flex-col animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 flex-grow h-[50vh] md:h-auto">
            {/* Social Media Platform Cards */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-md p-3 relative">
                <div>
                  <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md mt-2"></div>
                </div>
                <div className="absolute bottom-3 right-3">
                  <div className="h-7 w-7 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Section - Connect Accounts */}
        <div className="md:col-span-1 bg-white rounded-lg p-6 h-auto min-h-[30rem] animate-pulse">
          <div className="h-7 w-48 bg-gray-200 rounded-md mb-4"></div>
          <div className="space-y-1">
            {/* Account Connection Rows */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-full px-3 py-4 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-5 w-40 bg-gray-200 rounded-md"></div>
                </div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSkeletonLoader; 