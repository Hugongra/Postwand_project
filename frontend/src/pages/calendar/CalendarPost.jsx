import { CalendarIcon } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const CalendarPost = ({ post }) => {
  if (!post) return null;

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '/SM_icons/facebook.svg',
      instagram: '/SM_icons/instagram.svg',
      threads: '/SM_icons/threads.svg',
      tiktok: '/SM_icons/tiktok.svg',
      youtube: '/SM_icons/youtube.svg',
      linkedin: '/SM_icons/linkedin.svg',
    };
    return icons[platform?.toLowerCase()] || null;
  };

 const renderMedia = (post, size) => {
    return (
      <div>
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post media" 
          className={`
            ${size === 'small' 
              ?  'w-10 h-10 opacity-90'
              : 'w-24 h-24'
            } 
            ${post.video_url ? 'p-2' : ''}
            object-cover rounded bg-gray-100
          `}
          onError={(e) => {
            e.target.src = post.video_url ? '/images/video.svg' : '/images/no-photos.svg';
          }}
        />
      )}
    </div>
  )
}

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="border p-1 mb-2 shadow-sm flex items-center justify-between bg-white rounded-lg text-xs gap-1">
           
          <div>{renderMedia(post, 'small')}</div>
          <div className="text-gray-600"> {formatTime(post.scheduled_time)}</div>
          <div>
            <img src={getPlatformIcon(post.platform)} 
                 alt={post.platform} 
                 className="w-3.5 h-3.5 mr-1" 
            />
          </div>
        </div>

      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="text-xs space-y-3">
          <div className="flex items-center justify-between">
          <div className="text-gray-600">{formatTime(post.scheduled_time)}</div>
          <div className="bg-green-100/50 text-green-700 py-1 px-3 rounded-full">{post.status}</div>
          </div>

          <div className="flex space-x-2">
            <div>{renderMedia(post, 'big')}</div>
            
            <div>{post.content}</div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CalendarPost;

