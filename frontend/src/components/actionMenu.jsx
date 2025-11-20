import { Wand2 } from "lucide-react";
import { CircleFadingArrowUp, ScrollText, ScissorsLineDashed, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";

const ActionMenu = ({
  isGenerating,
  handleActionMessage
}) => {
  const { t } = useTranslation();
  const [showTextActionsMenu, setShowTextActionsMenu] = useState(false);
  const textActionsRef = useRef(null);
  const hideMenuTimer = useRef(null);
       // Handle text actions menu hover with delay
       const handleTextActionsHover = () => {
        if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
        setShowTextActionsMenu(true);
      };
    
      const handleTextActionsLeave = () => {
        hideMenuTimer.current = setTimeout(() => setShowTextActionsMenu(false), 300);
      };
    
      const handleTextActionsMenuHover = () => {
        if (hideMenuTimer.current) clearTimeout(hideMenuTimer.current);
      };

  const actions = [
    {
      id: 'improve',
      action: 'Improve',
      icon: CircleFadingArrowUp,
      translationKey: 'common.improve'
    },
    {
      id: 'expand',
      action: 'Expand',
      icon: ScrollText,
      translationKey: 'common.expand'
    },
    {
      id: 'shorten',
      action: 'Shorten',
      icon: ScissorsLineDashed,
      translationKey: 'common.shorten'
    },
    {
      id: 'ask',
      action: 'Ask',
      icon: MessageSquare,
      translationKey: 'common.ask'
    }
  ];

  const handleActionClick = (action) => {
    setShowTextActionsMenu(false);
    handleActionMessage(action);
  };

  return (
    <>
      <div ref={textActionsRef} className="relative">
        <button
          type="button"
          onMouseEnter={handleTextActionsHover}
          onMouseLeave={handleTextActionsLeave}
          className="flex justify-center items-center text-sm py-2 px-4 border border-gray-200 rounded-lg text-gray-800 shadow-sm hover:shadow-md bg-white"
          disabled={isGenerating}
        >
          <Wand2 size={16} className='mr-2 text-[rgba(219,39,119,1)]'/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            {t('common.actions')}
          </span>
        </button>

        {/* Dropdown Menu */}
        {showTextActionsMenu && (
          <div 
            onMouseEnter={handleTextActionsMenuHover} 
            onMouseLeave={handleTextActionsLeave} 
            className="absolute top-full mt-1 left-0 flex flex-col gap-1 bg-white rounded-lg p-1 shadow-lg border border-gray-200 w-36 z-30"
          >
            {actions.map(({ id, action, icon: Icon, translationKey }) => (
              <button 
                key={id}
                type="button"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors text-left"
                onClick={() => handleActionClick(action)}
                disabled={isGenerating}
              >
                <Icon size={16} className='mr-2'/> {t(translationKey)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default ActionMenu;