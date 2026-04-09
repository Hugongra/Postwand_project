import { Download, Type, Send, BookmarkPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';

const ImageCard = ({ image, index, selectedImage, setSelectedImage, onSaveToLibrary, onCreateCaption, onUseInPost }) => {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const isRemoteUrl = typeof image === 'string' && image.startsWith('http');

    const handleSave = async (e) => {
        e.stopPropagation();
        if (!onSaveToLibrary || saving || saved || !isRemoteUrl) return;
        setSaving(true);
        const ok = await onSaveToLibrary(image);
        setSaving(false);
        if (ok) setSaved(true);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch(image);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `image-${index + 1}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            window.open(image, '_blank');
        }
    };

    return (
        <div
            className={`w-full mb-20 rounded-lg shadow-sm overflow-hidden cursor-pointer group relative
                ${index === 0 ? 'mt-[15vh]' : ''}
                ${selectedImage === image ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedImage(image)}
        >
            <img
                src={image}
                alt={`Generated image ${index + 1}`}
                className="w-full h-auto object-cover bg-gray-200"
                style={{ display: 'none' }}
                onLoad={(e) => (e.target.style.display = 'block')}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            />

            {isRemoteUrl && (
                <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex justify-center gap-1.5">
                        <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2.5 py-1.5 rounded-full hover:bg-white transition-colors font-medium flex items-center gap-1"
                            title="Save to Library"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <BookmarkPlus size={12} />}
                            {saved ? 'Saved' : 'Save'}
                        </button>
                        {onCreateCaption && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onCreateCaption(image); }}
                                className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2.5 py-1.5 rounded-full hover:bg-white transition-colors font-medium flex items-center gap-1"
                                title="Create Caption"
                            >
                                <Type size={12} /> Caption
                            </button>
                        )}
                        {onUseInPost && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onUseInPost(image); }}
                                className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2.5 py-1.5 rounded-full hover:bg-white transition-colors font-medium flex items-center gap-1"
                                title="Use in Post"
                            >
                                <Send size={12} /> Post
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2.5 py-1.5 rounded-full hover:bg-white transition-colors font-medium flex items-center gap-1"
                            title="Download"
                        >
                            <Download size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageCard;
