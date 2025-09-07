import React, { useState, useRef, useEffect } from 'react';
import { Type, ImageUp, ChevronLeft, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Strikethrough, ListOrdered, Plus, Minus, Square } from 'lucide-react';
const handleSize = 12; // Size of the resize handles in pixels.

// Helper function to map resize directions to cursor styles.
const getCursorForDirection = (direction) => {
  switch (direction) {
    case 'top-left': return 'nw-resize';
    case 'top-right': return 'ne-resize';
    case 'bottom-left': return 'sw-resize';
    case 'bottom-right': return 'se-resize';
    case 'top': return 'ns-resize';
    case 'bottom': return 'ns-resize';
    case 'left': return 'ew-resize';
    case 'right': return 'ew-resize';
    default: return 'default';
  }
};

// A reusable hook for dragging and resizing behavior.
const useDraggableResizable = (initialPos, initialSize) => {
  const [position, setPosition] = useState(initialPos);
  const [size, setSize] = useState(initialSize);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const startRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, width: 0, height: 0, aspect: 1 });

  const handleDragMouseDown = (e, setSelected) => {
    e.stopPropagation();
    // Only trigger dragging if not clicking on a handle.
    if (!e.target.dataset.direction) {
      setSelected(true);
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
      setDragging(true);
    }
  };

  const handleResizeMouseDown = (e, setSelected) => {
    e.stopPropagation();
    const direction = e.target.dataset.direction;
    setResizeDirection(direction);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
      width: size.width,
      height: size.height,
      aspect: size.width / size.height,
    };
    setResizing(true);
    setSelected(true);
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setPosition({
        x: startRef.current.posX + dx,
        y: startRef.current.posY + dy,
      });
    } else if (resizing) {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      let newPos = { ...position };
      let newSize = { ...size };

      // For corner handles, maintain aspect ratio.
      if (
        resizeDirection === 'top-left' ||
        resizeDirection === 'top-right' ||
        resizeDirection === 'bottom-left' ||
        resizeDirection === 'bottom-right'
      ) {
        let delta = 0;
        switch (resizeDirection) {
          case 'top-left': {
            delta = Math.min(dx, dy);
            newSize.width = Math.max(20, startRef.current.width - delta);
            newSize.height = newSize.width / startRef.current.aspect;
            newPos.x = startRef.current.posX + delta;
            newPos.y = startRef.current.posY + (startRef.current.height - newSize.height);
            break;
          }
          case 'top-right': {
            delta = Math.min(dx, -dy);
            newSize.width = Math.max(20, startRef.current.width + delta);
            newSize.height = newSize.width / startRef.current.aspect;
            newPos.y = startRef.current.posY + (startRef.current.height - newSize.height);
            break;
          }
          case 'bottom-left': {
            delta = Math.min(-dx, dy);
            newSize.width = Math.max(20, startRef.current.width + delta);
            newSize.height = newSize.width / startRef.current.aspect;
            newPos.x = startRef.current.posX - delta;
            break;
          }
          case 'bottom-right': {
            delta = Math.min(dx, dy);
            newSize.width = Math.max(20, startRef.current.width + delta);
            newSize.height = newSize.width / startRef.current.aspect;
            break;
          }
          default:
            break;
        }
      } else {
        // For edge handles, allow free resizing.
        if (resizeDirection.includes('right')) {
          newSize.width = Math.max(20, startRef.current.width + dx);
        }
        if (resizeDirection.includes('left')) {
          newSize.width = Math.max(20, startRef.current.width - dx);
          newPos.x = startRef.current.posX + dx;
        }
        if (resizeDirection.includes('bottom')) {
          newSize.height = Math.max(20, startRef.current.height + dy);
        }
        if (resizeDirection.includes('top')) {
          newSize.height = Math.max(20, startRef.current.height - dy);
          newPos.y = startRef.current.posY + dy;
        }
      }
      setSize(newSize);
      setPosition(newPos);
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setResizeDirection(null);
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [dragging, resizing]);

  useEffect(() => {
    if (dragging) {
      document.body.style.cursor = 'grabbing';
    } else if (resizing && resizeDirection) {
      document.body.style.cursor = getCursorForDirection(resizeDirection);
    } else {
      document.body.style.cursor = 'default';
    }
  }, [dragging, resizing, resizeDirection]);

  return {
    position,
    size,
    setSize,
    dragging,
    resizing,
    resizeDirection,
    handleDragMouseDown,
    handleResizeMouseDown,
  };
};

