import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Globe, Link, X, ExternalLink, RefreshCw, Eye, EyeOff, Copy, Brain } from 'lucide-react';

interface UrlNodeData {
  url: string;
  title: string;
  description: string;
  favicon: string;
  isLoading: boolean;
  error: string | null;
  isPreviewVisible: boolean;
  lastFetched: Date | null;
  isActive: boolean;
}

export default function UrlNode({ data, selected }: NodeProps<UrlNodeData>) {
  const [urlInput, setUrlInput] = useState(data.url || '');
  const [isEditing, setIsEditing] = useState(!data.url);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (data.isPreviewVisible === undefined) data.isPreviewVisible = true;
    if (!data.title) data.title = '';
    if (!data.description) data.description = '';
    if (!data.favicon) data.favicon = '';
    if (data.isActive === undefined) data.isActive = false;
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const fetchUrlMetadata = async (url: string) => {
    data.isLoading = true;
    data.error = null;
    
    try {
      // Simulate API call to fetch metadata
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock metadata - in real implementation, this would come from a metadata service
      const domain = new URL(url).hostname;
      data.title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Website Title`;
      data.description = `This is a sample description for ${domain}. In a real implementation, this would be fetched from the website's meta tags or a metadata service.`;
      data.favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      data.lastFetched = new Date();
      data.isLoading = false;
    } catch (error) {
      data.error = 'Failed to fetch website metadata. Please check the URL and try again.';
      data.isLoading = false;
    }
  };

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      data.error = 'Please enter a URL';
      return;
    }
    
    // Add protocol if missing
    let finalUrl = trimmedUrl;
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      finalUrl = 'https://' + trimmedUrl;
    }
    
    if (!isValidUrl(finalUrl)) {
      data.error = 'Please enter a valid URL';
      return;
    }
    
    data.url = finalUrl;
    data.error = null;
    setIsEditing(false);
    
    fetchUrlMetadata(finalUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
    } else if (e.key === 'Escape') {
      setUrlInput(data.url || '');
      setIsEditing(false);
      data.error = null;
    }
  };

  const clearUrl = () => {
    data.url = '';
    data.title = '';
    data.description = '';
    data.favicon = '';
    data.error = null;
    data.lastFetched = null;
    setUrlInput('');
    setIsEditing(true);
  };

  const refreshMetadata = () => {
    if (data.url) {
      fetchUrlMetadata(data.url);
    }
  };

  const togglePreview = () => {
    data.isPreviewVisible = !data.isPreviewVisible;
  };

  const openUrl = () => {
    if (data.url) {
      try {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        data.error = 'Failed to open URL';
      }
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleDuplicate = () => {
  };

  const toggleActive = () => {
    data.isActive = !data.isActive;
  };

  return (
    <div className="relative">
      {/* Floating Title */}
      <div className="absolute -top-8 left-0 z-10">
        <span className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Website
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

        <button
          onClick={togglePreview}
          className={`
            w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
            ${isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-700 hover:text-gray-800'
            }
          `}
          title={data.isPreviewVisible ? 'Hide preview' : 'Show preview'}
        >
          {data.isPreviewVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>

        <button
          onClick={refreshMetadata}
          className={`
            w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
            ${isDarkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-700 hover:text-gray-800'
            }
          `}
          title="Refresh metadata"
        >
          <RefreshCw size={14} />
        </button>

        {/* Only show clear button when there's content */}
        {data.url && (
          <button
            onClick={clearUrl}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Clear URL"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Main Node */}
      <div 
        className={`
          relative transition-all duration-300 min-w-[300px] max-w-[400px]
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Content Area */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter website URL..."
                  className={`
                    flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500/30' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'
                    }
                  `}
                  onKeyDown={handleKeyDown}
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
                Enter a website URL to fetch its metadata and preview
              </p>
            </div>
          ) : data.url ? (
            <div className="space-y-4">
              {/* URL Display */}
              <div 
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-900/50 border-gray-700 hover:bg-gray-900/70' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }
                `}
                onClick={() => setIsEditing(true)}
              >
                <div className="flex items-center space-x-2">
                  <Link size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {getDomainFromUrl(data.url)}
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {data.isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Fetching website data...
                    </span>
                  </div>
                </div>
              )}

              {/* Website Preview */}
              {data.isPreviewVisible && data.title && !data.isLoading && (
                <div className={`
                  p-3 rounded-lg border
                  ${isDarkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}
                `}>
                  <div className="flex items-start space-x-3">
                    {data.favicon && (
                      <img 
                        src={data.favicon} 
                        alt="Favicon" 
                        className="w-6 h-6 rounded flex-shrink-0 mt-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {data.title}
                      </h4>
                      {data.description && (
                        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {data.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {data.lastFetched && `Updated ${data.lastFetched.toLocaleDateString()}`}
                        </span>
                        <button
                          onClick={openUrl}
                          className={`
                            flex items-center space-x-1 text-xs transition-colors
                            ${isDarkMode 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-700'
                            }
                          `}
                        >
                          <span>Visit</span>
                          <ExternalLink size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

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
    </div>
  );
}
