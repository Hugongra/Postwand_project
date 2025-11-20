import { Button } from "@components/ui/button";
import { Image } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import * as api from '@services/api/api';
import { X } from "lucide-react";

const ImageUploader = ({
    images = [],
    onImagesChange,
    imageInputRef,
    maxImages,
    showLibraryButton = true,
    className = ""
}) => {
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
        const response = await api.getImages();
        if (!response.ok) return;
        setLibraryImages(response.data.images || []);
        setIsLoadingLibrary(false);
    };  
    
    // Handle file uploads
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = [...images, ...files];
        
        // Respect max images limit if provided
        if (maxImages && newImages.length > maxImages) {
            onImagesChange(newImages.slice(0, maxImages));
        } else {
            onImagesChange(newImages);
        }
    };

    const selectFromLibrary = (image) => {
        const newImages = [...images, image.url];
        
        if (maxImages && newImages.length > maxImages) {
            onImagesChange(newImages.slice(0, maxImages));
        } else {
            onImagesChange(newImages);
        }
        setLibraryOpen(false);
    };

    const removeImage = (indexToRemove) => {
        onImagesChange(images.filter((_, index) => index !== indexToRemove));
    };

    // Helper to get preview URL for an image (File or URL string)
    const getPreviewUrl = (image) => {
        if (typeof image === 'string') return image;
        return URL.createObjectURL(image);
    };
    
    return (  
        <div className={className}>     
            {showLibraryButton && (
                <div className="flex items-center space-x-2 mb-2">
                    <button
                        type="button"
                        onClick={() => setLibraryOpen(true)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg w-24 text-sm bg-white border border-gray-200 shadow-none hover:shadow-sm text-gray-800 font-normal"
                    >
                        <Image className="w-6 h-6 text-black" />
                        <span className="text-black">
                            {t('social.selectFromLibrary')}
                        </span>
                    </button>
                </div>
            )}
           
            <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                    {!images.length && (
                        <div className="flex flex-col items-center text-gray-400 hover:text-gray-500 text-sm transition-all duration-300">
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
                        key={images.length || 'image-input'}
                    />
                </label>
                {images.length > 0 ? (
                    <div className="relative w-full h-full flex justify-center items-center">
                        <div className="relative flex gap-1 overflow-x-auto max-w-full">
                            {images.map((image, index) => (
                                <div key={index} className="relative flex-shrink-0">
                                    <img
                                        src={getPreviewUrl(image)}
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
                            {/* Add more images button - only show if not at max */}
                            {(!maxImages || images.length < maxImages) && (
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
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Image Library Modal */}
            {libraryOpen && (
                <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
                        <div className="p-2 flex justify-between items-center">
                            <h2 className="text-xl font-medium p-2">{t('social.selectImageFromLibrary')}</h2>
                            <Button 
                                variant="ghost" 
                                onClick={() => setLibraryOpen(false)}
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
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {libraryImages.map(image => (
                                        <div 
                                            key={image.id}
                                            className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                                            onClick={() => selectFromLibrary(image)}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.prompt || 'Library image'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 flex justify-end">
                        <Button
                    onClick={() => setSelectedImage(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Close
                  </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImageUploader;