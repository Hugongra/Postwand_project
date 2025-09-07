const MessagesListSkeleton = () => {
    const placeholderItems = Array(3).fill(null);
    return (
        <div className="space-y-4">
{placeholderItems.map((_, index) => (
  <div key={index} className="bg-white shadow rounded-lg p-4 animate-pulse">
    <div className="flex items-start">
      {/* Platform icon placeholder */}
      <div className="mr-3 w-8 h-8 bg-gray-200 rounded-full"></div>
      
      <div className="flex-1">
        {/* Header placeholder */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-3 w-32 bg-gray-200 rounded-md ml-2"></div>
          </div>
          <div className="h-3 w-20 bg-gray-200 rounded-md"></div>
        </div>
        
        {/* Content placeholder */}
        <div className="h-4 w-full bg-gray-200 rounded-md mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded-md mb-4"></div>
        
        {/* Action buttons placeholder */}
        <div className="flex items-center space-x-4 mt-2">
          <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
          <div className="ml-auto h-6 w-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
))}
</div>
    );
};

export default MessagesListSkeleton;
    