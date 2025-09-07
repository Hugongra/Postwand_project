import { useEffect } from "react";
import { Button } from "../../../ui/button";
import { X } from "lucide-react";

import { IoCloudUploadOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const VideoUploader = (
    {
        post,
        videoInputRef,
        handleVideoChange,
        resetVideoInput
    }
) => {
    const { t } = useTranslation();
        // Add useEffect to check localStorage on component mount
    useEffect(() => {
        // Check if we have a stored video URL that isn't already in the post state
        const storedVideoUrl = localStorage.getItem('videoUrl');
        if (storedVideoUrl && !post.videoUrl) {
            // If we found a video URL in localStorage but it's not in our component state,
            // we need to inform the parent component to update its state
            if (typeof handleVideoChange === 'function') {
                // Create a synthetic event object with a target.files array-like object
                const syntheticEvent = {
                    target: {
                        files: {
                            0: new File([], "restored-video", { type: "video/mp4" }),
                            length: 1
                        }
                    }
                };
                
                // Call handleVideoChange with our synthetic event
                // The parent component will update post.videoUrl with the stored URL
                handleVideoChange(syntheticEvent, storedVideoUrl);
            }
        }
    }, []);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
               
            </div>
            <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                    {!post.videoUrl && (
                        <div className="flex flex-col items-center text-gray-400 hover:text-gray-500 text-sm transition-all duration-300">
                         
                          <IoCloudUploadOutline className="w-6 h-6" />
                          {t('social.chooseVideo')}
                        </div>

                    )}
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                        key={post.video ? post.video.name : 'video-input'}
                    />
                </label>
                {post.videoUrl && (
                    <div className="relative w-full h-full flex justify-center items-center">
                        <div className="relative">
                            <button
                                type="button"
                                className="absolute top-2 right-2 bg-white/80 rounded-full p-0.5 text-black hover:text-red-600 z-10"
                                onClick={resetVideoInput}
                            >
                                <X size={16} />
                            </button>
                            <video
                                src={post.videoUrl}
                                controls
                                className="max-h-[100px] max-w-full object-contain rounded-lg opacity-80"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VideoUploader;