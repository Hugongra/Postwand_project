import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Download, Ellipsis, Upload, Pencil, Type, Send, Loader2, X } from 'lucide-react';
import ImagesSkeletonLoader from '@components/skeletons/ImagesSkeletonLoader';
import { useTranslations } from '@services/translator/useTranslations';
import Header from '@components/header';
import { useNavigate } from 'react-router-dom';
import * as api from '@services/api/api';

const ImageLibrary = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSavedImages();
  }, []);

  const fetchSavedImages = async () => {
    setIsLoading(true);
    const response = await api.getImages();
    if (response.ok) {
      setImages(response.data.images || []);
    }
    setIsLoading(false);
  };

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      const response = await api.UploadImage(file);
      if (response.ok && response.data.success) {
        setImages(prev => [{
          name: response.data.path?.split('/').pop() || file.name,
          url: response.data.image_url,
          path: response.data.path,
          type: 'image'
        }, ...prev]);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    const response = await api.DeleteImage(imageToDelete.name);
    if (response.ok) {
      setImages(images.filter(img => img.name !== imageToDelete.name));
      if (selectedImage?.name === imageToDelete.name) setSelectedImage(null);
    }
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

  const toggleMenu = (e, imageName) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === imageName ? null : imageName);
  };

  const handleUseInPost = (image) => {
    navigate('/scheduler', { state: { preloadedImage: image.url } });
  };

  const handleCreateCaption = (image) => {
    navigate('/create-text', { state: { attachedImage: image.url } });
  };

  const handleEditImage = (image) => {
    navigate('/edit-image', { state: { editImageUrl: image.url } });
  };

  const handleDownload = async (e, image) => {
    e.stopPropagation();
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = image.name || 'image';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(image.url, '_blank');
    }
    setMenuOpen(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowDeleteConfirm(false);
      setSelectedImage(null);
    }
  };

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
        <Header title={t('imageLibrary.title')} />

        {/* Action bar */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 text-sm border px-4 py-2 rounded-lg brand-button"
          >
            {isUploading
              ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
              : <><Upload size={16} /> Upload Images</>
            }
          </button>
          <button
            onClick={() => navigate('/edit-image?openImageGeneration=true')}
            className="flex items-center gap-1.5 text-sm border px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Pencil size={16} /> {t('imageLibrary.generateImages')}
          </button>
        </div>

        {isLoading ? (
          <ImagesSkeletonLoader />
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2 text-lg font-medium">{t('imageLibrary.noImagesYet')}</p>
            <p className="text-gray-400 text-sm mb-6">Upload images or create them with AI</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm border px-5 py-2.5 rounded-lg brand-button"
            >
              <Upload size={16} /> Upload your first image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {images.map(image => (
              <div
                key={image.name}
                className="overflow-hidden bg-transparent rounded-lg"
                onClick={() => setSelectedImage(image)}
              >
                <div
                  className="aspect-square relative group bg-gray-200/80 rounded-lg cursor-pointer"
                  onMouseLeave={() => setMenuOpen(null)}
                >
                  <img
                    src={image.url}
                    alt={image.name || 'Saved image'}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                    style={{ display: 'none' }}
                    onLoad={(e) => (e.target.style.display = 'block')}
                  />

                  {/* Three dots menu */}
                  <div
                    ref={menuOpen === image.name ? menuRef : null}
                    className="absolute top-2 right-2 cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => toggleMenu(e, image.name)}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-white hover:text-black">
                      <Ellipsis size={18} className="font-bold" />
                    </div>

                    {menuOpen === image.name && (
                      <div className="p-1 absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border z-20">
                        <div
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 flex items-center rounded-md cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleUseInPost(image); }}
                        >
                          <Send size={14} className="mr-2" /> Use in Post
                        </div>
                        <div
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 flex items-center rounded-md cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleCreateCaption(image); }}
                        >
                          <Type size={14} className="mr-2" /> Create Caption
                        </div>
                        <div
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 flex items-center rounded-md cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleEditImage(image); }}
                        >
                          <Pencil size={14} className="mr-2" /> Edit Image
                        </div>
                        <div
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 flex items-center rounded-md cursor-pointer"
                          onClick={(e) => handleDownload(e, image)}
                        >
                          <Download size={14} className="mr-2" /> Download
                        </div>
                        <hr className="my-1 border-gray-100" />
                        <div
                          className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center rounded-md cursor-pointer"
                          onClick={(e) => handleDeleteClick(e, image)}
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover overlay with quick actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-center opacity-0 group-hover:opacity-100 rounded-lg pb-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUseInPost(image); }}
                        className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full hover:bg-white transition-colors font-medium"
                      >
                        <Send size={12} className="inline mr-1" /> Post
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateCaption(image); }}
                        className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full hover:bg-white transition-colors font-medium"
                      >
                        <Type size={12} className="inline mr-1" /> Caption
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image detail modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-white rounded-xl max-w-4xl max-h-[95vh] flex flex-col relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="overflow-hidden flex justify-center items-center p-2">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name || 'Selected image'}
                  className="max-h-[calc(95vh-140px)] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUseInPost(selectedImage)}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" /> Use in Post
                  </Button>
                  <Button
                    onClick={() => handleCreateCaption(selectedImage)}
                    variant="outline"
                    size="sm"
                  >
                    <Type className="h-4 w-4 mr-1" /> Create Caption
                  </Button>
                  <Button
                    onClick={() => handleEditImage(selectedImage)}
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => handleDownload(e, selectedImage)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteClick(e, selectedImage)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:border-red-300"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && imageToDelete && (
          <div
            className="fixed inset-0 bg-gray-400/30 backdrop-blur-[3px] flex items-center justify-center z-50"
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
