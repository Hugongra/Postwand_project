import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { useTranslation } from "react-i18next";

const TextArea = ({
    textareaRef,
    isGenerating,
    getCurrentContent,
    handleContentChange,
    isAllTextPlatforms,
    textareaPlatform,

    handleEmojiSelect
}) => {
    const { t } = useTranslation();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    return (
        <>
          
        <Textarea
        ref={textareaRef}
        value={isGenerating ? 'Processing...' :
               getCurrentContent()}
        onChange={handleContentChange}
        placeholder={
          isAllTextPlatforms 
            ? t('social.postPlaceholderAll', 'Write content for all platforms...')
            : t('social.postPlaceholderPlatform', 'Write content for {{platform}}...', { platform: textareaPlatform })
        }
        className={`bg-white h-64 resize-none border rounded-lg p-3 w-full focus:ring-1 focus:ring-gray-200 text-sm ${
          (isGenerating) ? "cursor-default opacity-80" : ""
        } ${isGenerating ? 'animate-pulse' : ''}`}
        disabled={isGenerating}
        style={{ cursor: (isGenerating) ? 'default' : 'text' }}
      />
      
      {/* Buttons at the bottom of the text area */}
      <div className="absolute bottom-3 right-3 flex space-x-2">
    
        {/* Emoji Button */}
        <Button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 bg-transparent hover:bg-gray-100 rounded-full"
            disabled={isGenerating}
        >
          <Smile className="w-5 h-5 text-gray-500 hover:text-pink-500" />
        </Button>
      </div>
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute z-10 bottom-12 right-0">
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </>
    )
}

export default TextArea;