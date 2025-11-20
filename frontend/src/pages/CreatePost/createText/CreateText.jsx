import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SendChatMessage, GetChatHistory } from '@/services/api/api';
import ActionMenu from '@/components/actionMenu';

const CreateText2 = () => {
  const [posts, setPosts] = useState({
    instagram: '',
    facebook: '',
    threads: '',
    linkedin: ''
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Platform styling helper
const getPlatformStyling = (platform) => {
    const styles = {
      instagram: { postBg: 'bg-gradient-to-r from-purple-200/50 to-pink-100/50' },
      facebook: { postBg: 'bg-gradient-to-r from-blue-400/80 to-blue-200/80' },
      linkedin: { postBg: 'bg-gradient-to-r from-blue-200/80 to-blue-100/50' },
      threads: { postBg: 'bg-gradient-to-r from-gray-200/80 to-gray-100/50' }
    };
    
    return styles[platform?.toLowerCase()] || { postBg: 'bg-gray-100' };
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const loadChatHistory = async () => {
    const response = await GetChatHistory();
    if (response.ok && response.data.success) {
      setChatHistory(response.data.history || []);
    }
  };

  const handleSendMessage = async (message, mode) => {
    setIsLoading(true);
    
    const platforms = mode === 'write_post' 
      ? ['instagram', 'facebook', 'threads', 'linkedin'] 
      : [];

    const response = await SendChatMessage(message, mode, platforms);
    
    if (response.ok) {
      if (mode === 'write_post' && response.data.structured_content) {
        const newPosts = { ...posts };
        response.data.structured_content.posts.forEach(post => {
          const platform = post.platform.toLowerCase();
          newPosts[platform] = post.content_with_hashtags;
        });
        setPosts(newPosts);
      }  
      await loadChatHistory();
    }
    
    setIsLoading(false);
  };

  const handlePostChange = (platform, value) => {
    setPosts(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handlePostClick = (post) => {
    const platform = post.platform.toLowerCase();
    setPosts(prev => ({
      ...prev,
      [platform]: post.content_with_hashtags
    }));
  };

  const handleActionMessage = async (action) => {
    // Handle action menu clicks (Improve, Expand, Shorten, Ask)
    const message = `${action} this text`;
    await handleSendMessage(message, 'ask');
  };

  return (
    <div className="flex h-screen">
      <div className="w-[60%] px-2 py-4 bg-gray-50">
        <div className="w-full h-full bg-white rounded-lg relative">
           
          <Tabs defaultValue="instagram" className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between p-2">
              <ActionMenu 
                isGenerating={isLoading}
                handleActionMessage={handleActionMessage}
              />
              <TabsList>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
                <TabsTrigger value="threads">Threads</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="instagram" className="flex-1 m-0 p-6">
              <textarea
                value={posts.instagram}
                onChange={(e) => handlePostChange('instagram', e.target.value)}
                placeholder="Write your Instagram post..."
                className="w-full h-full resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-800 placeholder-gray-400"
              />
            </TabsContent>

            <TabsContent value="facebook" className="flex-1 m-0 p-6">
              <textarea
                value={posts.facebook}
                onChange={(e) => handlePostChange('facebook', e.target.value)}
                placeholder="Write your Facebook post..."
                className="w-full h-full resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-800 placeholder-gray-400"
              />
            </TabsContent>

            <TabsContent value="threads" className="flex-1 m-0 p-6">
              <textarea
                value={posts.threads}
                onChange={(e) => handlePostChange('threads', e.target.value)}
                placeholder="Write your Threads post..."
                className="w-full h-full resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-800 placeholder-gray-400"
              />
            </TabsContent>

            <TabsContent value="linkedin" className="flex-1 m-0 p-6">
              <textarea
                value={posts.linkedin}
                onChange={(e) => handlePostChange('linkedin', e.target.value)}
                placeholder="Write your LinkedIn post..."
                className="w-full h-full resize-none border-none outline-none focus:ring-0 bg-transparent text-gray-800 placeholder-gray-400"
              />
            </TabsContent>
          </Tabs>

        </div>
        
      </div>
      <div className="w-[40%] bg-gray-50 flex flex-col border-l border-gray-100">
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {chatHistory.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Start a conversation...
            </div>
          )}
          {chatHistory.map((msg, index) => (
            <div key={index} className="space-y-2">
              {/* User or AI message */}
              <div 
                className={`p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 text-white ml-12' 
                    : 'bg-gray-100 text-gray-800 mr-12'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Structured posts if available */}
              {msg.structured_posts && msg.structured_posts.length > 0 && (
                <div className="space-y-2">
                  {msg.structured_posts.map((post, postIndex) => {
                      const styling = getPlatformStyling(post.platform);
                      return (
                        <div
                          key={postIndex}
                          onClick={() => handlePostClick(post)}
                          className={`relative p-3 ${styling.postBg} rounded-lg cursor-pointer hover:opacity-80 transition-opacity mr-4`}
                        >
                          {/* Platform label */}
                          <div className="absolute top-2 left-2 text-xs font-medium text-gray-800 capitalize bg-white/80 px-2 py-1 rounded-lg">
                            {post.platform}
                          </div>
                          
                          {/* Post content */}
                          <div className="text-sm text-gray-800 pt-8 whitespace-pre-wrap">
                            {post.content_with_hashtags}
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-100 text-gray-800 mr-8 p-3 rounded-lg">
              <p className="text-sm">Generating...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default CreateText2;