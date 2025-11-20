import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ value, onChange, placeholder, options, width, placeholderWidth }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside of the component.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Find the selected option or use placeholder
  const selected = options.find(option => option.value === value);
  
  // Get display elements
  const displayIcon = selected ? selected.icon : (placeholder && placeholder.icon ? placeholder.icon : null);
  const displayLabel = selected ? selected.label : (placeholder && placeholder.title ? placeholder.title : placeholder);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setOpen(prev => !prev)}
        type="button"
        className={`border border-gray-200 rounded-lg bg-white h-10 p-2 mr-2 flex items-center justify-between ${placeholderWidth}`}
      >
        <div className="flex items-center gap-2 text-sm">
          {displayIcon}
          <span className="hidden md:block">{displayLabel}</span>
        </div>
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {/* Dropdown List */}
      {open && (
        <div className={`absolute mt-2 p-1 bg-white rounded-lg border z-50 ${width}`}>
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            >
              {option.icon}
              <span className="text-sm">{option.label}</span>
              {option.sublabel && (
                <span className="text-sm text-gray-500 ml-auto mr-2">{option.sublabel}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
