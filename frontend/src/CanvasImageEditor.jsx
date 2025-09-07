import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, ImageUp, ChevronLeft, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Strikethrough, Plus, Minus, Square, Download, Trash2, ChevronUp, ChevronDown, Layers, Eye, EyeOff } from 'lucide-react';

// Constants
const HANDLE_SIZE = 15; // Increased from 8 to make handles bigger and easier to grab
const MIN_ELEMENT_SIZE = 20;
const GRID_SIZE = 10;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 300;

// Helper functions
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getCursorForDirection = (direction) => {
  const cursorMap = {
    'top-left': 'nw-resize',
    'top-right': 'ne-resize', 
    'bottom-left': 'sw-resize',
    'bottom-right': 'se-resize',
    'top': 'ns-resize',
    'bottom': 'ns-resize',
    'left': 'ew-resize',
    'right': 'ew-resize'
  };
  return cursorMap[direction] || 'default';
};

// Base Canvas Element Class
class CanvasElement {
  constructor(x, y, width, height, type) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.rotation = 0;
    this.selected = false;
    this.zIndex = 0;
    this.opacity = 1;
    this.locked = false;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  hitTest(x, y) {
    return x >= this.x && x <= this.x + this.width && 
           y >= this.y && y <= this.y + this.height;
  }

