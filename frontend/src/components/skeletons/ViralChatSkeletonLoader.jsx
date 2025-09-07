import React from 'react';

const ViralChatSkeletonLoader = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-5 bg-white rounded-lg shadow-md animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded-md mb-2"></div>
        <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
      </div>
      
      <div className="flex-1 space-y-4 mb-4">
        <div className="h-16 w-3/4 bg-gray-200 rounded-lg"></div>
        <div className="h-16 w-3/4 bg-gray-200 rounded-lg ml-auto"></div>
        <div className="h-16 w-3/4 bg-gray-200 rounded-lg"></div>
      </div>
      
      <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
    </div>
  );
};

export default ViralChatSkeletonLoader; 