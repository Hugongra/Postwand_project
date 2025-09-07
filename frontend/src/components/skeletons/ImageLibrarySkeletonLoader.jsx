import React from 'react';
import ImagesSkeletonLoader from './ImagesSkeletonLoader';
import SideBarSkeleton from './SideBarSkeleton';
const ImageLibrarySkeletonLoader = () => {
  // Create an array to repeat the skeleton cards
  
  return (
    <div>
      {/* Sidebar Skeleton - fixed width */}
    
      <SideBarSkeleton />

      {/* title */}
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6 mt-10 md:ml-64"></div> 
      <div className=" md:ml-64">
     <ImagesSkeletonLoader />
     </div>  
    </div>
    
  );
};

export default ImageLibrarySkeletonLoader;