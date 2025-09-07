import React, { useState, useEffect, useRef } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import { Button } from '../ui/button';
import { ImageIcon, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';

// Note: You should uninstall current version and install v4.5.1 or earlier:
// npm uninstall react-filerobot-image-editor
// npm install react-filerobot-image-editor@4.5.1

const ImageEditor = ({ 
  initialImage = null, 
  onSave = () => {}, 
  onCancel = () => {} 
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageSource, setImageSource] = useState(initialImage);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch library images when needed
  useEffect(() => {
    if (libraryOpen) {
      fetchLibraryImages();
    }
  }, [libraryOpen]);

  // Use initial image if provided
  useEffect(() => {
    if (initialImage) {
      setImageSource(initialImage);
      setIsEditorOpen(true);
    }
  }, [initialImage]);

  const fetchLibraryImages = async () => {
    setIsLoadingLibrary(true);
    try {
      const response = await fetch('https://threads-dev.local:5000/api/saved-images', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved images');
      }
      
      const data = await response.json();
      setLibraryImages(data.images || []);
    } catch (error) {
      console.error('Error fetching saved images:', error);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadImage(file);
    }
  };

  // Load image function
  const loadImage = (file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSource(reader.result);
      setIsEditorOpen(true);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Direct save to Supabase without the dialog
  const saveToSupabase = async () => {
    if (!editorInstance) return;
    
    setIsSaving(true);
    setNotification(null);
    
    try {
      // Get the current edited image data
      const imageData = editorInstance.getImageData();
      const imageBase64 = imageData.imageBase64;
      
      // First notify local state with the edited image
      onSave(imageBase64);
      
      // Then save to Supabase through API
      const response = await fetch('https://threads-dev.local:5000/api/save-edited-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          image: imageBase64,
          prompt: 'Edited in Image Editor',
          source: 'editor'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save image to library');
      }

      // Show success notification
      setNotification({ 
        type: 'success', 
        message: 'Image saved successfully to library!' 
      });
      
      // Close the editor after a short delay
      setTimeout(() => {
        setIsEditorOpen(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving image:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Error saving image' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Close the editor
  const handleClose = () => {
    setIsEditorOpen(false);
    if (!imageSource && initialImage) {
      setImageSource(initialImage);
    }
    onCancel();
  };

  // Function to select an image from the library
  const selectFromLibrary = (image) => {
    setIsLoading(true);
    
    // Fetch the full image from the URL
    fetch(image.image_url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          setImageSource(reader.result);
          setIsEditorOpen(true);
          setIsLoading(false);
          setLibraryOpen(false);
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error loading image from library:', error);
        setIsLoading(false);
      });
  };

  return (
    <div className="w-full h-full relative">
      {/* Custom notification */}
      {notification && (
        <div className={`
          fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
          py-3 px-5 rounded-md shadow-lg flex items-center
          ${notification.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'}
        `}>
          {notification.type === 'success' 
            ? <CheckCircle className="w-5 h-5 mr-2" /> 
            : <XCircle className="w-5 h-5 mr-2" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-12 w-12 text-purple-500" />
        </div>
      ) : (
        <>
          {!isEditorOpen ? (
            <div className="w-full flex flex-col items-center justify-center py-12">
              <h1 className="text-2xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                Image Editor
              </h1>
              
              <div className="flex gap-4 mb-6">
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current.click()}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  size="lg"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Browse Files
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLibraryOpen(true)}
                  className="border-pink-200 text-pink-600 hover:bg-purple-50"
                  size="lg"
                >
                  Select from Library
                </Button>
              </div>
              
              {imageSource && (
                <div className="mt-6">
                  <Button
                    onClick={() => setIsEditorOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Edit Previous Image
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[calc(100vh-2rem)] overflow-hidden relative">
              <div className="absolute inset-0 max-w-full">
                <FilerobotImageEditor
                  source={imageSource}
                  onClose={handleClose}
                  annotationsCommon={{
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeWidth: 1,
                  }}
                  Text={{
                    text: 'Your generated title will be here',
                    fontFamily: 'Arial',
                    fontSize: 48,
                    fontStyle: 'bold',
                    align: 'center',
                  }}
                  tabsIds={[
                    TABS.ADJUST,
                    TABS.ANNOTATE,
                    TABS.WATERMARK,
                    TABS.FILTERS,
                    TABS.FINETUNE,
                    TABS.RESIZE,
                  ]}
                  defaultTabId={TABS.ANNOTATE}
                  defaultToolId={TOOLS.TEXT}
                  savingPixelRatio={4}
                  previewPixelRatio={4}
                  closeAfterSave={true}
                  onInitialize={(instance) => {
                    setEditorInstance(instance);
                    
                    // Get canvas dimensions to properly position elements
                    setTimeout(() => {
                      try {
                        // Use the editor's API to directly add annotations
                        const canvas = instance?.getCanvasNode();
                        if (!canvas) {
                          console.error('Canvas not available');
                          return;
                        }
                        
                        const canvasWidth = canvas.width;
                        const canvasHeight = canvas.height;
                        
                        // First, clear any existing annotations
                        instance.clearAll && instance.clearAll();
                        
                        // Add title text at the top center
                        instance.addAnnotation({
                          name: 'title',
                          type: 'text',
                          text: 'YOUR TITLE HERE',
                          position: { 
                            x: canvasWidth / 2, 
                            y: canvasHeight * 0.3 
                          },
                          options: {
                            fontSize: 72,
                            fontFamily: 'Arial',
                            fontWeight: 'bold',
                            fill: '#FFFFFF',
                            stroke: '#000000',
                            strokeWidth: 1,
                            align: 'center',
                            width: canvasWidth * 0.8,
                          }
                        });
                        
                        // Add subtitle below the title
                        instance.addAnnotation({
                          name: 'subtitle',
                          type: 'text',
                          text: 'Your subtitle text here',
                          position: { 
                            x: canvasWidth / 2, 
                            y: canvasHeight * 0.5 
                          },
                          options: {
                            fontSize: 36,
                            fontFamily: 'Arial',
                            fill: '#FFFFFF',
                            stroke: '#000000',
                            strokeWidth: 0.5,
                            align: 'center',
                            width: canvasWidth * 0.8,
                          }
                        });
                        
                        console.log('Added annotations with canvas dimensions', canvasWidth, canvasHeight);
                      } catch (error) {
                        console.error('Failed to add annotations:', error, error.stack);
                      }
                    }, 3000); // Give it more time to fully initialize
                  }}
                  theme={{
                    palette: {
                      'bg-primary': 'rgb(235, 52, 158, 1)',
                      'bg-primary-active': 'rgb(235, 52, 158, 0.3)',
                      'accent-primary': 'rgb(235, 52, 158, 1)',
                    },
                    container: {
                      height: '100%',
                      width: '100%',
                      maxWidth: '100%'
                    }
                  }}
                  config={{
                    canvas: {
                      responsive: true,
                      maxWidth: '100%'
                    },
                    showSaveModal: false,
                    forceToPngInEllipticalCrop: true,
                    showSaveButton: false,
                  }}
                />
              </div>
            </div>
          )}

          {/* Image Library Modal */}
          {libraryOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-medium">Select an Image from Library</h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setLibraryOpen(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                  {isLoadingLibrary ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
                    </div>
                  ) : libraryImages.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <p>No images found in your library.</p>
                      <Button 
                        variant="link"
                        onClick={() => {
                          setLibraryOpen(false);
                          window.location.href = '/ai-studio';
                        }}
                        className="mt-2 text-purple-500"
                      >
                        Generate images in AI Studio
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {libraryImages.map(image => (
                        <div 
                          key={image.id}
                          className="aspect-square rounded-md overflow-hidden border cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                          onClick={() => selectFromLibrary(image)}
                        >
                          <img
                            src={image.image_url}
                            alt={image.prompt || 'Library image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => setLibraryOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Custom save button */}
          <div className="fixed top-20 right-8 z-50">
            <Button 
              onClick={saveToSupabase}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSaving}
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? "Saving..." : "Save to Library"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageEditor;