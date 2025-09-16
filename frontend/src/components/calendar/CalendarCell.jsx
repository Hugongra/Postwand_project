import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PostPreview from "../scheduler/preview/Postpreview";
import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import TiktokIcon from '/SM_icons/tiktok.svg';
import YoutubeIcon from '/SM_icons/youtube.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import { PlusIcon } from 'lucide-react';
import DateTimePicker from '../scheduler/DateTimePicker';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CalendarCell = ({isToday, viewMode, posts = [], date, onPostDrop, isCompact, isDayView, onDateClick, platformsData = { facebook: { pages: [] }, instagram: { accounts: [] }, threads: { accounts: [] }, linkedin: { accounts: [] }, youtube: { channels: [] }, tiktok: { accounts: [] } }, onPostDelete, isMobile = false }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverDirection, setHoverDirection] = useState({ horizontal: 'right', vertical: 'top' });
  const hoverTimerRef = useRef(null);
  const hoverCardRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(date);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Helper function to extract content from JSON string
  const getContent = (post) => {
    try {
      const parsed = JSON.parse(post.content);
      return parsed[post.platform] || Object.values(parsed)[0] || '';
    } catch {
      return post.content || '';
    }
  };

  // Fixed useEffect to avoid infinite loop
  useEffect(() => {
    if (showHoverCard && hoverCardRef.current) {
      const updatePosition = () => {
        const cardRect = hoverCardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let newHorizontal = hoverDirection.horizontal;
        let newVertical = hoverDirection.vertical;
        let shouldUpdate = false;
        
        // Check if card would overflow on the right
        if (newHorizontal === 'right' && 
            hoverPosition.x + cardRect.width > viewportWidth - 20) {
          newHorizontal = 'left';
          shouldUpdate = true;
        }
        
        // Check if card would overflow on the left
        if (newHorizontal === 'left' && 
            hoverPosition.x - cardRect.width < 20) {
          newHorizontal = 'right';
          shouldUpdate = true;
        }
        
        // Check if card would overflow on the bottom
        if (newVertical === 'top' && 
            hoverPosition.y + cardRect.height > viewportHeight - 20) {
          newVertical = 'above';
          shouldUpdate = true;
        }
        
        // Check if card would overflow on the top
        if (newVertical === 'above' && 
            hoverPosition.y - cardRect.height < 20) {
          newVertical = 'top';
          shouldUpdate = true;
        }
        
        // Only update state if direction changed
        if (shouldUpdate) {
          setHoverDirection({ horizontal: newHorizontal, vertical: newVertical });
        }
      };
      
      updatePosition();
      
      const handleResize = () => {
        updatePosition();
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  // Remove hoverPosition from the dependency array to avoid infinite loops
  }, [showHoverCard, hoverDirection]);

  // Track global dragging state
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
    };

    // Add global drag end listener
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handlePostHover = (post, isEntering, e) => {
    // Skip hover behavior if we're currently dragging
    if (isDragging) return;
    
    // Skip hover card for daily view - we'll use dialog instead
    if (isDayView) return;

    if (isEntering) {
      setHoveredPost(post);
      // Get position for the hover card
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Determine initial direction based on space available
        const initialHorizontal = rect.right + 300 > viewportWidth ? 'left' : 'right';
        const initialVertical = 'top';
        
        setHoverPosition({
          x: initialHorizontal === 'right' ? rect.right + 10 : rect.left - 10,
          y: rect.top
        });
        
        setHoverDirection({
          horizontal: initialHorizontal,
          vertical: initialVertical
        });
      }
      
      // Clear any existing timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      // Set a new timer to show the card after 1 second
      hoverTimerRef.current = setTimeout(() => {
        if (!isDragging) { // Only show if not dragging
          setShowHoverCard(true);
        }
      }, 500);
    } else if (!isHoveringCard) {
      // Only hide if not hovering over the card itself
      // Clear the timer and hide the card
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      hoverTimerRef.current = setTimeout(() => {
        setShowHoverCard(false);
        setHoveredPost(null);
      }, 500);
    }
  };

  const handleHoverCardMouseEnter = () => {
    setIsHoveringCard(true);
  };

  const handleHoverCardMouseLeave = () => {
    setIsHoveringCard(false);
    setShowHoverCard(false);
    setHoveredPost(null);
  };

  const handleHoverCardClick = () => {
    if (hoveredPost && date && onDateClick) {
      onDateClick(date);
      // We'll show the post details after navigation
      setTimeout(() => {
        setSelectedPost(hoveredPost);
      }, 100);
    }
  };

  // Fixed drag and drop implementation
  const handleDragStart = (e, post) => {
    console.log('Drag started:', post);
    setIsDragging(true);
    setShowHoverCard(false);
    
    // Use both formats for better compatibility
    e.dataTransfer.setData('application/json', JSON.stringify(post));
    e.dataTransfer.setData('text/plain', JSON.stringify(post));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    // This is critical - must prevent default to allow drop
    e.preventDefault();
    // Set drop effect
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-pink-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-pink-50');
  };

  const handleDrop = (e) => {
    console.log('Drop event fired on date:', date);
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    e.currentTarget.classList.remove('bg-pink-50');
    
    try {
      // Get the data in a simpler way
      const textData = e.dataTransfer.getData('text/plain');
      
      if (!textData) {
        console.error('No data found in drag event');
        return;
      }
      
      const postData = JSON.parse(textData);
      
      console.log('Drop event on date:', date);
      console.log('Post data retrieved:', postData);
      
      if (onPostDrop && date && date instanceof Date) {
        console.log('Calling onPostDrop with post:', postData.id);
        onPostDrop(postData, date);
      } else {
        console.error('Cannot process drop:', {
          hasOnPostDrop: !!onPostDrop,
          hasDate: !!date,
          isDateValid: date instanceof Date
        });
      }
    } catch (error) {
      console.error('Error in drop handler:', error);
    }
  };


  const handleEditPost = (post) => {
    try {
      console.log('Edit button clicked for post:', post);
      
      // Create a simplified object with only the necessary data
      const editData = {
        postId: post.id,
        content: getContent(post),
        imageUrl: post.image_url || '',
        scheduledTime: post.scheduled_time,
        platform: post.platform?.toLowerCase(),
        pageId: post.page_id
      };
      
      console.log('Preparing edit data:', editData);
      
      // Convert to JSON string
      const jsonData = JSON.stringify(editData);
      console.log('JSON data to save:', jsonData);
      
      // Save to sessionStorage
      window.sessionStorage.setItem('editPostData', jsonData);
      
      // Verify it was saved
      const savedData = window.sessionStorage.getItem('editPostData');
      console.log('Verified saved data:', savedData);
      
      if (!savedData) {
        console.error('Failed to save data to sessionStorage');
        alert('Error: Could not save post data for editing');
        return;
      }
      
      // Redirect to scheduler page
      navigate("/scheduler");
    } catch (error) {
      console.error('Error in handleEditPost:', error);
      alert('An error occurred while preparing the post for editing');
    }
  };

  // Handle date time selection and redirect to scheduler
  const handleDateTimeConfirm = (selectedDateTime) => {
    // Store the selected date in sessionStorage
    sessionStorage.setItem('selectedDate', selectedDateTime.toISOString());
    
    // Close the date time picker
    setShowDateTimePicker(false);
    
    // Navigate to scheduler page
    navigate('/scheduler');
  };

  // Add a new function to handle closing the date picker without confirming
  const handleDateTimeClose = () => {
    setShowDateTimePicker(false);
  };

  if (!date || !(date instanceof Date)) {
    return null;
  }

  // Helper to prepare the post data for PostPreview component
  const preparePostForPreview = (post) => {
    // Determine the platform and extract relevant data
    const platform = post.platform?.toLowerCase();
    const content = getContent(post);
    const imageUrl = post.image_url || '';
    const videoUrl = post.video_url || '';
    const pageId = post.page_id || post.account_id || '1';
    
    // Default page info
    let pageInfo = {
      id: pageId,
      page_id: pageId,
      name: 'Page Name',
      profile_picture: 'https://via.placeholder.com/50',
      profilePicture: 'https://via.placeholder.com/50'
    };
    
    // Try to find the page/account info in our platform data
    if (platform === 'facebook' && platformsData.facebook?.pages?.length > 0) {
      const fbPage = platformsData.facebook.pages.find(p =>  p.page_id === pageId);
      if (fbPage) {
        pageInfo = {
          ...pageInfo,
          name: fbPage.name,
          profile_picture: fbPage.profile_picture || fbPage.picture?.data?.url,
          profilePicture: fbPage.profile_picture || fbPage.picture?.data?.url
        };
      }
    } else if (platform === 'instagram' && platformsData.instagram?.accounts?.length > 0) {
        const igAccount = platformsData.instagram.accounts.find(a =>  a.account_id === pageId);
      if (igAccount) {
        pageInfo = {
          ...pageInfo,
          name: igAccount.name || igAccount.username,
          profile_picture: igAccount.profile_picture || igAccount.profile_pic_url,
          profilePicture: igAccount.profile_picture || igAccount.profile_pic_url
        };
      }
    } else if (platform === 'threads' && platformsData.threads?.accounts?.length > 0) {
      const threadsAccount = platformsData.threads.accounts.find(a =>  a.account_id === pageId );
      if (threadsAccount) {
        pageInfo = {
          ...pageInfo,
          name: threadsAccount.name || threadsAccount.username,
          profile_picture: threadsAccount.profile_picture || threadsAccount.profile_pic_url,
          profilePicture: threadsAccount.profile_picture || threadsAccount.profile_pic_url
        };
      }
    } else if (platform === 'linkedin' && platformsData.linkedin?.accounts?.length > 0) {
      const linkedinAccount = platformsData.linkedin.accounts.find(a => a.account_id === pageId);
      if (linkedinAccount) {
        pageInfo = {
          ...pageInfo,
          name: linkedinAccount.name,
          profile_picture: linkedinAccount.picture || linkedinAccount.profile_picture,
          profilePicture: linkedinAccount.picture || linkedinAccount.profile_picture
        };
      }
    } else if (platform === 'youtube' && platformsData.youtube?.channels?.length > 0) {
      const youtubeChannel = platformsData.youtube.channels.find(c => c.channel_id === pageId);
      if (youtubeChannel) {
        pageInfo = {
          ...pageInfo,
          name: youtubeChannel.title || youtubeChannel.name,
          profile_picture: youtubeChannel.profile_picture || youtubeChannel.thumbnails?.default?.url,
          profilePicture: youtubeChannel.profile_picture || youtubeChannel.thumbnails?.default?.url
        };
      }
    } else if (platform === 'tiktok' && platformsData.tiktok?.accounts?.length > 0) {
      const tiktokAccount = platformsData.tiktok.accounts.find(a => a.account_id === pageId);
      if (tiktokAccount) {
        pageInfo = {
          ...pageInfo,
          name: tiktokAccount.display_name || tiktokAccount.name,
          profile_picture: tiktokAccount.avatar_url || tiktokAccount.profile_picture,
          profilePicture: tiktokAccount.avatar_url || tiktokAccount.profile_picture
        };
      }
    }
    
    // Create selectedPlatforms array
    const selectedPlatforms = [platform];
    
    // Create selectedPages object with platform-specific post type fields
    const selectedPages = {
      [platform]: pageInfo.id
    };
    
    // Map the post_type to the correct platform-specific field
    const platformPostType = post.post_type || 'post';
    if (platform === 'facebook' || platform === 'instagram') {
      selectedPages.meta_post_type = platformPostType;
    } else if (platform === 'linkedin') {
      selectedPages.linkedin_post_type = platformPostType;
    } else if (platform === 'youtube') {
      selectedPages.youtube_post_type = platformPostType;
    } else if (platform === 'tiktok') {
      selectedPages.tiktok_post_type = platformPostType;
    }
    
    // Determine the general content type for PostPreview
    // This should be 'text', 'image', or 'video' based on the media content
    let contentType = 'text'; // Default to text
    if (videoUrl) {
      contentType = 'video';
    } else if (imageUrl) {
      contentType = 'image';
    }
    
    // Prepare platform-specific data
    let platformData = {};
    
    if (platform === 'facebook') {
      platformData.facebookData = { 
        pages: [pageInfo]
      };
    } else if (platform === 'instagram') {
      platformData.instagramData = { 
        accounts: [pageInfo]
      };
    } else if (platform === 'threads') {
      platformData.threadsData = { 
        accounts: [pageInfo]
      };
    } else if (platform === 'linkedin') {
      platformData.linkedinData = { 
        accounts: [pageInfo]
      };
    } else if (platform === 'youtube') {
      platformData.youtubeData = { 
        channels: [pageInfo]
      };
    } else if (platform === 'tiktok') {
      platformData.tiktokData = { 
        accounts: [pageInfo]
      };
    }
    
    return {
      selectedPlatforms,
      selectedPages,
      content,
      imageUrl: imageUrl,
      imageUrls: imageUrl ? [imageUrl] : [],
      videoUrl,
      postType: contentType, // Use the content type ('text', 'image', 'video') instead of platform post type
      ...platformData
    };
  };

  return (
    <div 
      className={`h-full w-full ${isDayView ? 'p-4' : 'pt-1 pb-1 pr-1 pl-1'} relative bg-[#FDFDFD]`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-date={date.toISOString()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex justify-between items-start h-8">
        {!isDayView && isCompact && viewMode === 'month' && (
          <span className={`text-[15px] font-semibold ${isToday ? 'bg-second-accent-color text-white' : 'text-gray-700'} rounded-full w-6 h-6 flex items-center justify-center`}>
            {date.getDate()}
          </span>
        )}
        
        {/* Show date for mobile view */}
        {isMobile && !isDayView && (
          <div className="flex items-center mb-2">
            <span className={`text-sm font-semibold ${isToday ? 'text-second-accent-color' : 'text-gray-700'}`}>
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
        
        {/* Add the "+" button that's only visible on hover */}
        {isHovering && !isMobile && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDateTimePicker(true);
              setSelectedScheduleDate(date);
            }}
            className="w-18 h-6 m-1 p-2 rounded-[3px] bg-transparent text-xs text-second-accent-color font-medium flex items-center justify-center hover:bg-gray-200/20 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-1" /> {t('common.new')}
          </button>
        )}
      </div>

      <div className={`mt-1 space-y-2 ${isDayView ? 'space-y-4' : ''} ${isMobile ? 'space-y-3' : ''}`}>
        {posts.map((post, idx) => (
          <div
            key={idx}
            draggable={!isMobile}
            onDragStart={(e) => !isMobile && handleDragStart(e, post)}
            onDragEnd={!isMobile && handleDragEnd}
            onClick={() => setSelectedPost(post)}
            onMouseEnter={(e) => !isMobile && handlePostHover(post, true, e)}
            onMouseLeave={() => !isMobile && handlePostHover(post, false)}
           
            className={`bg-white rounded-md 
                      text-black cursor-pointer 
                      border border-gray-200
                      shadow-[0px_0px_2px_rgba(0,0,0,0.1)]
                      transition-transform hover:shadow-sm	
                      ${isDayView ? 'text-sm p-4 w-[95%] m-auto h-[20vh]' : 
                        isMobile ? 'p-3' : 'p-1 text-xs hover:scale-102'}`}
          >
            <div>
              {!isDayView && !isMobile ? (
                
                // Compact view (week/month) - all in one row
                <div className="flex items-center justify-between space-x-1">
                  
                  <div className="flex items-center space-x-2">
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt="" 
                        className="w-10 h-10 p-2 object-cover rounded-sm bg-gray-100"
                        onError={(e) => {
                          // If image fails and there's a video, show video icon, otherwise show no-photos
                          e.target.src = post.video_url ? '/images/video.svg' : '/images/no-photos.svg';
                        }}
                      />
                    ) : post.video_url ? (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img 
                          src="/images/video.svg" 
                          alt="Video" 
                          className="w-10 h-10"
                        />
                      </div>
                    ) : null}
                    <span className="flex items-center font-medium text-xs h-8 w-16 text-gray-500" >
                      {formatTime(post.scheduled_time)}
                    </span>
                  </div>
                  
                  {/* Platform icon */}
                  <span>
                    {post.platform === 'facebook' && <img src={FacebookIcon} alt="Facebook" className="w-4 h-4 mr-1" />}
                    {post.platform === 'instagram' && <img src={InstagramIcon} alt="Instagram" className="w-4 h-4 mr-1" />}
                    {post.platform === 'threads' && <img src={ThreadsIcon} alt="Threads" className="w-4 h-4 mr-1" />}
                    {post.platform === 'tiktok' && <img src={TiktokIcon} alt="TikTok" className="w-4 h-4 mr-1" />}
                    {post.platform === 'youtube' && <img src={YoutubeIcon} alt="YouTube" className="w-4 h-4 mr-1" />}
                    {post.platform === 'linkedin' && <img src={LinkedinIcon} alt="LinkedIn" className="w-4 h-4 mr-1" />}
                    {!['facebook', 'instagram', 'threads', 'tiktok', 'youtube', 'linkedin'].includes(post.platform) && post.platform}
                  </span>
                </div>
              ) : !isDayView && isMobile ? (
                // Mobile view for week/month - simplified
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600">
                        {formatTime(post.scheduled_time)}
                      </span>
                    </div>
                    {(post.image_url || post.video_url) && (
                      <div className="flex-shrink-0">
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt="" 
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              // If image fails and there's a video, show video icon, otherwise show no-photos
                              e.target.src = post.video_url ? '/images/video.svg' : '/images/no-photos.svg';
                            }}
                          />
                        ) : post.video_url ? (
                          <img 
                            src="/images/video.svg" 
                            alt="Video" 
                            className="w-12 h-12"
                          />
                        ) : null}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {getContent(post) || 'No content'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {post.platform === 'facebook' && <img src={FacebookIcon} alt="Facebook" className="w-5 h-5" />}
                    {post.platform === 'instagram' && <img src={InstagramIcon} alt="Instagram" className="w-5 h-5" />}
                    {post.platform === 'threads' && <img src={ThreadsIcon} alt="Threads" className="w-5 h-5" />}
                    {post.platform === 'tiktok' && <img src={TiktokIcon} alt="TikTok" className="w-5 h-5" />}
                    {post.platform === 'youtube' && <img src={YoutubeIcon} alt="YouTube" className="w-5 h-5" />}
                    {post.platform === 'linkedin' && <img src={LinkedinIcon} alt="LinkedIn" className="w-5 h-5" />}
                  </div>
                </div>
              ) : (
                // Day view - with video thumbnail if available
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      {formatTime(post.scheduled_time)}
                    </span>
                    <span>
                      {post.platform === 'facebook' && <img src={FacebookIcon} alt="Facebook" className="w-6 h-6" />}
                      {post.platform === 'instagram' && <img src={InstagramIcon} alt="Instagram" className="w-6 h-6" />}
                      {post.platform === 'threads' && <img src={ThreadsIcon} alt="Threads" className="w-6 h-6" />}
                      {post.platform === 'tiktok' && <img src={TiktokIcon} alt="TikTok" className="w-6 h-6" />}
                      {post.platform === 'youtube' && <img src={YoutubeIcon} alt="YouTube" className="w-6 h-6" />}
                      {post.platform === 'linkedin' && <img src={LinkedinIcon} alt="LinkedIn" className="w-6 h-6" />}
                      {!['facebook', 'instagram', 'threads', 'tiktok', 'youtube', 'linkedin'].includes(post.platform) && post.platform}
                    </span>
                  </div>
                  
                  {post.video_url && (
                    <div className="mt-2 flex items-center text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">{t('calendarCell.videoPost')}</span>
                    </div>
                  )}
                  
                  <div className="truncate mt-4">
                    <span className="text-sm font-semibold">{t('calendarCell.caption')}</span><br></br>
                    {post.content && <span>{getContent(post).substring(0, 100)}...</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hover Card - Only show if not dragging and not in day view */}
      {showHoverCard && hoveredPost && !isDragging && !isDayView && (
        <div 
          ref={hoverCardRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg p-2 w-80 cursor-pointer text-black"
          style={{
            top: hoverDirection.vertical === 'top' ? 
              `${hoverPosition.y}px` : 
              'auto',
            bottom: hoverDirection.vertical === 'above' ? 
              `${window.innerHeight - hoverPosition.y}px` : 
              'auto',
            left: hoverDirection.horizontal === 'right' ? 
              `${hoverPosition.x}px` : 
              'auto',
            right: hoverDirection.horizontal === 'left' ? 
              `${window.innerWidth - hoverPosition.x}px` : 
              'auto',
            maxHeight: '300px',
            overflow: 'auto'
          }}
          onMouseEnter={handleHoverCardMouseEnter}
          onMouseLeave={handleHoverCardMouseLeave}
          onClick={handleHoverCardClick}
        >
          <div className="space-y-3 text-black">
            <div className="flex justify-between items-center">
              <div>
              <div>
              <span className="text-xs text-gray-500 mt-2">
                {formatTime(hoveredPost.scheduled_time)}
              </span>
              
            </div>
            
            
               </div>
              <Badge 
              variant="outline" 
              className={hoveredPost.status === 'scheduled' ? 
                'bg-blue-50 text-blue-700 border-blue-200' : 
                'bg-green-50 text-green-700 border-green-200'}
            >
              {hoveredPost.status || 'scheduled'}
            </Badge>
             
            </div>
            
            {hoveredPost.image_url ? (
              <div className='flex items-start'>
                <img 
                  src={hoveredPost.image_url} 
                  alt="Post preview" 
                  className="w-24 h-24 object-cover rounded mr-2 bg-gray-100"
                  onError={(e) => {
                    e.target.src = '/images/no-photos.svg';
                  }}
                />
                <span className="text-sm text-black">{getContent(hoveredPost)}
                  
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm mt-1 text-black">{getContent(hoveredPost)}</p>
              </div>
            )}
          </div>
        </div>
      )}

   
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[95vh] bg-white " >
          

              <div className="p-2 flex flex-row opacity-100">
                <div className="w-1/3 pr-4">
                <Badge 
                      variant="outline" 
                      
                      className={` mb-2 w-28 h-8 text-sm justify-center ${selectedPost.status === 'scheduled' ? 
                        'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-green-50 text-green-700 border-green-200'}`}
                    >
                      {selectedPost.status || 'scheduled'}
                    </Badge>
                  <div className="text-md text-gray-500 mb-4">
                    {new Date(selectedPost.scheduled_time).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    {getContent(selectedPost)}
                  </div>
                  <div className="mt-4">
                    
                    
                    <div className="mt-4 space-x-2">
                      
                     
                      
                      {/* Conditionally render delete button only for scheduled posts */}
                      {selectedPost.status === 'scheduled' && (
                        <div className='flex items-center space-x-2'>
                        <button 
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              onPostDelete(selectedPost);
                              setSelectedPost(null); // Close the dialog after deletion
                            }
                          }}
                        >
                          {t('common.delete')}
                        </button>
                         <button 
                         className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                         onClick={() => {
                           console.log('Edit button clicked');
                           handleEditPost(selectedPost);
                         }}
                       >
                         {t('common.edit')}
                       </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-2/3">
                <div>
                  <PostPreview 
                    {...preparePostForPreview(selectedPost)}
                  />
                </div>
                </div>
              </div>
            
          </DialogContent>
        </Dialog>
      )}

      {/* DateTimePicker Modal */}
      {showDateTimePicker && (
        <DateTimePicker
          dateTime={selectedScheduleDate}
          setDateTime={setSelectedScheduleDate}
          setScheduleNow={() => {}}
          autoOpenPicker={true}
          onConfirm={handleDateTimeConfirm}
          onClose={handleDateTimeClose}
        />
      )}
    </div>
  );
};

export default CalendarCell;