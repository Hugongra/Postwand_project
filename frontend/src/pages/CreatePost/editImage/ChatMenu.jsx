import { History, Plus } from 'lucide-react';
import { useRef, useEffect } from 'react';
const ChatMenu = ({ startNewChat, setShowHistory, showHistory, chats, loadChatSession }) => {
    const historyRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
          if (historyRef.current && !historyRef.current.contains(event.target)) {
            setShowHistory(false);
          }
        };
    
        if (showHistory) {
          document.addEventListener('mousedown', handleClickOutside);
        }
    
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [showHistory]);
    return (
        <>
        <div ref={historyRef} className="absolute top-4 left-4 z-10 flex flex-col gap-2 text-sm">
<button 
  onClick={startNewChat}
  className="flex items-center justify-center px-2 py-1.5 bg-white rounded-lg shadow-md"
>
  <Plus size={16} className="mr-1"/> New
</button>

<button 
  onClick={() => setShowHistory(!showHistory)}
  className="flex items-center justify-center px-2 py-1.5 bg-white rounded-lg shadow-md "
>
  <History size={16} className="mr-1"/> Chats
</button>

{showHistory && (
<div className="absolute top-20 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
  <div className="p-1">
   
    {chats.length === 0 ? (
      <p className="text-xs text-gray-500">No previous chats</p>
    ) : (
      <div className="space-y-1">
        {chats.map((chat) => (
          <button
            key={chat}
            onClick={() => {
              loadChatSession(chat);
              setShowHistory(false);
            }}
            className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="text-xs text-gray-500">
            </div>
            <div className="text-sm">Previous Edit Session</div>
          </button>
        ))}
      </div>
    )}
  </div>
</div>
)}
</div>
</>
    )
}

export default ChatMenu;