// Component for draggable/resizable images.
const DraggableResizableImage = ({ src, initialPos, initialSize, selected, setSelected }) => {
  const {
    position,
    size,
    handleDragMouseDown,
    handleResizeMouseDown,
  } = useDraggableResizable(initialPos, initialSize);

  // Render the eight resize handles.
  const renderHandles = () => {
    const directions = [
      'top-left',
      'top',
      'top-right',
      'right',
      'bottom-right',
      'bottom',
      'bottom-left',
      'left',
    ];

    return directions.map((dir) => {
      let style = {
        position: 'absolute',
        width: handleSize,
        height: handleSize,
        background: 'white',
        border: '1px solid #000',
        boxSizing: 'border-box',
        cursor: getCursorForDirection(dir),
        borderRadius: '3px', // Default slight rounding for all handles
      };
      
      // Make the corner handles round
      if (dir === 'top-left' || dir === 'top-right' || dir === 'bottom-left' || dir === 'bottom-right') {
        style.borderRadius = '50%';
      }
      
      // Make side handles rectangular
      if (dir === 'top' || dir === 'bottom') {
        style.width = handleSize * 2;
        style.height = handleSize / 1.5;
      }
      if (dir === 'left' || dir === 'right') {
        style.width = handleSize / 1.5;
        style.height = handleSize * 2;
      }
      
      if (dir.includes('top')) {
        style.top = -handleSize / 2;
      }
      if (dir.includes('bottom')) {
        style.bottom = -handleSize / 2;
      }
      if (dir.includes('left')) {
        style.left = -handleSize / 2;
      }
      if (dir.includes('right')) {
        style.right = -handleSize / 2;
      }
      if (dir === 'top' || dir === 'bottom') {
        style.left = '50%';
        style.transform = 'translateX(-50%)';
      }
      if (dir === 'left' || dir === 'right') {
        style.top = '50%';
        style.transform = 'translateY(-50%)';
      }
      return (
        <div
          key={dir}
          data-direction={dir}
          style={style}
          onMouseDown={(e) => handleResizeMouseDown(e, setSelected)}
        />
      );
    });
  };

  return (
    <div
      className="draggable-image"
      onMouseDown={(e) => handleDragMouseDown(e, setSelected)}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        outline: selected ? '2px solid blue' : 'none',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 10, // Higher than frame
      }}
    >
      <img
        src={src}
        alt="Editable"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
        }}
      />
      {selected && renderHandles()}
    </div>
  );
};

// Component for draggable/resizable text boxes.
const DraggableResizableText = ({ 
  initialPos, 
  initialSize, 
  selected, 
  setSelected, 
  initialText = 'Edit me',
  textStyle = {}, 
  onStyleChange,
  setFontSize,
  fontSize
}) => {
  const {
    position,
    size,
    setSize,
    handleDragMouseDown,
    handleResizeMouseDown,
  } = useDraggableResizable(initialPos, initialSize);
  const [text, setText] = useState(initialText);
  const textRef = useRef(null);
  const [initialWidth] = useState(initialSize.width);
  
  // Initialize the content of the editable div
  useEffect(() => {
    if (textRef.current && !textRef.current.textContent) {
      textRef.current.textContent = initialText;
    }
  }, [initialText]);
  
  // Improved text resizing logic that responds to width changes
  useEffect(() => {
    if (!textStyle.fontSize) {
      // Calculate new font size proportionally to width change
      const scaleFactor = size.width / initialWidth;
      const newFontSize = Math.round(20 * scaleFactor);
      // Set min/max limits for font size
      setFontSize(Math.max(8, Math.min(120, newFontSize)));
    }
  }, [size.width, initialWidth, textStyle.fontSize, setFontSize]);

  // Auto-resize text box height based on content or font size changes
  useEffect(() => {
    if (textRef.current) {
      const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
      if (isOverflowing) {
        const newHeight = textRef.current.scrollHeight + 10;
        setSize({ ...size, height: newHeight });
      }
    }
  }, [text, size.width, fontSize, textStyle.fontSize]);

  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.currentTarget.textContent;
    setText(newText);
  };

  // Add renderHandles function
  const renderHandles = () => {
    const directions = [
      'top-left',
      'top',
      'top-right',
      'right',
      'bottom-right',
      'bottom',
      'bottom-left',
      'left',
    ];

    return directions.map((dir) => {
      let style = {
        position: 'absolute',
        width: handleSize,
        height: handleSize,
        background: 'white',
        border: '1px solid #000',
        boxSizing: 'border-box',
        cursor: getCursorForDirection(dir),
        zIndex: 100,
        borderRadius: '3px', // Default slight rounding for all handles
      };
      
      // Make the corner handles round
      if (dir === 'top-left' || dir === 'top-right' || dir === 'bottom-left' || dir === 'bottom-right') {
        style.borderRadius = '50%';
      }
      
      // Make side handles rectangular
      if (dir === 'top' || dir === 'bottom') {
        style.width = handleSize * 2;
        style.height = handleSize / 1.5;
      }
      if (dir === 'left' || dir === 'right') {
        style.width = handleSize / 1.5;
        style.height = handleSize * 2;
      }
      
      if (dir.includes('top')) {
        style.top = -handleSize / 2;
      }
      if (dir.includes('bottom')) {
        style.bottom = -handleSize / 2;
      }
      if (dir.includes('left')) {
        style.left = -handleSize / 2;
      }
      if (dir.includes('right')) {
        style.right = -handleSize / 2;
      }
      if (dir === 'top' || dir === 'bottom') {
        style.left = '50%';
        style.transform = 'translateX(-50%)';
      }
      if (dir === 'left' || dir === 'right') {
        style.top = '50%';
        style.transform = 'translateY(-50%)';
      }
      return (
        <div
          key={dir}
          data-direction={dir}
          style={style}
          onMouseDown={(e) => handleResizeMouseDown(e, setSelected)}
        />
      );
    });
  };

  // Apply all text styles to the style object
  const getTextStyles = () => {
    return {
      width: '100%',
      height: '100%',
      padding: '5px',
      boxSizing: 'border-box',
      outline: 'none',
      overflow: 'auto',
      fontSize: `${textStyle.fontSize || fontSize}px`,
      fontFamily: textStyle.fontFamily || 'Arial',
      fontWeight: textStyle.fontWeight || 'normal',
      fontStyle: textStyle.fontStyle || 'normal',
      textDecoration: textStyle.textDecoration || 'none',
      textAlign: textStyle.textAlign || 'left',
      color: textStyle.color || 'black',
      backgroundColor: textStyle.backgroundColor || 'transparent',
      opacity: textStyle.opacity || 1,
      textShadow: textStyle.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
      border: textStyle.border ? '1px solid #000' : 'none',
    };
  };

  return (
    <div
      className="draggable-text"
      onMouseDown={(e) => handleDragMouseDown(e, setSelected)}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        border: selected ? '2px solid blue' : 'none',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 10, // Higher than frame
      }}
    >
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleTextChange}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (!(e.ctrlKey || e.metaKey)) {
            e.stopPropagation();
          }
        }}
        style={getTextStyles()}
      />
      {selected && renderHandles()}
    </div>
  );
};

