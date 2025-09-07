import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Save, Upload, Trash2, Share2, List, Plus, Edit, Copy } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ChatComponent from './ChatComponent';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from '../../hooks/useTranslations';

export default function DraggableWhiteboard({returnToAiStudio}) {
  const { t } = useTranslations();
  const { id: whiteboardIdFromUrl } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we came from AI Studio
  const fromAiStudio = location.state?.fromAiStudio;
  const [elements, setElements] = useState([]);
  const [folderContents, setFolderContents] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [connectedItems, setConnectedItems] = useState(new Set());
  const [whiteboardOffset, setWhiteboardOffset] = useState({ x: 100, y: 100 });
  const isPanningRef = useRef(false);
  const [notification, setNotification] = useState(null);
  const [whiteboards, setWhiteboards] = useState([]);
  const [showWhiteboardsList, setShowWhiteboardsList] = useState(false);
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState(null);
  const [whiteboardName, setWhiteboardName] = useState('');
  const [whiteboardDescription, setWhiteboardDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isOwner, setIsOwner] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [mustChooseWhiteboard, setMustChooseWhiteboard] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [transcribingVideos, setTranscribingVideos] = useState(new Set());
  const [selectedElementId, setSelectedElementId] = useState(null);
  const dragRef = useRef({});
  const resizeRef = useRef({});
  const whiteboardRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef(null);
  const transcribingVideosRef = useRef(new Set());



  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch whiteboards from backend
  const fetchWhiteboards = async () => {
    try {
      const response = await fetch('https://app.postwand.io/api/whiteboards', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch whiteboards: ${response.status}`);
      }
      
      const data = await response.json();
      setWhiteboards([...data.own_whiteboards, ...data.shared_whiteboards]);
    } catch (error) {
      console.error('Error fetching whiteboards:', error);
      showNotification(`Error fetching whiteboards: ${error.message}`, 'error');
    }
  };

  // Load whiteboard from backend
  const loadWhiteboardFromServer = async (id) => {
    const actualLoad = async () => {
      try {
        const response = await fetch(`https://app.postwand.io/api/whiteboards/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load whiteboard: ${response.status}`);
        }
        
        const data = await response.json();
        const whiteboardData = data.whiteboard.data;
        
        setElements(whiteboardData.elements || []);
        setFolderContents(whiteboardData.folderContents || {});
        const loadedConnectedItems = new Set(whiteboardData.connectedItems || []);
        setConnectedItems(loadedConnectedItems);
        setWhiteboardName(data.whiteboard.name);
        setWhiteboardDescription(data.whiteboard.description || '');
        setCurrentWhiteboardId(id);
        setIsPublic(data.whiteboard.is_public || false);
        setIsOwner(data.is_owner);
        
        // Update URL without reloading the page
        navigate(`/viral-chat/${id}`, { replace: true });
        
        // Generate share URL
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/viral-chat/${id}`);
        
        showNotification('Whiteboard loaded successfully!');
        setShowWhiteboardsList(false);
        setMustChooseWhiteboard(false);
        
        // Auto-reconnect to chat if there were connected items (green dots)
        if (loadedConnectedItems.size > 0) {
          console.log('Auto-reconnecting to chat for loaded whiteboard...');
          setTimeout(() => {
            connectToChat(id, data.whiteboard.name); // Pass both ID and name directly
          }, 100);
        }
      } catch (error) {
        console.error('Error loading whiteboard:', error);
        showNotification(`Error loading whiteboard: ${error.message}`, 'error');
      }
    };

    // Only check for unsaved changes if loading a different whiteboard
    if (currentWhiteboardId !== id) {
      handleUnsavedChanges(actualLoad);
    } else {
      actualLoad();
    }
  };

  // Save whiteboard to backend
  const saveWhiteboardToServer = async () => {
    // Validate whiteboard name
    if (!whiteboardName.trim()) {
      showNotification('Please enter a whiteboard name', 'error');
      return;
    }
    
    try {
      const whiteboardData = {
        elements,
        folderContents,
        connectedItems: Array.from(connectedItems)
      };
      
      // Create structured info_data
      const folders = elements.filter(el => el.type === 'folder').map(folder => ({
        id: folder.id,
        name: folder.title,
        items: (folderContents[folder.id] || []).map(itemId => {
          const item = elements.find(el => el.id === itemId);
          if (!item) return null;
          return {
            id: item.id,
            type: item.type,
            url: item.url || null,
            text: item.text || null,
            title: item.title
          };
        }).filter(Boolean)
      }));
      
      const items = elements.filter(el => 
        el.type !== 'folder' && 
        !Object.values(folderContents).flat().includes(el.id)
      ).map(item => ({
        id: item.id,
        type: item.type,
        url: item.url || null,
        text: item.text || null,
        title: item.title
      }));
      
      const data_info = { folders, items };
      
      const payload = {
        whiteboard_data: whiteboardData,
        data_info: data_info,
        name: !isOwner && currentWhiteboardId ? `Copy of ${whiteboardName}` : whiteboardName,
        description: whiteboardDescription
      };
      
      // Always save as new whiteboard if user is not the owner
      if (!isOwner && currentWhiteboardId) {
        // Remove the id from payload to create a new whiteboard instead of updating
        payload.id = null;
      } else {
        payload.id = currentWhiteboardId;
      }
      
      const response = await fetch('https://app.postwand.io/api/whiteboards', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save whiteboard: ${response.status}`);
      }
      
      const data = await response.json();
      const wasFirstSave = !currentWhiteboardId;
      setCurrentWhiteboardId(data.whiteboard.id);
      
      // If we were viewing someone else's whiteboard, we're now the owner of our copy
      if (!isOwner && currentWhiteboardId) {
        setIsOwner(true);
        showNotification('Created your personal copy of this whiteboard!');
      } else if (wasFirstSave) {
        showNotification('Whiteboard saved! You can now paste videos for auto-transcription.');
      } else {
        showNotification('Whiteboard saved successfully!');
      }
      
      // Generate share URL
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/viral-chat/${data.whiteboard.id}`);
      
      setShowSaveDialog(false);
      setMustChooseWhiteboard(false);
      
      // Update URL without reloading the page
      navigate(`/viral-chat/${data.whiteboard.id}`, { replace: true });
      
      // Refresh whiteboard list
      fetchWhiteboards();
      
      // Execute pending action if exists
      if (pendingActionRef.current) {
        pendingActionRef.current();
        pendingActionRef.current = null;
      }
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      showNotification(`Error saving whiteboard: ${error.message}`, 'error');
    }
  };

  // Delete whiteboard
  const deleteWhiteboard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`https://app.postwand.io/api/whiteboards/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete whiteboard: ${response.status}`);
      }
      
      showNotification('Whiteboard deleted successfully!');
      
      // If we deleted the current whiteboard, clear the state
      if (id === currentWhiteboardId) {
        setElements([]);
        setFolderContents({});
        setConnectedItems(new Set());
        setCurrentWhiteboardId(null);
        setWhiteboardName('');
        setWhiteboardDescription('');
      }
      
      // Refresh whiteboard list
      fetchWhiteboards();
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      showNotification(`Error deleting whiteboard: ${error.message}`, 'error');
    }
  };

  // Share whiteboard
  const shareWhiteboard = async () => {
    if (!currentWhiteboardId) {
      showNotification('Please save the whiteboard first', 'error');
      return;
    }
    
    try {
      const payload = {
        is_public: isPublic
      };
      
      if (shareEmail) {
        payload.shared_with_email = shareEmail;
      }
      
      const response = await fetch(`https://app.postwand.io/api/whiteboards/${currentWhiteboardId}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to share whiteboard: ${response.status}`);
      }
      
      showNotification('Whiteboard shared successfully!');
      setShowShareDialog(false);
      setShareEmail('');
    } catch (error) {
      console.error('Error sharing whiteboard:', error);
      showNotification(`Error sharing whiteboard: ${error.message}`, 'error');
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // If user must choose a whiteboard, don't block with unsaved changes
    if (mustChooseWhiteboard) {
      return false;
    }
    return elements.length > 0 && (!currentWhiteboardId || !whiteboardName.trim());
  };

  // Handle action that might lose unsaved changes
  const handleUnsavedChanges = (action) => {
    if (hasUnsavedChanges()) {
      pendingActionRef.current = action;
      setShowUnsavedChangesDialog(true);
    } else {
      action();
    }
  };

  // Create new whiteboard
  const createNewWhiteboard = () => {
    const actualCreateNew = () => {
      setElements([]);
      setFolderContents({});
      setConnectedItems(new Set());
      setCurrentWhiteboardId(null);
      setWhiteboardName('');
      setWhiteboardDescription('');
      setShowWhiteboardsList(false);
      setShowSaveDialog(true);
    };

    handleUnsavedChanges(actualCreateNew);
  };

  // Handle unsaved changes dialog actions
  const saveAndProceed = async () => {
    if (!whiteboardName.trim()) {
      setShowUnsavedChangesDialog(false);
      setShowSaveDialog(true);
      return;
    }
    
    await saveWhiteboardToServer();
    setShowUnsavedChangesDialog(false);
    
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  const discardAndProceed = () => {
    setShowUnsavedChangesDialog(false);
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  // Chat functions
  const openChat = () => {
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
  };

  // Load from URL on component mount
  useEffect(() => {
    fetchWhiteboards();
    
    // Check if there's a whiteboard ID in the URL
    if (whiteboardIdFromUrl) {
      loadWhiteboardFromServer(whiteboardIdFromUrl);
    } else {
      // User must choose a whiteboard - cannot close dialog until they do
      setMustChooseWhiteboard(true);
      setShowWhiteboardsList(true);
    }
  }, [whiteboardIdFromUrl]);



  // Auto-save to database every 2 minutes
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      // Only auto-save if we have a whiteboard with content and a name
      if (elements.length > 0 && whiteboardName.trim() && currentWhiteboardId) {
        try {
          console.log(`Auto-saving whiteboard "${whiteboardName}" to database...`);
          await saveWhiteboardToServer();
          console.log(`Auto-saved whiteboard "${whiteboardName}" to database successfully`);
        } catch (error) {
          console.error('Error during database auto-save:', error);
        }
      }
    }, 120000); // 120000ms = 2 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(autoSaveInterval);
  }, [elements, folderContents, connectedItems, currentWhiteboardId, whiteboardName]);

  // Add save functionality
  const saveWhiteboard = () => {
    // Only show the save dialog for new whiteboards or if name is empty
    if (!currentWhiteboardId || !whiteboardName.trim()) {
      setShowSaveDialog(true);
    } else {
      // For existing whiteboards, save directly
      saveWhiteboardToServer();
    }
  };

  // Add file input trigger
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Add load functionality
  const loadWhiteboard = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the data structure
        if (data.elements && Array.isArray(data.elements) && 
            data.folderContents && typeof data.folderContents === 'object') {
          
          setElements(data.elements);
          setFolderContents(data.folderContents);
          setConnectedItems(new Set(data.connectedItems || []));
          showNotification('Whiteboard loaded successfully!');
        } else {
          showNotification('Invalid whiteboard data format', 'error');
        }
      } catch (error) {
        console.error('Error parsing whiteboard data:', error);
        showNotification('Failed to load whiteboard data', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Add clear whiteboard functionality
  const clearWhiteboard = () => {
    const actualClear = () => {
      if (window.confirm('Are you sure you want to clear the whiteboard? This action cannot be undone.')) {
        setElements([]);
        setFolderContents({});
        setConnectedItems(new Set());
        setCurrentWhiteboardId(null);
        setWhiteboardName('');
        setWhiteboardDescription('');
        showNotification('Whiteboard cleared');
      }
    };

    handleUnsavedChanges(actualClear);
  };

  const addFolder = () => {
    const folderCount = elements.filter(el => el.type === 'folder').length;
    const newElement = {
      id: Math.random().toString(36).substring(2),
      type: 'folder',
      x: Math.random() * 300,
      y: Math.random() * 200,
      width: 400,
      height: 400,
      title: `Folder ${folderCount + 1}`
    };
    setElements([...elements, newElement]);
  };

  const deleteElement = (id) => {
    const elementToDelete = elements.find(el => el.id === id);
    
    // If deleting a folder, also delete all its children
    if (elementToDelete && elementToDelete.type === 'folder') {
      const childrenIds = folderContents[id] || [];
      // Remove both the folder and all its children
      setElements(elements.filter(el => el.id !== id && !childrenIds.includes(el.id)));
    } else {
      // Just remove the single element
      setElements(elements.filter(el => el.id !== id));
    }
    
    // Remove from connected items
    setConnectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    // Clean up folder contents
    setFolderContents(prev => {
      const newContents = { ...prev };
      if (newContents[id]) {
        delete newContents[id]; // Remove folder
      } else {
        // Remove item from all folders
        Object.keys(newContents).forEach(folderId => {
          newContents[folderId] = newContents[folderId].filter(itemId => itemId !== id);
        });
      }
      return newContents;
    });
  };

  const extractYouTubeId = (url) => {
    console.log('Extracting YouTube ID from URL:', url);
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log('YouTube ID extracted:', match[1]);
        return match[1];
      }
    }
    
    console.log('No YouTube ID found in URL');
    return null;
  };

  const fetchYouTubeTitle = async (videoId) => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      return data.title || 'YouTube Video';
    } catch (error) {
      console.error('Error fetching YouTube title:', error);
      return 'YouTube Video';
    }
  };

  const handlePaste = async (e) => {
    // Don't handle paste events when chat is open
    if (showChat) return;
    
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text');
    console.log('Content pasted:', pastedText);
    
    if (!pastedText) {
      console.log('No text data in paste event');
      return;
    }

    // Check if it's a YouTube URL
    const youtubeId = extractYouTubeId(pastedText);
    if (youtubeId) {
      console.log('YouTube video detected, processing...');
      const videoTitle = await fetchYouTubeTitle(youtubeId);
      const elementId = Math.random().toString(36).substring(2);
      const newElement = {
        id: elementId,
        type: 'video',
        x: Math.random() * 300,
        y: Math.random() * 200,
        url: pastedText,
        videoId: youtubeId,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
        title: videoTitle,
        transcriptStatus: 'pending'
      };
      setElements(prev => [...prev, newElement]);
      
      // Auto-transcript the video and save to session storage
      console.log('Attempting to transcribe video:', pastedText);
      
      try {
        showNotification('Transcribing video... This may take a moment.', 'info');
        transcribingVideosRef.current.add(elementId);
        setTranscribingVideos(new Set(transcribingVideosRef.current));
        const response = await fetch('https://app.postwand.io/api/transcript-video', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            video_url: pastedText,
            whiteboard_name: whiteboardName || 'Untitled Whiteboard',
            video_id: elementId.toString()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          transcribingVideosRef.current.delete(elementId);
          setTranscribingVideos(new Set(transcribingVideosRef.current));
          
          // Update only the video element status and title
          setElements(prev => prev.map(el => 
            el.id === elementId 
              ? { 
                  ...el, 
                  transcriptStatus: 'completed',
                  title: data.title || el.title // Update title if received
                }
              : el
          ));
          
          showNotification(`Video "${data.title.substring(0, 20)}..." transcribed`);
        } else {
          transcribingVideosRef.current.delete(elementId);
          setTranscribingVideos(new Set(transcribingVideosRef.current));
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to transcribe video:', response.status, errorData);
          
          // Update video element to show failed status
          setElements(prev => prev.map(el => 
            el.id === elementId 
              ? { ...el, transcriptStatus: 'failed' }
              : el
          ));
          
          showNotification(`Failed to transcribe video: ${errorData.error || response.statusText}`, 'error');
        }
      } catch (error) {
        transcribingVideosRef.current.delete(elementId);
        setTranscribingVideos(new Set(transcribingVideosRef.current));
        console.error('Error transcribing video:', error);
        
        // Update video element to show failed status
        setElements(prev => prev.map(el => 
          el.id === elementId 
            ? { ...el, transcriptStatus: 'failed' }
            : el
        ));
        
        showNotification(`Error transcribing video: ${error.message}`, 'error');
      }
    } else {
      // Otherwise treat as document
      const newElement = {
        id: Math.random().toString(36).substring(2),
        type: 'document',
        x: Math.random() * 300,
        y: Math.random() * 200,
        text: pastedText.substring(0, 100) + (pastedText.length > 100 ? '...' : ''),
        title: 'Document'
      };
      setElements(prev => [...prev, newElement]);
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    
    const handleKeyDown = (e) => {
      // Don't handle keyboard shortcuts when chat is open
      if (showChat) return;
      
      if (e.ctrlKey && e.key === 'x' && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
        setSelectedElementId(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showChat, selectedElementId]);

  // Remove all restrictions for non-owners
  const handlePointerDown = (e, id) => {
    e.target.setPointerCapture(e.pointerId);
    e.stopPropagation(); // Prevent whiteboard panning when dragging objects
    
    // Select the element
    setSelectedElementId(id);
    
    // Handle regular elements
    const element = elements.find(el => el.id === id);
    
    dragRef.current[id] = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      element: e.currentTarget
    };
  };

  const handlePointerMove = (e, id) => {
    const drag = dragRef.current[id];
    if (!drag) return;
    
    const deltaX = (e.clientX - drag.startX) / zoom;
    const deltaY = (e.clientY - drag.startY) / zoom;
    
    // Allow free movement - no constraints during dragging for smooth experience
    drag.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // If dragging a folder, also move its contents visually
    const element = elements.find(el => el.id === id);
    if (element?.type === 'folder') {
      const folderItems = folderContents[id] || [];
      folderItems.forEach(itemId => {
        const itemElement = document.getElementById(`element-${itemId}`);
        if (itemElement) {
          itemElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
      });
    }
  };

  const handlePointerUp = (e, id) => {
    e.target.releasePointerCapture(e.pointerId);
    const drag = dragRef.current[id];
    if (!drag) return;
    
    const deltaX = (e.clientX - drag.startX) / zoom;
    const deltaY = (e.clientY - drag.startY) / zoom;
    
    const movedElement = elements.find(el => el.id === id);
    
    // No constraints - place objects exactly where user drags them
    const newX = drag.initialX + deltaX;
    const newY = drag.initialY + deltaY;
    
    // Check if dropped inside a folder
    if (movedElement.type !== 'folder') {
      const folders = elements.filter(el => el.type === 'folder');
      let insideFolder = null;
      
      for (const folder of folders) {
        if (newX >= folder.x && 
            newX <= folder.x + folder.width &&
            newY >= folder.y && 
            newY <= folder.y + folder.height) {
          insideFolder = folder.id;
          break;
        }
      }
      
      // Update folder contents
      setFolderContents(prev => {
        const newContents = { ...prev };
        // Remove from all folders first
        Object.keys(newContents).forEach(folderId => {
          newContents[folderId] = newContents[folderId].filter(itemId => itemId !== id);
        });
        // Add to new folder if dropped inside one
        if (insideFolder) {
          if (!newContents[insideFolder]) newContents[insideFolder] = [];
          newContents[insideFolder].push(id);
        }
        return newContents;
      });
    }
    
    // If dragging a folder, also update positions of its contents
    if (movedElement?.type === 'folder') {
      const folderItems = folderContents[id] || [];
      setElements(elements.map(el => {
        if (el.id === id) {
          return { ...el, x: newX, y: newY };
        } else if (folderItems.includes(el.id)) {
          // Update position of items inside the folder - no constraints
          const itemX = el.x + deltaX;
          const itemY = el.y + deltaY;
          return { ...el, x: itemX, y: itemY };
        }
        return el;
      }));
    } else {
      // Just update the single element
      setElements(elements.map(el => 
        el.id === id 
          ? { ...el, x: newX, y: newY }
          : el
      ));
    }
    
    // Reset transforms
    drag.element.style.transform = '';
    if (movedElement?.type === 'folder') {
      const folderItems = folderContents[id] || [];
      folderItems.forEach(itemId => {
        const itemElement = document.getElementById(`element-${itemId}`);
        if (itemElement) {
          itemElement.style.transform = '';
        }
      });
    }
    
    delete dragRef.current[id];
  };

  const handleResizeStart = (e, id) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    
    resizeRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height
    };
    
    const handleResizeMove = (e) => {
      const resize = resizeRef.current;
      if (!resize) return;
      
      const deltaX = (e.clientX - resize.startX) / zoom;
      const deltaY = (e.clientY - resize.startY) / zoom;
      
      setElements(prev => prev.map(el => 
        el.id === resize.id 
          ? { 
              ...el, 
              width: Math.max(100, resize.startWidth + deltaX),
              height: Math.max(100, resize.startHeight + deltaY)
            }
          : el
      ));
    };
    
    const handleResizeEnd = () => {
      resizeRef.current = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
    };
    
    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
  };

  const handleDoubleClick = (e, element) => {
    if (element.type === 'folder') {
      e.stopPropagation();
      // Save any existing edit first
      if (editingId && editingText.trim()) {
        setElements(prev => prev.map(el => 
          el.id === editingId 
            ? { ...el, title: editingText.trim() }
            : el
        ));
      }
      setEditingId(element.id);
      setEditingText(element.title);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editingText.trim()) {
      setElements(prev => prev.map(el => 
        el.id === editingId 
          ? { ...el, title: editingText.trim() }
          : el
      ));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditingText('');
    }
  };

  
  const connectToChat = async (whiteboardId = null, whiteboardNameParam = null) => {
    // Use provided values or current state
    const activeWhiteboardId = whiteboardId || currentWhiteboardId;
    const activeWhiteboardName = whiteboardNameParam || whiteboardName;
    
    // Check if whiteboard is saved first
    if (!activeWhiteboardId) {
      showNotification('Please save the whiteboard first', 'error');
      setShowSaveDialog(true);
      return;
    }
    
    try {
      // Create folder structure - only layout data, no transcripts
      const folders = elements.filter(el => el.type === 'folder').map(folder => ({
        id: folder.id,
        name: folder.title,
        items: (folderContents[folder.id] || []).map(itemId => {
          const item = elements.find(el => el.id === itemId);
          if (!item) return null;
          return {
            id: item.id,
            type: item.type,
            title: item.title,
            url: item.url || null,
            text: item.text || null
          };
        }).filter(Boolean)
      }));
      
      // Get loose items (not in folders) - only layout data, no transcripts
      const items = elements.filter(el => 
        el.type !== 'folder' && 
        !Object.values(folderContents).flat().includes(el.id)
      ).map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        url: item.url || null,
        text: item.text || null
      }));
      
    

      // Send to backend
      const response = await fetch('https://app.postwand.io/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          whiteboard_name: activeWhiteboardName,
          folders: folders,
          items: items
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
       
        throw new Error(`Server responded with ${response.status}: ${errorData}`);
      }
      
      showNotification('Connected to chat successfully!');
      
    } catch (error) {
      console.error('Error connecting to chat:', error);
      showNotification('Failed to connect to chat', 'error');
      return;
    }
    
    // Toggle connection status for all folders and loose items
    const allItemIds = new Set();
    
    // Add all folders
    elements.filter(el => el.type === 'folder').forEach(folder => {
      allItemIds.add(folder.id);
    });
    
    // Add all loose items (not in folders)
    elements.filter(el => 
      el.type !== 'folder' && 
      !Object.values(folderContents).flat().includes(el.id)
    ).forEach(item => {
      allItemIds.add(item.id);
    });
    
    // Check if all items are connected
    const allConnected = Array.from(allItemIds).every(id => connectedItems.has(id));
    

      // Connect all
      setConnectedItems(new Set(allItemIds));
      showNotification('Connected to chat successfully!');

  };

  const MIN_ZOOM = 0.3;  // 10%
  const MAX_ZOOM = 1;    // 500%

  // Panning functionality
  const handleWhiteboardPointerDown = (e) => {
    // Only start panning if clicking on the whiteboard background, not on an element
    if (e.target === e.currentTarget || e.target.classList.contains('whiteboard-content')) {
      setSelectedElementId(null); // Clear selection when clicking background
      isPanningRef.current = true;
      // Update cursor directly without re-render
      if (whiteboardRef.current) {
        whiteboardRef.current.style.cursor = 'grabbing';
      }
      dragRef.current['whiteboard'] = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: whiteboardOffset.x,
        initialY: whiteboardOffset.y
      };
      e.preventDefault();
    }
  };

  const handleWhiteboardPointerMove = (e) => {
    if (isPanningRef.current && dragRef.current['whiteboard']) {
      const drag = dragRef.current['whiteboard'];
      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;
      
      // Calculate new offset
      const newX = drag.initialX + deltaX;
      const newY = drag.initialY + deltaY;
      
      // Very generous panning limits - much more range than before
      const maxPanRange = 3000; // Allow 3000px in each direction
      
      // Simple bounds without complex viewport calculations
      const maxX = maxPanRange;   // Can pan 3000px to the right
      const minX = -maxPanRange;  // Can pan 3000px to the left
      const maxY = maxPanRange;   // Can pan 3000px down  
      const minY = -maxPanRange;  // Can pan 3000px up
      
      // Apply simple, generous constraints
      const constrainedX = Math.max(minX, Math.min(maxX, newX));
      const constrainedY = Math.max(minY, Math.min(maxY, newY));
      
      setWhiteboardOffset({
        x: constrainedX,
        y: constrainedY
      });
      e.preventDefault();
    }
  };

  const handleWhiteboardPointerUp = (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      // Reset cursor directly without re-render
      if (whiteboardRef.current) {
        whiteboardRef.current.style.cursor = 'grab';
      }
      delete dragRef.current['whiteboard'];
    }
  };

  // Add global pointer up handler to ensure panning stops even if mouse leaves the whiteboard
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        // Reset cursor directly without re-render
        if (whiteboardRef.current) {
          whiteboardRef.current.style.cursor = 'grab';
        }
        delete dragRef.current['whiteboard'];
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    return () => document.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []); // No dependencies needed
  
  useEffect(() => {
    const whiteboardEl = whiteboardRef.current;
    if (!whiteboardEl) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        // Prevent browser zoom
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(MIN_ZOOM, prev * delta), MAX_ZOOM));
      }
    };

    // Add event listener with passive: false to allow preventDefault
    whiteboardEl.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      whiteboardEl.removeEventListener('wheel', handleWheel);
    };
  }, []);

    // Modify the return to AI Studio function
  const handleReturnToAiStudio = () => {
    // Use React Router navigation instead of window.location
    navigate('/ai-studio');
  };

  return (
          <div>
        {/* Toolbar - Fixed and outside of zoom area */}
        <div className="ml-26 flex items-center justify-between h-[10vh] min-h-16 border-b border-gray-200 bg-primary px-4 z-10 w-[calc(100vw-20rem)] shadow-sm">
          

          <button
            onClick={handleReturnToAiStudio}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {fromAiStudio ? 'Back to AI Studio' : 'AI Studio'}
          </button>
          {/* Left section - Creation tools */} 
          <div className="flex items-center space-x-3">
            <button 
              onClick={addFolder}
              className="border border-gray-400 hover:bg-white text-black text-sm font-medium py-2 px-3 rounded-md flex items-center transition-colors"
            >
              <Plus size={16} className="mr-1" />
              {t('viralChat.addFolder')}
            </button>
          </div>

          {/* Center section - File operations */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
            <button 
              onClick={saveWhiteboard}
              className="text-gray-700 hover:bg-white text-sm font-medium py-2 px-3 rounded-md flex items-center transition-colors"
            >
              <Save size={14} className="mr-1" />
              <span className="hidden md:block">{t('common.save')}</span>
            </button>
            
            <button 
              onClick={() => setShowWhiteboardsList(true)}
              className="text-gray-700 hover:bg-white text-sm font-medium py-2 px-3 rounded-md flex items-center transition-colors"
            >
              <List size={14} className="mr-1" />
              <span className="hidden md:block">{t('viralChat.open')}</span>
            </button>

            <button 
              onClick={createNewWhiteboard}
              className="text-gray-700 hover:bg-white text-sm font-medium py-2 px-3 rounded-md flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              <span className="hidden md:block">{t('common.new')}</span>
            </button>

            {/* Share button - only for owners */}
            {(isOwner && currentWhiteboardId) && (
              <button 
                onClick={() => setShowShareDialog(true)}
                className="text-gray-700 hover:bg-white text-sm font-medium py-2 px-3 rounded-md flex items-center transition-colors"
              >
                <Share2 size={14} className="mr-1" />
                <span className="hidden md:block">{t('common.share')}</span>
              </button>
            )}
          </div>

          {/* Right section - Actions and title */}
          <div className="flex items-center space-x-3">
            {/* Connect to Chat button - prominent */}
            <button 
              onClick={connectToChat}
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <MessageCircle size={16} className="mr-2" />
                {t('viralChat.connectToChat')}
            </button>

            {/* Clear button - danger style */}
            <button 
              onClick={clearWhiteboard}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-medium py-2 px-3 rounded-lg flex items-center transition-colors"
            >
              <Trash2 size={14} className="mr-1" />
              <span className="hidden lg:block">{t('viralChat.clear')}</span>
            </button>

            {/* Whiteboard name */}
            <div className="ml-4 border-l border-gray-300 pl-4 w-[200px] ">
              <h2 className="text-md font-semibold text-gray-800 truncate max-w-xs">{whiteboardName}</h2>
            </div>
          </div>
        
        {/* Hidden file input for loading */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={loadWhiteboard}
        />
        
        </div>
       
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300 ${
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-green-300'
          }`}
        >
          {notification.message}
        </div>
      )}
      
      {/* Whiteboard container - This is where the zoom happens */}
      <div 
        ref={whiteboardRef}
        className="relative ml-26 w-[calc(100vw-6.5rem)] h-[90vh] bg-gray-100 overflow-hidden cursor-grab"
        onPointerDown={handleWhiteboardPointerDown}
        onPointerMove={handleWhiteboardPointerMove}
        onPointerUp={handleWhiteboardPointerUp}
      >
        {/* This is the actual content that gets zoomed */}
        <div 
          className="whiteboard-content"
          style={{ 
            position: 'relative',
            width: `${3000}px`,
            height: `${3000}px`,
            transform: `translate(${whiteboardOffset.x}px, ${whiteboardOffset.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {/* Draw connections */}
          {/* SVG connections have been removed - connection status is now shown with dots */}
          
          {/* Render elements with positions that don't need zoom adjustment */}
          {elements.map(element => {
            const scaledStyle = {
              left: `${element.x}px`,
              top: `${element.y}px`,
              willChange: 'transform',
              zIndex: element.type === 'video' ? 10 : (element.type === 'document' ? 5 : 1)
            };

            const commonProps = {
              id: `element-${element.id}`,
              className: `group absolute cursor-move select-none touch-none ${selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''}`,
              style: {...scaledStyle,},
              onPointerDown: (e) => handlePointerDown(e, element.id),
              onPointerMove: (e) => handlePointerMove(e, element.id),
              onPointerUp: (e) => handlePointerUp(e, element.id)
            };

            // Only show delete button if user is owner or it's a new whiteboard
            const deleteButton = (isOwner || !currentWhiteboardId) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
                className="absolute top-0 right-0 w-6 h-6 text-black opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm z-10"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <X size={12} />
              </button>
            ) : null;

            // Check if this item is inside a folder
            const isInsideFolder = Object.values(folderContents).flat().includes(element.id);
            
            // Connection dot - only show for folders and loose items (not items inside folders)
            const connectionDot = !isInsideFolder || element.type === 'folder' ? (
              <div 
                className={`absolute -top-4 right-2 w-3 h-3 rounded-full border-2 border-white z-20 ${
                  connectedItems.has(element.id) ? 'bg-green-500' : 'bg-gray-400'
                }`}
                title={connectedItems.has(element.id) ? 'Connected to chat' : 'Not connected'}
              />
            ) : null;

            switch (element.type) {
              case 'folder':  
                return (
                  <div 
                    key={element.id}
                    {...commonProps}            
                  className={`${commonProps.className} bg-gray-200 border-2 border-gray-400 rounded-lg hover:shadow-sm cursor-pointer`}
                  style={{ ...commonProps.style,   
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    fontSize: `16px`    
                  }}             
                  onDoubleClick={(e) => handleDoubleClick(e, element)} 
                  >            
                  {deleteButton}             
                  {connectionDot}
                  <div className=" h-full flex flex-col">               
                    {editingId === element.id ? (                
                      <form onSubmit={handleEditSubmit}>                   
                      <input                     
                      type="text"                    
                        value={editingText}                   
                          onChange={(e) => setEditingText(e.target.value)}                    
                          onKeyDown={handleEditKeyDown}                     
                          onPointerDown={(e) => e.stopPropagation()}                     
                          onBlur={handleEditSubmit}                     
                          className="bg-transparent border-0 outline-none font-semibold text-black 0 w-full  px-2 py-1"                     
                          autoFocus                  
                            />               
                              </form>             
                              ) : (             
                                    <div className="font-semibold text-black cursor-text px-2 py-1">{element.title}</div>   
                            )}               
                                            <div className="flex items-center justify-center bg-gray-100 rounded-xl h-full">
                  <div className="text-xs text-gray-500 p-2">{t('viralChat.dropItemsHere')}</div>
                </div>            
                              </div>           
                                <div          
                                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100"      
                                              onPointerDown={(e) => handleResizeStart(e, element.id)}      
                                                      />     
                                                            </div>
                );
                
              case 'video':
                // Standard YouTube aspect ratio is 16:9
                const videoWidth = 320;
                const videoHeight = 180;
                
                return (
                  <div 
                    key={element.id}
                    {...commonProps}
                    className={`${commonProps.className} overflow-visible`}
                    style={{
                      ...commonProps.style,
                      width: `${videoWidth}px`,
                      height: `${(videoHeight + 40)}px`
                    }}
                  >
                    {deleteButton}
                    {connectionDot}

                    <div className="rounded-lg hover:shadow-sm overflow-hidden w-full h-full">
                      <div 
                        className="bg-red-100 text-red-600" 
                        style={{ 
                          padding: `8px 10px`,
                          fontSize: `12px`,
                          height: `40px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          overflow: 'hidden'
                        }}
                      >
                        <div className="overflow-hidden text-overflow-ellipsis whitespace-nowrap flex-1">
                          {element.title}
                        </div>
                        {/* Transcription status indicator */}
                        {element.transcriptStatus === 'completed' && (
                          <div className="ml-2 flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" title={t('viralChat.transcribed')} />
                        )}
                        {element.transcriptStatus === 'failed' && (
                          <div className="ml-2 flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" title={t('viralChat.transcriptionFailed')} />
                        )}
                        {element.transcriptStatus === 'pending' && (
                          <div className="ml-2 flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title={t('viralChat.transcribing')} />
                        )}
                      </div>
                        {transcribingVideos.has(element.id) && (
                        <div className="text-gray-500 flex items-center justify-center w-full bg-gray-200 animate-pulse object-cover" 
                        style={{
                          height: `${videoHeight}px`,
                        }}
                        >
                          Transcribing...
                        </div>
                      )}
                      {!transcribingVideos.has(element.id) && (
                      <img 
                        src={element.thumbnailUrl} 
                        alt={element.title}
                        className="w-full pointer-events-none object-cover bg-black "
                        style={{
                          height: `${videoHeight}px`
                        }}
                        draggable={false}
                      />
                      )}
                    </div>
                
                  </div>
                );
                
              case 'document':
                return (
                  <div 
                    key={element.id}
                    {...commonProps}
                    className={`${commonProps.className} bg-white border-2 border-gray-400 rounded hover:shadow-sm p-4`}
                    style={{
                      ...commonProps.style,
                      width: `200px`,
                      maxWidth: `300px`,
                      fontSize: `12px`
                    }}
                  >
                    {deleteButton}
                    {connectionDot}
                    <div className="font-semibold text-gray-700 mb-2">{element.title}</div>
                    <div className="text-xs text-gray-500 break-words">{element.text}</div>
                  </div>
                );
                
              default:
                return null;
            }
          })}
          
          {/* Chat button is now in the toolbar */}
        </div>
      </div>
      
      {/* Save Dialog */}
      {showSaveDialog && (
       <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
       <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-xl mx-4 p-6 my-8 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{t('viralChat.saveWhiteboard')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('viralChat.name')}
              </label>
              <input
                type="text"
                value={whiteboardName}
                onChange={(e) => setWhiteboardName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder={t('viralChat.enterWhiteboardName')}
                autoFocus
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('viralChat.description')} <span className="text-xs text-gray-500">({t('common.optional')})</span>
              </label>
              <textarea
                value={whiteboardDescription}
                onChange={(e) => setWhiteboardDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                placeholder={t('viralChat.describeWhiteboard')}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              {!mustChooseWhiteboard && (
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    pendingActionRef.current = null;
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                onClick={async (e) => {
                  e.target.disabled = true;
                  try {
                    await saveWhiteboardToServer();
                  } finally {
                    e.target.disabled = false;
                  }
                }}
                className={`px-4 py-2 text-white rounded-md ${
                  !whiteboardName.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={!whiteboardName.trim()}
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
       <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-xl mx-4 p-6 my-8 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{t('viralChat.shareWhiteboard')}</h2>
            
            {!currentWhiteboardId ? (
              <div className="mb-6 text-center">
                <p className="text-red-500 mb-4">{t('viralChat.pleaseSaveWhiteboardFirst')}</p>
                <button
                  onClick={() => {
                    setShowShareDialog(false);
                    setShowSaveDialog(true);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {t('viralChat.saveNow')}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('viralChat.shareLink')}
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        showNotification(t('viralChat.linkCopied'));
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      {t('common.copy')}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{t('viralChat.makePublic')}</span>
                  </label>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('viralChat.shareWithSpecificUser')}
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={t('viralChat.enterEmailAddress')}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowShareDialog(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={shareWhiteboard}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    {t('common.share')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Unsaved Changes Dialog */}
      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 my-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('viralChat.unsavedChanges')}</h2>
            
            <p className="text-gray-600 mb-6">
              {t('viralChat.unsavedChangesMessage')}
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={saveAndProceed}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {t('viralChat.saveAndContinue')}
              </button>
              
              <button
                onClick={discardAndProceed}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                {t('viralChat.discardChanges')}
              </button>
              
              <button
                onClick={() => {
                  setShowUnsavedChangesDialog(false);
                  pendingActionRef.current = null;
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Whiteboards List */}
      {showWhiteboardsList && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50 overflow-y-auto p-4">
       <div className="bg-gray-100/90 rounded-lg shadow-xl w-full max-w-xl mx-4 p-6 my-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {mustChooseWhiteboard && (
                  <button
                    onClick={handleReturnToAiStudio}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-xl font-semibold">
                  {mustChooseWhiteboard ? t('viralChat.chooseWhiteboardToContinue') : t('viralChat.myWhiteboards')}
                </h2>
              </div>
              {!mustChooseWhiteboard && (
                <button
                  onClick={() => setShowWhiteboardsList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <button
                onClick={createNewWhiteboard}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                {t('viralChat.createNewWhiteboard')}
              </button>
            </div>
            
            {whiteboards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('viralChat.noSavedWhiteboards')}</p>
                <p className="mt-2">{t('viralChat.createNewToGetStarted')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {whiteboards.map((whiteboard) => (
                  <div 
                    key={whiteboard.id}
                    onClick={() => loadWhiteboardFromServer(whiteboard.id)}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{whiteboard.name}</h3>
                      {whiteboard.description && (
                        <p className="text-sm text-gray-500 truncate">{whiteboard.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(whiteboard.updated_at).toLocaleString()}
                        {whiteboard.is_shared && <span className="ml-2 text-blue-500">({t('viralChat.shared')})</span>}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                    
                      {!whiteboard.is_shared && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWhiteboard(whiteboard.id);
                          }}
                          className="px-3 py-1 text-gray-500 text-sm rounded hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Button - Fixed at bottom right */}
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Component */}
      <ChatComponent isOpen={showChat} onClose={closeChat} whiteboardName={whiteboardName} />
      
    </div>
  );
}