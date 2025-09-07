const ImagesSkeletonLoader = () => {
    const placeholderCards = Array(15).fill(null);

  return (
  <div>
        
        {/* Grid of image cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {placeholderCards.map((_, index) => (
            <div 
              key={index} 
              className="overflow-hidden bg-white rounded-lg shadow-sm animate-pulse"
            >
              {/* Image placeholder */}
              <div className="aspect-square w-full bg-gray-200"></div>
              
              {/* Card content */}
              <div className="p-3">
                {/* Date placeholder */}
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                
                {/* Prompt/caption placeholder */}
                <div className="h-5 w-full bg-gray-200 rounded mb-1"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
                
                {/* Action buttons placeholders */}
                <div className="flex mt-2 space-x-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};

export default ImagesSkeletonLoader;
