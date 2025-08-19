import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Type,
  Image,
  Video,
  Mic,
  FileText,
  Globe,
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isDarkMode: boolean;
  onCreateNode: (type: string, position: { x: number; y: number }) => void;
  onOpenAIModelSelection: () => void;
}

interface NodeType {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const nodeTypes: NodeType[] = [
  {
    id: 'text',
    label: 'Text Input',
    icon: <Type size={14} />,
    shortcut: 'T'
  },
  {
    id: 'image',
    label: 'Image',
    icon: <Image size={14} />,
    shortcut: 'I'
  },
  {
    id: 'video',
    label: 'Video',
    icon: <Video size={14} />,
    shortcut: 'V'
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: <Mic size={14} />,
    shortcut: 'A'
  },
  {
    id: 'document',
    label: 'Document',
    icon: <FileText size={14} />,
    shortcut: 'D'
  },
  {
    id: 'url',
    label: 'Website',
    icon: <Globe size={14} />,
    shortcut: 'W'
  }
];

export default function Sidebar({ isDarkMode, onCreateNode, onOpenAIModelSelection }: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle dropdown navigation when open
      if (isDropdownOpen) {
        if (key === 'arrowup') {
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : nodeTypes.length - 1);
          return;
        }
        if (key === 'arrowdown') {
          event.preventDefault();
          setSelectedIndex(prev => prev < nodeTypes.length - 1 ? prev + 1 : 0);
          return;
        }
        if (key === 'enter') {
          event.preventDefault();
          handleCreateNode(nodeTypes[selectedIndex].id);
          return;
        }
        if (key === 'escape') {
          event.preventDefault();
          setIsDropdownOpen(false);
          setSelectedIndex(0);
          return;
        }
      }

      // AI Model shortcut
      if (key === 'l') {
        event.preventDefault();
        onOpenAIModelSelection();
        return;
      }

      // Find matching node type by shortcut
      const nodeType = nodeTypes.find(type => type.shortcut.toLowerCase() === key);
      if (nodeType) {
        event.preventDefault();
        // Create node at center of viewport
        const centerX = window.innerWidth / 2 - 100;
        const centerY = window.innerHeight / 2 - 50;
        onCreateNode(nodeType.id, { x: centerX, y: centerY });
      }

      // Handle organize shortcut
      if (key === 'o') {
        event.preventDefault();
        console.log('Organize nodes (to be implemented)');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateNode, onOpenAIModelSelection, isDropdownOpen, selectedIndex]);

  const handleCreateNode = (nodeType: string) => {
    // Calculate position relative to the dropdown
    const dropdownRect = dropdownRef.current?.getBoundingClientRect();
    const x = dropdownRect ? dropdownRect.right + 20 : 250;
    const y = dropdownRect ? dropdownRect.top : 100;

    onCreateNode(nodeType, { x, y });
    setIsDropdownOpen(false);
    setSelectedIndex(0);
  };

  return (
    <>
      {/* Compact Left Sidebar Buttons */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-2">
        {/* Add Node Button */}
        <button
          ref={buttonRef}
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
            backdrop-blur-md shadow-md border hover:scale-105 group
            ${isDarkMode
              ? 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-800/90 text-slate-300 hover:text-white'
              : 'bg-white/80 border-gray-200/50 hover:bg-white/90 text-gray-600 hover:text-gray-800'
            }
            ${isDropdownOpen ? 'scale-105 ring-1 ring-blue-500/30' : ''}
          `}
          title="Add Node"
        >
          <Plus
            size={16}
            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-45' : 'group-hover:rotate-90'}`}
          />
        </button>

        {/* AI Tools Button */}
        <button
          ref={aiButtonRef}
          onClick={onOpenAIModelSelection}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
            backdrop-blur-md shadow-md border hover:scale-105 group
            ${isDarkMode
              ? 'bg-slate-900/80 border-slate-700/50 hover:bg-slate-800/90 text-slate-300 hover:text-white'
              : 'bg-white/80 border-gray-200/50 hover:bg-white/90 text-gray-600 hover:text-gray-800'
            }
          `}
          title="AI Models (L)"
        >
          <Sparkles 
            size={16} 
            className="transition-all duration-300 group-hover:text-purple-400 group-hover:scale-110"
          />
        </button>
      </div>

      {/* Node Types Dropdown Menu */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute left-14 top-1/2 -translate-y-1/2 z-30 w-56
            rounded-xl backdrop-blur-md shadow-xl border overflow-hidden
            animate-in slide-in-from-left-2 duration-300
            ${isDarkMode
              ? 'bg-slate-900/95 border-slate-700/50'
              : 'bg-white/95 border-gray-200/50'
            }
          `}
        >
          {/* Header */}
          <div className={`
            px-4 py-2 border-b flex items-center justify-between
            ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}
          `}>
            <h3 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Node
            </h3>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setSelectedIndex(0);
              }}
              className={`
                w-5 h-5 rounded flex items-center justify-center transition-colors
                ${isDarkMode
                  ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                  : 'hover:bg-gray-100/50 text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <X size={10} />
            </button>
          </div>

          {/* Node Types */}
          <div className="p-1">
            {nodeTypes.map((nodeType, index) => (
              <button
                key={nodeType.id}
                onClick={() => handleCreateNode(nodeType.id)}
                className={`
                  w-full p-2 rounded-lg text-left transition-all duration-150
                  group border border-transparent
                  ${index === selectedIndex
                    ? isDarkMode
                      ? 'bg-blue-600/20 border-blue-500/30 text-white'
                      : 'bg-blue-50 border-blue-200/50 text-gray-900'
                    : isDarkMode
                      ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  }
                `}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`
                      w-6 h-6 rounded flex items-center justify-center
                      ${index === selectedIndex
                        ? isDarkMode
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-blue-100 text-blue-600'
                        : isDarkMode
                          ? 'bg-slate-700/50 text-slate-400 group-hover:text-slate-300'
                          : 'bg-gray-100 text-gray-500 group-hover:text-gray-600'
                      }
                    `}>
                      {nodeType.icon}
                    </div>
                    <span className="font-medium text-sm">
                      {nodeType.label}
                    </span>
                  </div>
                  <span className={`
                    px-1.5 py-0.5 text-xs font-mono rounded
                    ${index === selectedIndex
                      ? isDarkMode
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-blue-100 text-blue-600'
                      : isDarkMode
                        ? 'bg-slate-700/50 text-slate-400'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {nodeType.shortcut}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className={`
            px-3 py-2 border-t text-xs
            ${isDarkMode
              ? 'border-slate-700/50 bg-slate-800/30 text-slate-400'
              : 'border-gray-200/50 bg-gray-50/30 text-gray-500'
            }
          `}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd className={`px-1.5 py-0.5 rounded text-sm ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className={`px-1.5 py-0.5 rounded text-sm ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                    ⏎
                  </kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd className={`px-1.5 py-0.5 rounded text-sm ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                    L
                  </kbd>
                  <span>AI</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className={`px-1.5 py-0.5 rounded text-sm ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                    O
                  </kbd>
                  <span>Organize</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}