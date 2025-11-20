import { useState } from 'react';
import { Wand2, Pencil } from 'lucide-react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useTranslations } from '@services/translator/useTranslations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const CHAT_MODES = [
  {
    value: 'write_post',
    icon: Pencil,
    label: 'Write Post'
  },
  {
    value: 'ask',
    icon: Wand2,
    label: 'Ask'
  }
];

const ChatInput = ({ onSendMessage, isLoading }) => {
    const [chatMode, setChatMode] = useState('write_post');
    const [input, setInput] = useState('');
    const { t } = useTranslations();

    const handleSubmit = () => {
        if (!input.trim() || isLoading) return;
        
        onSendMessage(input, chatMode);
        setInput('');
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="shrink-0 bg-gray-50 pl-3 pr-3 pb-1">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full text-sm min-h-[112px] max-h-[300px] p-4 pr-24 shadow-xl bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-transparent placeholder-gray-500 resize-none no-scrollbar"
            placeholder={t('createPost.editPlaceholder')}
          />
          
          <div className="absolute inset-x-0 bottom-0 h-11 bg-white pointer-events-none rounded-b-2xl">
            <div className="flex items-center space-x-2 pointer-events-auto px-3">
              <Select value={chatMode} onValueChange={setChatMode} disabled={isLoading}>
                <SelectTrigger className="h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {CHAT_MODES.map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent size={15} />
                            <span>{mode.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Submit button */}
            <button 
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading} 
              className="absolute right-3 bottom-3 text-white bg-gray-900 rounded-lg p-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 pointer-events-auto"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
};

export default ChatInput;