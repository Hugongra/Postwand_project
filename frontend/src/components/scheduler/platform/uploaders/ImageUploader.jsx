import { Cross, X } from "lucide-react";
import { Button } from "../../../ui/button";
import { Trash2 } from "lucide-react";
import { Camera } from "lucide-react";
import { Image } from "lucide-react";
import { API_BASE_URL } from '../../../config_url.js';
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const ImageUploader = (
    {
        post,
        imageInputRef,
        handleImageChange,
        resetImageInput,
        setPost
    }
) => {
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryImages, setLibraryImages] = useState([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const { t } = useTranslation();
    
    // Fetch library images when the modal is opened
    useEffect(() => {
        if (libraryOpen) {
            fetchLibraryImages();
        }
    }, [libraryOpen]);

    const fetchLibraryImages = async () => {
        setIsLoadingLibrary(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/saved-images`, {
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

    const selectFromLibrary = (image) => {
        // Add to existing images
        setPost(prev => ({
            ...prev,
            images: [...(prev.images || []), image.image_url]
        }));
        
        // Close the library modal
        setLibraryOpen(false);
    };

    const removeImage = (indexToRemove) => {
        setPost(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };
    
    return (  
        <div >     
            <div className="mb-2">
            <div className="flex items-center space-x-2 ">
                     
                <Button
                    type="button"
                    onClick={() => setLibraryOpen(true)}
                    className="bg-white border border-gray-200 shadow-none hover:shadow-sm text-gray-800 px-3 font-normal"
                >
                    <Image className="w-4 h-4 mr-1 text-black" />
                    <span className="text-black">
                    {t('social.selectFromLibrary')}
                    </span>
                </Button>
                    </div>
            </div>
            <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                    {post.images?.length === 0 && (
                    <div className="flex flex-col items-center text-gray-400  hover:text-gray-500 text-sm transition-all duration-300">
                       
                        
                       
                          <IoCloudUploadOutline className="w-6 h-6" />
                          {t('social.chooseImage')}
                        
                    </div>
                    )}
                    <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                                            key={post.images?.length || 'image-input'}
                    />
                </label>
                {post.images?.length > 0 ? (
                    <div className="relative w-full h-full flex justify-center items-center">
                        <div className="relative flex gap-1 overflow-x-auto max-w-full">
                            {post.images.map((image, index) => (
                                <div key={index} className="relative flex-shrink-0">
                                    <img
                                        src={image}
                                        alt={`Preview ${index + 1}`}
                                        className="max-h-[80px] max-w-[80px] object-contain rounded-lg opacity-80"
                                        onError={(e) => {
                                            e.target.src = 'no-photos.svg';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-gray-100/50 hover:text-red-600 text-black rounded-full p-0.5 z-10"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {/* Add more images button */}
                            <label className="flex-shrink-0 flex items-center justify-center w-[80px] h-[80px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                                <span className="text-gray-500 text-lg">+</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Image Library Modal */}
            {libraryOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center h-[100vh]">
                    <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-medium">{t('social.selectImageFromLibrary')}</h2>
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
                                    <p>{t('social.noImagesFoundInLibrary')}</p>
                                    <Button 
                                        variant="link"
                                        onClick={() => {
                                            setLibraryOpen(false);
                                            window.location.href = '/ai-studio';
                                        }}
                                        className="mt-2 text-purple-500"
                                    >
                                        {t('social.generateImagesInAIStudio')}
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
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImageUploader;