import React from "react";
import SideBarSkeleton from "./SideBarSkeleton";

const RecentDraftsSkeletonLoader = () => {
  // Randomly decide if we should show empty state or draft items
  const showEmptyState = false; // Set to Math.random() > 0.7 if you want random empty states

  return (
    <div className="min-h-screen flex bg-[#F8F5FA]">
      {/* Sidebar Skeleton */}
      <div className="hidden md:block">
        <SideBarSkeleton />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 md:ml-0">
        <div className="w-full px-4 py-4 mx-auto bg-[#F8F5FA]">
          {/* Header */}
          <div className="h-28 flex flex-col py-2 px-4 mb-1 rounded-lg bg-[#F8F9FA] border-white">
            <div className="w-48 h-9 bg-gray-200 rounded-md mt-2 animate-pulse"></div>
          </div>
          
          {/* Card Content */}
          <div className="p-6 bg-[#F8F5FA] rounded-lg shadow-sm">
            {showEmptyState ? (
              /* Empty state */
              <div className="text-center py-8 animate-pulse">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-36 bg-gray-200 rounded-md mx-auto mb-4"></div>
                <div className="h-10 w-40 bg-gray-200 rounded-md mx-auto"></div>
              </div>
            ) : (
              /* Grid of draft skeletons */
              <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Generate 6 draft card skeletons */}
                {[...Array(6)].map((_, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-3 bg-gray-white h-32 animate-pulse"
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentDraftsSkeletonLoader; 