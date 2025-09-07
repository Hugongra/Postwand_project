import React, { useState, useRef, useEffect } from 'react';
import { Settings, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { VscSettings } from "react-icons/vsc";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

const SettingsMenu = ({ 
  options, 
  currentValues, 
  onChange,
  buttonClassName = "",
  menuClassName = "",
  position = "bottom-right" 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Check if dropdown would overflow viewport bottom
      if (buttonRect.bottom + menuRect.height > viewportHeight - 20) {
        // Position above if it would overflow
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen, activeCategory]); // Re-calculate when activeCategory changes

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (settingKey, value) => {
    onChange(settingKey, value);
    // Close the menu after selection
    setIsOpen(false);
    setActiveCategory(null);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const handleBackClick = () => {
    setActiveCategory(null);
  };

  const getPositionClasses = () => {
    const basePosition = position.includes('right') ? 'right-0' : 'left-0';
    
    if (dropdownPosition === 'top') {
      return `${basePosition} bottom-full mb-2`;
    } else {
      return `${basePosition} mt-2`;
    }
  };

  const getCurrentValueLabel = (settingKey) => {
    const setting = options.find(opt => opt.key === settingKey);
    if (!setting) return '';
    
    const currentOption = setting.options.find(opt => opt.value === currentValues[settingKey]);
    return currentOption ? currentOption.label : '';
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setActiveCategory(null);
        }}
        className={cn(
          "p-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2",
          buttonClassName
        )}
        type="button"
      >
        <VscSettings className="w-5 h-5 text-gray-700" />
        <span className="text-sm text-gray-700 hidden md:block">{t('common.settings')}</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px]",
            getPositionClasses(),
            menuClassName
          )}
          style={{
            maxHeight: dropdownPosition === 'top' 
              ? `${buttonRef.current?.getBoundingClientRect().top - 20}px`
              : `${window.innerHeight - (buttonRef.current?.getBoundingClientRect().bottom || 0) - 20}px`,
            overflowY: 'auto'
          }}
        >
          {!activeCategory ? (
            // Show categories
            <div className="p-1 space-y-1">
              {options.map((setting) => (
                <button
                  key={setting.key}
                  onClick={() => handleCategoryClick(setting)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  type="button"
                >
                  <span className="font-medium">{setting.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">{getCurrentValueLabel(setting.key)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Show specific category options
            <div className="p-1 space-y-1">
              <button
                onClick={handleBackClick}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">{activeCategory.label}</span>
              </button>
              <div className="space-y-1">
                {activeCategory.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(activeCategory.key, option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-150 min-h-[50px]",
                      currentValues[activeCategory.key] === option.value
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    type="button"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-shrink-0">{option.label}</span>
                        {option.sublabel && (
                          <span className="text-xs text-gray-500 flex-shrink-0">{option.sublabel}</span>
                        )}
                      </div>
                    </div>
                    {currentValues[activeCategory.key] === option.value && (
                      <Check className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsMenu; 