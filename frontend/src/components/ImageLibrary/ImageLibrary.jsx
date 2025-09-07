import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Download, Loader2, Plus } from 'lucide-react';
import ImagesSkeletonLoader from "../skeletons/ImagesSkeletonLoader";
import { useTranslations } from '../../hooks/useTranslations';

const ImageLibrary = () => {
  const { t } = useTranslations();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSavedImages();
  }, []);

  const fetchSavedImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://threads-dev.local:5000/api/saved-images`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('imageLibrary.errorGettingImages'));
      }
      
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching saved images:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm(t('imageLibrary.confirmDelete'))) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`https://threads-dev.local:5000/api/saved-images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(t('imageLibrary.failedToDelete'));
      }
      
      // Remove the deleted image from the state
      setImages(images.filter(img => img.id !== imageId));
      
      // If the deleted image was selected, clear the selection
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyToClipboard = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert(t('imageLibrary.urlCopiedToClipboard'));
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert(t('imageLibrary.failedToCopyUrl'));
    }
  };

  const handleUseInPost = (image) => {
    // Navigate to scheduler with the image URL as a parameter
    window.location.href = `/scheduler?image=${encodeURIComponent(image.image_url)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen w-full bg-primary">
      <div className="py-4 px-2 md:pr-2 bg-primary w-full mx-auto">
      <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
                <h1 className="text-3xl font-medium text-pink-500">
                    {t('imageLibrary.title')}
                </h1>
                
                <div className="absolute bottom-2 flex items-center justify-end w-full pr-10 gap-2 ">
                      
                        <button 
                            onClick={() => {
                                // Navigate directly with URL parameters instead of using localStorage
                                window.location.href = '/ai-studio?openImageGeneration=true&returnToLibrary=true';
                            }}
                            className="flex items-center gap-1 brand-button border  px-4 py-1.5 rounded-lg"
                        >
                            <Plus size={20} /> {t('imageLibrary.generateImages')}
                        </button>
               
                </div>
            </div>
        
        {isLoading ? (
          <ImagesSkeletonLoader />
        ) : error ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-black">{t('imageLibrary.errorGettingImages')}</p>
          </div>
        ) : images.length === 0 ? (
          <div className=" p-8 rounded-md text-center">
            <p className="text-gray-600 mb-4">{t('imageLibrary.noImagesYet')}</p>
          
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {images.map(image => (
              <Card 
                key={image.id} 
                className={`overflow-hidden bg-white transition-all duration-200 hover:shadow-md ${
                  selectedImage?.id === image.id ? 'ring-2 ring-pink-500' : ''
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative group">
                  <img 
                    src={image.image_url} 
                    alt={image.prompt || 'Saved image'} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseInPost(image);
                        }}
                        className="bg-pink-500 hover:bg-pink-600 text-white"
                        size="sm"
                      >
{t('imageLibrary.useInPost')}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        variant="outline"
                        className="bg-white text-red-500 hover:bg-red-50"
                        size="sm"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm text-gray-500 mb-1">
                    {formatDate(image.created_at)}
                  </p>
                  {image.prompt && (
                    <p className="text-sm text-black line-clamp-2">
                      {image.prompt}
                    </p>
                  )}
                  <div className="flex mt-2 space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToClipboard(image.image_url);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-pink-500 p-0 h-6 w-6"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.image_url, '_blank');
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-pink-500 p-0 h-6 w-6"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg py-4 px-8 max-w-5xl max-h-[95vh] flex flex-col relative">
              <Button
                onClick={() => setSelectedImage(null)}
                variant="ghost"
                className="absolute top-2 right-2 p-1 h-auto text-black bg-white rounded-full hover:bg-gray-100"
              >
                ✕
              </Button>
              <div className="flex-1 overflow-hidden flex justify-center">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.prompt || 'Selected image'} 
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </div>
              
              {selectedImage.prompt && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-black mb-1">{t('imageLibrary.prompt')}</h3>
                  <p className="text-gray-600">{selectedImage.prompt}</p>
                </div>
              )}
              
              <div className="mt-4 flex justify-between">
                <Button
                  onClick={() => handleUseInPost(selectedImage)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {t('imageLibrary.useInPost')}
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleCopyToClipboard(selectedImage.image_url)}
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
{t('imageLibrary.copyUrl')}
                  </Button>
                  <Button
                    onClick={() => handleDeleteImage(selectedImage.id)}
                    variant="outline"
                    className="text-red-500"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full h-20 bg-primary"></div>
    </div>
  );
};

export default ImageLibrary;