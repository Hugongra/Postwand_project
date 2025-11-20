import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VideoUploader from '../../../components/uploaders/VideoUploader';
import { useState } from 'react';
import ImageUploader from '../../../components/uploaders/ImageUploader';
const CreateVideo = () => {
    const [imageInputRef, setImageInputRef] = useState(null);
    const [imagePost, setImagePost] = useState({
        images: [],
    });
    const [model, setModel] = useState('kling');
    const [resolution, setResolution] = useState('720p');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState('4');
    const [prompt, setPrompt] = useState('');

    return (
        <div className="flex h-screen">
            <div className="w-[50%] py-4 px-2">
                <div className="w-full h-full bg-white rounded-lg relative p-4 space-y-3">
                    <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="w-28">
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="w-28">
                            <SelectItem value="kling">Kling</SelectItem>
                            <SelectItem value="sora">Sora</SelectItem>
                            <SelectItem value="veo">Veo</SelectItem>
                        </SelectContent>
                    </Select>

                    <ImageUploader 
                        imageInputRef={imageInputRef}
                        setPost={setImagePost}
                        post={imagePost}
                    />

                    <textarea
                        placeholder="Enter a prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm resize-none"
                     
                    />
                    <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Select resolution" />
                        </SelectTrigger>
                        <SelectContent className="w-28">
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent className="w-28">
                            <SelectItem value="16:9">16:9</SelectItem>
                            <SelectItem value="9:16">9:16</SelectItem>
                            <SelectItem value="1:1">1:1</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="w-28" >
                            <SelectItem value="4">4 seconds</SelectItem>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="8">8 seconds</SelectItem>
                        </SelectContent>
                    </Select>

                </div>
            </div>
            <div className="w-[50%] p-2">
                <div className="w-full h-full relative flex justify-center items-center">
                    <video src="https://www.youtube.com/shorts/JFUpG84xblM" 
                    controls 
                    className="w-[90%] h-auto object-cover bg-gray-100 rounded-lg shadow-lg" 
                    autoPlay
                    muted
                    loop
                    
                    />
                </div>
            </div>
        </div>
    );
};

export default CreateVideo;