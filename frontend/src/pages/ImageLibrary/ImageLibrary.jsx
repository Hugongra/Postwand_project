import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Ellipsis } from 'lucide-react';
import ImagesSkeletonLoader from '@components/skeletons/ImagesSkeletonLoader';
import { useTranslations } from '@services/translator/useTranslations';
import Header from '@components/header';
import * as api from '@services/api/api';
const ImageLibrary = () => {
  const { t } = useTranslations();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchSavedImages();
  }, []);

  const fetchSavedImages = async () => {
    setIsLoading(true);
    
      const response = await api.getImages();
      if (!response.ok) return;
      setImages(response.data.images || []);
      setIsLoading(false);
    
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    setIsDeleting(true);
    const response = await api.DeleteImage(imageToDelete.id);
    if (!response.ok) {
      setIsDeleting(false);
      return;
    }
    
    setImages(images.filter(img => img.id !== imageToDelete.id));
    if (selectedImage && selectedImage.id === imageToDelete.id) setSelectedImage(null);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setImageToDelete(null);
  };

  const handleDeleteClick = (e, image) => {
    e.stopPropagation();
    setImageToDelete(image);
    setShowDeleteConfirm(true);
    setMenuOpen(null);
  };

  const toggleMenu = (e, imageId) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === imageId ? null : imageId);
  };

  const handleUseInPost = (image) => {
    window.location.href = `/scheduler?image=${encodeURIComponent(image.url)}`;
  };

  const handleDownload = (e, image) => {
    e.stopPropagation();
    window.open(image.url, '_blank');
    setMenuOpen(null);
  };


  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setShowDeleteConfirm(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(null);
    };

    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen w-full bg-primary">
      <div className="py-2 pr-2 bg-primary w-full mx-auto">
        <Header title={t('imageLibrary.title')} 
        button={t('imageLibrary.generateImages')} 
        onClick={() => {
            window.location.href = '/edit-image?openImageGeneration=true&returnToLibrary=true';
        }}/>
   
        
        {isLoading ? (
          <ImagesSkeletonLoader />
        ) : error ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-black">{t('imageLibrary.errorGettingImages')}</p>
          </div>
        ) : images.length === 0 ? (
          <div className=" p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">{t('imageLibrary.noImagesYet')}</p>
          
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {images.map(image => (
              <Card 
                key={image.id} 
                className="overflow-hidden bg-transparent"
                onClick={() => setSelectedImage(image)}
              >
                <div 
                  className="aspect-square relative group bg-gray-200/80 rounded-lg"
                  onMouseLeave={() => setMenuOpen(null)}
                >
                <img
                      src={image.url}
                      alt={image.prompt || 'Saved image'}
                      className="w-full h-full object-cover bg-gray-200/80 rounded-lg shadow-md"
                      style={{ display: 'none' }}
                      onLoad={(e) => (e.target.style.display = 'block')}
                    />
                  
                  {/* Three dots menu */}
                  <div 
                    ref={menuOpen === image.id ? menuRef : null}
                    className="absolute top-2 right-2 cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => toggleMenu(e, image.id)}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-white hover:text-black">
                      <Ellipsis size={18} className="font-bold" />
                    </div>
                    
                    {menuOpen === image.id && (
                      <div className="p-1 absolute right-0 mt-1 w-26 bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                        <div 
                          className="px-4 py-2 text-sm text-black hover:bg-gray-200 flex items-center rounded-lg"
                          onClick={(e) => handleDownload(e, image)}
                        >
                          <Download size={16} className="mr-2" />
                          Download
                        </div>
                        <div 
                          className="px-4 py-2 text-sm text-black hover:bg-gray-200 flex items-center rounded-lg"
                          onClick={(e) => handleDeleteClick(e, image)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </div>
                      </div>
                    )}
                  </div>

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
                    </div>
                  </div>
                </div>
               
              </Card>
            ))}
          </div>
        )}
        
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="bg-white rounded-lg max-w-4xl max-h-[95vh] flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              
              <div className="overflow-hidden flex justify-center items-center p-2">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt || 'Selected image'} 
                  className="max-h-[calc(95vh-100px)] w-auto object-contain rounded-lg"
                />
              </div>
              
             
              <div className="flex justify-between items-center p-4 border-t">
              
                <Button
                  onClick={() => handleUseInPost(selectedImage)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {t('imageLibrary.useInPost')}
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setSelectedImage(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={(e) => handleDownload(e, selectedImage)}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteClick(e, selectedImage)}
                    variant="outline"
                    className="text-red-500"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && imageToDelete && (
          <div 
            className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
          >
            <div className="bg-white rounded-lg w-[400px] shadow-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Image</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete this image? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteImage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
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