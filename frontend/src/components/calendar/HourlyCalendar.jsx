import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import CalendarCell from './CalendarCell';
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'];


const CustomCalendar = ({ userToken, instagramToken, threadsToken, isLoggedIn, facebookData, instagramData, threadsData }) => {
const [currentDate, setCurrentDate] = useState(new Date());
const [posts, setPosts] = useState([]);
const [viewMode, setViewMode] = useState(
  localStorage.getItem('calendarViewMode') || 'week'
);
const [searchTerm, setSearchTerm] = useState('');
const [platformFilter, setPlatformFilter] = useState('all');

// Create structured platforms data to pass to CalendarCell
const platformsData = {
  facebook: { pages: facebookData?.pages || [] },
  instagram: { accounts: instagramData?.accounts || [] },
  threads: { accounts: threadsData?.accounts || [] }
};

useEffect(() => {
  if (isLoggedIn) {
    fetchPosts();
  }
}, [isLoggedIn, userToken, instagramToken, threadsToken]);

const fetchPosts = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/get_scheduled_posts`, {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch posts');
    const data = await response.json();
    setPosts(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};

const handlePostReschedule = async (post, newDate) => {
  if (!post || !post.id) {
    console.error('Error rescheduling post: post is invalid', post);
    return;
  }
  
  if (!newDate || !(newDate instanceof Date)) {
    console.error('Error rescheduling post: invalid date', newDate);
    return;
  }

  try {
    const originalDate = new Date(post.scheduled_time);
    console.log('Original scheduled time:', originalDate.toISOString());
    
    const newDateCopy = new Date(newDate.getTime());
    
    const updatedDate = new Date(newDateCopy.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds()
    ));
    
    console.log('New scheduled time:', updatedDate.toISOString());

    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === post.id) {
        return { ...p, scheduled_time: updatedDate.toISOString() };
      }
      return p;
    }));

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reschedule_post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        post_id: post.id,
        new_scheduled_time: updatedDate.toISOString()
      })
    });

    console.log('Reschedule response status:', response.status);
    
    try {
      const responseData = await response.json();
      console.log('Reschedule response data:', responseData);
    } catch (e) {
      console.log('Could not parse response as JSON:', e);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update post schedule: ${response.status} ${errorText}`);
    }

    console.log('Reschedule successful, refreshing posts');
    fetchPosts();
  } catch (error) {
    console.error('Error rescheduling post:', error);
    fetchPosts();
  }
};
const getPostsForDate = (date) => {
  if (!date) return [];
  
  return posts.filter(post => {
    const postDate = new Date(post.scheduled_time);
    const dateMatch = postDate.getDate() === date.getDate() &&
                   postDate.getMonth() === date.getMonth() &&
                   postDate.getFullYear() === date.getFullYear();
    
    const platformMatch = platformFilter === 'all' || 
                         post.platform?.toLowerCase() === platformFilter.toLowerCase();
    
    const searchMatch = !searchTerm || 
                       post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return dateMatch && platformMatch && searchMatch;
  });
};
const getPostsForDateAndHour = (date, hour) => {
  if (!date) return [];
  
  return posts.filter(post => {
    const postDate = new Date(post.scheduled_time);
    const dateMatch = postDate.getDate() === date.getDate() &&
                     postDate.getMonth() === date.getMonth() &&
                     postDate.getFullYear() === date.getFullYear() &&
                     postDate.getHours() === hour;
    
    const platformMatch = platformFilter === 'all' || 
                         post.platform?.toLowerCase() === platformFilter.toLowerCase();
    
    const searchMatch = !searchTerm || 
                       post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return dateMatch && platformMatch && searchMatch;
  });
};

const getAvailablePlatforms = () => {
  const platforms = new Set();
  posts.forEach(post => {
    if (post.platform) platforms.add(post.platform.toLowerCase());
  });
  return ['all', ...Array.from(platforms)];
};

const changeDate = (increment) => {
  const newDate = new Date(currentDate);
  switch (viewMode) {
    case 'day':
      newDate.setDate(newDate.getDate() + increment);
      break;
    case 'week':
      newDate.setDate(newDate.getDate() + (increment * 7));
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() + increment);
      break;
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + increment);
      break;
  }
  setCurrentDate(newDate);
};

const getWeekDates = () => {
  const dates = [];
  const current = new Date(currentDate);
  
  // Start the week on Sunday by going back to the last Sunday
  const day = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
  current.setDate(current.getDate() - day);
  
  // Now get 7 days starting from this Sunday
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

const getMonthDates = () => {
  const dates = [];
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const totalDays = lastDay.getDate();
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    dates.push(null);
  }
  
  for (let day = 1; day <= totalDays; day++) {
    dates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  
  const remainingCells = 7 - (dates.length % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      dates.push(null);
    }
  }
  
  return dates;
};

