import React from 'react';
import SideBarSkeleton from './SideBarSkeleton';

// Define DAYS constant here for the component
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarSkeletonLoader = () => {
  // Get the view mode from localStorage, default to 'week'
  const viewMode = localStorage.getItem('calendarViewMode') || 'week';

  return (
    <div className="min-h-screen flex bg-[#F8F5FA]">
      {/* Sidebar Skeleton */}
      <SideBarSkeleton />
      
      {/* Main Calendar Content */}
      <div className="flex-1 md:ml-64">
        <div className="p-4">
          <div className="bg-white p-4 rounded-lg shadow-sm" style={{ minHeight: '95vh', height: 'auto' }}>
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              
              <div className="flex items-center space-x-3">
                {/* View mode selector */}
                <div className="relative flex items-center rounded-md overflow-hidden bg-gray-200/50 py-1 w-80 h-10 animate-pulse">
                  <div className="absolute inset-y-1 bg-white rounded-md" style={{width: 'calc(25% - 8px)'}}></div>
                  {['Day', 'Week', 'Month', 'Year'].map((mode, index) => (
                    <div key={mode} className="h-8 px-4 py-1 text-sm font-medium flex-1 text-center">
                      <div className="h-4 w-12 mx-auto bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation buttons */}
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map(day => (
                <div key={day} className="text-center py-2 bg-gray-100 rounded">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-12"></div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {[...Array(viewMode === 'week' ? 7 : viewMode === 'month' ? 35 : viewMode === 'day' ? 1 : 12)].map((_, index) => (
                <div 
                  key={index}
                  className={`border border-gray-100 bg-white ${
                    viewMode === 'week' ? 'min-h-[70vh]' : 
                    viewMode === 'day' ? 'min-h-[70vh] col-span-7' :
                    viewMode === 'month' ? 'min-h-[20vh]' : 'min-h-[15vh]'
                  }`}
                >
                  {/* Date number */}
                  <div className="p-2 flex justify-between items-center">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    {/* Indicator dots for events */}
                    {Math.random() > 0.7 && (
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-pink-200 rounded-full animate-pulse"></div>
                        <div className="h-2 w-2 bg-blue-200 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Event placeholders */}
                  {viewMode !== 'month' && viewMode !== 'year' && (
                    <div className="px-2 space-y-2">
                      {[...Array(Math.floor(Math.random() * 3))].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-md animate-pulse"></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeletonLoader; 