  getHandles() {
    const handles = [];
    const { x, y, width, height } = this.getBounds();
    
    // Corner handles
    handles.push({ type: 'top-left', x: x - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'top-right', x: x + width - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-left', x: x - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-right', x: x + width - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    
    // Edge handles
    handles.push({ type: 'top', x: x + width/2 - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom', x: x + width/2 - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    handles.push({ type: 'left', x: x - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2 });
    handles.push({ type: 'right', x: x + width - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2 });
    
    return handles;
  }

  draw(ctx) {
    // Override in subclasses
  }

  drawSelection(ctx) {
    if (!this.selected || this.locked) return;
    
    const { x, y, width, height } = this.getBounds();
    
    // Draw selection border in purple
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, width, height);
    
    // Draw round handles in purple
    const handles = this.getHandles();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    
    handles.forEach(handle => {
      // Draw circular handles
      ctx.beginPath();
      ctx.arc(handle.x + HANDLE_SIZE/2, handle.y + HANDLE_SIZE/2, HANDLE_SIZE/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  // Convert element to JSON for serialization
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      zIndex: this.zIndex,
      opacity: this.opacity,
      locked: this.locked
    };
  }
}

// Text Element Class with improved scaling
class TextElement extends CanvasElement {
  constructor(x, y, width, height, text = 'Edit me') {
    super(x, y, width, height, 'text');
    this.text = text;
    this.fontSize = 18;
    this.baseFontSize = 18; // Base font size for scaling calculations
    this.fontFamily = 'Arial';
    this.fontWeight = 'normal';
    this.fontStyle = 'normal';
    this.textAlign = 'left';
    this.color = '#000000';
    this.textDecoration = 'none';
    this.backgroundColor = 'transparent';
    this.padding = 3; // Reduced padding for tighter text wrapping
    this.lineHeight = 1.2;
    this.baseWidth = width;
    this.baseHeight = height;
    this.isBeingEdited = false; // Flag to hide when editing
    this.isHorizontalResize = false; // Flag to track horizontal-only resizing
  }

  // Update font size based on element scaling - FIXED to scale correctly
  updateFontSize() {
    // Calculate scale based on area change (more natural scaling)
    const currentArea = this.width * this.height;
    const baseArea = this.baseWidth * this.baseHeight;
    const scale = Math.sqrt(currentArea / baseArea); // Square root for more natural scaling
    
    this.fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, this.baseFontSize * scale));
  }

  // Get scaled padding that maintains visual consistency
  getScaledPadding() {
    const scale = this.fontSize / this.baseFontSize;
    return this.padding * scale;
  }

  // Method to update base dimensions when font size is manually changed
  updateBaseDimensions() {
    this.baseWidth = this.width;
    this.baseHeight = this.height;
    this.baseFontSize = this.fontSize;
  }

  // Auto-resize textbox to fit content tightly
  autoResizeToContent(ctx) {
    // Measure the actual text content
    const oldFont = ctx.font;
    const fontWeight = this.fontWeight === 'Bold' ? 'bold' : this.fontWeight === 'Light' ? '300' : 'normal';
    ctx.font = `${this.fontStyle} ${fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    
    // Get current scaled padding
    const scaledPadding = this.getScaledPadding();
    
    // Measure text dimensions
    const lines = this.text.split('\n');
    let maxWidth = 0;
    let totalHeight = 0;
    
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });
    
    totalHeight = lines.length * this.fontSize * this.lineHeight;
    
    // Fit content naturally with just padding (no arbitrary minimums)
    const contentWidth = maxWidth + (scaledPadding * 2);
    const contentHeight = totalHeight + (scaledPadding * 2);
    
    // Only apply absolute minimum for usability (much smaller than before)
    const newWidth = Math.max(contentWidth, MIN_ELEMENT_SIZE);
    const newHeight = Math.max(contentHeight, MIN_ELEMENT_SIZE);
    
    // Update dimensions
    this.width = newWidth;
    this.height = newHeight;
    this.baseWidth = newWidth;
    this.baseHeight = newHeight;
    
    // Restore original font
    ctx.font = oldFont;
  }

  // Get minimum size for this text element based on its current content
  getContentBasedMinimum(ctx) {
    // Temporarily measure at minimum font size to get absolute minimum
    const oldFont = ctx.font;
    const fontWeight = this.fontWeight === 'Bold' ? 'bold' : this.fontWeight === 'Light' ? '300' : 'normal';
    ctx.font = `${this.fontStyle} ${fontWeight} ${MIN_FONT_SIZE}px ${this.fontFamily}`;
    
    const minPadding = 2; // Minimum padding at smallest size
    const lines = this.text.split('\n');
    let maxWidth = 0;
    
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });
    
    const minContentWidth = maxWidth + (minPadding * 2);
    const minContentHeight = lines.length * MIN_FONT_SIZE * this.lineHeight + (minPadding * 2);
    
    // Restore original font
    ctx.font = oldFont;
    
    return {
      width: Math.max(minContentWidth, MIN_ELEMENT_SIZE),
      height: Math.max(minContentHeight, MIN_ELEMENT_SIZE)
    };
  }

  // Override getHandles to only show corner and left/right handles for text elements
  getHandles() {
    const handles = [];
    const { x, y, width, height } = this.getBounds();
    
    // Only corner handles and left/right handles for text elements
    // Corner handles
    handles.push({ type: 'top-left', x: x - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'top-right', x: x + width - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-left', x: x - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-right', x: x + width - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    
    // Only left and right edge handles (no top/bottom)
    handles.push({ type: 'left', x: x - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2 });
    handles.push({ type: 'right', x: x + width - HANDLE_SIZE/2, y: y + height/2 - HANDLE_SIZE/2 });
    
    return handles;
  }

  draw(ctx) {
    // Don't draw if currently being edited (prevents doubling)
    // Check both isBeingEdited flag AND global editingText state for reliability
    if (this.isBeingEdited) return;
    
    ctx.save();
    
    // Only update font size if not doing horizontal-only resize
    if (!this.isHorizontalResize) {
      this.updateFontSize();
    }
    
    // Get scaled padding for consistent visual appearance
    const scaledPadding = this.getScaledPadding();
    
    // Set text properties
    const fontWeight = this.fontWeight === 'Bold' ? 'bold' : this.fontWeight === 'Light' ? '300' : 'normal';
    ctx.font = `${this.fontStyle} ${fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.globalAlpha = this.opacity;
    
    // Draw background if set
    if (this.backgroundColor !== 'transparent') {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // Set text color
    ctx.fillStyle = this.color;
    
    // Calculate text position based on alignment with scaled padding
    let textX = this.x + scaledPadding;
    if (this.textAlign === 'center') {
      textX = this.x + this.width / 2;
      ctx.textAlign = 'center';
    } else if (this.textAlign === 'right') {
      textX = this.x + this.width - scaledPadding;
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'left';
    }
    
    // Apply text decorations
    if (this.textDecoration === 'underline') {
      ctx.save();
      const metrics = ctx.measureText(this.text);
      const textY = this.y + scaledPadding;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      if (this.textAlign === 'center') {
        ctx.moveTo(textX - metrics.width/2, textY + this.fontSize);
        ctx.lineTo(textX + metrics.width/2, textY + this.fontSize);
      } else if (this.textAlign === 'right') {
        ctx.moveTo(textX - metrics.width, textY + this.fontSize);
        ctx.lineTo(textX, textY + this.fontSize);
      } else {
        ctx.moveTo(textX, textY + this.fontSize);
        ctx.lineTo(textX + metrics.width, textY + this.fontSize);
      }
      
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw text with wrapping using scaled padding
    this.drawWrappedText(ctx, this.text, textX, this.y + scaledPadding, scaledPadding);
    
    ctx.restore();
  }

  drawWrappedText(ctx, text, x, y, padding) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const maxWidth = this.width - (2 * padding);
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += this.fontSize * this.lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      text: this.text,
      fontSize: this.fontSize,
      baseFontSize: this.baseFontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textAlign: this.textAlign,
      color: this.color,
      textDecoration: this.textDecoration,
      backgroundColor: this.backgroundColor,
      padding: this.padding,
      lineHeight: this.lineHeight,
      baseWidth: this.baseWidth,
      baseHeight: this.baseHeight,
      isBeingEdited: false, // Don't save editing state
      isHorizontalResize: false // Don't save resize state
    };
  }
}

// Image Element Class with aspect ratio preservation
class ImageElement extends CanvasElement {
  constructor(x, y, width, height, imageSrc) {
    super(x, y, width, height, 'image');
    this.imageSrc = imageSrc;
    this.imageObj = null;
    this.loaded = false;
    this.aspectRatio = width / height;
    this.loadImage();
  }

  loadImage() {
    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.loaded = true;
      this.aspectRatio = this.imageObj.naturalWidth / this.imageObj.naturalHeight;
    };
    this.imageObj.onerror = () => {
      console.error('Failed to load image:', this.imageSrc);
    };
    this.imageObj.src = this.imageSrc;
  }

  draw(ctx) {
    if (this.loaded && this.imageObj) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(this.imageObj, this.x, this.y, this.width, this.height);
      ctx.restore();
    } else {
      // Draw placeholder
      ctx.save();
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', this.x + this.width/2, this.y + this.height/2);
      ctx.restore();
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      imageSrc: this.imageSrc,
      aspectRatio: this.aspectRatio
    };
  }
}

// Frame Element Class with improved hit testing
class FrameElement extends CanvasElement {
  constructor(x, y, width, height, aspectRatio) {
    super(x, y, width, height, 'frame');
    this.aspectRatio = aspectRatio;
    this.backgroundColor = '#ffffff';
    this.borderColor = '#ddd';
    this.borderWidth = 2;
  }

  draw(ctx) {
    ctx.save();
    
    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw border
    ctx.strokeStyle = this.selected ? '#8b5cf6' : this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    ctx.restore();
  }

  // Allow selection from border area only, but with generous border for usability
  hitTest(x, y) {
    const borderSensitivity = 20; // Increased from 10px for easier selection
    const inBounds = x >= this.x && x <= this.x + this.width && 
                     y >= this.y && y <= this.y + this.height;
    
    if (!inBounds) return false;
    
    // Check if click is near any edge (border area only)
    return (
      x < this.x + borderSensitivity || // Left border
      y < this.y + borderSensitivity || // Top border
      x > this.x + this.width - borderSensitivity || // Right border
      y > this.y + this.height - borderSensitivity // Bottom border
    );
  }

  // Override getHandles to only show corner handles for frames
  getHandles() {
    const handles = [];
    const { x, y, width, height } = this.getBounds();
    
    // Only corner handles for frames to maintain aspect ratio
    handles.push({ type: 'top-left', x: x - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'top-right', x: x + width - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-left', x: x - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    handles.push({ type: 'bottom-right', x: x + width - HANDLE_SIZE/2, y: y + height - HANDLE_SIZE/2 });
    
    return handles;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      aspectRatio: this.aspectRatio,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      borderWidth: this.borderWidth
    };
  }
}

// Event Emitter for UI synchronization
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// History Manager for undo/redo
class HistoryManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = 50;
  }

  saveState(elements) {
    const state = JSON.stringify(elements.map(el => el.toJSON()));
    
    // Remove any history after current index
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.history.push(state);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(this.history[this.currentIndex]);
    }
    return null;
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(this.history[this.currentIndex]);
    }
    return null;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

// Element restoration helper
const restoreElement = (elementData) => {
  if (!elementData) return null;
  
  let element;
  switch (elementData.type) {
    case 'text':
      element = new TextElement(elementData.x, elementData.y, elementData.width, elementData.height, elementData.text);
      break;
    case 'image':
      element = new ImageElement(elementData.x, elementData.y, elementData.width, elementData.height, elementData.imageSrc);
      break;
    case 'frame':
      element = new FrameElement(elementData.x, elementData.y, elementData.width, elementData.height, elementData.aspectRatio);
      break;
    default:
      return null;
  }
  
  // Restore all properties
  Object.assign(element, elementData);
  
  // Always reset editing state when restoring
  if (element.type === 'text') {
    element.isBeingEdited = false;
  }
  
  return element;
};

// Main Canvas Editor Hook
const useCanvasEditor = (canvasRef) => {
  const [elements, setElementsRaw] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragState, setDragState] = useState({ 
    isDragging: false, 
    isResizing: false, 
    resizeHandle: null,
    startBounds: null,
    startMouse: null,
    aspectRatioLocked: false
  });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(null);
  const [activeFrame, setActiveFrame] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const historyManager = useRef(new HistoryManager());
  const eventEmitter = useRef(new EventEmitter());
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Custom state setter that ensures elements are properly instantiated
  const setElements = useCallback((elementsOrUpdater) => {
    setElementsRaw(prevElements => {
      const newElements = typeof elementsOrUpdater === 'function' 
        ? elementsOrUpdater(prevElements)
        : elementsOrUpdater;
        
      // Ensure all elements are properly instantiated
      return newElements.map(el => el instanceof CanvasElement ? el : restoreElement(el)).filter(Boolean);
    });
  }, []);

