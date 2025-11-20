import { useEffect } from "react";
import { X } from "lucide-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const VideoUploader = (
    {
        post,
        videoInputRef,
        setPost
    }
) => {
    const { t } = useTranslation();
    
    const video = post.media?.[0];

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPost(prev => ({
            ...prev,
            media: [{
                type: 'video',
                file: file,
                url: null
            }]
        }));
    };

    const resetVideoInput = () => {
        setPost(prev => ({
            ...prev,
            media: []
        }));
    };

    const getPreviewUrl = () => {
        if (!video) return null;
        if (video.url) return video.url;
        if (typeof video.file === 'string') return video.file;
        return URL.createObjectURL(video.file);
    };
       

    return (
        <div>
            
            <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors h-[120px] flex flex-col justify-center items-center overflow-hidden group">
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                    {!video && (
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
                    />
                </label>
                {video && (
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
                                src={getPreviewUrl()}
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