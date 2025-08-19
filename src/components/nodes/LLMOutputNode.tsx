import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Copy, Info, FileText } from 'lucide-react';

interface LLMOutputNodeData {
  response: string;
  prompt: string; // To show the original prompt
  modelName: string;
  provider: string;
  isDarkMode?: boolean;
}

export default function LLMOutputNode({ data, selected }: NodeProps<LLMOutputNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDuplicate = () => {
    console.log('Duplicate LLM Output node');
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Title and Model Name */}
      <div className="absolute -top-8 left-0 right-0 z-10 flex justify-between items-center">
        <span className={`text-sm font-normal ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          LLM Output
        </span>
        <span className={`text-xs font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.modelName} ({data.provider})
        </span>
      </div>

      {/* Main Node Card */}
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
          rounded-xl overflow-hidden
          ${isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-400'
          }
        `}
      >
        {/* "Original Prompt" section */}
        <div className={`
          flex items-center p-4 space-x-2
          ${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100/50 text-gray-700'}
        `}>
          <Info size={16} />
          <span className="text-sm font-medium">Original Prompt</span>
        </div>
        <div className="p-4 pt-2">
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {data.prompt || 'No prompt provided.'}
          </p>
        </div>

        {/* "LLM Response" section */}
        <div className={`
          flex items-center p-4 space-x-2 border-t
          ${isDarkMode ? 'bg-gray-700/50 border-gray-700 text-gray-300' : 'bg-gray-100/50 border-gray-300 text-gray-700'}
        `}>
          <FileText size={16} />
          <span className="text-sm font-medium">LLM Response</span>
        </div>
        <div className="p-4 pt-2">
          <div
            ref={displayRef}
            className={`
              w-full cursor-text transition-all duration-200 
              text-sm leading-relaxed whitespace-pre-wrap
              ${isDarkMode ? 'text-white' : 'text-gray-800'}
            `}
            style={{ 
              minHeight: '80px',
              height: 'auto',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {data.response || (
              <span className={`font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>
                No response generated.
              </span>
            )}
          </div>
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
