import React from "react";

const BrandSkeletonLoader = () => {
  return (
    <>   
    <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
    <div className="w-48 h-9 bg-gray-200 rounded-lg mt-2 animate-pulse"></div>
    </div>
    <div className="flex bg-[#FAFBFB]">
       
      {/* Main Content Area */}
      <div className="flex-1">
        <div className="w-full h-full p-4 bg-[#FAFBFB]">
          {/* Two-column layout - flex-col on mobile, flex-row on larger screens */}
          <div className="flex flex-col md:flex-row w-[92%] mx-auto py-6 gap-4 h-auto">
            {/* Left column - Brand Details */}
            <div className="space-y-3 w-full md:w-1/2">
              {/* Brand Details title */}
              <div className="w-32 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              
              {/* Brand Details card */}
              <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                {/* Form fields - each row has label + input */}
                {['Brand Name', 'Main header', 'Purpose', 'Audience', 'Industry', 'Tone', 'Character'].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-20 h-4 bg-gray-200 rounded-lg mr-2 animate-pulse"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right column - Style, Colors, Logo, Images */}
            <div className="w-full md:w-1/2 mt-6 md:mt-0">
              {/* Style title */}
              <div className="w-20 h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              
              {/* Colors section */}
              <div className="w-full bg-white rounded-lg p-4 shadow mb-3">
                <div className="w-24 h-6 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="flex items-center gap-3 mt-6 flex-wrap justify-center md:justify-start">
                  {/* Color circles */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="rounded-full w-[60px] md:w-[75px] h-[60px] md:h-[75px] border border-gray-200 bg-gray-200 animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded-lg mt-1 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Logo title */}
              <div className="w-20 h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              
              {/* Logo section */}
              <div className="w-full bg-white rounded-lg p-4 shadow mb-3">
                <div className="mt-6 flex justify-center md:justify-start">
                  <div className="w-auto h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
              
              {/* Images title */}
              <div className="w-20 h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              
              {/* Images section */}
              <div className="w-full bg-white rounded-lg p-4 shadow">
                <div className="flex flex-wrap gap-3 mt-6 justify-center">
                  {/* Image placeholders */}
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-32 md:w-40 h-full md:h-40 bg-gray-200 rounded-lg shadow animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
    </> 
  );
};

export default BrandSkeletonLoader;