  // Define selectElement before it's used
  const selectElement = useCallback((id) => {
    // Clear any existing text editing when selecting a different element
    if (editingText && editingText.id !== id) {
      setElements(prev => prev.map(el => 
        el.id === editingText.id 
          ? { ...el, isBeingEdited: false }
          : el
      ));
      setEditingText(null);
    }
    
    setSelectedElement(id);
    
    // Update selection state of all elements
    setElements(prev => prev.map(el => ({
      ...el,
      selected: el.id === id
    })));
    
    // Emit event for UI synchronization
    if (id) {
      const element = elements.find(el => el.id === id);
      if (element) {
        eventEmitter.current.emit('elementSelected', element);
      }
    } else {
      eventEmitter.current.emit('elementSelected', null);
    }
  }, [elements, setElements, editingText]);

  // Get mouse position relative to canvas with zoom and pan adjustments
  const getMousePos = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom
    };
  }, [canvasRef, zoom, panOffset]);

  // Canvas setup with zoom support
  const setupCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Set canvas display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }, [canvasRef]);

  // Render function with zoom and pan support
  const render = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(panOffset.x / zoom, panOffset.y / zoom);
    
    // Sort elements by zIndex
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    // Draw all elements
    sortedElements.forEach(element => {
      // For text elements being edited, skip the text content but still show selection
      if (element.type === 'text' && editingText && element.id === editingText.id) {
        // Still draw selection handles/border so user can see the textbox boundaries
        if (element.selected) {
          element.drawSelection(ctx);
        }
        return; // Skip drawing the actual text content
      }
      
      element.draw(ctx);
      if (element.selected) {
        element.drawSelection(ctx);
      }
    });
    
    ctx.restore();
  }, [elements, canvasRef, editingText, zoom, panOffset]);

  // Hit testing
  const getElementAt = useCallback((x, y) => {
    // Check from top to bottom (reverse z-index order)
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const element of sortedElements) {
      if (element.hitTest(x, y)) {
        return element;
      }
    }
    return null;
  }, [elements]);

  // Check if point is on a resize handle
  const getHandleAt = useCallback((x, y, element) => {
    if (!element || !element.selected) return null;
    
    const handles = element.getHandles();
    
    // More reasonable hit detection - covers the full handle visually
    const HANDLE_HIT_BUFFER = 4; // Reasonable extra pixels around handle for easier clicking
    
    // Check corner handles first as they're most important
    const cornerHandles = handles.filter(h => h.type.includes('-'));
    const edgeHandles = handles.filter(h => !h.type.includes('-'));
    
    // Check corner handles first - align hit detection with visual circle center
    for (const handle of cornerHandles) {
      // The visual circle is drawn at handle.x + HANDLE_SIZE/2, handle.y + HANDLE_SIZE/2
      const circleCenterX = handle.x + HANDLE_SIZE/2;
      const circleCenterY = handle.y + HANDLE_SIZE/2;
      const hitRadius = (HANDLE_SIZE/2) + HANDLE_HIT_BUFFER;
      
      // Use circular hit detection for better alignment with visual circles
      const distance = Math.sqrt((x - circleCenterX) * (x - circleCenterX) + (y - circleCenterY) * (y - circleCenterY));
      if (distance <= hitRadius) {
        return handle.type;
      }
    }
    
    // Then check edge handles with same circular hit detection
    for (const handle of edgeHandles) {
      const circleCenterX = handle.x + HANDLE_SIZE/2;
      const circleCenterY = handle.y + HANDLE_SIZE/2;
      const hitRadius = (HANDLE_SIZE/2) + HANDLE_HIT_BUFFER;
      
      const distance = Math.sqrt((x - circleCenterX) * (x - circleCenterX) + (y - circleCenterY) * (y - circleCenterY));
      if (distance <= hitRadius) {
        return handle.type;
      }
    }
    
    return null;
  }, []);

  // Start panning with space+drag or middle mouse button
  const startPan = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.getModifierState('Space'))) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  }, []);

  // Pan the canvas
  const handlePan = useCallback((e) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // End panning
  const endPan = useCallback(() => {
    isPanning.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  }, []);

  // Calculate new bounds during resize with cursor-following handles (like Canva)
  const calculateNewBounds = useCallback((element, currentMouse, startMouse, startBounds, handleType, preserveAspectRatio) => {
    const bounds = { ...startBounds };
    const aspectRatio = startBounds.width / startBounds.height;
    
    // Get appropriate minimum size based on element type
    let minSize;
    if (element.type === 'text') {
      // For text elements, use content-based minimum
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const contentMin = element.getContentBasedMinimum(ctx);
        minSize = Math.min(contentMin.width, contentMin.height); // Use smaller dimension as constraint
      } else {
        minSize = MIN_ELEMENT_SIZE; // Fallback
      }
    } else {
      // For other elements, use standard minimum
      minSize = MIN_ELEMENT_SIZE;
    }
    
    if (preserveAspectRatio && handleType.includes('-')) {
      // Corner handles with aspect ratio preservation - handle follows cursor
      let newWidth, newHeight;
      
      switch (handleType) {
        case 'top-left':
          // Use distance from opposite corner for stable resizing
          const maxWidth = startBounds.x + startBounds.width - currentMouse.x;
          const maxHeight = startBounds.y + startBounds.height - currentMouse.y;
          
          // Use the smaller constraint to maintain aspect ratio
          if (maxWidth / aspectRatio <= maxHeight) {
            newWidth = Math.max(minSize, maxWidth);
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = Math.max(minSize, maxHeight);
            newWidth = newHeight * aspectRatio;
          }
          
          bounds.x = (startBounds.x + startBounds.width) - newWidth;
          bounds.y = (startBounds.y + startBounds.height) - newHeight;
          bounds.width = newWidth;
          bounds.height = newHeight;
          break;
          
        case 'top-right':
          const availWidth = currentMouse.x - startBounds.x;
          const availHeight = startBounds.y + startBounds.height - currentMouse.y;
          
          // Use the smaller constraint to maintain aspect ratio
          if (availWidth / aspectRatio <= availHeight) {
            newWidth = Math.max(minSize, availWidth);
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = Math.max(minSize, availHeight);
            newWidth = newHeight * aspectRatio;
          }
          
          bounds.y = (startBounds.y + startBounds.height) - newHeight;
          bounds.width = newWidth;
          bounds.height = newHeight;
          break;
          
        case 'bottom-left':
          const widthFromRight = startBounds.x + startBounds.width - currentMouse.x;
          const heightFromTop = currentMouse.y - startBounds.y;
          
          // Use the smaller constraint to maintain aspect ratio
          if (widthFromRight / aspectRatio <= heightFromTop) {
            newWidth = Math.max(minSize, widthFromRight);
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = Math.max(minSize, heightFromTop);
            newWidth = newHeight * aspectRatio;
          }
          
          bounds.x = (startBounds.x + startBounds.width) - newWidth;
          bounds.width = newWidth;
          bounds.height = newHeight;
          break;
          
        case 'bottom-right':
          // Simplified stable approach - use mouse distance from origin corner
          const mouseDistanceX = currentMouse.x - startBounds.x;
          const mouseDistanceY = currentMouse.y - startBounds.y;
          
          // Calculate diagonal distance and scale proportionally
          const currentDiagonal = Math.sqrt(mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY);
          const startDiagonal = Math.sqrt(startBounds.width * startBounds.width + startBounds.height * startBounds.height);
          
          // Prevent division by zero and ensure minimum size
          if (startDiagonal > 0 && currentDiagonal > 0) {
            const scale = Math.max(minSize / Math.min(startBounds.width, startBounds.height), currentDiagonal / startDiagonal);
            newWidth = Math.max(minSize, startBounds.width * scale);
            newHeight = Math.max(minSize, startBounds.height * scale);
          } else {
            // Fallback to minimum size
            newWidth = minSize;
            newHeight = minSize / aspectRatio;
          }
          
          bounds.width = newWidth;
          bounds.height = newHeight;
          break;
      }
    } else {
      // Free resize or edge handles - handle follows cursor exactly
      
      switch (handleType) {
        case 'top-left':
          bounds.width = startBounds.x + startBounds.width - currentMouse.x;
          bounds.height = startBounds.y + startBounds.height - currentMouse.y;
          bounds.x = currentMouse.x;
          bounds.y = currentMouse.y;
          break;
        case 'top-right':
          bounds.width = currentMouse.x - startBounds.x;
          bounds.height = startBounds.y + startBounds.height - currentMouse.y;
          bounds.y = currentMouse.y;
          break;
        case 'bottom-left':
          bounds.width = startBounds.x + startBounds.width - currentMouse.x;
          bounds.height = currentMouse.y - startBounds.y;
          bounds.x = currentMouse.x;
          break;
        case 'bottom-right':
          bounds.width = currentMouse.x - startBounds.x;
          bounds.height = currentMouse.y - startBounds.y;
          break;
        case 'top':
          bounds.height = startBounds.y + startBounds.height - currentMouse.y;
          bounds.y = currentMouse.y;
          break;
        case 'bottom':
          bounds.height = currentMouse.y - startBounds.y;
          break;
        case 'left':
          bounds.width = startBounds.x + startBounds.width - currentMouse.x;
          bounds.x = currentMouse.x;
          break;
        case 'right':
          bounds.width = currentMouse.x - startBounds.x;
          break;
      }
      
      // Enforce minimum size and adjust position if needed
      if (bounds.width < minSize) {
        if (handleType.includes('left')) {
          bounds.x = bounds.x + bounds.width - minSize;
        }
        bounds.width = minSize;
      }
      
      if (bounds.height < minSize) {
        if (handleType.includes('top')) {
          bounds.y = bounds.y + bounds.height - minSize;
        }
        bounds.height = minSize;
      }
    }
    
    return bounds;
  }, [canvasRef]);

  // Mouse event handlers with pan support
  const handleMouseDown = useCallback((e) => {
    // Handle panning first
    startPan(e);
    if (isPanning.current || editingText) return;
    
    const mousePos = getMousePos(e);
    setLastMousePos(mousePos);
    
    const element = getElementAt(mousePos.x, mousePos.y);
    
    if (element && !element.locked) {
      const handleType = getHandleAt(mousePos.x, mousePos.y, element);
      
      if (handleType) {
        // Start resizing
        // Text boxes should maintain aspect ratio when resized from corners ONLY
        // Images and frames also maintain aspect ratio
        const isCornerHandle = handleType.includes('-');
        const isTextSideHandle = element.type === 'text' && (handleType === 'left' || handleType === 'right');
        
        // Don't lock aspect ratio for text side handles
        let shouldLockAspectRatio = e.shiftKey || 
          (isCornerHandle && (element.type === 'text' || element.type === 'image' || element.type === 'frame'));
          
        // Override: never lock aspect ratio for text side handles
        if (isTextSideHandle) {
          shouldLockAspectRatio = false;
        }
        
        setDragState({
          isDragging: false,
          isResizing: true,
          resizeHandle: handleType,
          startBounds: { ...element.getBounds() },
          startMouse: mousePos,
          aspectRatioLocked: shouldLockAspectRatio
        });
      } else {
        // Start dragging for all elements (including text)
        setDragState({
          isDragging: true,
          isResizing: false,
          resizeHandle: null,
          startBounds: { ...element.getBounds() },
          startMouse: mousePos,
          aspectRatioLocked: false
        });
      }
      
      selectElement(element.id);
      
      // Manage active frame: set when clicking frames, keep for content elements
      if (element.type === 'frame') {
        setActiveFrame(element);
      }
      // Keep activeFrame when clicking content elements (text/images) for export workflow
    } else {
      selectElement(null);
      setActiveFrame(null); // Clear active frame only when clicking empty space
    }
  }, [getMousePos, getElementAt, getHandleAt, editingText, activeFrame, selectElement, startPan]);

  const handleMouseMove = useCallback((e) => {
    // Handle panning
    handlePan(e);
    if (isPanning.current || editingText) return;
    
    const mousePos = getMousePos(e);
    const dx = mousePos.x - lastMousePos.x;
    const dy = mousePos.y - lastMousePos.y;
    
    if (dragState.isDragging && selectedElement) {
      // Update element position
      setElements(prev => prev.map(el => {
        if (el.id === selectedElement) {
          return {
            ...el,
            x: el.x + dx,
            y: el.y + dy
          };
        }
        return el;
      }));
    } else if (dragState.isResizing && selectedElement) {
      // Lock cursor during resize to prevent glitches
      if (canvasRef.current) {
        canvasRef.current.style.cursor = getCursorForDirection(dragState.resizeHandle);
      }
      
      // Update element size using the locked handle type
      setElements(prev => prev.map(el => {
        if (el.id === selectedElement) {
          const newBounds = calculateNewBounds(
            el, 
            mousePos, 
            dragState.startMouse, 
            dragState.startBounds, 
            dragState.resizeHandle,
            dragState.aspectRatioLocked || el.type === 'image' || el.type === 'frame'
          );
          
          // For text elements, handle different resize behaviors
          if (el.type === 'text') {
            const isHorizontalResize = dragState.resizeHandle === 'left' || dragState.resizeHandle === 'right';
            
            if (isHorizontalResize) {
              // Left/right resizing: keep current font size, don't update base dimensions
              return {
                ...el,
                ...newBounds,
                // Preserve current font size for horizontal resizing
                fontSize: el.fontSize,
                baseFontSize: el.baseFontSize,
                baseWidth: el.baseWidth,
                baseHeight: el.baseHeight,
                isHorizontalResize: true // Set flag to prevent font scaling
              };
            } else {
              // Corner resizing: allow font scaling (normal behavior)
              return {
                ...el,
                ...newBounds,
                isHorizontalResize: false // Clear flag to allow font scaling
              };
            }
          }
          
          return {
            ...el,
            ...newBounds
          };
        }
        return el;
      }));
    }
    
    // Update cursor based on hover state ONLY when not actively dragging/resizing
    if (!dragState.isDragging && !dragState.isResizing) {
      const element = getElementAt(mousePos.x, mousePos.y);
      if (element && element.selected && !element.locked) {
        const handleType = getHandleAt(mousePos.x, mousePos.y, element);
        if (handleType) {
          // On resize handles - show appropriate resize cursor
          canvasRef.current.style.cursor = getCursorForDirection(handleType);
        } else if (element.type === 'frame') {
          // Inside frames - show move cursor since frames are meant to be positioned
          canvasRef.current.style.cursor = 'move';
        } else {
          // Inside text boxes and images - show default cursor for better UX
          canvasRef.current.style.cursor = 'default';
        }
      } else if (element && !element.selected) {
        // Hovering over unselected elements - show default cursor to indicate clickable
        canvasRef.current.style.cursor = 'default';
      } else {
        // Empty canvas area - default cursor
        canvasRef.current.style.cursor = 'default';
      }
    }
    
    setLastMousePos(mousePos);
  }, [getMousePos, lastMousePos, dragState, selectedElement, editingText, getElementAt, getHandleAt, canvasRef, calculateNewBounds, setElements, handlePan]);

  const handleMouseUp = useCallback(() => {
    // End panning
    endPan();
    
    if (dragState.isDragging || dragState.isResizing) {
      // For text elements that were resized, update their base dimensions appropriately
      if (dragState.isResizing && selectedElement) {
        setElements(prev => prev.map(el => {
          if (el.id === selectedElement && el.type === 'text') {
            const isHorizontalResize = dragState.resizeHandle === 'left' || dragState.resizeHandle === 'right';
            
            if (isHorizontalResize) {
              // For horizontal resizing, only update base width (keep font scaling based on original height)
              el.baseWidth = el.width;
              // Don't change baseHeight or baseFontSize for horizontal resizing
            } else {
              // For corner resizing, update all base dimensions to allow proper font scaling
              el.updateBaseDimensions();
            }
            
            // Always clear the horizontal resize flag when done
            el.isHorizontalResize = false;
          }
          return el;
        }));
      }
      
      historyManager.current.saveState(elements);
    }
    
    setDragState({ 
      isDragging: false, 
      isResizing: false, 
      resizeHandle: null,
      startBounds: null,
      startMouse: null,
      aspectRatioLocked: false
    });
  }, [dragState, elements, selectedElement, endPan]);

  // Layer management functions - Fixed to ensure content never goes behind frames
  const bringToFront = useCallback((elementId) => {
    setElements(prev => {
      const element = prev.find(el => el.id === elementId);
      // Don't allow frames to be moved in layers
      if (!element || element.type === 'frame') return prev;
      
      const nonFrameElements = prev.filter(el => el.type !== 'frame');
      if (nonFrameElements.length === 0) return prev;
      
      const maxContentZIndex = Math.max(...nonFrameElements.map(el => el.zIndex));
      return prev.map(el => 
        el.id === elementId 
          ? { ...el, zIndex: maxContentZIndex + 1 }
          : el
      );
    });
    historyManager.current.saveState(elements);
  }, [elements]);

  const sendToBack = useCallback((elementId) => {
    setElements(prev => {
      const element = prev.find(el => el.id === elementId);
      // Don't allow frames to be moved in layers
      if (!element || element.type === 'frame') return prev;
      
      const nonFrameElements = prev.filter(el => el.type !== 'frame');
      if (nonFrameElements.length <= 1) return prev; // Can't send back if only one content element
      
      const minContentZIndex = Math.min(...nonFrameElements.map(el => el.zIndex));
      
      return prev.map(el => 
        el.id === elementId 
          ? { ...el, zIndex: Math.max(0, minContentZIndex - 1) } // Never go below 0 (frames are negative)
          : el
      );
    });
    historyManager.current.saveState(elements);
  }, [elements]);

  const moveLayer = useCallback((elementId, direction) => {
    setElements(prev => {
      const element = prev.find(el => el.id === elementId);
      // Don't allow frames to be moved in layers
      if (!element || element.type === 'frame') return prev;
      
      const nonFrameElements = [...prev].filter(el => el.type !== 'frame');
      if (nonFrameElements.length <= 1) return prev; // Need at least 2 elements to swap
      
      const sortedElements = nonFrameElements.sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedElements.findIndex(el => el.id === elementId);
      
      if (currentIndex === -1) return prev; // Element not found
      
      if (direction === 'up' && currentIndex < sortedElements.length - 1) {
        const nextElement = sortedElements[currentIndex + 1];
        return prev.map(el => {
          if (el.id === elementId) return { ...el, zIndex: nextElement.zIndex };
          if (el.id === nextElement.id) return { ...el, zIndex: element.zIndex };
          return el;
        });
      } else if (direction === 'down' && currentIndex > 0) {
        const prevElement = sortedElements[currentIndex - 1];
        return prev.map(el => {
          if (el.id === elementId) return { ...el, zIndex: prevElement.zIndex };
          if (el.id === prevElement.id) return { ...el, zIndex: element.zIndex };
          return el;
        });
      }
      
      return prev;
    });
    historyManager.current.saveState(elements);
  }, [elements]);

  // Element management
  const addElement = useCallback((element) => {
    const newElement = element instanceof CanvasElement ? element : restoreElement(element);
    if (!newElement) return;
    
    // Frames get negative z-index to stay in background
    if (newElement.type === 'frame') {
      const frameElements = elements.filter(el => el.type === 'frame');
      newElement.zIndex = -(frameElements.length + 1);
    } else {
      // Content elements (text, images) start at z-index 0 or higher
      const contentElements = elements.filter(el => el.type !== 'frame');
      newElement.zIndex = contentElements.length;
    }
    
    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    selectElement(newElement.id);
    historyManager.current.saveState(updatedElements);
  }, [elements, setElements]);

  const removeElement = useCallback((elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
    historyManager.current.saveState(elements.filter(el => el.id !== elementId));
  }, [elements, selectedElement]);

  const updateElement = useCallback((elementId, updates) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        // For text elements, handle font size changes specially
        if (el.type === 'text' && updates.fontSize !== undefined) {
          updates.baseFontSize = updates.fontSize;
          
          // Auto-resize textbox when font size changes manually
          const fontSizeRatio = updates.fontSize / el.fontSize;
          const newWidth = Math.max(MIN_ELEMENT_SIZE, el.width * fontSizeRatio);
          const newHeight = Math.max(MIN_ELEMENT_SIZE, el.height * fontSizeRatio);
          
          updates.width = newWidth;
          updates.height = newHeight;
          updates.baseWidth = newWidth;
          updates.baseHeight = newHeight;
        }
        return { ...el, ...updates };
      }
      return el;
    }));
    historyManager.current.saveState(elements);
  }, [elements]);

  // Undo/Redo
  const undo = useCallback(() => {
    const prevState = historyManager.current.undo();
    if (prevState) {
      const restoredElements = prevState.map(restoreElement).filter(Boolean);
      setElements(restoredElements);
      setSelectedElement(null);
      // Clear any active text editing
      setEditingText(null);
    }
  }, [setElements]);

  const redo = useCallback(() => {
    const nextState = historyManager.current.redo();
    if (nextState) {
      const restoredElements = nextState.map(restoreElement).filter(Boolean);
      setElements(restoredElements);
      setSelectedElement(null);
      // Clear any active text editing
      setEditingText(null);
    }
  }, [setElements]);

  // Effects
  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  useEffect(() => {
    render();
  }, [render]);

  // Handle text editing - MOVED BEFORE mouse handlers to fix hoisting
  const startTextEditing = useCallback((element) => {
    if (element && element.type === 'text') {
      // Set the editing flag to hide the original text
      setElements(prev => prev.map(el => 
        el.id === element.id 
          ? { ...el, isBeingEdited: true }
          : el
      ));
      setEditingText(element);
    }
  }, [setElements]);

  const finishTextEditing = useCallback((newText) => {
    if (editingText) {
      // Update text and clear editing flag
      setElements(prev => prev.map(el => {
        if (el.id === editingText.id) {
          const updatedElement = { 
            ...el, 
            text: newText,
            isBeingEdited: false 
          };
          
          // Auto-resize to fit content if canvas is available
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Create a temporary element to measure
            const tempElement = new TextElement(el.x, el.y, el.width, el.height, newText);
            Object.assign(tempElement, updatedElement);
            tempElement.autoResizeToContent(ctx);
            
            // Apply the new dimensions
            updatedElement.width = tempElement.width;
            updatedElement.height = tempElement.height;
            updatedElement.baseWidth = tempElement.baseWidth;
            updatedElement.baseHeight = tempElement.baseHeight;
          }
          
          return updatedElement;
        }
        return el;
      }));
      setEditingText(null);
    }
  }, [editingText, setElements, canvasRef]);

  const cancelTextEditing = useCallback(() => {
    if (editingText) {
      // Just clear the editing flag without changing text
      setElements(prev => prev.map(el => 
        el.id === editingText.id 
          ? { ...el, isBeingEdited: false }
          : el
      ));
      setEditingText(null);
    }
  }, [editingText, setElements]);

  // Export frame contents only - Updated to work with any available frame
  const exportFrameContents = useCallback(async () => {
    // Find any frame in the elements (since only one frame can exist)
    const frameToExport = elements.find(el => el.type === 'frame');
    if (!frameToExport || !canvasRef.current) return null;
    
    // Get elements within frame bounds
    const elementsInFrame = elements.filter(el => {
      return el.type !== 'frame' && 
             el.x >= frameToExport.x && 
             el.y >= frameToExport.y &&
             el.x + el.width <= frameToExport.x + frameToExport.width &&
             el.y + el.height <= frameToExport.y + frameToExport.height;
    });
    
    // Wait for all images to load before exporting
    const imageElements = elementsInFrame.filter(el => el.type === 'image');
    await Promise.all(imageElements.map(imageEl => {
      return new Promise((resolve) => {
        if (imageEl.loaded && imageEl.imageObj) {
          resolve();
        } else if (imageEl.imageObj) {
          imageEl.imageObj.onload = resolve;
          imageEl.imageObj.onerror = resolve; // Resolve even on error to not block export
        } else {
          resolve(); // No image to load
        }
      });
    }));
    
    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set export canvas size to frame size (high resolution)
    const scale = 2; // 2x resolution for better quality
    exportCanvas.width = frameToExport.width * scale;
    exportCanvas.height = frameToExport.height * scale;
    exportCtx.scale(scale, scale);
    
    // Apply frame background
    exportCtx.fillStyle = frameToExport.backgroundColor;
    exportCtx.fillRect(0, 0, frameToExport.width, frameToExport.height);
    
    // Sort by z-index
    elementsInFrame.sort((a, b) => a.zIndex - b.zIndex);
    
    // Draw elements with translation
    exportCtx.save();
    exportCtx.translate(-frameToExport.x, -frameToExport.y);
    
    elementsInFrame.forEach(element => {
      element.draw(exportCtx);
    });
    
    exportCtx.restore();
    
    return exportCanvas.toDataURL('image/png', 1.0);
  }, [elements, canvasRef]);

  // Double-click handler for text editing
  const handleDoubleClick = useCallback((e) => {
    if (editingText) return;
    
    const mousePos = getMousePos(e);
    const element = getElementAt(mousePos.x, mousePos.y);
    
    if (element && element.type === 'text' && !element.locked) {
      // Use the centralized startTextEditing function for consistency
      startTextEditing(element);
    }
  }, [editingText, getMousePos, getElementAt, startTextEditing]);

  // Zoom handling
  const handleZoom = useCallback((delta, clientX, clientY) => {
    setZoom(prevZoom => {
      // Calculate zoom change with smooth factor
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.1, Math.min(5, prevZoom * zoomFactor));
      
      // Calculate mouse position relative to canvas
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      
      // Calculate new pan offset to zoom toward mouse position
      const newPanOffsetX = mouseX - (mouseX - panOffset.x) * (newZoom / prevZoom);
      const newPanOffsetY = mouseY - (mouseY - panOffset.y) * (newZoom / prevZoom);
      
      // Update pan offset
      setPanOffset({
        x: newPanOffsetX,
        y: newPanOffsetY
      });
      
      return newZoom;
    });
  }, [canvasRef, panOffset]);

  // Reset zoom and pan
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Wheel event handler for zooming
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      handleZoom(delta, e.clientX, e.clientY);
    } else if (e.shiftKey) {
      // Horizontal pan with shift+wheel
      e.preventDefault();
      setPanOffset(prev => ({
        x: prev.x - e.deltaY,
        y: prev.y
      }));
    } else {
      // Vertical pan with wheel
      e.preventDefault();
      setPanOffset(prev => ({
        x: prev.x,
        y: prev.y - e.deltaY
      }));
    }
  }, [handleZoom]);

  return {
    elements,
    selectedElement,
    editingText,
    activeFrame,
    zoom,
    panOffset,
    addElement,
    removeElement,
    selectElement,
    updateElement,
    undo,
    redo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleWheel,
    handleZoom,
    resetZoom,
    startTextEditing,
    finishTextEditing,
    cancelTextEditing,
    exportFrameContents,
    eventEmitter: eventEmitter.current,
    canUndo: historyManager.current.canUndo(),
    canRedo: historyManager.current.canRedo(),
    bringToFront,
    sendToBack,
    moveLayer,
    setElements
  };
};

