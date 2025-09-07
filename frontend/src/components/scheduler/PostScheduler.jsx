import React, { useState, useEffect, useRef } from 'react';
import {  Wand2, PenLine,Trash2, Smile, MapPin, CircleFadingArrowUp, ScissorsLineDashed, ScrollText, MessageSquare, ChevronDown, Image} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DateTimePicker from './DateTimePicker';
import EmojiPicker from 'emoji-picker-react';
import SocialPlatformSelector from './SocialPlatformSelector';
import { AiWriterDialog } from './dialogs/AiWriterDialog';
import Platform from './platform/Platform';
import NotificationCard from './NotificationCard';
import AccountSelect from './platform/AccountSelect';
import { useTranslation } from 'react-i18next';

const PostScheduler = ({
  facebookData,
  instagramData,
  threadsData,
  tiktokData,
  linkedinData,
  youtubeData,
  postContent,
  selectedPlatforms,
  setSelectedPlatforms,
  selectedPages,
  setSelectedPages,
  onStateChange,
  videoUrl,
  updateVideoUrl,
  postType,
  onChangePostType,
  shouldReset
}) => {
  const { t } = useTranslation();

  const [post, setPost] = useState({
    content: '',
    platformContent: {}, // New: Store content for each platform separately
    scheduledTime: new Date(),
    images: [], // Only array for all images
    video: null,
    videoUrl: null,
    scheduleNow: true,
    // YouTube specific fields
    youtubeTitle: '',
    youtubeTags: '',
    youtubeDescription: '',
  });



  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('');

  
  // Loading state variables
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isImprovingPost, setIsImprovingPost] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);


  // Action menu state variables
  const [showTextActionsMenu, setShowTextActionsMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const textActionsRef = useRef(null);
  const hideMenuTimer = useRef(null);

  const [location, setLocation] = useState('');
  const [locationId, setLocationId] = useState('');
  

  const [backgroundTasks, setBackgroundTasks] = useState([]);

  const [displayPlatform, setDisplayPlatform] = useState('');
  const [selectedYouTubeCategory, setSelectedYouTubeCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('People & Blogs');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const youtubeCategories = [
    { id: 1, name: "Film & Animation" },
    { id: 2, name: "Autos & Vehicles" },
    { id: 10, name: "Music" },
    { id: 15, name: "Pets & Animals" },
    { id: 17, name: "Sports" },
    { id: 18, name: "Short Movies" },
    { id: 19, name: "Travel & Events" },
    { id: 20, name: "Gaming" },
    { id: 21, name: "Videoblogging" },
    { id: 22, name: "People & Blogs" },
    { id: 23, name: "Comedy" },
    { id: 24, name: "Entertainment" },
    { id: 25, name: "News & Politics" },
    { id: 26, name: "Howto & Style" },
    { id: 27, name: "Education" },
    { id: 28, name: "Science & Technology" },
    { id: 29, name: "Nonprofits & Activism" },
    { id: 30, name: "Movies" },
    { id: 31, name: "Anime/Animation" },
    { id: 32, name: "Action/Adventure" },
    { id: 33, name: "Classics" },
    { id: 34, name: "Comedy" },
    { id: 35, name: "Documentary" },
    { id: 36, name: "Drama" },
    { id: 37, name: "Family" },
    { id: 38, name: "Foreign" },
    { id: 39, name: "Horror" },
    { id: 40, name: "Sci-Fi/Fantasy" },
    { id: 41, name: "Thriller" },
    { id: 42, name: "Shorts" },
    { id: 43, name: "Shows" },
    { id: 44, name: "Trailers" }
  ];
  // Set display platform to first selected platform (for account selection only)
  useEffect(() => {
    if (selectedPlatforms?.length > 0) {
      setDisplayPlatform(selectedPlatforms[0]);
    } else {
      setDisplayPlatform('');
    }
  }, [selectedPlatforms]);

  // Separate state for textarea platform switching
  const [textareaPlatform, setTextareaPlatform] = useState('');
  const [isAllTextPlatforms, setIsAllTextPlatforms] = useState(false);

  // Set textarea platform when platforms change
  useEffect(() => {
    if (selectedPlatforms?.length > 0) {
      if (selectedPlatforms.length > 1) {
        setTextareaPlatform('all');
        setIsAllTextPlatforms(true);
      } else {
        setTextareaPlatform(selectedPlatforms[0]);
        setIsAllTextPlatforms(false);
      }
    } else {
      setTextareaPlatform('');
      setIsAllTextPlatforms(false);
    }
  }, [selectedPlatforms]);

  const socialAccounts = [
    ...(facebookData?.pages?.map(page => ({
      id_: page.id,
      auth_id: page.auth_id,
      page_id: page.page_id,
      name: page.name,
      profile_picture: page.profile_picture,
      platform: 'facebook'
    })) || []),
    ...(instagramData?.accounts?.map(account => ({
      id_: account.id,
      account_id: account.account_id,
      name: account.name,
      profile_picture: account.profile_picture,
      platform: 'instagram'
    })) || []),
    ...(threadsData?.accounts?.map(account => ({
      id_: account.id,
      auth_id: account.auth_id,
      account_id: account.account_id,
      name: account.name,
      profile_picture: account.profilePicture,
      platform: 'threads'
    })) || []),
    ...(linkedinData?.accounts?.map(account => ({
      id_: account.id,
      auth_id: account.auth_id,
      account_id: account.account_id,
      name: account.name,
      profile_picture: account.picture,
      platform: 'linkedin'
    })) || []),
    ...(youtubeData?.channels?.map(channel => ({
      id_: channel.id,
      channel_id: channel.channel_id,
      name: channel.title,
      profile_picture: channel.profile_picture,
      platform: 'youtube'
    })) || []),
    ...(tiktokData?.accounts?.map(account => ({
      id_: account.id,
      account_id: account.tiktok_id,
      name: account.display_name,
      profile_picture: account.avatar_url,
      platform: 'tiktok'
    })) || [])
  ];

  // Function to filter platforms based on post type
  const getAvailablePlatformsForType = (selectedPostType) => {
    const platformsByType = {
      text: ['facebook', 'threads', 'linkedin'],
      image: ['facebook', 'instagram', 'tiktok', 'linkedin'],
      video: ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin']
    };

    const allowedPlatforms = platformsByType[selectedPostType] || [];
    
    // Only include platforms that are both allowed for this post type AND have data
    return allowedPlatforms.filter(platform => {
      switch (platform) {
        case 'facebook': return facebookData;
        case 'instagram': return instagramData;
        case 'threads': return threadsData;
        case 'tiktok': return tiktokData;
        case 'linkedin': return linkedinData;
        case 'youtube': return youtubeData;
        default: return false;
      }
    });
  };

  // Determine available platforms based on post type
  const   availablePlatforms = getAvailablePlatformsForType(postType);

  




  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  

  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleImageChange = (e, storedImageUrl) => {
    // If we have a stored image URL from localStorage, use that directly
    if (storedImageUrl) {
      setPost(prev => {
        const newPost = { ...prev, images: [storedImageUrl] };
        // Notify parent component immediately
        if (typeof onStateChange === 'function') {
          onStateChange({
            isGeneratingPost,
            generationProgress: 0,
            content: getCurrentContent(),
            imageUrls: newPost.images
          });
        }
        return newPost;
      });
      return;
    }
    
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(imagePromises).then(base64Images => {
        setPost(prev => {
          const newImages = [...(prev.images || []), ...base64Images];
          const newPost = { ...prev, images: newImages };
          
          // Notify parent component immediately
          if (typeof onStateChange === 'function') {
            onStateChange({
              isGeneratingPost,
              generationProgress: 0,
              content: getCurrentContent(),
              imageUrls: newPost.images
            });
          }
          
          return newPost;
        });
      });
    }
  };

  
  
  


  const checkUploadStatus = async (taskId) => {
    try {
              const response = await fetch(`https://app.postwand.io/api/upload-status/${taskId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Error checking task status: ${response.status}`);
        return;
      }
      
      const data = await response.json();
     
      
      // Update background tasks list
      setBackgroundTasks(prev => prev.map(task => 
        task.taskId === taskId ? { ...task, status: data.status, result: data.result } : task
      ));
      
      // If completed or failed, show notification
      if (data.status === 'completed') {
        setStatus({ type: 'success', message: t('messages.postPublishedPlatform', { platform: data.platform, type: data.post_type }) });
        localStorage.removeItem('videoUrl');
      } else if (data.status === 'failed') {
        const errorMsg = data.result?.error || t('common.unknownError');
        setStatus({ type: 'error', message: t('messages.failedToPost', { platform: data.platform, type: data.post_type, error: errorMsg }) });
      } else if (data.status === 'processing') {
        // If still processing, check again in 10 seconds
        setTimeout(() => checkUploadStatus(taskId), 10000);
      }
    } catch (error) {
      console.error(`Error checking task status: ${error}`);
    }
  };




  // Handle the schedule/submit functionality
  const handleSchedule = async (e) => {
    console.log('handleSchedule triggered');
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    // Frontend validation based on post type
    const hasContent = getCurrentContent().trim().length > 0;
    const hasImages = post.images && post.images.length > 0;
    const hasVideo = post.video || post.videoUrl;

    // Validate based on post type
    if (postType === 'text' && !hasContent) {
      setStatus({ type: 'error', message: t('messages.textPostRequiresContent', 'Text posts require content') });
      setIsSubmitting(false);
      return;
    }

    if (postType === 'image' && !hasImages) {
      setStatus({ type: 'error', message: t('messages.imagePostRequiresImage', 'Image posts require at least one image') });
      setIsSubmitting(false);
      return;
    }

    if (postType === 'video' && !hasVideo) {
      setStatus({ type: 'error', message: t('messages.videoPostRequiresVideo', 'Video posts require a video file') });
      setIsSubmitting(false);
      return;
    }

    // Additional validation for YouTube (requires title for video posts)
    if (selectedPlatforms.includes('youtube') && postType === 'video' && !post.youtubeTitle.trim()) {
      setStatus({ type: 'error', message: t('messages.youtubeRequiresTitle', 'YouTube videos require a title') });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    
    // Prepare platform-specific content
    const platformsContent = {};
    selectedPlatforms.forEach(platform => {
      // Use platform-specific content if available, otherwise fall back to shared content
      const content = post.platformContent[platform] || post.content || '';
      platformsContent[platform] = content;
    });
    
    formData.append('platforms_content', JSON.stringify(platformsContent));
    formData.append('scheduled_time', post.scheduledTime.toISOString());
    
    // Add location data if provided
    if (locationId) {
      formData.append('location_id', locationId);
      formData.append('location_name', location);
    }
    
    // Add YouTube category if selected
    if (selectedYouTubeCategory) {
      formData.append('youtube_category', selectedYouTubeCategory);
    }
    
    // Add YouTube metadata if YouTube is selected
    if (selectedPlatforms.includes('youtube')) {
      formData.append('youtube_title', post.youtubeTitle);
      formData.append('youtube_tags', post.youtubeTags);
      formData.append('youtube_description', getCurrentContent());
    }
    
    // Verify selectedPlatforms and selectedPages have values
    if (!selectedPlatforms.length) {
      setStatus({ type: 'error', message: t('messages.noPlatformSelected') });
      setIsSubmitting(false);
      return;
    }
    
    // Create an array of platform data
    const platformsData = selectedPlatforms.map(platform => {
      const selectedId = selectedPages[platform];
      if (!selectedId) {
        throw new Error(t('messages.noPageSelected', { platform }));
      }
      
      const selectedAccount = socialAccounts.find(account => 
        account.platform === platform && account.id_ === selectedId
      );
      
      if (!selectedAccount) {
        throw new Error(t('messages.accountNotFound', { platform, id: selectedId }));
      }
      
      const platformId = platform === 'facebook' ? selectedAccount.page_id : 
                         platform === 'youtube' ? selectedAccount.channel_id : 
                         platform === 'tiktok' ? selectedAccount.account_id :
                         selectedAccount.account_id;
      
      // Determine post_type based on platform
      let postType = 'post'; // default
      if (platform === 'facebook' || platform === 'instagram') {
        postType = selectedPages.meta_post_type || 'post';
      } else if (platform === 'youtube') {
        postType = selectedPages.youtube_post_type || 'video';
      } else if (platform === 'linkedin') {
        postType = selectedPages.linkedin_post_type || 'post';
      } else if (platform === 'tiktok') {
        postType = selectedPages.tiktok_post_type || 'video';
      }
      
      const platformData = {
        platform: platform,
        auth_id: selectedAccount.auth_id || null,
        page_id: platformId,
        post_type: postType
      };
      
    
      return platformData;
    });
    
    // Append platforms data as a JSON string
    formData.append('platforms', JSON.stringify(platformsData));

    formData.append('schedule_now', post.scheduleNow ? 'true' : 'false');

    // Handle multiple images
    if (post.images && post.images.length > 0) {
      post.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      formData.append('image_count', post.images.length.toString());
    }
    
    // Add video handling
    if (post.video instanceof File) {
      formData.append('video', post.video);
    }
    else if (post.videoUrl) {
      formData.append('video', post.videoUrl);
    }
    
    console.log("Submitting post with image:", post.image);
 
    try {
        const response = await fetch(`https://app.postwand.io/api/schedule`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      
      const responseText = await response.text();
  
      let data;
      try {
        data = JSON.parse(responseText);
   
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Server responded with ${response.status}: ${responseText}`);
      }

      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.error || `Failed to schedule post (${response.status})`);
      }

      // Check if we got a task ID for background processing (immediate posts)
      if (data.task_id) {
        // Start polling for task status
        setStatus({ 
          type: 'info', 
          message: t('messages.publishingPost')  
        });
        
        // Start checking task status
        pollTaskStatus(data.task_id);
      } else if (data.scheduled_posts) {
        // Handle scheduled posts response
        const successCount = data.scheduled_posts.length;
        const hasErrors = data.errors && data.errors.length > 0;
        
        if (hasErrors) {
          setStatus({ 
            type: 'warning', 
            message: `${successCount} post(s) scheduled successfully. ${data.errors.length} error(s) occurred.`
          });
        } else {
          setStatus({ 
            type: 'success', 
            message: data.message || `${successCount} post(s) scheduled successfully!`
          });
        }
        
       
        
      } else {
        // Handle other synchronous responses
        setStatus({ type: 'success', message: data.message || 'Operation completed successfully!' });
      }

      
    } catch (error) {
   
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function to poll for task status
  const pollTaskStatus = async (taskId) => {
    // Keep track of polling
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    let attempts = 0;
    
    // Set initial loading state
    setBackgroundTasks(prev => [...prev, {
      taskId: taskId,
      status: 'pending',
      platforms: []  // Will be populated when we get more details
    }]);
    
    // Create polling interval
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://app.postwand.io/api/task/${taskId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to check task status: ${response.status}`);
        }
        
        const task = await response.json();
    
        // Update background tasks state
        setBackgroundTasks(prev => {
          const updatedTasks = [...prev];
          const index = updatedTasks.findIndex(t => t.taskId === taskId);
          
          if (index !== -1) {
            // Parse results if available
            let platforms = [];
            if (task.results) {
              const results = typeof task.results === 'string' ? 
                JSON.parse(task.results) : task.results;
                
              // Combine success and failed results
              if (results.success) {
                platforms = platforms.concat(results.success.map(r => ({
                  platform: r.platform,
                  status: 'completed',
                  postType: r.post_type || 'regular'
                })));
              }
              
              if (results.failed) {
                platforms = platforms.concat(results.failed.map(r => ({
                  platform: r.platform,
                  status: 'failed',
                  postType: r.post_type || 'regular',
                  error: r.result || 'Unknown error'
                })));
              }
            }
            
            updatedTasks[index] = {
              ...updatedTasks[index],
              status: task.status,
              platforms: platforms.length > 0 ? platforms : updatedTasks[index].platforms
            };
          }
          
          return updatedTasks;
        });
        
        // If task is completed or failed, stop polling
        if (task.status === 'completed' || task.status === 'failed') {
          clearInterval(interval);
          
          // Update status message
          if (task.status === 'completed') {
            setStatus({ 
              type: 'success', 
              message: t('messages.postPublished') 
            });
          } else {
            setStatus({ 
              type: 'error', 
              message: t('messages.postPublishError') 
            });
          }
        }
        
        // Stop polling after max attempts
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus({ 
            type: 'warning', 
            message: t('messages.taskTakingLonger') 
          });
        }
      } catch (error) {
        console.error('Error checking task status:', error);
        clearInterval(interval);
      }
    }, 10000); 
    
    
    return interval;
  };

  const handleGeneratePost = async () => {
    setIsGeneratingPost(true);
    try {
          const response = await fetch(`https://app.postwand.io/api/generate-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: aiTopic, platform: 'twitter', tone: aiTone, contentType: 'post' })
      });

      const data = await response.json();
   
      if (!response.ok) throw new Error(data.error || t('messages.failedToGeneratePost'));

      if (data.success && data.data.suggestions) {
 
        let newContent = data.data.suggestions;
        
    
        if (Array.isArray(newContent)) {
          newContent = newContent.join('\n\n');
        } else if (typeof newContent === 'object') {
          newContent = JSON.stringify(newContent);
        } else if (typeof newContent !== 'string') {
          newContent = String(newContent);
        }
        
        // Update content based on current mode
        if (isAllTextPlatforms) {
          // Update all platforms with the new content
          setPost(prevPost => {
            const updatedPlatformContent = { ...prevPost.platformContent };
            selectedPlatforms.forEach(platform => {
              updatedPlatformContent[platform] = newContent;
            });
            
            return {
              ...prevPost,
              content: newContent,
              platformContent: updatedPlatformContent
            };
          });
        } else {
          // Update specific platform content
          setPost(prevPost => ({
            ...prevPost,
            platformContent: {
              ...prevPost.platformContent,
              [textareaPlatform]: newContent
            }
          }));
        }
        
        
        setAiTopic('');
        setAiTone('');
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsGeneratingPost(false);
    }
  };

  
  // Action menu handlers - adapted from CreateText
  const handleActionMessage = async (action) => {
    console.log('Action:', action);
    
    if (action === "Ask") {
      setAiDialogOpen(true);
      setShowTextActionsMenu(false);
      return;
    } else {
      setIsAnimating(true);
    }
    
    // Get current content based on current mode
    let currentContent = getCurrentContent();
    
    // Handle various content types
    if (Array.isArray(currentContent)) {
      currentContent = currentContent.join('\n\n');
    } else if (typeof currentContent === 'object' && currentContent !== null) {
      currentContent = JSON.stringify(currentContent);
    } else if (typeof currentContent !== 'string') {
      currentContent = String(currentContent || '');
    }
    
    if (!currentContent.trim()) {
      setStatus({ type: 'error', message: t('messages.addContentToImprove') });
      setIsAnimating(false);
      return;
    }
    
    try {
          const response = await fetch(`https://app.postwand.io/api/chat/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: action,
          content: currentContent,
          platform: textareaPlatform || selectedPlatforms[0] || 'facebook'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const modifiedContent = data.modified_content;
        
        // Update content based on current mode
        if (isAllTextPlatforms) {
          // Update all platforms with the modified content
          setPost(prevPost => {
            const updatedPlatformContent = { ...prevPost.platformContent };
            selectedPlatforms.forEach(platform => {
              updatedPlatformContent[platform] = modifiedContent;
            });
            
            return {
              ...prevPost,
              content: modifiedContent,
              platformContent: updatedPlatformContent
            };
          });
        } else {
          // Update specific platform content
          setPost(prevPost => ({
            ...prevPost,
            platformContent: {
              ...prevPost.platformContent,
              [textareaPlatform]: modifiedContent
            }
          }));
        }
        
        setIsAnimating(false);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to modify content' });
        setIsAnimating(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: 'Failed to process action' });
      setIsAnimating(false);
    }
  };

  // Handle text actions menu hover with delay
  const handleTextActionsHover = () => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    setShowTextActionsMenu(true);
  };

  const handleTextActionsLeave = () => {
    hideMenuTimer.current = setTimeout(() => setShowTextActionsMenu(false), 300);
  };

  const handleTextActionsMenuHover = () => {
    if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
  };

  // Get current content based on selected textarea platform/mode
  const getCurrentContent = () => {
    if (isAllTextPlatforms) {
      // When "All" is selected, return the shared content or the first platform's content
      return post.content || '';
    } else {
      // Return platform-specific content or shared content as fallback
      return post.platformContent[textareaPlatform] || post.content || '';
    }
  };

  // Initialize platform content when switching textarea platforms
  useEffect(() => {
    if (textareaPlatform && textareaPlatform !== 'all' && !post.platformContent[textareaPlatform] && post.content) {
      // If switching to a platform that doesn't have content yet, but we have shared content, copy it
      setPost(prev => ({
        ...prev,
        platformContent: {
          ...prev.platformContent,
          [textareaPlatform]: prev.content
        }
      }));
    }
  }, [textareaPlatform, post.content]);

  // Update handleContentChange to work with platform-specific content
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    
    if (isAllTextPlatforms) {
      // When "All" is selected, update shared content and sync to all platforms
      setPost(prev => {
        const updatedPlatformContent = { ...prev.platformContent };
        selectedPlatforms.forEach(platform => {
          updatedPlatformContent[platform] = newContent;
        });
        
        return {
          ...prev,
          content: newContent,
          platformContent: updatedPlatformContent
        };
      });
    } else {
      // Update content for specific platform
      setPost(prev => ({
        ...prev,
        platformContent: {
          ...prev.platformContent,
          [textareaPlatform]: newContent
        }
      }));
    }
    
    // Add this to update the parent component's state with the new content
    if (typeof onStateChange === 'function') {
      onStateChange({
        isGeneratingPost,
        generationProgress: 0, // No longer generating image, so progress is 0
        content: newContent,  // Send content updates through existing onStateChange prop
        imageUrls: post.images || [], // Send current images to parent
        youtubeMetadata: {
          title: post.youtubeTitle,
          tags: post.youtubeTags,
          description: getCurrentContent()
        }
      });
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData) => {
    const { emoji } = emojiData;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = getCurrentContent();
      const newContent = currentContent.substring(0, start) + emoji + currentContent.substring(end);
      
      // Update content based on current mode
      if (isAllTextPlatforms) {
        // Update all platforms with the new content
        setPost(prev => {
          const updatedPlatformContent = { ...prev.platformContent };
          selectedPlatforms.forEach(platform => {
            updatedPlatformContent[platform] = newContent;
          });
          
          return {
            ...prev,
            content: newContent,
            platformContent: updatedPlatformContent
          };
        });
      } else {
        // Update specific platform content
        setPost(prev => ({
          ...prev,
          platformContent: {
            ...prev.platformContent,
            [textareaPlatform]: newContent
          }
        }));
      }
      
      // Close the emoji picker
      setShowEmojiPicker(false);
      
      // Focus back on the textarea and set cursor position after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + emoji.length;
        textarea.selectionEnd = start + emoji.length;
      }, 10);
    }
  };


  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
   
      if (file.size > 52428800) {
        setStatus({ 
          type: 'error', 
          message: t('messages.videoTooLarge')
        });
        return;
      }
      
      // For Instagram, check dimensions and duration (would require additional libraries)
      const previewURL = URL.createObjectURL(file);
      setPost({ ...post, video: file, videoUrl: previewURL });
      updateVideoUrl(previewURL);
   
    }
  };
  // Add a component to show background tasks
  const BackgroundTasksList = () => {
    const [isVisible, setIsVisible] = useState(true);
    
    if (backgroundTasks.length === 0 || !isVisible) return null;
    
    return (
      <div className="fixed bottom-16 right-4 bg-white shadow-lg rounded-md p-2 max-w-xs z-40">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[15px] font-medium">{t('social.backgroundTasks')}</h3>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {backgroundTasks.map(task => (
          <div key={task.taskId} className="text-xs mb-1 flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              task.status === 'completed' ? 'bg-green-500' : 
              task.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></span>
            <span>{task.platform} {task.postType}: {task.status}</span>
          </div>
        ))}
      </div>
    );
  };

  const resetImageInput = () => {
    setPost(prev => {
      const newPost = { ...prev, images: [] };
      
      // Notify parent component immediately
      if (typeof onStateChange === 'function') {
        onStateChange({
          isGeneratingPost,
          generationProgress: 0,
          content: getCurrentContent(),
          imageUrls: []
        });
      }
      
      return newPost;
    });
    
    // Reset the file input value
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };
  
  const resetVideoInput = () => {
    setPost({ ...post, video: null, videoUrl: null });
    updateVideoUrl(null);
    localStorage.removeItem('videoUrl');
    // Reset the file input value
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Function to reset all post data in PostScheduler
  const resetAllPostData = () => {
    setPost({
      content: '',
      platformContent: {},
      scheduledTime: new Date(),
      images: [],
      video: null,
      videoUrl: null,
      scheduleNow: true,
      youtubeTitle: '',
      youtubeTags: '',
      youtubeDescription: '',
    });
    
    // Reset other state variables
    setLocation('');
    setLocationId('');
    setSelectedYouTubeCategory('');
    setSelectedCategoryName('People & Blogs');
    setAiTopic('');
    setAiTone('');
    setStatus(null);
    setShowEmojiPicker(false);
    setShowTextActionsMenu(false);
    setIsDropdownOpen(false);
    
    // Reset file inputs
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Effect to handle reset from parent
  useEffect(() => {
    if (shouldReset) {
      resetAllPostData();
    }
  }, [shouldReset]);
  // Check for selected date in sessionStorage when component mounts
  useEffect(() => {
    const selectedDateStr = sessionStorage.getItem('selectedDate');
    if (selectedDateStr) {
      try {
        const selectedDate = new Date(selectedDateStr);
        if (!isNaN(selectedDate.getTime())) {
          setPost(prev => ({
            ...prev,
            scheduledTime: selectedDate,
            scheduleNow: false
          }));
          
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('selectedDate');
        }
      } catch (error) {
        console.error('Error parsing selected date:', error);
      }
    }
  }, []);

  // Check for content and image from URL params when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentFromParams = urlParams.get('content');
    const imageFromParams = urlParams.get('image');
    
    if (contentFromParams || imageFromParams) {
      setPost(prev => {
        // If we have content from params, distribute it to all platforms
        const updatedPlatformContent = { ...prev.platformContent };
        if (contentFromParams && selectedPlatforms.length > 0) {
          selectedPlatforms.forEach(platform => {
            updatedPlatformContent[platform] = contentFromParams;
          });
        }
        
        return {
          ...prev,
          content: contentFromParams || prev.content,
          platformContent: contentFromParams ? updatedPlatformContent : prev.platformContent,
          images: imageFromParams ? [decodeURIComponent(imageFromParams)] : prev.images
        };
      });
      
     
      
      // Notify parent component of content change for preview update
      if (contentFromParams && typeof onStateChange === 'function') {
        onStateChange({
          isGeneratingPost,
          generationProgress: 0, // No longer generating image, so progress is 0
          content: contentFromParams,
          imageUrls: imageFromParams ? [decodeURIComponent(imageFromParams)] : []
        });
      }
      
      // Clear the URL params after using them
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [selectedPlatforms]);

  // Notify parent component when content changes
  useEffect(() => {
    if (typeof onStateChange === 'function') {
      const currentContent = getCurrentContent();
      onStateChange({
        isGeneratingPost,
        generationProgress: 0, // No longer generating image, so progress is 0
        content: currentContent,
        imageUrls: post.images || [],
        youtubeMetadata: {
          title: post.youtubeTitle,
          tags: post.youtubeTags,
          description: currentContent
        }
      });
    }
  }, [post.content, post.platformContent, textareaPlatform, isAllTextPlatforms, isGeneratingPost, post.images, post.youtubeTitle, post.youtubeTags]);

  // Close AI options dropdown and text actions menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {

      if (textActionsRef.current && !textActionsRef.current.contains(event.target)) {
        setShowTextActionsMenu(false);
      }
      
      // Close YouTube category dropdown when clicking outside
      if (isDropdownOpen && !event.target.closest('.youtube-category-dropdown')) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
    };
  }, [textActionsRef, isDropdownOpen]);



  return (
    <>
      <div className="w-full h-28 mb-1 mx-auto bg-gray-100/80 p-4 rounded-lg relative">
        <button
          onClick={onChangePostType}
          className="absolute left-3 bottom-3 text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors hover:bg-white px-3 py-1.5 rounded-md"
        >
          ← {t('social.backToPostType', 'Back')}
        </button>
        <h1 className="text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
          {t('social.createPost')}
        </h1>
      </div>
      
            <Card className="w-full mx-auto bg-[#FDFDFD] border-none relative">
        <CardContent className="space-y-6 p-3 md:p-6" >
          <form onSubmit={handleSchedule} className="space-y-6">
            {/* Platform Selection - Multi-select */}
            <div className="space-y-1">
              <label className="text-md font-medium text-gray-700">{t('social.platformsToPost')}</label>
              <SocialPlatformSelector 
                platforms={availablePlatforms}
                selectedPlatforms={selectedPlatforms}
                onSelectPlatform={setSelectedPlatforms}
              />
            </div>

          {selectedPlatforms.length > 1 && (
            <div className="space-y-3">

              <label className="text-md font-medium text-gray-700">{t('social.selectPlatformAccount')}</label>
          
              <div className="flex gap-2 w-full ">
                {selectedPlatforms.map((platform, index) => (
                  <button
                    type="button"
                    key={platform}
                    onClick={() => setDisplayPlatform(platform)}
                    className={`px-2 py-1.5 rounded-lg w-24 text-sm ${
                      displayPlatform === platform
                          ? 'bg-white border border-purple-200 text-purple-500'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
           
            </div>
            </div>
          )}


          {selectedPlatforms.map(platform => (
               <div key={platform} className={selectedPlatforms.length === 1 || platform === displayPlatform ? 'block' : 'hidden'}>
                 <AccountSelect 
                   platform={platform}
                   selectedPages={selectedPages}
                   setSelectedPages={setSelectedPages}
                   socialAccounts={socialAccounts}
                 />
               </div>
             ))}
           
           
          
               <Platform
                selectedPlatforms={selectedPlatforms}
                selectedPages={selectedPages}
                setSelectedPages={setSelectedPages}
                imageInputRef={imageInputRef}
                videoInputRef={videoInputRef}
                post={post}
                handleImageChange={handleImageChange}
                resetImageInput={resetImageInput}
                handleVideoChange={handleVideoChange}
                resetVideoInput={resetVideoInput}
                socialAccounts={socialAccounts}
                setPost={setPost}
                postType={postType}
               />
            

            

            {/* Content Area with Emoji & Location buttons */}
            <div className="space-y-3">
              <div className="space-y-3">
                  
                    
                  <label className="text-md font-medium text-gray-700">
                    {t('social.content')} 
                    {isAllTextPlatforms ? (
                      <span className="text-sm text-purple-500 ml-2">{t('social.allPlatforms', 'All Platforms')}</span>
                    ) : (
                      <span className="text-sm text-gray-500 ml-2">{textareaPlatform}</span>
                    )}
                  </label>
               
                  <div className="flex items-center space-x-2">
                    {/* All Platforms button - only show when multiple platforms selected */}
                    {selectedPlatforms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAllTextPlatforms(true);
                          setTextareaPlatform('all');
                        }}
                        className={`px-2 py-1.5 rounded-lg text-sm ${
                          isAllTextPlatforms
                            ? 'bg-white border border-purple-200 text-purple-500'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All Platforms
                      </button>
                    )}
                    
                    {selectedPlatforms.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          // Switch to specific platform
                          setIsAllTextPlatforms(false);
                          setTextareaPlatform(platform);
                        }}
                        className={`px-2 py-1.5 w-24 rounded-lg text-sm ${
                          (!isAllTextPlatforms && platform === textareaPlatform)
                            ? 'bg-white border border-purple-200 text-purple-500'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </button>
                    ))}
                  </div>
                
             


                
                
                
              </div>
              
              <div className="relative">
                
              {textareaPlatform === 'youtube' && (
                <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                {t('social.youtube.title')}
                </label>
                 <Textarea 
                 value={post.youtubeTitle}
                 onChange={(e) => setPost(prev => ({ ...prev, youtubeTitle: e.target.value }))}
                 placeholder="Enter YouTube video title..."
                 className="mb-2 bg-white h-16 resize-none border rounded-lg p-3 w-full focus:ring-1 focus:ring-gray-200 text-sm"
                 />
                 </div>
              )}
             <div className="flex items-center justify-between mb-2" >
             <label className="text-sm font-medium text-gray-700 block mb-2">
             {t('social.caption')}
             </label>
             {/* Action Menu - Desktop and Mobile */}
             <div ref={textActionsRef} className="relative">
                  {/* Menu Trigger Button */}
                  <button
                    type="button"
                    onMouseEnter={handleTextActionsHover}
                    onMouseLeave={handleTextActionsLeave}
                    className="flex justify-center items-center text-sm py-2 px-4 border border-gray-200 rounded-lg text-gray-800 shadow-sm hover:shadow-md bg-white"
                    disabled={isGeneratingPost || isImprovingPost || isAnimating}
                  >
                    <Wand2 size={16} className='mr-2 text-[rgba(219,39,119,1)]'/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                      {t('common.actions')}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showTextActionsMenu && (
                    <div 
                      onMouseEnter={handleTextActionsMenuHover} 
                      onMouseLeave={handleTextActionsLeave} 
                      className="absolute top-full mt-1 left-0 flex flex-col gap-1 bg-white rounded-xl p-1 shadow-lg border border-gray-200 w-36 z-30"
                    >
                      <button 
                        type="button"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                        onClick={() => {
                          setShowTextActionsMenu(false);
                          handleActionMessage("Improve");
                        }}
                        disabled={isGeneratingPost || isImprovingPost || isAnimating}
                      >
                        <CircleFadingArrowUp size={16} className='mr-2'/>  {t('common.improve')}
                      </button>
                      <button 
                        type="button"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                        onClick={() => {
                          setShowTextActionsMenu(false);
                          handleActionMessage("Expand");
                        }}
                        disabled={isGeneratingPost || isImprovingPost || isAnimating}
                      >
                         <ScrollText size={16} className='mr-2'/>{t('common.expand')}
                      </button>
                      <button 
                        type="button"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                        onClick={() => {
                          setShowTextActionsMenu(false);
                          handleActionMessage("Shorten");
                        }}
                        disabled={isGeneratingPost || isImprovingPost || isAnimating}
                      >
                        <ScissorsLineDashed size={16} className='mr-2'/> {t('common.shorten')}
                      </button>
                      <button 
                        type="button"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                        onClick={() => {
                          setShowTextActionsMenu(false);
                          handleActionMessage("Ask");
                        }}
                        disabled={isGeneratingPost || isImprovingPost || isAnimating}
                      >
                        <MessageSquare size={16} className='mr-2'/> {t('common.ask')}
                      </button>
                    </div>
                  )}
                </div>
             </div>
             {/* Action Menu - Desktop and Mobile */}
          
                <Textarea
                  ref={textareaRef}
                  value={isGeneratingPost ? t('social.generatingCaption') : 
                         isImprovingPost ? t('social.improvingCaption') : 
                         isAnimating ? 'Processing...' :
                         getCurrentContent()}
                  onChange={handleContentChange}
                  placeholder={
                    isAllTextPlatforms 
                      ? t('social.postPlaceholderAll', 'Write content for all platforms...')
                      : t('social.postPlaceholderPlatform', 'Write content for {{platform}}...', { platform: textareaPlatform })
                  }
                  className={`bg-white h-64 resize-none border rounded-lg p-3 w-full focus:ring-1 focus:ring-gray-200 text-sm ${
                    (isGeneratingPost || isImprovingPost || isAnimating) ? "cursor-default opacity-80" : ""
                  } ${isAnimating ? 'animate-pulse' : ''}`}
                  disabled={isGeneratingPost || isImprovingPost || isAnimating}
                  style={{ cursor: (isGeneratingPost || isImprovingPost || isAnimating) ? 'default' : 'text' }}
                />
                
                {/* Buttons at the bottom of the text area */}
                <div className="absolute bottom-3 right-3 flex space-x-2">
              
                  {/* Emoji Button */}
                  <Button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 bg-transparent hover:bg-gray-100 rounded-full"
                    disabled={isGeneratingPost || isImprovingPost || isAnimating}
                  >
                    <Smile className="w-5 h-5 text-gray-500 hover:text-pink-500" />
                  </Button>
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute z-10 bottom-12 right-0">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width={320}
                      height={400}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              {textareaPlatform === 'youtube' && (
                <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                Tags
                </label>
                
                 <Textarea 
                 value={post.youtubeTags}
                 onChange={(e) => setPost(prev => ({ ...prev, youtubeTags: e.target.value }))}
                 placeholder="gaming, tutorial, how-to..."
                 className="mb-2 bg-white h-16 resize-none border rounded-lg p-3 w-full focus:ring-1 focus:ring-gray-200 text-sm"
                 /> 
                 </div>
              )}

              {/* YouTube Category Dropdown */}
              {textareaPlatform === 'youtube' && (
                <div className="mb-4 relative youtube-category-dropdown">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    {t('social.youtube.category')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="text-sm w-full px-4 py-3 bg-white border border-gray-200 rounded-lg  focus:ring-1 focus:ring-gray-200  flex items-center justify-between"
                    >
                      <span className={selectedCategoryName ? "text-gray-900" : "text-gray-500"}>
                        {selectedCategoryName || "Choose a category..."}
                      </span>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {youtubeCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setSelectedYouTubeCategory(category.id);
                              setSelectedCategoryName(category.name);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:bg-blue-50 focus:text-blue-700 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
                  </div>



           

  {textareaPlatform === 'facebook' && (
            <div>
             <button
             type="button"
             className={` flex items-center justify-center cursor-pointer py-2 px-3 rounded-md text-sm  bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm`}
             onClick={() => {
               // Find the selected Facebook account
               const selectedFacebookId = selectedPages["facebook"];
               const selectedFacebookAccount = socialAccounts.find(account => 
                 account.platform === 'facebook' && account.id_ === selectedFacebookId
               );
               
               if (selectedFacebookAccount) {
                 setLocationId(selectedFacebookAccount.page_id);
                 setLocation(selectedFacebookAccount.name);
               }

               console.log('facebook location', selectedFacebookAccount.page_id)
             }}
             >
             <MapPin className="w-4 h-4 mr-2" />
             {t('social.addLocation')}
             </button>

            </div>
            )}
            {location && location.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm ">{location}</span>
              </div>
            </div>
            )}


            {/* DateTime Picker */}
            <DateTimePicker 
              dateTime={post.scheduledTime} 
              setDateTime={(date) => setPost({ ...post, scheduledTime: date })} 
              setScheduleNow={(scheduleNow) => setPost({ ...post, scheduleNow: scheduleNow })}
            />

            

            <Button 
              type="submit"
              onClick={() => console.log('Button clicked', {
                platformsSelected: selectedPlatforms.length > 0,
                pagesSelected: Object.values(selectedPages).length > 0,
                isSubmitting,
                isGeneratingPost,
                isImprovingPost,
                isAnimating
              })}
              disabled={selectedPlatforms.length === 0 || Object.values(selectedPages).length === 0 || isSubmitting || isGeneratingPost || isImprovingPost || isAnimating}
              className={`w-full h-10 ${
                selectedPlatforms.length === 0 || Object.values(selectedPages).length === 0 || isSubmitting || isGeneratingPost || isImprovingPost || isAnimating
                  ? 'bg-gray-100 text-gray-500' 
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              {post.scheduleNow ? isSubmitting ? t('social.publishing') : t('social.publish') :  isSubmitting ? t('social.scheduling') : t('social.schedulePost')}
            </Button>
          </form>
        </CardContent>
        
            
      </Card>
      
      {/* Update to use NotificationCard with single status prop */}
      {status && <NotificationCard status={status} />}
      
      <BackgroundTasksList />
      
      {/* Add the AiWriterDialog component */}
      <AiWriterDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        aiTopic={aiTopic}
        setAiTopic={setAiTopic}
        aiTone={aiTone}
        setAiTone={setAiTone}
        handleGeneratePost={handleGeneratePost}
        isGeneratingPost={isGeneratingPost}
      />
      
      {/* Add the ImageGenerationDialog component */}
      {/* Removed ImageGenerationDialog */}
    </>
  );
};

export default PostScheduler;

