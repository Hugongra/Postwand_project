import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const CombinedTextEditor = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [mode, setMode] = useState('regular'); // 'regular' or 'stylized'
  const [clipboardData, setClipboardData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Regular text editing states
  const [text, setText] = useState('Double click to edit');
  const [fontSize, setFontSize] = useState(30);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  // Stylized text states
  const [stylizedText, setStylizedText] = useState('Best hanburger!');
  const [stylizedFontSize, setStylizedFontSize] = useState(80);
  const [stylizedFontFamily, setStylizedFontFamily] = useState('Impact');
  const [stylizedTextColor, setStylizedTextColor] = useState('#FFE135');
  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5');
  const [strokeColor, setStrokeColor] = useState('#FF4500');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(5);
  const [shadowOffsetX, setShadowOffsetX] = useState(5);
  const [shadowOffsetY, setShadowOffsetY] = useState(5);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const [angle, setAngle] = useState(0);
  
  // Style presets
  const stylePresets = [
    {
      name: "3D Yellow on Red",
      fontFamily: "Impact",
      fontSize: 80,
      textColor: "#FFE135",
      backgroundColor: "#8B0000",
      strokeColor: "#FF4500",
      strokeWidth: 2,
      shadowColor: "#000000",
      shadowBlur: 5,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
      skewX: 0,
      skewY: 0,
      angle: 0
    },
    {
      name: "Neon Sign",
      fontFamily: "Comic Sans MS",
      fontSize: 70,
      textColor: "#39FF14",
      backgroundColor: "#000000",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      shadowColor: "#39FF14",
      shadowBlur: 15,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      skewX: 0,
      skewY: 0,
      angle: 0
    },
    {
      name: "Retro Slant",
      fontFamily: "Arial Black",
      fontSize: 70,
      textColor: "#FFFFFF",
      backgroundColor: "#0047AB",
      strokeColor: "#FF6EC7",
      strokeWidth: 2,
      shadowColor: "#000000",
      shadowBlur: 2,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      skewX: -15,
      skewY: 0,
      angle: -5
    }
  ];
  
  // Font options for regular text
  const fontOptions = [
    'Arial', 'Times New Roman', 'Courier New', 'Verdana', 
    'Georgia', 'Tahoma', 'Trebuchet MS', 'Impact',
    'Helvetica', 'Calibri', 'Cambria', 'Garamond', 
    'Palatino', 'Bookman', 'Comic Sans MS', 'Candara', 
    'Arial Black', 'Lucida Sans', 'Lucida Console', 
    'Franklin Gothic Medium', 'Segoe UI', 'Futura', 
    'Century Gothic', 'Gill Sans', 'Baskerville', 
    'Consolas', 'Monaco', 'Optima', 'Copperplate', 
    'Broadway', 'Brush Script MT', 'Rockwell'
  ];
  
  // Font options for stylized text
  const stylizedFontOptions = [
    'Impact', 'Arial Black', 'Comic Sans MS', 'Brush Script MT', 
    'Broadway', 'Cooper Black', 'Stencil', 'Verdana', 
    'Georgia', 'Rockwell', 'Trebuchet MS'
  ];

  // Initialize canvas
  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600
    });
    
    // Set background color directly
    fabricCanvas.backgroundColor = backgroundColor;
    fabricCanvas.renderAll();
    
    setCanvas(fabricCanvas);

    // Selection events
    fabricCanvas.on('selection:created', (e) => {
      if (e.target && e.target.type === 'textbox') {
        handleTextboxSelection(e.target);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (e.target && e.target.type === 'textbox') {
        handleTextboxSelection(e.target);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    fabricCanvas.on('object:modified', () => {
      // Save state after object modification
      saveCurrentState();
    });

    // Initial history state
    saveCurrentState();

    // Clean up on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update background color when it changes
  useEffect(() => {
    if (canvas) {
      // Using the correct method to set background color
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  }, [backgroundColor, canvas]);

  // Switch between regular and stylized modes
  useEffect(() => {
    if (canvas) {
      canvas.clear();
      
      if (mode === 'regular') {
        // Set light background for regular mode
        setBackgroundColor('#f5f5f5');
      } else {
        // Apply the background color directly for stylized mode
        canvas.backgroundColor = backgroundColor;
        canvas.renderAll();
        
        // Add a stylized text example if switching to that mode
        addStylizedText();
      }
    }
  }, [mode]);

  // Save current canvas state to history
  const saveCurrentState = () => {
    if (!canvas) return;
    
    // Only keep history up to current index before adding new state
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add current state to history
    const currentState = JSON.stringify(canvas.toJSON());
    newHistory.push(currentState);
    
    // Update history and index
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Helper function to handle textbox selection and update controls
  const handleTextboxSelection = (textbox) => {
    if (!textbox || textbox.type !== 'textbox') return;
    
    setActiveObject(textbox);
    
    // Check if this is a stylized textbox (has stroke or shadow)
    const isStylized = textbox.stroke || textbox.shadow;
    
    if (isStylized) {
      // Update stylized text controls
      setStylizedText(textbox.text || '');
      setStylizedFontSize(textbox.fontSize || 80);
      setStylizedFontFamily(textbox.fontFamily || 'Impact');
      setStylizedTextColor(textbox.fill || '#FFE135');
      setStrokeColor(textbox.stroke || '#FF4500');
      setStrokeWidth(textbox.strokeWidth || 2);
      
      if (textbox.shadow) {
        setShadowColor(textbox.shadow.color || '#000000');
        setShadowBlur(textbox.shadow.blur || 5);
        setShadowOffsetX(textbox.shadow.offsetX || 5);
        setShadowOffsetY(textbox.shadow.offsetY || 5);
      }
      
      setSkewX(textbox.skewX || 0);
      setSkewY(textbox.skewY || 0);
      setAngle(textbox.angle || 0);
    } else {
      // Update regular text controls
      setText(textbox.text || '');
      setFontSize(textbox.fontSize || 30);
      setFontFamily(textbox.fontFamily || 'Arial');
      setTextColor(textbox.fill || '#000000');
      setIsBold(textbox.fontWeight === 'bold');
      setIsItalic(textbox.fontStyle === 'italic');
      setIsUnderline(textbox.underline || false);
    }
  };

  // Add regular text to canvas
  const addText = () => {
    if (!canvas) return;
    
    const textbox = new fabric.Textbox('Double click to edit', {
      left: 200,
      top: 200,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      cornerSize: 12,
      transparentCorners: false,
      cornerColor: '#0096FF',
      editingBorderColor: '#0096FF'
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    handleTextboxSelection(textbox);
    
    // Save state after adding text
    saveCurrentState();
  };

  // Add stylized text to canvas
  const addStylizedText = () => {
    if (!canvas) return;
    
    // Create a shadow object
    const shadow = new fabric.Shadow({
      color: shadowColor,
      blur: shadowBlur,
      offsetX: shadowOffsetX,
      offsetY: shadowOffsetY
    });
    
    // Create a textbox with all styling properties
    const textbox = new fabric.Textbox(stylizedText, {
      left: 50,
      top: 150,
      fontFamily: stylizedFontFamily,
      fontSize: stylizedFontSize,
      fill: stylizedTextColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      shadow: shadow,
      skewX: skewX,
      skewY: skewY,
      angle: angle,
      textAlign: 'center',
      width: 700,
      cornerSize: 12,
      transparentCorners: false,
      cornerColor: '#0096FF',
      editingBorderColor: '#0096FF'
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    handleTextboxSelection(textbox);
    canvas.centerObject(textbox);
    
    // Save state after adding text
    saveCurrentState();
  };

  // Apply style preset
  const applyPreset = (preset) => {
    setStylizedFontFamily(preset.fontFamily);
    setStylizedFontSize(preset.fontSize);
    setStylizedTextColor(preset.textColor);
    setBackgroundColor(preset.backgroundColor);
    setStrokeColor(preset.strokeColor);
    setStrokeWidth(preset.strokeWidth);
    setShadowColor(preset.shadowColor);
    setShadowBlur(preset.shadowBlur);
    setShadowOffsetX(preset.shadowOffsetX);
    setShadowOffsetY(preset.shadowOffsetY);
    setSkewX(preset.skewX);
    setSkewY(preset.skewY);
    setAngle(preset.angle);
    
    // Apply changes to active object if it's a stylized textbox
    updateStylizedObject();
  };

  // Update regular text properties
  useEffect(() => {
    if (activeObject && canvas && mode === 'regular') {
      activeObject.set({
        text: text,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: textColor,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        underline: isUnderline
      });
      
      canvas.renderAll();
    }
  }, [text, fontSize, fontFamily, textColor, isBold, isItalic, isUnderline, activeObject, canvas]);

  // Update stylized object
  const updateStylizedObject = () => {
    if (activeObject && canvas && mode === 'stylized') {
      // Create a new shadow with current settings
      const shadow = new fabric.Shadow({
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY
      });
      
      // Update all properties
      activeObject.set({
        text: stylizedText,
        fontFamily: stylizedFontFamily,
        fontSize: stylizedFontSize,
        fill: stylizedTextColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        shadow: shadow,
        skewX: skewX,
        skewY: skewY,
        angle: angle
      });
      
      canvas.renderAll();
    }
  };

  // Update stylized text properties
  useEffect(() => {
    updateStylizedObject();
  }, [stylizedText, stylizedFontSize, stylizedFontFamily, stylizedTextColor, 
      strokeColor, strokeWidth, shadowColor, shadowBlur, shadowOffsetX, 
      shadowOffsetY, skewX, skewY, angle, activeObject, canvas]);

  // Delete selected object
  const deleteSelected = () => {
    if (!canvas || !canvas.getActiveObject()) return;
    
    canvas.remove(canvas.getActiveObject());
    setActiveObject(null);
    canvas.renderAll();
    
    // Save state after deletion
    saveCurrentState();
  };

  // Copy selected object
  const copySelected = () => {
    if (!canvas || !canvas.getActiveObject()) return;
    
    const activeObj = canvas.getActiveObject();
    if (activeObj.type === 'textbox') {
      // Store all properties in clipboard
      const data = {
        type: 'textbox',
        text: activeObj.text,
        left: activeObj.left,
        top: activeObj.top,
        width: activeObj.width,
        fontSize: activeObj.fontSize,
        fontFamily: activeObj.fontFamily,
        fill: activeObj.fill,
        fontWeight: activeObj.fontWeight,
        fontStyle: activeObj.fontStyle,
        underline: activeObj.underline,
        stroke: activeObj.stroke,
        strokeWidth: activeObj.strokeWidth,
        shadow: activeObj.shadow,
        skewX: activeObj.skewX,
        skewY: activeObj.skewY,
        angle: activeObj.angle,
        scaleX: activeObj.scaleX,
        scaleY: activeObj.scaleY
      };
      
      setClipboardData(data);
      console.log('Text copied to clipboard');
    }
  };

  // Cut selected object
  const cutSelected = () => {
    if (!canvas || !canvas.getActiveObject()) return;
    
    copySelected();
    deleteSelected();
    console.log('Text cut to clipboard');
  };

  // Paste from clipboard
  const pasteFromClipboard = () => {
    if (!canvas || !clipboardData) return;
    
    // Create a new textbox from clipboard data
    if (clipboardData.type === 'textbox') {
      const options = {
        left: clipboardData.left + 20,  // Offset slightly
        top: clipboardData.top + 20,
        width: clipboardData.width,
        fontSize: clipboardData.fontSize,
        fontFamily: clipboardData.fontFamily,
        fill: clipboardData.fill,
        fontWeight: clipboardData.fontWeight,
        fontStyle: clipboardData.fontStyle,
        underline: clipboardData.underline,
        angle: clipboardData.angle,
        scaleX: clipboardData.scaleX,
        scaleY: clipboardData.scaleY,
        cornerSize: 12,
        transparentCorners: false,
        cornerColor: '#0096FF',
        editingBorderColor: '#0096FF'
      };
      
      // Add stylized properties if they exist
      if (clipboardData.stroke) options.stroke = clipboardData.stroke;
      if (clipboardData.strokeWidth) options.strokeWidth = clipboardData.strokeWidth;
      if (clipboardData.shadow) options.shadow = new fabric.Shadow(clipboardData.shadow);
      if (clipboardData.skewX) options.skewX = clipboardData.skewX;
      if (clipboardData.skewY) options.skewY = clipboardData.skewY;
      
      const newTextbox = new fabric.Textbox(clipboardData.text, options);
      
      canvas.add(newTextbox);
      canvas.setActiveObject(newTextbox);
      handleTextboxSelection(newTextbox);
      canvas.renderAll();
      
      // Save state after pasting
      saveCurrentState();
      console.log('Text pasted from clipboard');
    }
  };

  // Undo function
  const undo = () => {
    if (!canvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const stateToRestore = history[newIndex];
    
    canvas.loadFromJSON(JSON.parse(stateToRestore), () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      setActiveObject(null);
      console.log('Undo operation completed');
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canvas) return;
      
      // Ctrl key combinations
      if (e.ctrlKey) {
        // Ctrl+C: Copy
        if (e.key === 'c') {
          e.preventDefault();
          copySelected();
        }
        
        // Ctrl+X: Cut
        else if (e.key === 'x') {
          e.preventDefault();
          cutSelected();
        }
        
        // Ctrl+V: Paste
        else if (e.key === 'v') {
          e.preventDefault();
          pasteFromClipboard();
        }
        
        // Ctrl+Z: Undo
        else if (e.key === 'z') {
          e.preventDefault();
          undo();
        }
      }
      
      // Delete key
      if (e.key === 'Delete' && canvas.getActiveObject()) {
        e.preventDefault();
        deleteSelected();
      }
    };
    
    // Attach event listener to document
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, clipboardData, history, historyIndex]);

  // Export canvas as image
  const exportAsImage = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'text-editor-export.png';
      link.click();
    }
  };

  return (
    <div className="editor-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Combined Text Editor</h2>
      
      {/* Mode Selector */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMode('regular')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: mode === 'regular' ? '#4CAF50' : '#f0f0f0',
            color: mode === 'regular' ? 'white' : 'black',
            border: 'none',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Regular Text Editor
        </button>
        
        <button 
          onClick={() => setMode('stylized')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: mode === 'stylized' ? '#4CAF50' : '#f0f0f0',
            color: mode === 'stylized' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Stylized Text Creator
        </button>
      </div>
      
      {/* Canvas Container */}
      <div className="canvas-container" style={{ 
        border: '1px solid #ccc', 
        marginBottom: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <canvas ref={canvasRef} />
      </div>
      
      {/* Regular Text Editor Controls */}
      {mode === 'regular' && (
        <div className="regular-controls">
          <div className="toolbar" style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <button 
              onClick={addText}
              style={{ marginRight: '10px', padding: '5px 10px' }}
            >
              Add Text
            </button>
            
            {/* Text formatting controls */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              opacity: activeObject ? 1 : 0.5,
              marginBottom: '10px'
            }}>
              <input 
                type="text" 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                style={{ marginRight: '10px', padding: '5px' }}
                disabled={!activeObject}
              />
              
              <select 
                value={fontFamily} 
                onChange={(e) => setFontFamily(e.target.value)}
                style={{ marginRight: '10px', padding: '5px', minWidth: '150px' }}
                disabled={!activeObject}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
              
              <input 
                type="number" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                min="10" 
                max="100"
                style={{ width: '60px', marginRight: '10px', padding: '5px' }}
                disabled={!activeObject}
              />
              
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)}
                style={{ marginRight: '10px' }}
                disabled={!activeObject}
              />
              
              <button 
                onClick={() => setIsBold(!isBold)}
                style={{ 
                  marginRight: '5px', 
                  padding: '5px 10px',
                  fontWeight: 'bold',
                  backgroundColor: isBold ? '#ddd' : '#fff'
                }}
                disabled={!activeObject}
              >
                B
              </button>
              
              <button 
                onClick={() => setIsItalic(!isItalic)}
                style={{ 
                  marginRight: '5px', 
                  padding: '5px 10px',
                  fontStyle: 'italic',
                  backgroundColor: isItalic ? '#ddd' : '#fff'
                }}
                disabled={!activeObject}
              >
                I
              </button>
              
              <button 
                onClick={() => setIsUnderline(!isUnderline)}
                style={{ 
                  marginRight: '10px', 
                  padding: '5px 10px',
                  textDecoration: 'underline',
                  backgroundColor: isUnderline ? '#ddd' : '#fff'
                }}
                disabled={!activeObject}
              >
                U
              </button>
            </div>
            
            {/* Clipboard and edit controls */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={copySelected}
                style={{ marginRight: '5px', padding: '5px 10px' }}
                disabled={!activeObject}
                title="Copy (Ctrl+C)"
              >
                Copy
              </button>
              
              <button 
                onClick={cutSelected}
                style={{ marginRight: '5px', padding: '5px 10px' }}
                disabled={!activeObject}
                title="Cut (Ctrl+X)"
              >
                Cut
              </button>
              
              <button 
                onClick={pasteFromClipboard}
                style={{ marginRight: '5px', padding: '5px 10px' }}
                disabled={!clipboardData}
                title="Paste (Ctrl+V)"
              >
                Paste
              </button>
              
              <button 
                onClick={undo}
                style={{ marginRight: '5px', padding: '5px 10px' }}
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
              
              <button 
                onClick={deleteSelected}
                style={{ 
                  padding: '5px 10px', 
                  backgroundColor: '#ff6b6b', 
                  color: 'white', 
                  border: 'none',
                  marginLeft: '10px'
                }}
                disabled={!activeObject}
                title="Delete (Delete key)"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="instructions" style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul>
              <li><strong>Ctrl+C:</strong> Copy selected text</li>
              <li><strong>Ctrl+X:</strong> Cut selected text</li>
              <li><strong>Ctrl+V:</strong> Paste copied text</li>
              <li><strong>Ctrl+Z:</strong> Undo last action</li>
              <li><strong>Delete:</strong> Remove selected text</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Stylized Text Creator Controls */}
      {mode === 'stylized' && (
        <div className="stylized-controls">
          {/* Text Content */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Text Content</h3>
            <input 
              type="text" 
              value={stylizedText} 
              onChange={(e) => setStylizedText(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
            <button 
              onClick={addStylizedText}
              style={{ 
                marginTop: '10px',
                padding: '8px 16px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Add Stylized Text
            </button>
          </div>
          
          {/* Preset Styles */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Preset Styles</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {stylePresets.map((preset, index) => (
                <button 
                  key={index}
                  onClick={() => applyPreset(preset)}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: preset.backgroundColor,
                    color: preset.textColor,
                    border: `2px solid ${preset.strokeColor}`,
                    fontFamily: preset.fontFamily,
                    transform: `skew(${preset.skewX}deg, ${preset.skewY}deg) rotate(${preset.angle}deg)`,
                    cursor: 'pointer'
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Style Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Text Formatting */}
            <div>
              <h3>Text Formatting</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Font Family:</label>
                <select 
                  value={stylizedFontFamily} 
                  onChange={(e) => setStylizedFontFamily(e.target.value)}
                  style={{ width: '100%', padding: '5px' }}
                >
                  {stylizedFontOptions.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Font Size: {stylizedFontSize}px</label>
                <input 
                  type="range" 
                  min="20" 
                  max="200" 
                  value={stylizedFontSize} 
                  onChange={(e) => setStylizedFontSize(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Text Color:</label>
                <input 
                  type="color" 
                  value={stylizedTextColor} 
                  onChange={(e) => setStylizedTextColor(e.target.value)}
                  style={{ width: '100%', height: '30px' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Background Color:</label>
                <input 
                  type="color" 
                  value={backgroundColor} 
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{ width: '100%', height: '30px' }}
                />
              </div>
            </div>
            
            {/* Stroke & Shadow */}
            <div>
              <h3>Stroke & Shadow</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Stroke Color:</label>
                <input 
                  type="color" 
                  value={strokeColor} 
                  onChange={(e) => setStrokeColor(e.target.value)}
                  style={{ width: '100%', height: '30px' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Stroke Width: {strokeWidth}px</label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={strokeWidth} 
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Shadow Color:</label>
                <input 
                  type="color" 
                  value={shadowColor} 
                  onChange={(e) => setShadowColor(e.target.value)}
                  style={{ width: '100%', height: '30px' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Shadow Blur: {shadowBlur}px</label>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={shadowBlur} 
                  onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Shadow Offset X: {shadowOffsetX}px</label>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={shadowOffsetX} 
                  onChange={(e) => setShadowOffsetX(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Shadow Offset Y: {shadowOffsetY}px</label>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={shadowOffsetY} 
                  onChange={(e) => setShadowOffsetY(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            {/* Transformation */}
            <div>
              <h3>Transformation</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Skew X: {skewX}°</label>
                <input 
                  type="range" 
                  min="-45" 
                  max="45" 
                  value={skewX} 
                  onChange={(e) => setSkewX(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Skew Y: {skewY}°</label>
                <input 
                  type="range" 
                  min="-45" 
                  max="45" 
                  value={skewY} 
                  onChange={(e) => setSkewY(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Rotation: {angle}°</label>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  value={angle} 
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Clipboard Controls for Stylized Mode */}
              <div style={{ marginTop: '20px' }}>
                <h3>Edit Operations</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={copySelected}
                    style={{ padding: '5px 10px' }}
                    disabled={!activeObject}
                  >
                    Copy
                  </button>
                  
                  <button 
                    onClick={cutSelected}
                    style={{ padding: '5px 10px' }}
                    disabled={!activeObject}
                  >
                    Cut
                  </button>
                  
                  <button 
                    onClick={pasteFromClipboard}
                    style={{ padding: '5px 10px' }}
                    disabled={!clipboardData}
                  >
                    Paste
                  </button>
                  
                  <button 
                    onClick={deleteSelected}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#ff6b6b', 
                      color: 'white', 
                      border: 'none'
                    }}
                    disabled={!activeObject}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Common Export Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={exportAsImage}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Export as Image
        </button>
      </div>
    </div>
  );
};

export default CombinedTextEditor;