export {
  CanvasElement,
  TextElement,
  ImageElement,
  FrameElement,
  useCanvasEditor,
  EventEmitter,
  HistoryManager
};

// Custom fonts (preserved from original)
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
];

// Text Style Sidebar Component (preserved from original)
const TextStyleSidebar = ({ style, onStyleChange, onClose, onAddText, setFontSize, fontSize }) => {
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Cardo'];
  const customFontNames = customFonts.map(font => font.name);
  const allFontFamilies = [...fontFamilies, ...customFontNames];
  
  const handleFontSizeChange = (increment) => {
    const currentSize = style.fontSize || fontSize;
    const newSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, currentSize + increment));
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

      {/* Opacity Control */}
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

// Frame Style Sidebar Component (preserved from original)
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

      {/* Background Color Section */}
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

// Sidebar Component (preserved from original)
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
      
      {/* Frame Tool */}
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

// Frame options dropdown (preserved from original)
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

// In-place text editor overlay with improved functionality
const TextEditor = ({ element, onFinish, canvasRect, zoom = 1, panOffset = { x: 0, y: 0 } }) => {
  const [text, setText] = useState(element.text);
  const textareaRef = useRef(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      
      // Auto-resize textarea
      const autoResize = () => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      };
      
      autoResize();
    }
  }, []);

  const finishEditing = useCallback((finalText) => {
    if (hasFinishedRef.current) return; // Prevent multiple calls
    hasFinishedRef.current = true;
    onFinish(finalText);
  }, [onFinish]);

  const handleKeyDown = (e) => {
    e.stopPropagation(); // Prevent canvas shortcuts
    if (e.key === 'Escape') {
      e.preventDefault();
      finishEditing(element.text); // Cancel changes - use original text
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      finishEditing(text); // Save changes with Ctrl+Enter
    }
  };

  const handleBlur = () => {
    finishEditing(text);
  };

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent canvas click
  };

  const handleInput = (e) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Calculate scaled padding for precise alignment
  const scaledPadding = element.getScaledPadding();

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: canvasRect.left + element.x * zoom + panOffset.x + scaledPadding * zoom,
        top: canvasRect.top + element.y * zoom + panOffset.y + scaledPadding * zoom,
        width: (element.width - (scaledPadding * 2)) * zoom,
        minHeight: (element.height - (scaledPadding * 2)) * zoom,
        fontSize: `${element.fontSize * zoom}px`,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight === 'Bold' ? 'bold' : element.fontWeight === 'Light' ? '300' : 'normal',
        fontStyle: element.fontStyle,
        color: element.color,
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        outline: 'none',
        zIndex: 10000,
        textAlign: element.textAlign || 'left',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: element.lineHeight || 1.2,
        boxShadow: 'none',
        transform: `scale(${1})`
      }}
    />
  );
};

