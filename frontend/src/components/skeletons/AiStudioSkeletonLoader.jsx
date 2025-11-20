import React from 'react';
import SideBarSkeleton from './SideBarSkeleton';

const AiStudioSkeletonLoader = () => (
  <div className="min-h-screen flex">
    <SideBarSkeleton />
    
    {/* Main Content - AI Studio */}
    <div className="flex-1 ml-64 bg-primary">
      <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
        {/* Header skeleton */}
        <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-[#F8F9FA] relative">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-80 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Main content skeleton */}
        <div className="relative flex flex-col justify-center items-center lg:w-[90%] h-full mx-auto">
          <div className="rounded-lg p-6 flex flex-col mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 md:gap-4 gap-3 w-[90%] mx-auto">
                
                                {/* Option card 1 - Generate Ideas with image */}
                <div className="bg-gray-300/50 rounded-lg p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full min-h-[200px]">
                  <div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3 opacity-90"></div>
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Option card 2 - Generate Images with image */}
                <div className="bg-gray-300/50 rounded-lg p-3 md:p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full min-h-[200px]">
                <div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3 opacity-90"></div>
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Option card 3 - Generate Captions text only */}
                <div className="bg-gray-300/50 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full min-h-[200px]">
                <div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3 opacity-90"></div>
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Option card 4 - Generate Post text only with "SOON" badge */}
                <div className="bg-gray-300/50 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full min-h-[200px]">
                <div>
                    <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3 opacity-90"></div>
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
            </div>
          </div>
        </div>
      </div>
    
      {/* Bottom padding */}
      <div className="w-full h-20 bg-primary"></div>
    </div>
  </div>
);

export default AiStudioSkeletonLoader; 