const getDayView = () => {
  return [currentDate];
};

const getYearView = () => {
  const year = currentDate.getFullYear();
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const monthDates = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      monthDates.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      monthDates.push(new Date(year, month, day));
    }
    
    const remainingCells = 7 - (monthDates.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        monthDates.push(null);
      }
    }
    
    months.push(monthDates);
  }
  
  return months;
};

const handleDateClick = (date) => {
  if (date) {
    setCurrentDate(date);
    setViewMode('day');
  }
};

// Format hour for display (12am, 1am, etc.)
const formatHour = (hour) => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
};

const generateCalendarView = () => {
  let dates;
  switch (viewMode) {
    case 'day':
      dates = getDayView();
      return (
        <div className="grid grid-cols-1 gap-1">
          {dates.map((date, index) => (
            <div 
              key={index}
              className="border border-gray-100 min-h-[85vh] bg-white"
            >
              {getPostsForDate(date).length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No posts scheduled for this day
                </div>
              ) : (
                <CalendarCell 
                  posts={getPostsForDate(date)} 
                  date={date}
                  onPostDrop={(post, date) => {
                    console.log('onPostDrop called in Calendar with:', { postId: post.id, date: date });
                    handlePostReschedule(post, date);
                  }}
                  isCompact={false}
                  isDayView={true}
                  onDateClick={handleDateClick}
                  platformsData={platformsData}
                  viewMode={viewMode}
                />
              )}
            </div>
          ))}
        </div>
      );
    case 'week':
      dates = getWeekDates();
      // Generate an hourly grid for week view
      return (
        <div className="relative w-full">
          {/* Time column on the left */}
          <div className="grid grid-cols-[80px_1fr] w-full">
            {/* Time labels column */}
            <div className="relative">
              {Array.from({ length: 24 }, (_, hour) => (
                <div 
                  key={hour} 
                  className="h-48 border-b border-r border-gray-200 text-sm text-gray-500 relative" 
                >
                  <span className="absolute top-0 right-2">{formatHour(hour)}</span>
                </div>
              ))}
            </div>
            
            {/* Days grid */}
            <div className="grid grid-cols-7 w-full">
              {dates.map((date, dayIndex) => (
                <div key={dayIndex} className="w-full">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourDate = new Date(date);
                    hourDate.setHours(hour, 0, 0, 0);
                    
                    const postsForThisHour = getPostsForDateAndHour(date, hour);
                    const isCurrentHour = new Date().getDate() === date.getDate() && 
                                        new Date().getMonth() === date.getMonth() && 
                                        new Date().getFullYear() === date.getFullYear() && 
                                        new Date().getHours() === hour;
                    
                    return (
                      <div 
                        key={hour}
                        className={`min-h-48 border-b border-r border-gray-200 ${
                          isCurrentHour ? 'bg-pink-50' : ''
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const postData = JSON.parse(e.dataTransfer.getData('post'));
                            handlePostReschedule(postData, hourDate);
                          } catch (err) {
                            console.error('Error handling drop:', err);
                          }
                        }}
                      >
                        <div className="h-full  overflow-y-auto">
                        {postsForThisHour.length > 0 && (
                          <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                            {postsForThisHour.length}
                          </Badge>
                        )}
                          {postsForThisHour.map(post => (
                            <CalendarCell
                            key={post.id}
                            posts={[post]}
                            date={date}
                            onPostDrop={handlePostReschedule}
                            isCompact={true}
                            onDateClick={handleDateClick}
                            platformsData={platformsData}
                            viewMode={viewMode}
                          />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'year':
      const months = getYearView();
      return (
        <div className="grid grid-cols-3 gap-4 w-full" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {months.map((monthDates, monthIndex) => (
            <div key={monthIndex} className="bg-white rounded-lg p-2 shadow-sm w-full">
              <h3 className="text-center font-semibold mb-2">{MONTHS[monthIndex]}</h3>
              <div className="grid grid-cols-7 gap-1 text-xs" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {DAYS.map(day => (
                  <div key={day} className="text-center font-medium p-1">
                    {day[0]}
                  </div>
                ))}
                {monthDates.map((date, dateIndex) => {
                  const hasEvents = date ? getPostsForDate(date).length > 0 : false;
                  return (
                    <div
                      key={dateIndex}
                      className={`text-center p-1 ${
                        !date ? 'bg-gray-50/30' :
                        hasEvents ? 'bg-pink-100 text-pink-700 rounded' : ''
                      }`}
                      onClick={() => {
                        if (date) {
                          setCurrentDate(date);
                          setViewMode('day');
                        }
                      }}
                    >
                      {date?.getDate() || ''}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    default: // Month view
      dates = getMonthDates();
      return (
        <div className="grid grid-cols-7">
          {dates.map((date, index) => {
            if (!date && viewMode === 'month') {
              return (
                <div 
                  key={index}
                  className="border border-gray-100 min-h-[100px] bg-gray-50/30"
                />
              );
            }

            const postsForDay = getPostsForDate(date);
            const isToday = new Date().toDateString() === date?.toDateString();

            return (
              <div 
                key={index}
                className={`border border-gray-100 min-h-[100px] text-sm
                  ${isToday ? 'hover:bg-pink-200/50 text-pink-700' : 'hover:bg-gray-100/50'}
                  transition-colors cursor-pointer relative`}
                onClick={() => handleDateClick(date)}
              >
                
                <CalendarCell 
                  posts={postsForDay} 
                  date={date}
                  onPostDrop={handlePostReschedule}
                  isCompact={true}
                  onDateClick={handleDateClick}
                  platformsData={platformsData}
                  viewMode={viewMode}
                />
              </div>
            );
          })}
        </div>
      );
  }
};

const getHeaderText = () => {
  switch (viewMode) {
    case 'day':
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    case 'year':
      return currentDate.getFullYear().toString();
    case 'week':
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      
      if (startDate.getMonth() === endDate.getMonth()) {
        // Same month
        return `${MONTHS[startDate.getMonth()]} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else if (startDate.getFullYear() === endDate.getFullYear()) {
        // Different months, same year
        return `${MONTHS[startDate.getMonth()]} ${startDate.getDate()} - ${MONTHS[endDate.getMonth()]} ${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else {
        // Different years
        return `${MONTHS[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()} - ${MONTHS[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
      }
    default:
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
};

const handleViewModeChange = (newMode) => {
  setViewMode(newMode);
  localStorage.setItem('calendarViewMode', newMode);
};

return (
  <div className="p-4 h-auto w-[95vw] max-w-[2200px] mx-auto bg-[#faf8fb]">
    <Card className="p-4 h-full w-full mx-auto overflow-hidden bg-white">
      <div className="flex justify-between items-center mb-4 h-14">
        <div className="w-64 min-w-64 overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 truncate">
            {getHeaderText()}
          </h2>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 mr-4">
            <input
              type="text"
              placeholder="Search posts by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 px-2 py-2 border shadow-sm rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-transparent bg-white"
            />
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40 px-4 py-2 text-sm bg-white shadow-sm">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-md w-40 border">
                {getAvailablePlatforms().map(platform => (
                  <SelectItem 
                    key={platform} 
                    value={platform} 
                    className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100"
                  >
                    {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative flex items-center rounded-md overflow-hidden bg-gray-100 py-1 w-80 h-10">
            <div 
              className="absolute inset-y-1 bg-white transition-all duration-300 ease-in-out rounded-md"
              style={{
                width: 'calc(25% - 8px)',
                left: `calc(${['day', 'week', 'month', 'year'].indexOf(viewMode) * 25}% + 4px)`
              }}
            />
            
            {['Day', 'Week', 'Month', 'Year'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode.toLowerCase())}
                className={`h-8 px-4 py-1 text-sm font-medium relative z-10 transition-colors duration-300 flex-1 text-center ${
                  viewMode === mode.toLowerCase()
                    ? 'text-black-700'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="grid grid-cols-[75px_1fr] gap-0 mb-1">
          <div className="h-8 m-0"></div> {/* Empty cell for time column */}
          <div className="grid grid-cols-7 ">
            {DAYS.map((day, index) => {
              const date = getWeekDates()[index];
              const isToday = new Date().getDay() === index;
              return (
                <div 
                  key={index} 
                  className={`text-center font-semibold py-2 rounded border-r-2 border-l-2 border-white ${isToday ? 'bg-pink-200' : 'bg-gray-200/80'}`}
                >
                  {day} {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((day, index) => {
            const isToday = new Date().getDay() === index;
            return (
              <div>
              <div 
                key={day} 
                className={`text-center font-semibold py-2 rounded border-r-2 border-l-2 border-white ${isToday ? 'bg-pink-200' : 'bg-gray-200/80'}`}
              >
                {day}
              </div>
             
              </div>  
            );
          })}
        </div>
      )}

      <div className={`w-full ${viewMode === 'week' ? 'h-[calc(100vh-12rem)]' : ''}  ${viewMode === 'year' ? 'h-[calc(100vh-10rem)]' : ''}overflow-auto`}>
        {generateCalendarView()}
      </div>
    </Card>
  </div>
);
};

export default CustomCalendar;