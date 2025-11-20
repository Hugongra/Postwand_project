const ImagesSkeletonLoader = () => {
    const placeholderCards = Array(4).fill(null);

  return (
  <div>
        
        {/* Grid of image cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {placeholderCards.map((_, index) => (
            <div 
              key={index} 
              className="overflow-hidden bg-white rounded-lg shadow-sm animate-pulse"
            >
              {/* Image placeholder */}
              <div className="aspect-square w-full bg-gray-200/80"></div>
          
            </div>
          ))}
        </div>
      </div>
  );
};

export default ImagesSkeletonLoader;
