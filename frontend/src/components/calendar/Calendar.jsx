import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import CalendarCell from './CalendarCell';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TiktokIcon from '/SM_icons/tiktok.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import TwitterIcon from '/SM_icons/x.svg';
import { useTranslation } from 'react-i18next';
const DAYS = ['daysShort.sun', 'daysShort.mon', 'daysShort.tue', 'daysShort.wed', 'daysShort.thu', 'daysShort.fri', 'daysShort.sat'];
const MONTHS = ['months.january', 'months.february', 'months.march', 'months.april', 'months.may', 'months.june', 
                'months.july', 'months.august', 'months.september', 'months.october', 'months.november', 'months.december'];

const CustomCalendar = ({ isLoggedIn, facebookData, instagramData, threadsData }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('calendarViewMode') || 'week'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Helper function to extract content from JSON string
  const getContent = (post) => {
    try {
      const parsed = JSON.parse(post.content);
      return parsed[post.platform] || Object.values(parsed)[0] || '';
    } catch {
      return post.content || '';
    }
  };

  // Create structured platforms data to pass to CalendarCell
  const platformsData = {
    facebook: { pages: facebookData?.pages || [] },
    instagram: { accounts: instagramData?.accounts || [] },
    threads: { accounts: threadsData?.accounts || [] }
  };

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn]);

  const fetchPosts = async () => {
    try {
        const response = await fetch(`https://app.postwand.io/api/get_scheduled_posts`, {
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

      const response = await fetch(`https://app.postwand.io/api/reschedule_post`, {
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

  const handlePostDelete = async (post) => {
    if (!post || !post.id) {
      console.error('Error deleting post: post is invalid', post);
      return;
    }

    try {
      // Update UI immediately for a responsive feel
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
      
      const response = await fetch(`https://app.postwand.io/api/delete_post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          post_id: post.id
        })
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete post: ${response.status} ${errorText}`);
      }

      console.log('Post deleted successfully');
      // Refresh posts to ensure synchronization with server
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      // Refresh posts to restore the UI state
      fetchPosts();
    }
  };

  const getPostsForDate = (date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_time);
      const dateMatch = postDate.getDate() === date.getDate() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
      
      const platformMatch = platformFilter === 'all' || 
                           post.platform?.toLowerCase() === platformFilter.toLowerCase();
      
      const searchMatch = !searchTerm || 
                         getContent(post)?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return dateMatch && platformMatch && searchMatch;
    }).sort((a, b) => {
      // Sort by time (earlier times first)
      return new Date(a.scheduled_time) - new Date(b.scheduled_time);
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
    const currentDay = current.getDay();
    
    current.setDate(current.getDate() - currentDay);
    
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

  const generateCalendarView = () => {
    let dates;
    switch (viewMode) {
      case 'day':
        dates = getDayView();
        return (
          <div>
            {dates.map((date, index) => {
              const isToday = new Date().toDateString() === date?.toDateString();
              const postsForDay = getPostsForDate(date);
              
              return (
                <div key={index}>
                  {postsForDay.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500 min-h-[40vh] sm:min-h-[85vh] bg-[#FDFDFD] rounded-lg">
                      {t('messages.noDataAvailable')}
                    </div>
                  ) : (
                    // Mobile optimization: Single column layout for day view
                    <div className="grid grid-cols-1 gap-4 bg-[#FDFDFD]">
                      {postsForDay.map((post, postIndex) => (
                          <CalendarCell 
                            key={postIndex}
                            isToday={isToday}
                            posts={[post]} 
                            date={date}
                            onPostDrop={handlePostReschedule}
                            onPostDelete={handlePostDelete}
                            isCompact={false}
                            isDayView={true}
                            platformsData={platformsData}
                            viewMode={viewMode}
                          />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      case 'year':
        const months = getYearView();
        return (
          // Mobile optimization: Single column for year view on mobile
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-1 w-full`}>
            {months.map((monthDates, monthIndex) => (
              <div key={monthIndex} className="bg-white rounded-md  shadow-sm w-full h-[400px] md:h-auto">
                <h2 className={`text-center text-md font-semibold mb-1 sm:mb-2 py-4 ${new Date().getMonth() === monthIndex ? 'text-second-accent-color' : 'text-gray-700'}`}>{t(`dates.${MONTHS[monthIndex]}`)}</h2>
                <div className="grid grid-cols-7 gap-0 sm:gap-1 text-[13px] sm:text-xs">
                  {DAYS.map(day => (
                    <div key={day} className="text-center font-medium p-0 sm:p-1">
                      {t(`dates.${day}`)[0]}
                    </div>
                  ))}
                  {monthDates.map((date, dateIndex) => {
                    const hasEvents = date ? getPostsForDate(date).length > 0 : false;
                    return (
                      <div
                        key={dateIndex}
                        className={`text-center p-0 sm:p-1 ${
                          !date ? 'bg-gray-50/30' :
                          hasEvents ? 'bg-second-accent-color text-white rounded' : ''
                        } ${isMobile ? 'py-4' : ''}`}
                        onClick={() => {
                          if (date) {
                            handleDateClick(date);
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
      default:
        // Week/Month view
        dates = viewMode === 'week' ? getWeekDates() : getMonthDates();
        
        if (isMobile) {
          // Mobile view: simplified to use CalendarCell
          return (
            <div className="flex flex-col space-y-1">
              {dates.map((date, index) => {
                if (!date) return null;

                const postsForDay = getPostsForDate(date);
                const isToday = new Date().toDateString() === date?.toDateString();

                return (
                  <div 
                    key={index}
                    className="border-b border-gray-200 h-24"
                  >
                    <CalendarCell 
                      isToday={isToday}
                      posts={postsForDay} 
                      date={date}
                      onPostDrop={handlePostReschedule}
                      onPostDelete={handlePostDelete}
                      isCompact={false}
                      isDayView={false}
                      platformsData={platformsData}
                      viewMode={viewMode}
                      isMobile={true}
                    />
                  </div>
                );
              })}
            </div>
          );
        } else {
          // Desktop view remains the same
          return (
            <div className="grid grid-cols-7 text-xs">
              {dates.map((date, index) => {
                if (!date && viewMode === 'month') {
                  return (
                    <div 
                      key={index}
                      className="border border-gray-200 bg-gray-50/30"
                    />
                  );
                }

                const postsForDay = getPostsForDate(date);
                const isToday = new Date().toDateString() === date?.toDateString();

                return (
                  <div 
                    key={index}
                    className={`border-[0.5px] border-gray-200/50 ${
                      viewMode === 'week' ? 'min-h-[40vh] sm:min-h-[70vh]' : 'min-h-[10vh] sm:min-h-[20vh]'
                    } ${
                      isToday ? 'hover:bg-pink-50/50 text-white' : 'hover:bg-gray-50/50'
                    } transition-colors cursor-pointer relative`}
                  >
                    <CalendarCell 
                      isToday={isToday}
                      posts={postsForDay} 
                      date={date}
                      onPostDrop={handlePostReschedule}
                      onPostDelete={handlePostDelete}
                      isCompact={viewMode === 'month'}
                      platformsData={platformsData}
                      viewMode={viewMode}
                    />
                  </div>
                );
              })}
            </div>
          );
        }
    }
  };

  const getHeaderText = () => {
    switch (viewMode) {
      case 'day':
        return `${t(`dates.${MONTHS[currentDate.getMonth()]}`)} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case 'year':
        return currentDate.getFullYear().toString();
      case 'week':
        const weekDates = getWeekDates();
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        return startDate.getMonth() === endDate.getMonth()
          ? `${t(`dates.${MONTHS[startDate.getMonth()]}`)} ${startDate.getFullYear()}`
          : `${t(`dates.${MONTHS[startDate.getMonth()]}`)} ${startDate.getDate()} - ${t(`dates.${MONTHS[endDate.getMonth()]}`)} ${endDate.getDate()}, ${endDate.getFullYear()}`;
      default:
        return `${t(`dates.${MONTHS[currentDate.getMonth()]}`)} ${currentDate.getFullYear()}`;
    }
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('calendarViewMode', newMode);
  };

  return (
    <div className="w-full mx-auto overflow-hidden bg-primary">
      <Card className="h-full w-full overflow-hidden bg-white py-4 md:pr-2 md:px-0 px-2 bg-primary border-none">
        <div className={`${isMobile ? 'h-auto' : 'h-28'} flex flex-col space-y-2 p-4 mb-1 rounded-lg bg-gray-100/80`}>
          <div className="w-full overflow-hidden bg-gray-100/80">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {getHeaderText()}
            </h1>
          </div>
          
          <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex'} gap-2 items-center ${isMobile ? '' : 'justify-end'}`}>
            {/* Mobile-optimized search and filter */}
            <div className={`${isMobile ? 'flex flex-col w-full space-y-2' : 'flex items-center gap-2 mr-4'}`}>
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`text-black ${isMobile ? 'w-full' : 'w-80'} px-2 py-2 border shadow-sm rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-transparent bg-white`}
              />
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-60'} px-4 py-2 text-sm bg-white shadow-sm bg-white`}>
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-md w-40 border">
                  {getAvailablePlatforms().map(platform => (
                    <SelectItem 
                      key={platform} 
                      value={platform} 
                      className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100"
                    >
                      {platform === 'all' ? (
                        <span>{t('social.platforms.all')}</span>
                      ) : platform === 'facebook' ? (
                        <span className="flex items-center">
                            <img src={FacebookIcon} className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                          <span>{t('social.platforms.facebook')}</span>
                        </span>
                      ) : platform === 'instagram' ? (
                        <span className="flex items-center">
                          <img src={InstagramIcon} className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                          <span>{t('social.platforms.instagram')}</span>
                        </span>
                      ) : platform === 'threads' ? (
                        <span className="flex items-center">
                          <img src={ThreadsIcon} className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                          <span>Threads</span>
                        </span>
                      ) : (
                        <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Mobile-optimized view selector */}
            <div className={`relative flex items-center rounded-md overflow-hidden bg-gray-200/50 py-1 ${isMobile ? 'w-full' : 'w-80'} h-10`}>
              <div 
                className="absolute inset-y-1 bg-white transition-all duration-300 ease-in-out rounded-md"
                style={{
                  width: 'calc(25% - 8px)',
                  left: `calc(${['day', 'week', 'month', 'year'].indexOf(viewMode) * 25}% + 4px)`
                }}
              />
              
              {['day', 'week', 'month', 'year'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  className={`h-8 px-4 py-1 text-xs sm:text-sm font-medium relative z-10 transition-colors duration-300 flex-1 text-center ${
                    viewMode === mode
                      ? 'text-black-700'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {t(`dates.calendarViewModes.${mode}`)}
                </button>
              ))}
            </div>
            
            {/* Mobile-optimized navigation buttons */}
            <div className={`flex ${isMobile ? 'justify-between w-full' : ''}`}>
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-5 w-5 text-second-accent-color" />
              </Button>
              <Button className="text-second-accent-color h-10 ml-1 mr-1" variant="outline" onClick={() => setCurrentDate(new Date())}>
                {t('dates.today')}
              </Button>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-5 w-5 text-second-accent-color" />
              </Button>
            </div>
          </div>
        </div>

        {/* Only show day headers for desktop week/month view */}
        {!isMobile && (viewMode === 'week' || viewMode === 'month') && (
          <div className="grid grid-cols-7 text-xs sm:text-sm">
            {DAYS.map((day, index) => {
              const isToday = new Date().getDay() === index;
              const dayNumber = viewMode === 'week' 
                ? new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + index).getDate()
                : null;
              const translatedDay = t(`dates.${day}`);
              return (
                <div 
                  key={day} 
                  className={`text-center text-[16px] m-0 font-semibold py-2 bg-white ${index === 0 ? 'rounded-tl-lg' : index == 6 ? 'rounded-tr-lg' : '' } ${isToday ? 'text-second-accent-color' : 'text-gray-700'}`}
                >
                  {translatedDay.slice(0, 1)}<span className="hidden sm:inline">{translatedDay.slice(1)}</span> {viewMode === 'week' && <span className="ml-1">{dayNumber}</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className={`w-full ${viewMode === 'year' ? 'h-[calc(100%-8rem)]' : ''} overflow-auto p-0`}>
          {generateCalendarView()}
        </div>
      </Card>
    </div>
  );
};

export default CustomCalendar;