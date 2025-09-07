import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Calendar, Clock, Ellipsis, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
  import FacebookIcon from '/SM_icons/facebook.svg';
import InstagramIcon from '/SM_icons/instagram.svg';
import LinkedInIcon from '/SM_icons/linkedin.svg';
import ThreadsIcon from '/SM_icons/threads.svg';  

const RecentDrafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [menuOpenForDraft, setMenuOpenForDraft] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDrafts, setSelectedDrafts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load drafts on component mount
  useEffect(() => {
    console.log("Loading drafts from storage");
    try {
      const savedDrafts = localStorage.getItem('savedDrafts');
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        
        // Sort by last modified (newest first)
        parsedDrafts.sort((a, b) => 
          new Date(b.lastModified) - new Date(a.lastModified)
        );
        
        setDrafts(parsedDrafts);
        console.log("Loaded drafts:", parsedDrafts.length);
      }
    } catch (error) {
      console.error("Error loading drafts:", error);
    }
  }, []);

  // Handle continuing a draft
  const handleEditDraft = (draftId) => {
    console.log("Opening draft:", draftId);
    // Navigate to scheduler with draft ID as URL parameter
    navigate(`/scheduler?draftId=${draftId}`);
  };

  // Handle selecting all drafts
  const handleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map(draft => draft.id));
    }
  };

  // Handle selecting individual draft
  const handleSelectDraft = (e, draftId) => {
    e.stopPropagation();
    setSelectedDrafts(prev => 
      prev.includes(draftId) 
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    );
  };

  // Handle deleting selected drafts
  const handleDeleteSelected = () => {
    try {
      const updatedDrafts = drafts.filter(draft => !selectedDrafts.includes(draft.id));
      setDrafts(updatedDrafts);
      localStorage.setItem('savedDrafts', JSON.stringify(updatedDrafts));
      console.log(`${selectedDrafts.length} drafts deleted successfully`);
      setSelectedDrafts([]);
      if (updatedDrafts.length === 0) {
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Error deleting drafts:", error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpenForDraft !== null) {
        setMenuOpenForDraft(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpenForDraft]);

  // Helper to get time ago string
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle image loading error
  const handleImageError = (draftId) => {
    setImageErrors(prev => ({
      ...prev,
      [draftId]: true
    }));
  };

  return (
    <div className="w-full py-4 pr-2 mx-auto bg-primary">
      <div className="h-28 flex flex-col py-4 px-4 mb-1 rounded-lg bg-gray-100/80">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium text-pink-500">
            {t('RecentDrafts.recentDrafts')}
          </h1>
          {drafts.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant={selectionMode ? "secondary" : "outline"}
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedDrafts([]);
                }}
                className="text-sm"
              >
                {selectionMode ? t('RecentDrafts.cancel') : t('RecentDrafts.selectDrafts')}
              </Button>
              
              {selectionMode && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSelectAll}
                    className="text-sm"
                  >
                    {selectedDrafts.length === drafts.length ? t('RecentDrafts.deselectAll') : t('RecentDrafts.selectAll')}
                  </Button>
                  
                  {selectedDrafts.length > 0 && (
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      className="text-sm"
                    >
                      {t('RecentDrafts.deleteSelected')} ({selectedDrafts.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <CardContent>
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          
           
            <button 
              onClick={() => navigate('/scheduler')}
              className="mt-4 brand-button border px-4 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus size={20} /> {t('RecentDrafts.createNewPost')}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 gap-y-10">
            {drafts.map(draft => (
              <div 
                key={draft.id} 
                className={` rounded-lg p-3  bg-transparent h-full flex flex-col relative cursor-pointer group overflow-hidden ${selectedDrafts.includes(draft.id) ? 'ring-2 ring-pink-500' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    handleSelectDraft({ stopPropagation: () => {} }, draft.id);
                  } else {
                    handleEditDraft(draft.id);
                  }
                }}
              >
                {/* Selection checkbox (only visible in selection mode) */}
                {selectionMode && (
                  <div 
                    className="absolute top-2 left-2 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedDrafts.includes(draft.id)}
                      className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectDraft(e, draft.id);
                      }}
                    />
                  </div>
                )}
                
                {/* Semi-transparent overlay on hover */}
                <div className="absolute inset-0 bg-gray-100 opacity-0  transition-opacity pointer-events-none z-0"></div>
                
                {/* Ellipsis Menu - keep on top with higher z-index */}
                <div 
                  className="absolute top-4 right-4 cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenForDraft(menuOpenForDraft === draft.id ? null : draft.id);
                  }}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-300">
                    <Ellipsis size={18} className="text-gray-500 font-bold" />
                  </div>
                  
                  {menuOpenForDraft === draft.id && (
                    <div 
                      className="p-1 absolute right-0 mt-1 w-26 bg-white rounded-md shadow-lg border overflow-hidden z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div 
                        className="px-4 py-2 text-sm text-black hover:bg-gray-200 flex items-center rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedDrafts = drafts.filter(d => d.id !== draft.id);
                          setDrafts(updatedDrafts);
                          localStorage.setItem('savedDrafts', JSON.stringify(updatedDrafts));
                          console.log(`Draft deleted successfully`);
                          setMenuOpenForDraft(null);
                        }}
                      >
                        <Trash2 size={16} className="mr-2" />
                        {t('RecentDrafts.delete')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Square content area */}
                <div className="aspect-square w-full mb-3 relative overflow-hidden bg-gray-200/80 rounded-lg hover:shadow-md transition-shadow">
                  {draft.imagePreview && !imageErrors[draft.id] ? (
                    <img 
                      src={draft.imagePreview} 
                      alt="No Photo" 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(draft.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-gray-700">
                     
                        <img src="/images/no-photos.svg" alt="No Photo" className="w-full h-full object-cover " />
                      
                    </div>
                  )}
                  
                  {/* Platform icons at bottom right */}
                  <div className="absolute bottom-2 right-2 flex space-x-1">
                    {draft.selectedPlatforms?.map(platform => (
                        <span 
                          key={platform} 
                          className="text-xs rounded-full text-gray-700"
                        >
                          {platform === 'facebook' ? <img src={FacebookIcon} alt="Facebook" className="h-6 w-6 flex-shrink-0" /> :
                           platform === 'instagram' ? <img src={InstagramIcon} alt="Instagram" className="h-6 w-6 flex-shrink-0" /> : 
                           platform === 'linkedin' ? <img src={LinkedInIcon} alt="LinkedIn" className="h-6 w-6 flex-shrink-0" /> : 
                           platform === 'threads' ? <img src={ThreadsIcon} alt="Threads" className="h-6 w-6 flex-shrink-0" /> : platform}
                        </span>
                      ))}
                  </div>
                </div>
                
                {/* Description and metadata */}
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-2 text-center">
                    {draft.content ? 
                      draft.content.substring(0, 80) + (draft.content.length > 80 ? '...' : '') : 
                      t('RecentDrafts.untitledDraft')
                    }
                  </h3>
                  
                  
                  
                 
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default RecentDrafts; 