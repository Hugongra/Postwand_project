import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import InstagramIcon from '/SM_icons/instagram.svg';
import FacebookIcon from '/SM_icons/facebook.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import { Trash2, MessageCircle, EyeOff } from 'lucide-react';
const MessageItem = ({ message, onReply, onDelete, facebookData, instagramData, threadsData }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        
        setIsSubmitting(true);
        try {
            const success = await onReply(replyText);
            if (success) {
                setReplyText('');
                setIsReplying(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Format timestamp to relative time
    const formattedTime = message.timestamp ? 
        formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : 
        'Unknown time';
    
    // Get post information based on platform
    const getPostInfo = () => {
        if (message.platform === 'instagram') {
            return {
                accountName: instagramData?.accounts?.find(account => account.account_id === message.account_id)?.name || 'Unknown Account',
                mediaType: message.metadata?.media?.media_type || 'Post',
                mediaUrl: message.metadata?.media?.media_url || '',
                permalink: message.metadata?.media?.permalink || '#',
                content: message.metadata?.media?.caption || ''
            };
        } else if (message.platform === 'facebook') {
            return {
                accountName: facebookData?.pages?.find(page => page.page_id === message.account_id)?.name || 'Unknown Page',
                mediaType: message.metadata?.post?.type || 'Post',
                mediaUrl: message.metadata?.post?.full_picture || '',
                permalink: message.metadata?.post?.permalink_url || message.permalink || '#',
                content: message.metadata?.post?.content || ''
            };
        } else if (message.platform === 'threads') {
            return {
                accountName: threadsData?.accounts?.find(account => account.account_id === message.account_id)?.name || 'Unknown Account',
                mediaType: message.metadata?.post?.type || 'Post',
                mediaUrl: message.metadata?.post?.full_picture || '',
                permalink: message.metadata?.post?.permalink_url || message.permalink || '#',
                content: message.metadata?.post?.content || ''
            };
        }
        return {
            accountName: 'Unknown',
            mediaType: 'Post',
            mediaUrl: '',
            permalink: '#'
        };
    };
    
    const postInfo = getPostInfo();
    
    // Determine if this is a reply to another comment
    const isReply = message.is_reply || message.parent_id;
    
    // Style based on platform
    const getPlatformStyle = () => {
        switch(message.platform) {
            case 'facebook':
                return 'border-blue-500';
            case 'instagram':
                return 'border-pink-500';
            case 'threads':
                return 'border-black';
            default:
                return 'border-gray-300';
        }
    };
    
    // Platform icon based on message platform
    const getPlatformIcon = (platform) => {
        switch(platform) {
            case 'facebook':
                return <img src={FacebookIcon} alt="Facebook" className="w-6 h-6" />
            case 'instagram':
                    return <img src={InstagramIcon} alt="Instagram" className="w-6 h-6" />
            case 'threads':
                return <img src={ThreadsIcon} alt="Threads" className="w-6 h-6"/>
            default:
                return '';
        }
    };
    
    // Toggle expanded view
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    
    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${getPlatformStyle()} ${isReply ? 'ml-8' : ''}`}>
            {/* Header with Author and Time */}
            <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={toggleExpanded}>
                <div className="flex items-center gap-3">
                    {/* Avatar Circle Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                    
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">{message.author}</span>
                            <span className="text-gray-500 text-sm">@{message.author.replace(/\s+/g, '').toLowerCase()}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            {postInfo.accountName}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formattedTime}</span>
                    {/* Platform Icon */}
                    <div className="text-gray-600">
                        {getPlatformIcon(message.platform)}
                    </div>
                </div>
            </div>
            
            {/* Message Content */}
            <div className="mb-3">
                <p className="mb-2 cursor-pointer" onClick={toggleExpanded}>{message.content}</p>
                
                {/* Original post content - only show when expanded */}
                {isExpanded && message.metadata?.post?.content && (
                    <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Original Post:</div>
                        <p className="text-sm text-gray-700">{postInfo.content}</p>
                    </div>
                )}
                
                {/* If there's media attached (image or video) - only show when expanded */}
                {isExpanded && postInfo.mediaUrl && (
                    <div className="rounded-md overflow-hidden border border-gray-200 mt-2">
                        {postInfo.mediaType === 'VIDEO' ? (
                            <video 
                                src={postInfo.mediaUrl} 
                                controls
                                className="w-full max-h-80 object-contain"
                            />
                        ) : (
                            <img 
                                src={postInfo.mediaUrl} 
                                alt="Post media" 
                                className="w-full max-h-80 object-cover"
                            />
                        )}
                    </div>
                )}
                
                {/* Additional post details - only show when expanded */}
                {isExpanded && postInfo.permalink && (
                    <div className="mt-2">
                        <a 
                            href={postInfo.permalink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 text-sm hover:underline"
                        >
                            View original post
                        </a>
                    </div>
                )}
            </div>
            
            {/* Engagement Stats and Actions */}
            <div className="flex flex-wrap items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span>{message.likes || 0} likes</span>
                    </div>
                    
                    {message.metadata?.comment_count > 0 && (
                        <span>{message.metadata.comment_count} replies</span>
                    )}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-4">
                    <button 
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Reply
                    </button>
                    
                    {/* For Instagram messages or Facebook messages that can be removed */}
                    
                        <button 
                            onClick={() => onDelete()}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                 
                    
                    {/* For Facebook messages that can be hidden but not removed */}
                    {message.platform === 'facebook' && message.can_hide && !message.can_remove && (
                        <button 
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium"
                        >
                            <EyeOff className="w-4 h-4" />
                            Hide
                        </button>
                    )}
                </div>
            </div>
            
            {/* Reply Form */}
            {isReplying && (
                <form onSubmit={handleSubmit} className="mt-4 border-t pt-3">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-2 bg-white border rounded resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Write your reply..."
                        rows="2"
                        disabled={isSubmitting}
                        required
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setIsReplying(false)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Sending...' : 'Reply'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default MessageItem; 