import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image, Upload, Link, X, Copy, Brain } from 'lucide-react';

interface ImageNodeData {
  imageUrl: string;
  imageFile: File | null;
  uploadMethod: 'file' | 'url';
  isLoading: boolean;
  error: string | null;
  imageDimensions?: { width: number; height: number };
  displayDimensions?: { width: number; height: number };
  isActive: boolean;
}

export default function ImageNode({ data, selected }: NodeProps<ImageNodeData>) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get theme from the app's background
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const appElement = document.querySelector('[class*="bg-black"], [class*="bg-stone-50"]');
    if (appElement) {
      const hasLightBg = appElement.classList.contains('bg-stone-50');
      setIsDarkMode(!hasLightBg);
    }
    
    const observer = new MutationObserver(() => {
      const appElement = document.querySelector('[class*="bg-black"], [class*="bg-stone-50"]');
      if (appElement) {
        const hasLightBg = appElement.classList.contains('bg-stone-50');
        setIsDarkMode(!hasLightBg);
      }
    });
    
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'],
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, []);

  // Initialize defaults
  useEffect(() => {
    if (data.isActive === undefined) data.isActive = false;
  }, []);

  // Calculate optimal display dimensions
  const calculateDisplayDimensions = (naturalWidth: number, naturalHeight: number) => {
    const maxWidth = 500;
    const maxHeight = 400;
    const minWidth = 300;
    const minHeight = 150;
    
    // Calculate aspect ratio
    const aspectRatio = naturalWidth / naturalHeight;
    
    let displayWidth = naturalWidth;
    let displayHeight = naturalHeight;
    
    // Scale down if too large
    if (displayWidth > maxWidth) {
      displayWidth = maxWidth;
      displayHeight = displayWidth / aspectRatio;
    }
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }
    
    // Scale up if too small (but maintain aspect ratio)
    if (displayWidth < minWidth && displayHeight < minHeight) {
      if (aspectRatio > 1) {
        // Landscape
        displayWidth = minWidth;
        displayHeight = displayWidth / aspectRatio;
      } else {
        // Portrait or square
        displayHeight = minHeight;
        displayWidth = displayHeight * aspectRatio;
      }
    }
    
    return {
      width: Math.round(displayWidth),
      height: Math.round(displayHeight)
    };
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      
      // Store original dimensions
      data.imageDimensions = { width: naturalWidth, height: naturalHeight };
      
      // Calculate and store display dimensions
      data.displayDimensions = calculateDisplayDimensions(naturalWidth, naturalHeight);
      
      setImageLoaded(true);
    }
  };

  const isValidImageUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Check for direct image file URLs
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const pathname = urlObj.pathname.toLowerCase();
      if (imageExtensions.some(ext => pathname.endsWith(ext))) {
        return { isValid: true, type: 'direct' };
      }
      
      // Check for common image hosting services
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('imgur.com') || hostname.includes('i.imgur.com') ||
          hostname.includes('unsplash.com') || hostname.includes('pexels.com') ||
          hostname.includes('pixabay.com') || hostname.includes('flickr.com')) {
        return { isValid: true, type: 'hosting' };
      }
      
      // Assume it might be a direct image URL
      return { isValid: true, type: 'assumed' };
    } catch {
      return { isValid: false, type: 'invalid', message: 'Please enter a valid URL' };
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    // Clear previous errors and reset dimensions
    data.error = null;
    data.imageDimensions = undefined;
    data.displayDimensions = undefined;
    setImageLoaded(false);
    
    if (!allowedTypes.includes(file.type)) {
      data.error = 'Please select a valid image file (JPG, PNG, GIF, WebP, SVG)';
      return;
    }
    
    if (file.size > maxSize) {
      data.error = 'File size must be less than 10MB';
      return;
    }
    
    data.isLoading = true;
    data.imageFile = file;
    data.uploadMethod = 'file';
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      data.imageUrl = e.target?.result as string;
      data.isLoading = false;
    };
    reader.onerror = () => {
      data.error = 'Failed to read the image file';
      data.isLoading = false;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      data.error = 'Please enter an image URL';
      return;
    }
    
    // Validate URL
    const validation = isValidImageUrl(trimmedUrl);
    
    if (!validation.isValid) {
      data.error = validation.message || 'Invalid image URL';
      return;
    }
    
    data.error = null;
    data.isLoading = true;
    data.imageUrl = trimmedUrl;
    data.uploadMethod = 'url';
    data.imageFile = null;
    data.imageDimensions = undefined;
    data.displayDimensions = undefined;
    setImageLoaded(false);
    
    // Test if the image can actually load
    const testImage = new Image();
    testImage.crossOrigin = 'anonymous';
    
    const loadTimeout = setTimeout(() => {
      data.error = 'Image failed to load. Please check the URL and ensure it\'s accessible.';
      data.isLoading = false;
      data.imageUrl = '';
    }, 8000); // 8 second timeout
    
    testImage.onload = () => {
      clearTimeout(loadTimeout);
      data.isLoading = false;
      setShowUrlInput(false);
      setUrlInput('');
    };
    
    testImage.onerror = () => {
      clearTimeout(loadTimeout);
      data.error = 'Failed to load image. Please ensure the URL points to a valid image file.';
      data.isLoading = false;
      data.imageUrl = '';
    };
    
    testImage.src = trimmedUrl;
  };

  const clearImage = () => {
    data.imageUrl = '';
    data.imageFile = null;
    data.error = null;
    data.isLoading = false;
    data.imageDimensions = undefined;
    data.displayDimensions = undefined;
    setImageLoaded(false);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleImageError = () => {
    data.error = 'Failed to load image. Please check the file format or URL.';
    data.imageUrl = '';
    setImageLoaded(false);
  };

  // Get dynamic width for the node
  const getNodeWidth = () => {
    if (data.displayDimensions && imageLoaded) {
      // Add padding (48px total: 24px on each side)
      return data.displayDimensions.width + 48;
    }
    return 300; // Default width
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDuplicate = () => {
    console.log('Duplicate Image node');
  };

  const toggleActive = () => {
    data.isActive = !data.isActive;
  };

  return (
    <div className="relative">
      {/* Floating Title */}
      <div className="absolute -top-8 left-0 z-10">
        <span className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Image
        </span>
      </div>

      {/* Floating Action Icons - Only show when hovering or active */}
      <div className={`
        absolute -top-8 right-0 z-10 flex items-center space-x-1 transition-all duration-300
        ${isHovered || data.isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
      `}>
        <button
          onClick={toggleActive}
          className={`
            w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
            ${data.isActive
              ? isDarkMode 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-green-600 hover:text-green-700'
              : isDarkMode 
                ? 'text-gray-400 hover:text-green-400' 
                : 'text-gray-700 hover:text-green-600'
            }
          `}
          title="Toggle AI Processing"
        >
          <Brain size={14} />
        </button>
        
        <button
          onClick={handleDuplicate}
          className={`
            w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
            ${isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-700 hover:text-gray-800'
            }
          `}
          title="Duplicate Node"
        >
          <Copy size={14} />
        </button>

        {/* Only show clear button when there's content */}
        {data.imageUrl && (
          <button
            onClick={clearImage}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Clear image"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Main Node */}
      <div 
        className={`
          relative transition-all duration-300 max-w-[500px]
          ${selected 
            ? isDarkMode
              ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20' 
              : 'ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/15'
            : isDarkMode
              ? 'shadow-lg hover:shadow-xl shadow-black/20' 
              : 'shadow-md hover:shadow-lg shadow-black/8'
          }
          rounded-2xl overflow-hidden
          ${isDarkMode 
            ? 'bg-gray-800 border border-gray-600' 
            : 'bg-white border border-black'
          }
        `}
        style={{ width: `${getNodeWidth()}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Content Area */}
        <div className="p-6">
          {data.imageUrl ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  ref={imageRef}
                  src={data.imageUrl}
                  alt="Uploaded content"
                  className="w-full object-cover rounded-lg"
                  style={{
                    height: data.displayDimensions && imageLoaded 
                      ? `${data.displayDimensions.height}px` 
                      : '200px'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
                {data.isLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white text-xs">Loading image...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Info */}
              <div className="space-y-1">
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {data.uploadMethod === 'file' ? data.imageFile?.name : data.imageUrl}
                </p>
                
                {/* Image dimensions and file size */}
                {(data.imageDimensions || data.imageFile) && (
                  <div className={`flex items-center space-x-3 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {data.imageDimensions && (
                      <span>
                        {data.imageDimensions.width} × {data.imageDimensions.height}
                      </span>
                    )}
                    {data.imageFile && (
                      <span>
                        {formatFileSize(data.imageFile.size)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                  ${dragOver 
                    ? isDarkMode 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-blue-500 bg-blue-50'
                    : isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Drop image here or click to browse
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  JPG, PNG, GIF, WebP up to 10MB
                </p>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                {!showUrlInput ? (
                  <button
                    onClick={() => setShowUrlInput(true)}
                    className={`
                      w-full flex items-center justify-center space-x-2 p-2 border rounded-lg transition-colors
                      ${isDarkMode 
                        ? 'border-gray-600 hover:bg-gray-700/50 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <Link size={16} />
                    <span className="text-sm">Add from URL</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Enter image URL..."
                        className={`
                          flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500/30' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'
                          }
                        `}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                      />
                      <button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Supports direct image URLs and popular image hosting services
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {data.error && (
            <div className={`
              mt-3 p-3 rounded-lg border
              ${isDarkMode 
                ? 'bg-red-900/20 border-red-800/30 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
              }
            `}>
              <p className="text-sm leading-relaxed">{data.error}</p>
            </div>
          )}
        </div>

        {/* Connection Handles */}
        <Handle 
          type="source" 
          position={Position.Right} 
          className={`
            w-3 h-3 border-2 hover:bg-blue-500 transition-colors rounded-full
            ${isDarkMode 
              ? 'bg-gray-600 border-gray-800' 
              : 'bg-gray-400 border-white'
            }
          `} 
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          className={`
            w-3 h-3 border-2 hover:bg-blue-500 transition-colors rounded-full
            ${isDarkMode 
              ? 'bg-gray-600 border-gray-800' 
              : 'bg-gray-400 border-white'
            }
          `} 
        />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}