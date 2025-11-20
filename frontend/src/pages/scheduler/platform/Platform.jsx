import React from "react";

import ImageUploader from "../../../components/uploaders/ImageUploader";
import VideoUploader from "../../../components/uploaders/VideoUploader";
import PostType from "./PostType";
import { useTranslation } from "react-i18next";

const Platform = ({ 
    selectedAccounts, 
    setSelectedAccounts,
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
    
    return (
        <>
        
            <div className="w-full">
            
                {postType === 'image' && (
                    <>
                    <div className="text-md font-medium text-gray-700 mt-10 mb-2">{t('social.uploadMedia')}</div>    
                    <ImageUploader
                        imageInputRef={imageInputRef}
                        post={post}
                        handleImageChange={handleImageChange}
                        resetImageInput={resetImageInput}
                        setPost={setPost}
                    />
                    </>
                )}
                
              
                {postType === 'video' && (
                    <>
                    <div className="text-md font-medium text-gray-700 mt-10 mb-2">{t('social.uploadMedia')}</div>   
                    <VideoUploader
                        videoInputRef={videoInputRef}
                        post={post}
                        handleVideoChange={handleVideoChange}
                        resetVideoInput={resetVideoInput}
                    />
                    </>
                )}  
            </div>

           
            <PostType 
                selectedPlatforms={selectedPlatforms}
                selectedAccounts={selectedAccounts}
                setSelectedAccounts={setSelectedAccounts}
                post={post}
                postType={postType}
            />
        </>
    );
};

export default Platform;
