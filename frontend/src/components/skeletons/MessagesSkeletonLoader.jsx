import React from 'react';
import MessagesListSkeleton from './MessagesListSkeleton';

const MessagesSkeletonLoader = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Skeleton - fixed width */}
      <div className="w-20 shrink-0 bg-white border-r border-gray-200 p-4 shadow-md z-10">
        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse mb-8 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-10 w-12 bg-gray-200 rounded-md animate-pulse mx-auto"></div>
          <div className="h-10 w-12 bg-gray-200 rounded-md animate-pulse mx-auto"></div>
          <div className="h-10 w-12 bg-gray-200 rounded-md animate-pulse mx-auto"></div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4 pl-12 overflow-auto">
        <div className="h-8 w-48 bg-gray-200 rounded-md mb-6 animate-pulse"></div>
        
        {/* Search and Filter Bar Skeleton */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-36 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-36 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
        
        {/* Messages List Skeleton */}
        <MessagesListSkeleton />
      </div>
    </div>
  );
};

export default MessagesSkeletonLoader; 