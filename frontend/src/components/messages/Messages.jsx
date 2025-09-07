import { useState, useEffect } from 'react';
import MessageItem from './MessageItem';
import MessagesListSkeleton from '../skeletons/MessagesListSkeleton';
import { CardTitle } from '../ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

import InstagramIcon from '/SM_icons/instagram.svg';
import ThreadsIcon from '/SM_icons/threads.svg';
import FacebookIcon from '/SM_icons/facebook.svg';
const Messages = ({facebookData, instagramData, threadsData}) => {
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [filterAccount, setFilterAccount] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Fetch messages from the backend
    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch Instagram messages
                const igResponse = await fetch(`https://threads-dev.local:5000/api/messages`, {
                    credentials: 'include'
                });
                
                // Fetch Facebook messages
                const fbResponse = await fetch(`https://threads-dev.local:5000/api/facebook/messages`, {
                    credentials: 'include'
                });
                
                // Handle unauthorized responses
                if (igResponse.status === 401 || fbResponse.status === 401) {
                    setError('Please log in to view messages');
                    setIsLoading(false);
                    return;
                }
                
                // Process Instagram messages
                let instagramMessages = [];
                if (igResponse.ok) {
                    const igData = await igResponse.json();
                    if (Array.isArray(igData)) {
                        instagramMessages = igData;
                    }
                }
                
                // Process Facebook messages
                let facebookMessages = [];
                if (fbResponse.ok) {
                    const fbData = await fbResponse.json();
                    if (Array.isArray(fbData)) {
                        facebookMessages = fbData;
                    }
                }
                
                // Combine messages from both platforms
                const allMessages = [...instagramMessages, ...facebookMessages];
                
                // Sort messages by timestamp (newest first)
                allMessages.sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                
                setMessages(allMessages);
                setFilteredMessages(allMessages);
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Failed to load messages. Please try again later.');
                setMessages([]);
                setFilteredMessages([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMessages();
    }, []);
    
    // Filter messages based on search and filters
    useEffect(() => {
        let result = messages;
        
        // Filter by platform
        if (filterPlatform !== 'all') {
            result = result.filter(message => message.platform === filterPlatform);
        }
        
        // Filter by account - fix the logic here
        if (filterAccount !== 'all') {
            result = result.filter(message => {
                // Check both page_name (Facebook) and account_name (Instagram) fields
                return (
                    (message.page_name && message.page_name === filterAccount) ||
                    (message.account_name && message.account_name === filterAccount)
                );
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            result = result.filter(message => 
                message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.author?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredMessages(result);
    }, [messages, searchTerm, filterPlatform, filterAccount]);
    
    
    // Handle reply to message
  
    
    // Helper function to refresh messages
    const refreshMessages = async () => {
        setIsLoading(true);
        try {
            // Fetch Instagram messages
            const igResponse = await fetch(`https://threads-dev.local:5000/api/messages`, {
                credentials: 'include'
            });
            
            // Fetch Facebook messages
            const fbResponse = await fetch(`https://threads-dev.local:5000/api/facebook/messages`, {
                credentials: 'include'
            });
            
            // Process Instagram messages
            let instagramMessages = [];
            if (igResponse.ok) {
                const igData = await igResponse.json();
                if (Array.isArray(igData)) {
                    instagramMessages = igData;
                }
            }
            
            // Process Facebook messages
            let facebookMessages = [];
            if (fbResponse.ok) {
                const fbData = await fbResponse.json();
                if (Array.isArray(fbData)) {
                    facebookMessages = fbData;
                }
            }
            
            // Combine messages from both platforms
            const allMessages = [...instagramMessages, ...facebookMessages];
            
            // Sort messages by timestamp (newest first)
            allMessages.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            setMessages(allMessages);
            setFilteredMessages(allMessages);
        } catch (err) {
            console.error('Error refreshing messages:', err);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle deletion of messages
    const handleDelete = async (id, platform) => {
        if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
            return;
        }
        
        try {
            // For now, we only support deleting Instagram messages through our API
            // Facebook deletion would require additional backend support
            if (platform !== 'instagram') {
                alert('Deleting Facebook comments is not supported in this version.');
                return;
            }
            
            const response = await fetch(`https://threads-dev.local:5000/api/messages/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ message_id: id }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete message');
            }
            
            // Remove the message from the local state
            setMessages(messages.filter(message => message.message_id !== id));
            setFilteredMessages(filteredMessages.filter(message => message.message_id !== id));
        } catch (err) {
            console.error('Error deleting message:', err);
            alert('Failed to delete message. Please try again.');
        }
    };
    
    // Get unique accounts for the filter dropdown
    const accounts = Array.isArray(messages) 
        ? [...new Set(
            messages
                .filter(m => m?.account_name || m?.page_name)
                .map(m => m.account_name || m.page_name)
                .filter(Boolean)
        )]
        : [];
    
    // Show error state
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Messages</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="mx-auto py-4 pr-2 w-full bg-primary">
            {/* Combined header with title and search/filters */}
            <div className="h-28 flex flex-col space-y-2 px-4 py-2 mb-1 rounded-lg bg-[#F8F9FA] border-white">
                <h1 className="text-3xl font-medium text-pink-500 mb-1">
                    Messages
                </h1>
                
                <div className="flex items-center gap-2 justify-end">
          
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="text-black w-80 px-2 py-2 border shadow-sm rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-transparent bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                   
                    
                   
                        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                            <SelectTrigger className="w-40 px-4 py-2 text-sm bg-white shadow-sm bg-white">
                                <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-md w-40 border">
                                <SelectItem value="all" className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                    All Platforms
                                </SelectItem>
                                <SelectItem value="facebook" className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                <img src={FacebookIcon} alt="Facebook" className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                                    Facebook
                                </SelectItem>
                                <SelectItem value="instagram" className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                <img src={InstagramIcon} alt="Instagram" className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                                    Instagram
                                </SelectItem>
                                <SelectItem value="threads" className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                <img src={ThreadsIcon} alt="Threads" className="h-5 w-5 flex-shrink-0 inline-block mr-2" />
                                    Threads
                                </SelectItem>
                            </SelectContent>
                        </Select>
                  
                    
                        <Select value={filterAccount} onValueChange={setFilterAccount}>
                            <SelectTrigger className="w-40 px-4 py-2 text-sm bg-white shadow-sm bg-white">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-md w-40 border">
                                <SelectItem value="all" className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                    All Accounts
                                </SelectItem>
                                {accounts.map(account => (
                                    <SelectItem key={account} value={account} className="py-2 px-4 cursor-pointer bg-white hover:bg-gray-100 border-b last:border-b-0 border-gray-100">
                                        {account}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                   
           
                        <button
                            onClick={refreshMessages}
                            className="py-1.5 px-4 bg-pink-500 text-white rounded hover:bg-pink-600 flex items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span>Refreshing...</span>
                            ) : (
                                <span>Refresh Messages</span>
                            )}
                        </button>

                </div>
            </div>
            
            {/* Messages List */}
            <div className="space-y-4 bg-primary ">
                {isLoading && (
                    <MessagesListSkeleton  />
                )}
                {filteredMessages.length > 0 ? (
                    filteredMessages.map(message => (
                        <MessageItem 
                            key={message.message_id}
                            message={message}
                            onReply={(replyText) => handleReply(message.message_id, replyText, message.platform)}
                            onDelete={() => handleDelete(message.message_id, message.platform)}
                            facebookData={facebookData}
                            instagramData={instagramData}
                            threadsData={threadsData}
                        />
                    ))
                ) : (!isLoading && (
                    <div className="text-center py-8 text-gray-500">
                        No messages found matching your filters.
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Messages;
