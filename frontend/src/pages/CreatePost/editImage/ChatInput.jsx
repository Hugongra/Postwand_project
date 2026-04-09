import { useState, useRef } from 'react';
import { Wand2, Pencil, Banana, Upload, ArrowUp, Loader2 } from 'lucide-react';
import { SiOpenai } from "react-icons/si";
import fluxLogo from '/images/flux_logo.svg';
import { useTranslations } from '@services/translator/useTranslations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const FluxIcon = ({ size }) => ( 
<img src={fluxLogo} alt="Flux" width={size} height={size} />
);

// Reusable aspect ratio icon component
const AspectRatioIcon = ({ width, height, size = 15 }) => {
  const viewBox = 15;
  const x = (viewBox - width) / 2;
  const y = (viewBox - height) / 2;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={x} y={y} width={width} height={height} stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
    </svg>
  );
};

const SquareIcon = ({ size }) => <AspectRatioIcon width={11} height={11} size={size} />;
const PortraitIcon = ({ size }) => <AspectRatioIcon width={8} height={12} size={size} />;
const StoryIcon = ({ size }) => <AspectRatioIcon width={6} height={14} size={size} />;

const CHAT_MODEL = [
{
value: 'openai',
icon: SiOpenai,
label: 'OpenAI'
}
];

const ASPECT_RATIOS = [
{
value: '1:1',
icon: SquareIcon,
label: '1:1 Square'
},
{
value: '4:5',
icon: PortraitIcon,
label: '4:5 Portrait'
},
{
value: '9:16',
icon: StoryIcon,
label: '9:16 Story'
}
];

const ChatInput = ({
mode = 'edit', 
onGenerateAd,
onEditImage,
onGenerateImage,
isGenerating,
onImageUpload,
selectedImage,
uploadedImageFile
}) => {
const [chatModel, setChatModel] = useState('openai');
const [input, setInput] = useState('');
const { t } = useTranslations();
const fileInputRef = useRef(null);
const textareaRef = useRef(null);
const [aspectRatio, setAspectRatio] = useState('1:1');
const handleSubmit = async () => {
if (!input.trim() || isGenerating) return;

const prompt = input.trim();

if (mode === 'ad') {
  if (!uploadedImageFile) {
    alert('Please upload an image first');
    return;
  }
  await onGenerateAd(uploadedImageFile, prompt, aspectRatio);
  setInput('');
} else if (mode === 'create') {
  await onGenerateImage(chatModel, prompt, aspectRatio);
  setInput('');
} else if (mode === 'edit') {
  if (!selectedImage) {
    alert('Please select an image to edit');
    return;
  }
  await onEditImage(chatModel, uploadedImageFile, selectedImage, prompt);
  setInput('');
}

};

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (file && onImageUpload) {
    onImageUpload(file);
  }

  e.target.value = null;
};


const handleKeyDown = (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
handleSubmit();
}
};

return ( <div className="shrink-0 bg-primary pb-3"> <div className="max-w-3xl mx-auto relative">
<textarea
ref={textareaRef}
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={handleKeyDown}
className="w-full text-sm min-h-[112px] max-h-[300px] p-4 pr-24 shadow-lg bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
placeholder={mode === 'create' ? 'Describe the image you want to create...' : 'Describe how to edit the image...'}
/>


    <div className="absolute inset-x-0 bottom-0 h-11 bg-white pointer-events-none rounded-b-2xl">
      <div className="flex items-center space-x-2 pointer-events-auto px-3">
        {(mode === 'edit' || mode === 'create') && (
        <Select value={chatModel} onValueChange={setChatModel}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHAT_MODEL.map((model) => {
              const IconComponent = model.icon;
              return (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center space-x-2">
                    <IconComponent size={15} />
                    <span>{model.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        )}
        
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((ratio) => {
              const IconComponent = ratio.icon;
              return (
                <SelectItem key={ratio.value} value={ratio.value}>
                  <div className="flex items-center space-x-2">
                    <IconComponent size={15} />
                    <span>{ratio.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Upload button — only in edit mode */}
      {mode === 'edit' && (
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute right-14 bottom-3 text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-lg transition-colors pointer-events-auto"
        title={t('createPost.uploadImage')}
      >
        <Upload size={18} />
      </button>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isGenerating}
        className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-lg p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
      >
        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
      </button>
    </div>

    {/* Hidden file input */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileUpload}
      className="hidden"
    />
  </div>
</div>


);
};

export default ChatInput;