// Define custom fonts outside the component or use useMemo to prevent recreating on every render
const customFonts = [
  {
    name: 'Super Cottage',
    woff: 'https://threads-dev.local:5173/fonts/super_cottage/Super Cottage.woff',
    ttf: 'https://threads-dev.local:5173/fonts/super_cottage/Super Cottage.ttf'
  },
  {
    name: 'Comic Hand',
    woff: 'https://threads-dev.local:5173/fonts/comic_hand/Comic Hand.woff',
    ttf: 'https://threads-dev.local:5173/fonts/comic_hand/Comic Hand.ttf'
  },
  // Add more fonts as needed
];

// Text Style Sidebar Component
const TextStyleSidebar = ({ style, onStyleChange, onClose, onAddText, setFontSize, fontSize }) => {
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Cardo'];
  
  // Extract custom font names
  const customFontNames = customFonts.map(font => font.name);
  
  // Create the combined font list
  const allFontFamilies = [...fontFamilies, ...customFontNames];
  
  useEffect(() => {
    // Font loading logic here
    // ... the rest of your font loading code
  }, []);
  
  const handleFontSizeChange = (increment) => {
    const currentSize = style.fontSize || fontSize;
    const newSize = Math.max(8, Math.min(120, currentSize + increment));
    
    setFontSize(newSize);
    if (style.fontSize) {
      onStyleChange({ ...style, fontSize: newSize });
    }
  };

  const handleOpacityChange = (increment) => {
    const currentOpacity = style.opacity || 1;
    const newOpacity = Math.min(1, Math.max(0, currentOpacity + increment));
    onStyleChange({ ...style, opacity: newOpacity });
  };

  const toggleStyle = (property, value) => {
    const newValue = style[property] === value ? undefined : value;
    onStyleChange({ ...style, [property]: newValue });
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      right: 0,
      width: '20vw',
      height: '87vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      borderRadius: '10px',
      padding: '15px',
      overflowY: 'auto',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}
        >
          <ChevronLeft size={20} /> Text
        </button>
      </div>

      {/* Add Text Button */}
      <button 
        onClick={onAddText}
        style={{ 
          padding: '12px', 
          backgroundColor: '#0066ff', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '15px'
        }}
      >
        <Type size={18} />
        Add Text Box
      </button>

      {/* Font Style Section */}
      <div style={{ padding: '15px', backgroundColor: '#f8f8f8', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Font Style</label>
          <select 
            value={style.fontFamily || 'Arial'} 
            onChange={(e) => onStyleChange({ ...style, fontFamily: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            {allFontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Size and Weight Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Size</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => handleFontSizeChange(-4)}
                style={{ 
                  background: '#eee', 
                  border: 'none', 
                  borderRadius: '4px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Minus size={16} />
              </button>
              <div style={{ 
                width: '60px', 
                textAlign: 'center',
                padding: '5px 0'
              }}>
                {style.fontSize || fontSize}
              </div>
              <button 
                onClick={() => handleFontSizeChange(4)}
                style={{ 
                  background: '#eee', 
                  border: 'none', 
                  borderRadius: '4px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Weight</label>
            <select 
              value={style.fontWeight || 'Normal'} 
              onChange={(e) => onStyleChange({ ...style, fontWeight: e.target.value })}
              style={{ 
                padding: '8px', 
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '120px'
              }}
            >
              {['Normal', 'Bold', 'Light'].map(weight => (
                <option key={weight} value={weight}>{weight}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alignment Controls */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Alignment</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => onStyleChange({ ...style, textAlign: 'left' })}
              style={{ 
                flex: 1,
                padding: '8px',
                backgroundColor: style.textAlign === 'left' ? '#ddd' : '#eee',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlignLeft size={18} />
              <span style={{ marginLeft: '5px' }}>Left</span>
            </button>
            <button 
              onClick={() => onStyleChange({ ...style, textAlign: 'center' })}
              style={{ 
                flex: 1,
                padding: '8px',
                backgroundColor: style.textAlign === 'center' ? '#ddd' : '#eee',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlignCenter size={18} />
              <span style={{ marginLeft: '5px' }}>Center</span>
            </button>
            <button 
              onClick={() => onStyleChange({ ...style, textAlign: 'right' })}
              style={{ 
                flex: 1,
                padding: '8px',
                backgroundColor: style.textAlign === 'right' ? '#ddd' : '#eee',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlignRight size={18} />
              <span style={{ marginLeft: '5px' }}>Right</span>
            </button>
          </div>
        </div>

        {/* Text Formatting Controls */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
          <button 
            onClick={() => toggleStyle('fontWeight', style.fontWeight === 'bold' ? 'normal' : 'bold')}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: style.fontWeight === 'bold' ? '#ddd' : '#eee',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Bold size={18} />
          </button>
          <button 
            onClick={() => toggleStyle('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic')}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: style.fontStyle === 'italic' ? '#ddd' : '#eee',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Italic size={18} />
          </button>
          <button 
            onClick={() => toggleStyle('textDecoration', style.textDecoration === 'line-through' ? 'none' : 'line-through')}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: style.textDecoration === 'line-through' ? '#ddd' : '#eee',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Strikethrough size={18} />
          </button>
          <button 
            onClick={() => toggleStyle('textDecoration', style.textDecoration === 'underline' ? 'none' : 'underline')}
            style={{ 
              flex: 1,
              padding: '8px',
              backgroundColor: style.textDecoration === 'underline' ? '#ddd' : '#eee',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Underline size={18} />
          </button>
        </div>
      </div>

      {/* Color Section */}
      <div style={{ 
        padding: '15px 15px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            backgroundColor: style.color || 'black',
            border: '1px solid #ddd'
          }}></div>
          <span>Color</span>
        </div>
        <input 
          type="color" 
          value={style.color || '#000000'} 
          onChange={(e) => onStyleChange({ ...style, color: e.target.value })}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Border Toggle */}
      <div style={{ 
        padding: '15px 15px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#000' 
            }}></div>
          </div>
          <span>Border</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={!!style.border} 
            onChange={() => onStyleChange({ ...style, border: !style.border })}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Shadow Toggle */}
      <div style={{ 
        padding: '15px 15px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            backgroundColor: '#0088ff'
          }}></div>
          <span>Shadow</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={!!style.shadow} 
            onChange={() => onStyleChange({ ...style, shadow: !style.shadow })}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Opacity Control (with buttons instead of slider) */}
      <div style={{ 
        padding: '15px 15px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 5px 5px'
          }}></div>
          <span>Opacity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => handleOpacityChange(-0.1)}
            style={{ 
              background: '#eee', 
              border: 'none', 
              borderRadius: '4px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Minus size={16} />
          </button>
          <div style={{ 
            width: '60px', 
            textAlign: 'center',
            padding: '5px 0'
          }}>
            {Math.round((style.opacity || 1) * 100)}%
          </div>
          <button 
            onClick={() => handleOpacityChange(0.1)}
            style={{ 
              background: '#eee', 
              border: 'none', 
              borderRadius: '4px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Frame Style Sidebar Component - Improved
const FrameStyleSidebar = ({ backgroundColor, onBackgroundColorChange, onClose }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      right: 0,
      width: '20vw',
      height: '87vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      borderRadius: '10px',
      padding: '15px',
      overflowY: 'auto',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}
        >
          <ChevronLeft size={20} /> Frame
        </button>
      </div>

      {/* Background Color Section - Improved UI */}
      <div style={{ padding: '15px', backgroundColor: '#f8f8f8', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>Background Color</label>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* Color preview */}
            <div style={{ 
              width: '100%', 
              height: '50px', 
              borderRadius: '8px', 
              backgroundColor: backgroundColor || '#ffffff',
              border: '1px solid #ddd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}></div>
            
            {/* Color presets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {['#ffffff', '#000000', '#f44336', '#2196f3', '#4caf50', 
                '#ffeb3b', '#ff9800', '#9c27b0', '#795548', '#607d8b'].map(color => (
                <div 
                  key={color}
                  onClick={() => onBackgroundColorChange(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    border: color === backgroundColor ? '2px solid #000' : '1px solid #ddd',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            
            {/* Custom color picker */}
            <div style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label style={{ fontSize: '14px' }}>Custom Color:</label>
              <input 
                type="color" 
                value={backgroundColor || '#ffffff'} 
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '40px',
                  cursor: 'pointer',
                  padding: '0',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revised frame component with border-only selection
const FixedFrame = ({ initialSize, selected, setSelected, aspectRatio, id, backgroundColor }) => {
  const [size, setSize] = useState(initialSize);
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const startRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Function to handle resize
  const handleResizeMouseDown = (e, direction) => {
    e.stopPropagation();
    setResizeDirection(direction);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    setResizing(true);
    setSelected();
  };
  
  const handleMouseMove = (e) => {
    if (!resizing) return;
    
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    let newSize = { ...size };
    
    // Always maintain aspect ratio for frames
    if (resizeDirection.includes('right')) {
      newSize.width = Math.max(100, startRef.current.width + dx);
      newSize.height = newSize.width / aspectRatio;
    } else if (resizeDirection.includes('bottom')) {
      newSize.height = Math.max(100, startRef.current.height + dy);
      newSize.width = newSize.height * aspectRatio;
    }
    
    setSize(newSize);
  };
  
  const handleMouseUp = () => {
    setResizing(false);
    setResizeDirection(null);
  };
  
  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);
  
  // Click handler that only selects the frame when clicking near the border
  const handleFrameClick = (e) => {
    // Get position relative to the frame
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Define border sensitivity (how many pixels from the edge are clickable)
    const borderSensitivity = 10;
    
    // Check if click is near any edge
    if (
      x < borderSensitivity || // Left border
      y < borderSensitivity || // Top border
      x > rect.width - borderSensitivity || // Right border
      y > rect.height - borderSensitivity // Bottom border
    ) {
      setSelected();
    }
    // If not near an edge, let the click pass through to select other elements
  };
  
  // Render the resize handles - only right and bottom for simplicity
  const renderHandles = () => {
    const directions = ['right', 'bottom', 'bottom-right'];
    
    return directions.map((dir) => {
      let style = {
        position: 'absolute',
        width: handleSize,
        height: handleSize,
        background: 'white',
        border: '1px solid #000',
        boxSizing: 'border-box',
        cursor: getCursorForDirection(dir),
        zIndex: 100,
        borderRadius: '3px',
      };
      
      if (dir === 'bottom-right') {
        style.borderRadius = '50%';
        style.right = -handleSize / 2;
        style.bottom = -handleSize / 2;
      } else if (dir === 'right') {
        style.width = handleSize / 1.5;
        style.height = handleSize * 2;
        style.right = -handleSize / 2;
        style.top = '50%';
        style.transform = 'translateY(-50%)';
      } else if (dir === 'bottom') {
        style.width = handleSize * 2;
        style.height = handleSize / 1.5;
        style.bottom = -handleSize / 2;
        style.left = '50%';
        style.transform = 'translateX(-50%)';
      }
      
      return (
        <div
          key={dir}
          data-direction={dir}
          style={style}
          onMouseDown={(e) => handleResizeMouseDown(e, dir)}
        />
      );
    });
  };

  return (
    <div
      onClick={handleFrameClick}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: size.width,
        height: size.height,
        border: selected ? '2px solid blue' : '2px solid #ddd',
        backgroundColor: backgroundColor || 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        userSelect: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
      data-frame-id={id}
    >
      {selected && renderHandles()}
    </div>
  );
};

// Updated Sidebar component
const Sidebar = ({ onAddText, onFileUpload, onAddFrame }) => {
  const fileInputRef = useRef(null);
  const [showFrameOptions, setShowFrameOptions] = useState(false);
  const [frameOptionsPosition, setFrameOptionsPosition] = useState({ x: 0, y: 0 });
  
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFrameClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFrameOptionsPosition({ 
      x: rect.left, 
      y: rect.bottom + 5 
    });
    setShowFrameOptions(!showFrameOptions);
  };

  return (
    <div className="sidebar" style={{
      height: '70px',
      width: '80vw',
      backgroundColor: '#f8f8f8',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 10px',
      margin: '10px auto',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
    }}>
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={onFileUpload} 
      />
      
      {/* Text Tool */}
      <div 
        onClick={onAddText}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 5px',
          cursor: 'pointer',
          padding: '5px',
          width: '60px',
          borderRadius: '5px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ fontSize: '24px', marginBottom: '5px' }}><Type /></div>
        <div style={{ fontSize: '12px' }}>Text</div>
      </div>
      
      {/* Upload Tool */}
      <div 
        onClick={handleUploadClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 5px',
          width: '60px',
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '5px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ fontSize: '20px', marginBottom: '5px' }}><ImageUp/></div>
        <div style={{ fontSize: '12px' }}>Upload</div>
      </div>
      
      {/* Frame Tool - NEW */}
      <div 
        onClick={handleFrameClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 5px',
          width: '60px',
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '5px',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ fontSize: '20px', marginBottom: '5px' }}><Square/></div>
        <div style={{ fontSize: '12px' }}>Frame</div>
      </div>
      
      <FrameOptionsDropdown 
        visible={showFrameOptions}
        position={frameOptionsPosition}
        onSelectFrame={(ratio) => {
          onAddFrame(ratio);
          setShowFrameOptions(false);
        }}
      />
    </div>
  );
};

// Frame options dropdown
const FrameOptionsDropdown = ({ onSelectFrame, visible, position }) => {
  if (!visible) return null;
  
  const frameOptions = [
    { name: '1:1 Square', ratio: 1 },
    { name: '3:4 Portrait', ratio: 3/4 },
    { name: '4:5 Portrait', ratio: 4/5 },
    { name: '9:16 Portrait', ratio: 9/16 },
  ];
  
  return (
    <div style={{
      position: 'absolute',
      top: position.y,
      left: position.x,
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px 0',
      zIndex: 1000,
      minWidth: '180px',
    }}>
      {frameOptions.map((option) => (
        <div 
          key={option.name}
          onClick={() => onSelectFrame(option.ratio)}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            hover: { backgroundColor: '#f5f5f5' }
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {option.name}
        </div>
      ))}
    </div>
  );
};

// Updated ImageEditor component with mutually exclusive sidebars
const ImageEditor = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [textBoxes, setTextBoxes] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [textStyles, setTextStyles] = useState({});
  const [showTextSidebar, setShowTextSidebar] = useState(false);
  const [globalTextStyles, setGlobalTextStyles] = useState({});
  const [fontSize, setFontSize] = useState(20);
  const [frames, setFrames] = useState([]);
  const [activeFrame, setActiveFrame] = useState(null);
  const [frameBackgroundColors, setFrameBackgroundColors] = useState({});
  const [showFrameSidebar, setShowFrameSidebar] = useState(false);
  const canvasRef = useRef(null);
  const [editorScale, setEditorScale] = useState(1); // Track zoom level
  
  // Save current state to history
  const saveToHistory = (state) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(state));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    // Initialize history with current state
    if (historyIndex === -1 && (imageSrc || textBoxes.length > 0)) {
      saveToHistory({ imageSrc, textBoxes, imageSize });
    }
  }, [imageSrc, textBoxes, imageSize]);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      // Create an image element to get natural dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate size maintaining aspect ratio
        const maxDimension = 400; // Max initial dimension
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let width, height;
        
        if (aspectRatio >= 1) {
          // For landscape or square images
          width = Math.min(img.naturalWidth, maxDimension);
          height = width / aspectRatio;
        } else {
          // For portrait images
          height = Math.min(img.naturalHeight, maxDimension);
          width = height * aspectRatio;
        }
        
        const newSize = { width, height };
        setImageSize(newSize);
        setImageSrc(imageUrl);
        setSelectedElement(null);
        saveToHistory({ imageSrc: imageUrl, textBoxes, imageSize: newSize });
      };
      img.src = imageUrl;
    }
  };

  // Function to show text sidebar without adding text
  const showTextStyling = () => {
    setShowTextSidebar(true);
  };
  
  const addTextBox = () => {
    const newTextBox = {
      id: Date.now(),
      initialPos: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 25 },
      initialSize: { width: 100, height: 15 },
      initialText: "Edit me"
    };
    
    const newTextBoxes = [...textBoxes, newTextBox];
    setTextBoxes(newTextBoxes);
    setSelectedElement(`text-${newTextBox.id}`);
    setShowTextSidebar(true);
    saveToHistory({ imageSrc, textBoxes: newTextBoxes, imageSize, textStyles });
  };

  // Update text style for a specific text box
  const updateTextStyle = (style) => {
    if (selectedElement && selectedElement.startsWith('text-')) {
      const id = selectedElement.split('-')[1];
      const newTextStyles = {
        ...textStyles,
        [id]: style
      };
      setTextStyles(newTextStyles);
      saveToHistory({ imageSrc, textBoxes, imageSize, textStyles: newTextStyles });
    }
  };

  // Effect to manage sidebars - they should be mutually exclusive
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.startsWith('text-')) {
        setShowTextSidebar(true);
        setShowFrameSidebar(false);
      } else if (selectedElement.startsWith('frame-')) {
        setShowFrameSidebar(true);
        setShowTextSidebar(false);
      } else {
        setShowTextSidebar(false);
        setShowFrameSidebar(false);
      }
    } else {
      setShowTextSidebar(false);
      setShowFrameSidebar(false);
    }
  }, [selectedElement]);

  // Get style for a text box
  const getTextBoxStyle = (id) => {
    return textStyles[id] || {};
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const prevState = JSON.parse(history[newIndex]);
          setImageSrc(prevState.imageSrc);
          setTextBoxes(prevState.textBoxes);
          if (prevState.imageSize) {
            setImageSize(prevState.imageSize);
          }
          setHistoryIndex(newIndex);
        }
      }
      
      // Redo: Ctrl+Y
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextState = JSON.parse(history[newIndex]);
          setImageSrc(nextState.imageSrc);
          setTextBoxes(nextState.textBoxes);
          if (nextState.imageSize) {
            setImageSize(nextState.imageSize);
          }
          setHistoryIndex(newIndex);
        }
      }
      
      // Only process copy/cut/paste if we have a selected element
      if (selectedElement) {
        // Copy: Ctrl+C
        if (e.ctrlKey && e.key === 'c') {
          e.preventDefault();
          if (selectedElement.startsWith('text-')) {
            const id = selectedElement.split('-')[1];
            const textBoxToCopy = textBoxes.find(box => box.id.toString() === id);
            if (textBoxToCopy) {
              setClipboard({ type: 'text', data: { ...textBoxToCopy } });
            }
          } else if (selectedElement === 'image' && imageSrc) {
            setClipboard({ type: 'image', data: imageSrc });
          }
        }
        
        // Cut: Ctrl+X
        if (e.ctrlKey && e.key === 'x') {
          e.preventDefault();
          if (selectedElement.startsWith('text-')) {
            const id = selectedElement.split('-')[1];
            const textBoxToCopy = textBoxes.find(box => box.id.toString() === id);
            if (textBoxToCopy) {
              setClipboard({ type: 'text', data: { ...textBoxToCopy } });
              const newTextBoxes = textBoxes.filter(box => box.id.toString() !== id);
              setTextBoxes(newTextBoxes);
              setSelectedElement(null);
              saveToHistory({ imageSrc, textBoxes: newTextBoxes, imageSize });
            }
          } else if (selectedElement === 'image' && imageSrc) {
            setClipboard({ type: 'image', data: imageSrc });
            setImageSrc(null);
            setSelectedElement(null);
            saveToHistory({ imageSrc: null, textBoxes, imageSize });
          }
        }
      }
      
      // Paste: Ctrl+V
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (clipboard) {
          if (clipboard.type === 'text') {
            const newTextBox = {
              ...clipboard.data,
              id: Date.now(),
              initialPos: { 
                x: clipboard.data.initialPos.x + 20, 
                y: clipboard.data.initialPos.y + 20 
              }
            };
            const newTextBoxes = [...textBoxes, newTextBox];
            setTextBoxes(newTextBoxes);
            setSelectedElement(`text-${newTextBox.id}`);
            saveToHistory({ imageSrc, textBoxes: newTextBoxes, imageSize });
          } else if (clipboard.type === 'image') {
            setImageSrc(clipboard.data);
            saveToHistory({ imageSrc: clipboard.data, textBoxes, imageSize });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, selectedElement, textBoxes, imageSrc, clipboard, imageSize]);

  // Clicking on the canvas (outside any element) deselects all.
  const handleCanvasClick = (e) => {
    if (e.target.id === 'canvas-container') {
      setSelectedElement(null);
    }
  };

  const deleteSelectedElement = () => {
    if (selectedElement && selectedElement.startsWith('text-')) {
      const id = selectedElement.split('-')[1];
      const newTextBoxes = textBoxes.filter(box => box.id.toString() !== id);
      setTextBoxes(newTextBoxes);
      setSelectedElement(null);
      saveToHistory({ imageSrc, textBoxes: newTextBoxes, imageSize });
    } else if (selectedElement === 'image') {
      setImageSrc(null);
      setSelectedElement(null);
      saveToHistory({ imageSrc: null, textBoxes, imageSize });
    }
  };

  // When text box is resized, update the font size
  const handleTextBoxResize = (id, width) => {
    const newSize = Math.round(width / 10); // Simple calculation example
    setGlobalTextStyles(prev => ({
      ...prev,
      [id]: { ...prev[id], fontSize: newSize }
    }));
  };

  // Calculate appropriate frame size based on viewport
  const calculateFrameSize = (aspectRatio) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Use 70% of the smaller dimension as base
    const maxDimension = Math.min(viewportWidth * 0.7, viewportHeight * 0.7);
    
    let width, height;
    
    if (aspectRatio >= 1) {
      // For landscape or square
      width = maxDimension;
      height = width / aspectRatio;
    } else {
      // For portrait
      height = maxDimension;
      width = height * aspectRatio;
    }
    
    return { width, height };
  };
  
  // Add frame function with better sizing
  const addFrame = (aspectRatio) => {
    // Calculate appropriate frame size for the viewport
    const frameSize = calculateFrameSize(aspectRatio);
    
    const newFrame = {
      id: Date.now(),
      aspectRatio,
      size: frameSize
    };
    
    setFrames([newFrame]); // Replace any existing frame
    setActiveFrame(newFrame.id);
    setSelectedElement(`frame-${newFrame.id}`);
  };

  // Zoom handler
  useEffect(() => {
    const handleZoom = (e) => {
      // Prevent zoom displacement by normalizing elements
      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer) {
        canvasContainer.style.transformOrigin = 'center center';
      }
    };
    
    window.addEventListener('resize', handleZoom);
    return () => window.removeEventListener('resize', handleZoom);
  }, []);

  // Improved download function with better text rendering
  const downloadFrame = () => {
    if (!frames.length) return;
    
    const frame = document.querySelector(`[data-frame-id="${frames[0].id}"]`);
    if (!frame) return;
    
    const frameRect = frame.getBoundingClientRect();
    
    // Create a canvas with higher resolution
    const pixelRatio = window.devicePixelRatio || 1;
    const qualityMultiplier = 2; // Increase this for even higher quality
    
    // Create hidden container to render the frame contents
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = `${frameRect.width}px`;
    tempContainer.style.height = `${frameRect.height}px`;
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.overflow = 'hidden';
    document.body.appendChild(tempContainer);
    
    // Function to create a clone of an element
    const cloneElement = (element, container) => {
      const rect = element.getBoundingClientRect();
      const frameLeft = frameRect.left;
      const frameTop = frameRect.top;
      
      // Calculate position relative to frame
      const left = rect.left - frameLeft;
      const top = rect.top - frameTop;
      
      // Only clone elements that are at least partially within the frame
      if (
        left + rect.width > 0 && 
        top + rect.height > 0 && 
        left < frameRect.width && 
        top < frameRect.height
      ) {
        const clone = element.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = `${left}px`;
        clone.style.top = `${top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = '0';
        clone.style.border = 'none'; // Remove selection border
        clone.style.transform = 'none'; // Reset any transforms
        
        container.appendChild(clone);
        return true;
      }
      return false;
    };
    
    // Clone all relevant elements
    let hasElements = false;
    
    // Clone images
    if (imageSrc) {
      const imageElements = document.querySelectorAll('.draggable-image');
      imageElements.forEach(element => {
        if (cloneElement(element, tempContainer)) {
          hasElements = true;
        }
      });
    }
    
    // Clone text boxes
    const textElements = document.querySelectorAll('.draggable-text');
    textElements.forEach(element => {
      if (cloneElement(element, tempContainer)) {
        hasElements = true;
      }
    });
    
    // Use html2canvas to render the container
    if (hasElements) {
      import('html2canvas').then(html2canvasModule => {
        const html2canvas = html2canvasModule.default;
        
        const canvasOptions = {
          backgroundColor: 'white',
          scale: pixelRatio * qualityMultiplier,
          logging: false,
          useCORS: true,
          allowTaint: true,
        };
        
        html2canvas(tempContainer, canvasOptions).then(canvas => {
          // Cleanup
          document.body.removeChild(tempContainer);
          
          // Download the canvas
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = 'my-design.png';
          link.href = dataUrl;
          link.click();
        });
      }).catch(err => {
        console.error("Error loading html2canvas:", err);
        document.body.removeChild(tempContainer);
        alert("Could not generate image. Please try again.");
      });
    } else {
      // Clean up and show error if no elements were cloned
      document.body.removeChild(tempContainer);
      alert("No elements found within the frame to export.");
    }
  };

  // Get the currently selected frame ID
  const getSelectedFrameId = () => {
    if (selectedElement && selectedElement.startsWith('frame-')) {
      return selectedElement.split('-')[1];
    }
    return null;
  };
  
  // Handle frame background color change
  const handleFrameBackgroundChange = (color) => {
    const frameId = getSelectedFrameId();
    if (frameId) {
      setFrameBackgroundColors(prev => ({
        ...prev,
        [frameId]: color
      }));
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Toolbar with download button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
      }}>
        <Sidebar 
          onAddText={showTextStyling}
          onFileUpload={handleFileUpload}
          onAddFrame={addFrame}
        />
        
        {frames.length > 0 && (
          <button
            onClick={downloadFrame}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Download Design
          </button>
        )}
      </div>
      
      {/* Main Canvas with zoom handling */}
      <div
        id="canvas-container"
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f0f0f0', // Light gray background like Figma
        }}
      >
        {/* Render the fixed frame */}
        {frames.map((frame) => (
          <FixedFrame
            key={frame.id}
            id={frame.id}
            initialSize={frame.size}
            aspectRatio={frame.aspectRatio}
            selected={selectedElement === `frame-${frame.id}`}
            setSelected={() => setSelectedElement(`frame-${frame.id}`)}
            backgroundColor={frameBackgroundColors[frame.id]}
          />
        ))}
        
        {imageSrc && (
          <DraggableResizableImage
            src={imageSrc}
            initialPos={{ x: (window.innerWidth - imageSize.width) / 2, y: (window.innerHeight - imageSize.height) / 2 }}
            initialSize={imageSize}
            selected={selectedElement === 'image'}
            setSelected={() => setSelectedElement('image')}
          />
        )}
        
        {textBoxes.map((textBox) => (
          <DraggableResizableText
            key={textBox.id}
            initialPos={textBox.initialPos}
            initialSize={textBox.initialSize}
            selected={selectedElement === `text-${textBox.id}`}
            setSelected={() => setSelectedElement(`text-${textBox.id}`)}
            initialText={textBox.initialText}
            textStyle={getTextBoxStyle(textBox.id)}
            onStyleChange={(style) => updateTextStyle(style)}
            setFontSize={setFontSize}
            fontSize={fontSize}
          />
        ))}
      </div>

      {/* Text Style Sidebar */}
      {showTextSidebar && (
        <TextStyleSidebar 
          style={selectedElement && selectedElement.startsWith('text-') 
            ? getTextBoxStyle(selectedElement.split('-')[1]) 
            : {}}
          onStyleChange={updateTextStyle}
          onClose={() => setShowTextSidebar(false)}
          onAddText={addTextBox}
          setFontSize={setFontSize}
          fontSize={fontSize}
        />
      )}
      
      {/* Frame Style Sidebar */}
      {showFrameSidebar && (
        <FrameStyleSidebar 
          backgroundColor={frameBackgroundColors[getSelectedFrameId()] || '#ffffff'}
          onBackgroundColorChange={handleFrameBackgroundChange}
          onClose={() => setShowFrameSidebar(false)}
        />
      )}
    </div>
  );
};

export default ImageEditor;
