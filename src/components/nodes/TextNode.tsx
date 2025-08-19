import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Copy, Brain, Edit3 } from 'lucide-react';

interface TextNodeData {
  text: string;
  title: string;
  isRichText: boolean;
  isMultiline: boolean;
  alignment: 'left' | 'center' | 'right';
  formatting: {
    bold: boolean;
    italic: boolean;
  };
  isActive: boolean;
  suggestionPrompt: string;
  isDarkMode?: boolean;
}

export default function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(data.text || '');
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(data.isActive || false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [localSuggestion, setLocalSuggestion] = useState(data.suggestionPrompt || 'A description of a haunted mansion in winter');
  const [hasUserEditedSuggestion, setHasUserEditedSuggestion] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get theme from the app's background - check if parent has dark background
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    // Check the app's background color to determine theme
    const appElement = document.querySelector('[class*="bg-black"], [class*="bg-stone-50"]');
    if (appElement) {
      const hasLightBg = appElement.classList.contains('bg-stone-50');
      setIsDarkMode(!hasLightBg);
    }
    
    // Also listen for theme changes
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

  // Initialize data defaults
  useEffect(() => {
    if (!data.title) data.title = 'Text Input';
    if (data.isActive === undefined) data.isActive = false;
    if (!data.suggestionPrompt) data.suggestionPrompt = 'A description of a haunted mansion in winter';
  }, []);

  // Auto-resize textarea and sync display height
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [localText, isEditing]);

  // Auto-resize suggestion textarea
  useEffect(() => {
    if (isEditingSuggestion && suggestionTextareaRef.current) {
      suggestionTextareaRef.current.style.height = 'auto';
      suggestionTextareaRef.current.style.height = `${Math.max(40, suggestionTextareaRef.current.scrollHeight)}px`;
      suggestionTextareaRef.current.style.overflow = 'hidden';
    }
  }, [localSuggestion, isEditingSuggestion]);

  // Update local text when data changes
  useEffect(() => {
    setLocalText(data.text || '');
  }, [data.text]);

  // Update local suggestion when data changes
  useEffect(() => {
    setLocalSuggestion(data.suggestionPrompt || 'A description of a haunted mansion in winter');
  }, [data.suggestionPrompt]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingSuggestion && suggestionTextareaRef.current) {
      suggestionTextareaRef.current.focus();
      suggestionTextareaRef.current.select();
    }
  }, [isEditingSuggestion]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleSave = () => {
    data.text = localText;
    setIsEditing(false);
  };

  const handleSuggestionSave = () => {
    data.suggestionPrompt = localSuggestion;
    setIsEditingSuggestion(false);
    setHasUserEditedSuggestion(true); // Mark that user has edited the suggestion
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalText(data.text || '');
      setIsEditing(false);
      setShowSuggestion(false);
    }
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSuggestionSave();
    } else if (e.key === 'Escape') {
      setLocalSuggestion(data.suggestionPrompt || 'A description of a haunted mansion in winter');
      setIsEditingSuggestion(false);
    }
  };

  const handleDuplicate = () => {
    console.log('Duplicate node');
  };

  const toggleBrainActive = () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    data.isActive = newActiveState;
    
    // Show suggestion only when brain is activated
    setShowSuggestion(newActiveState);
    
    // Close suggestion editing when brain is deactivated
    if (!newActiveState) {
      setIsEditingSuggestion(false);
    }
  };

  const handleSuggestionClick = () => {
    if (!isEditingSuggestion) {
      setIsEditingSuggestion(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Title */}
      <div className="absolute -top-8 left-0 z-10">
        <span className={`text-sm font-normal ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {data.title}
        </span>
      </div>

      {/* Floating Action Icons */}
      <div className={`
        absolute -top-8 right-0 z-10 flex items-center space-x-1 transition-all duration-300
        ${isHovered || isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
      `}>
        <button
          onClick={toggleBrainActive}
          className={`
            w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
            ${isActive
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
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-400'
          }
        `}
      >
        {/* Text Content Area */}
        <div className="relative p-6">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className={`
                w-full bg-transparent border-none resize-none 
                focus:outline-none transition-all duration-200 text-sm 
                leading-relaxed overflow-hidden
                ${isDarkMode 
                  ? 'text-white placeholder-gray-400' 
                  : 'text-gray-800 placeholder-gray-300'
                }
              `}
              placeholder="your text here"
              style={{ 
                minHeight: '120px',
                height: 'auto'
              }}
            />
          ) : (
            <div
              ref={displayRef}
              onClick={() => setIsEditing(true)}
              className={`
                w-full cursor-text transition-all duration-200 
                text-sm leading-relaxed whitespace-pre-wrap
                ${isDarkMode ? 'text-white' : 'text-gray-800'}
              `}
              style={{ 
                minHeight: '120px',
                height: 'auto',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {localText || (
                <span className={`font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>
                  your text here
                </span>
              )}
            </div>
          )}
        </div>

        {/* Suggestion Section - Only shows when brain is active */}
        {showSuggestion && isActive && (
          <>
            {/* Divider */}
            <div className={`
              mx-6 border-t
              ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
            `} />
            
            {/* Suggestion Prompt Area */}
            <div className="p-6 pt-4">
              <div className="relative group">
                {isEditingSuggestion ? (
                  <textarea
                    ref={suggestionTextareaRef}
                    value={localSuggestion}
                    onChange={(e) => setLocalSuggestion(e.target.value)}
                    onBlur={handleSuggestionSave}
                    onKeyDown={handleSuggestionKeyDown}
                    className={`
                      w-full bg-transparent border border-dashed rounded-lg p-3 resize-none 
                      focus:outline-none focus:ring-2 transition-all duration-200 text-sm 
                      leading-relaxed overflow-hidden
                      ${isDarkMode 
                        ? 'text-gray-300 placeholder-gray-500 border-gray-600/50 focus:ring-blue-500/30 focus:border-blue-500/50' 
                        : 'text-gray-700 placeholder-gray-400 border-gray-400/60 focus:ring-blue-500/40 focus:border-blue-500/60'
                      }
                    `}
                    placeholder="Enter your suggestion prompt..."
                    style={{ 
                      minHeight: '40px',
                      height: 'auto'
                    }}
                  />
                ) : (
                  <div className="flex items-start justify-between group">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={handleSuggestionClick}
                    >
                      <div className="relative">
                        <span className={`
                          text-sm leading-relaxed font-normal transition-colors duration-200
                          ${isDarkMode 
                            ? 'text-gray-400 group-hover:text-gray-300' 
                            : 'text-gray-600 group-hover:text-gray-700'
                          }
                        `}>
                          {/* Only show "Try" prefix if user hasn't edited the suggestion and not currently editing */}
                          {!isEditingSuggestion && !hasUserEditedSuggestion && 'Try "'}
                          {localSuggestion}
                          {!isEditingSuggestion && !hasUserEditedSuggestion && '"'}
                          
                          {/* Ultra-subtle silver shimmer effect on hover */}
                          <span 
                            className={`
                              absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300
                              animate-shimmer pointer-events-none
                            `}
                            style={{
                              backgroundSize: '200% 100%',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              animation: 'shimmer 2s ease-in-out infinite'
                            }}
                          />
                        </span>
                      </div>
                    </div>
                    
                    {/* Edit Icon */}
                    <button
                      onClick={handleSuggestionClick}
                      className={`
                        ml-2 w-5 h-5 rounded flex items-center justify-center transition-all duration-200
                        opacity-0 group-hover:opacity-100 hover:scale-110
                        ${isDarkMode 
                          ? 'text-gray-500 hover:text-gray-300' 
                          : 'text-gray-700 hover:text-gray-800'
                        }
                      `}
                      title="Edit suggestion"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

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

      {/* Custom CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
