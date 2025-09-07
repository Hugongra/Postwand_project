import React from "react";

import ImageUploader from "./uploaders/ImageUploader";
import VideoUploader from "./uploaders/VideoUploader";
import PostType from "./PostType";
import { useTranslation } from "react-i18next";

const Platform = ({ 
    selectedPages, 
    setSelectedPages, 
    selectedPlatforms,
    imageInputRef,
    videoInputRef,
    post,
    handleImageChange,
    resetImageInput,
    handleVideoChange,
    resetVideoInput,
    setPost,
    postType
}) => {

    const { t } = useTranslation();
    // Don't show media upload section for text posts
    if (postType === 'text') {
        return (
            <>
                {/* Show post types based on uploaded media */}
                <PostType 
                    selectedPlatforms={selectedPlatforms}
                    selectedPages={selectedPages}
                    setSelectedPages={setSelectedPages}
                    post={post}
                    postType={postType}
                />
            </>
        );
    }

    return (
        <>
        <div className="text-md font-medium text-gray-700 mt-10">{t('social.uploadMedia')}</div>
            <div className="w-full">
               
                {/* Show ImageUploader only for image posts */}
                {postType === 'image' && (
                    <ImageUploader
                        imageInputRef={imageInputRef}
                        post={post}
                        handleImageChange={handleImageChange}
                        resetImageInput={resetImageInput}
                        setPost={setPost}
                    />
                )}
                
                {/* Show VideoUploader only for video posts */}
                {postType === 'video' && (
                    <VideoUploader
                        videoInputRef={videoInputRef}
                        post={post}
                        handleVideoChange={handleVideoChange}
                        resetVideoInput={resetVideoInput}
                    />
                )}
            </div>

            {/* Show post types based on uploaded media */}
            <PostType 
                selectedPlatforms={selectedPlatforms}
                selectedPages={selectedPages}
                setSelectedPages={setSelectedPages}
                post={post}
                postType={postType}
            />
        </>
    );
};

export default Platform;