// Layers Sidebar Component - Modified to handle frames specially
const LayersSidebar = ({ elements, selectedElement, onSelectElement, onMoveLayer, onBringToFront, onSendToBack, onToggleVisibility, onClose }) => {
  // Filter out frames from layer management - frames are background containers
  const layerElements = elements.filter(el => el.type !== 'frame');
  const frameElements = elements.filter(el => el.type === 'frame');
  const sortedElements = [...layerElements].sort((a, b) => b.zIndex - a.zIndex);

  const getElementIcon = (element) => {
    switch (element.type) {
      case 'text':
        return <Type size={16} />;
      case 'image':
        return <ImageUp size={16} />;
      case 'frame':
        return <Square size={16} />;
      default:
        return <Square size={16} />;
    }
  };

  const getElementName = (element) => {
    switch (element.type) {
      case 'text':
        return element.text.length > 15 ? element.text.substring(0, 15) + '...' : element.text;
      case 'image':
        return 'Image';
      case 'frame':
        return `Frame (${element.aspectRatio.toFixed(2)})`;
      default:
        return 'Element';
    }
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
      gap: '15px'
    }}>
      {/* Header */}
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
          <ChevronLeft size={20} /> Layers
        </button>
      </div>

      {/* Layer Controls - Only show for non-frame elements */}
      {selectedElement && layerElements.find(el => el.id === selectedElement) && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8f8f8',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
            Layer Controls
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onBringToFront(selectedElement)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px'
              }}
            >
              <ChevronUp size={12} />
              Front
            </button>
            <button
              onClick={() => onSendToBack(selectedElement)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px'
              }}
            >
              <ChevronDown size={12} />
              Back
            </button>
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            <button
              onClick={() => onMoveLayer(selectedElement, 'up')}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Move Up
            </button>
            <button
              onClick={() => onMoveLayer(selectedElement, 'down')}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Move Down
            </button>
          </div>
        </div>
      )}

      {/* Frames Section - Read-only display */}
      {frameElements.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#6b7280' }}>
            Frames (Background)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {frameElements.map((element) => (
              <div
                key={element.id}
                onClick={() => onSelectElement(element.id)}
                style={{
                  padding: '8px 10px',
                  backgroundColor: selectedElement === element.id ? '#fef3c7' : '#fafafa',
                  border: selectedElement === element.id ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ color: '#f59e0b' }}>
                  {getElementIcon(element)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: selectedElement === element.id ? 'bold' : 'normal' }}>
                    {getElementName(element)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Background Frame
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layers List - Only non-frame elements */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          Content Layers ({layerElements.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {sortedElements.map((element, index) => (
            <div
              key={element.id}
              onClick={() => onSelectElement(element.id)}
              style={{
                padding: '8px 10px',
                backgroundColor: selectedElement === element.id ? '#e0e7ff' : '#f9fafb',
                border: selectedElement === element.id ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ color: '#6b7280' }}>
                {getElementIcon(element)}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: selectedElement === element.id ? 'bold' : 'normal' }}>
                  {getElementName(element)}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Layer {sortedElements.length - index}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                z{element.zIndex}
              </div>
            </div>
          ))}
          {layerElements.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px'
            }}>
              No content layers yet. Add text or images to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Canvas Editor Component
const CanvasImageEditor = () => {
  const canvasRef = useRef(null);
  const [showTextSidebar, setShowTextSidebar] = useState(false);
  const [showFrameSidebar, setShowFrameSidebar] = useState(false);
  const [showLayersSidebar, setShowLayersSidebar] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [clipboard, setClipboard] = useState(null);

  const {
    elements,
    selectedElement,
    editingText,
    activeFrame,
    zoom,
    panOffset,
    addElement,
    removeElement,
    selectElement,
    updateElement,
    undo,
    redo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleWheel,
    handleZoom,
    resetZoom,
    startTextEditing,
    finishTextEditing,
    cancelTextEditing,
    exportFrameContents,
    eventEmitter,
    canUndo,
    canRedo,
    bringToFront,
    sendToBack,
    moveLayer,
    setElements
  } = useCanvasEditor(canvasRef);

  // UI synchronization
  useEffect(() => {
    const handleElementSelected = (element) => {
      if (element) {
        if (element.type === 'text') {
          setShowTextSidebar(true);
          setShowFrameSidebar(false);
        } else if (element.type === 'frame') {
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
    };

    eventEmitter.on('elementSelected', handleElementSelected);
    return () => eventEmitter.off('elementSelected', handleElementSelected);
  }, [eventEmitter]);

  // Add text element - Fixed to wrap around text properly and auto-start editing
  const addTextBox = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = rect.width / 2 - 100;
    const y = rect.height / 2 - 30;
    
    const defaultText = 'Text';
    
    // Create text element with initial size
    const newTextElement = new TextElement(x, y, 60, 30, defaultText);
    
    // Auto-resize to fit content tightly
    const ctx = canvas.getContext('2d');
    newTextElement.autoResizeToContent(ctx);
    
    // Center the text box after resizing
    newTextElement.x = rect.width / 2 - newTextElement.width / 2;
    newTextElement.y = rect.height / 2 - newTextElement.height / 2;
    
    addElement(newTextElement);
    setShowTextSidebar(true);
    
    // Auto-start editing for better UX - use proper state management
    setTimeout(() => {
      // Only use the startTextEditing function - don't modify element directly
      startTextEditing(newTextElement);
    }, 0); // Use setTimeout to ensure element is added first
  }, [addElement, startTextEditing]);

  // Add image element
  const handleFileUpload = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const rect = canvas.getBoundingClientRect();
          const maxDimension = Math.min(rect.width * 0.5, rect.height * 0.5, 400);
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          
          let width, height;
          if (aspectRatio >= 1) {
            width = Math.min(img.naturalWidth, maxDimension);
            height = width / aspectRatio;
          } else {
            height = Math.min(img.naturalHeight, maxDimension);
            width = height * aspectRatio;
          }
          
          const x = rect.width / 2 - width / 2;
          const y = rect.height / 2 - height / 2;
          
          const imageElement = new ImageElement(x, y, width, height, imageUrl);
          addElement(imageElement);
        };
        img.src = imageUrl;
      };
      
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  }, [addElement]);

  // Add frame element - Only one frame allowed at a time
  const addFrame = useCallback((aspectRatio) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const maxDimension = Math.min(rect.width * 0.7, rect.height * 0.7);
    
    let width, height;
    if (aspectRatio >= 1) {
      width = maxDimension;
      height = width / aspectRatio;
    } else {
      height = maxDimension;
      width = height * aspectRatio;
    }
    
    const x = rect.width / 2 - width / 2;
    const y = rect.height / 2 - height / 2;
    
    // Remove any existing frames first (only one frame allowed)
    setElements(prev => prev.filter(el => el.type !== 'frame'));
    
    const frameElement = new FrameElement(x, y, width, height, aspectRatio);
    addElement(frameElement);
    setShowFrameSidebar(true);
  }, [addElement, setElements, canvasRef]);

  // Style management
  const getSelectedTextElement = useCallback(() => {
    return elements.find(el => el.id === selectedElement && el.type === 'text');
  }, [elements, selectedElement]);

  const getSelectedFrameElement = useCallback(() => {
    return elements.find(el => el.id === selectedElement && el.type === 'frame');
  }, [elements, selectedElement]);

  const updateTextStyle = useCallback((style) => {
    const textElement = getSelectedTextElement();
    if (textElement) {
      updateElement(textElement.id, style);
    }
  }, [getSelectedTextElement, updateElement]);

  const handleFrameBackgroundChange = useCallback((color) => {
    const frameElement = getSelectedFrameElement();
    if (frameElement) {
      updateElement(frameElement.id, { backgroundColor: color });
    }
  }, [getSelectedFrameElement, updateElement]);

  // Close all sidebars when opening one
  const handleSidebarToggle = useCallback((sidebarType) => {
    setShowTextSidebar(false);
    setShowFrameSidebar(false);
    setShowLayersSidebar(false);
    
    switch (sidebarType) {
      case 'text':
        setShowTextSidebar(true);
        break;
      case 'frame':
        setShowFrameSidebar(true);
        break;
      case 'layers':
        setShowLayersSidebar(true);
        break;
    }
  }, []);

  // Improved keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingText) return; // Don't process shortcuts while editing text
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            if (selectedElement) {
              const element = elements.find(el => el.id === selectedElement);
              if (element) {
                setClipboard({ ...element.toJSON() });
              }
            }
            break;
          case 'x':
            e.preventDefault();
            if (selectedElement) {
              const element = elements.find(el => el.id === selectedElement);
              if (element) {
                setClipboard({ ...element.toJSON() });
                removeElement(selectedElement);
              }
            }
            break;
          case 'v':
            e.preventDefault();
            if (clipboard) {
              const newElement = restoreElement(clipboard);
              if (newElement) {
                newElement.id = generateId();
                newElement.x += 20;
                newElement.y += 20;
                newElement.selected = false;
                addElement(newElement);
              }
            }
            break;
          case 'a':
            e.preventDefault();
            // Select all elements
            if (elements.length > 0) {
              selectElement(elements[elements.length - 1].id);
            }
            break;
          case 'd':
            e.preventDefault();
            // Duplicate selected element
            if (selectedElement) {
              const element = elements.find(el => el.id === selectedElement);
              if (element) {
                const newElement = restoreElement(element.toJSON());
                if (newElement) {
                  newElement.id = generateId();
                  newElement.x += 20;
                  newElement.y += 20;
                  newElement.selected = false;
                  addElement(newElement);
                }
              }
            }
            break;
        }
      }
      
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedElement) {
          removeElement(selectedElement);
        }
      }
      
      // Arrow keys for nudging
      if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const element = elements.find(el => el.id === selectedElement);
        if (element && !element.locked) {
          const updates = {};
          switch (e.key) {
            case 'ArrowUp':
              updates.y = element.y - step;
              break;
            case 'ArrowDown':
              updates.y = element.y + step;
              break;
            case 'ArrowLeft':
              updates.x = element.x - step;
              break;
            case 'ArrowRight':
              updates.x = element.x + step;
              break;
          }
          updateElement(selectedElement, updates);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElement, elements, clipboard, addElement, removeElement, editingText, updateElement, selectElement]);

  // Export functionality - Updated to work with any available frame
  const downloadDesign = useCallback(async () => {
    // Find any frame in the elements (since only one frame can exist)
    const availableFrame = elements.find(el => el.type === 'frame');
    if (!availableFrame) {
      alert('Please add a frame to export your design');
      return;
    }
    
    try {
      const dataUrl = await exportFrameContents();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = 'design.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Error exporting design:', error);
      alert('Error exporting design. Please try again.');
    }
  }, [elements, exportFrameContents]);

  // Add zoom controls to UI
  const zoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    handleZoom(1, rect.left + centerX, rect.top + centerY);
  }, [handleZoom, canvasRef]);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    handleZoom(-1, rect.left + centerX, rect.top + centerY);
  }, [handleZoom, canvasRef]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column',
      position: 'relative',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd'
      }}>
        <Sidebar 
          onAddText={addTextBox}
          onFileUpload={handleFileUpload}
          onAddFrame={addFrame}
        />
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Zoom Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            backgroundColor: '#f8f8f8',
            borderRadius: '4px',
            padding: '2px'
          }}>
            <button
              onClick={zoomOut}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
              title="Zoom Out"
            >
              -
            </button>
            <div style={{
              padding: '4px 8px',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={zoomIn}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={resetZoom}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => handleSidebarToggle('layers')}
            style={{
              padding: '8px 12px',
              backgroundColor: showLayersSidebar ? '#8b5cf6' : '#e5e7eb',
              color: showLayersSidebar ? 'white' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Layers size={16} />
            Layers
          </button>
          
          {selectedElement && (
            <button
              onClick={() => removeElement(selectedElement)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          
          {editingText && (
            <button
              onClick={cancelTextEditing}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Cancel Edit
            </button>
          )}
          
          <button
            onClick={downloadDesign}
            style={{
              padding: '8px 16px',
              backgroundColor: elements.some(el => el.type === 'frame') ? '#0066ff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: elements.some(el => el.type === 'frame') ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            disabled={!elements.some(el => el.type === 'frame')}
          >
            <Download size={16} />
            Export Frame
          </button>
        </div>
      </div>
      
      {/* Main Canvas */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            cursor: 'default'
          }}
        />
        
        {/* Text Editor Overlay - Only show one at a time */}
        {editingText && (
          <TextEditor
            key={editingText.id} // Force remount if editing different element
            element={editingText}
            onFinish={finishTextEditing}
            canvasRect={canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 }}
            zoom={zoom}
            panOffset={panOffset}
          />
        )}
      </div>

      {/* Text Style Sidebar */}
      {showTextSidebar && (
        <TextStyleSidebar 
          style={getSelectedTextElement() || {}}
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
          backgroundColor={getSelectedFrameElement()?.backgroundColor || '#ffffff'}
          onBackgroundColorChange={handleFrameBackgroundChange}
          onClose={() => setShowFrameSidebar(false)}
        />
      )}

      {/* Layers Sidebar */}
      {showLayersSidebar && (
        <LayersSidebar
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={selectElement}
          onMoveLayer={moveLayer}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onToggleVisibility={onToggleVisibility}
          onClose={() => setShowLayersSidebar(false)}
        />
      )}
    </div>
  );
};

export default CanvasImageEditor; 