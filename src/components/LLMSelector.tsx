import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface LLMSelectorProps {
  isDarkMode: boolean;
  onSelectModel: (modelId: string, modelName: string, provider: string) => void;
  llmDropdownRef: React.RefObject<HTMLDivElement>;
}

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
}

const llmModels: LLMModel[] = [
  // OpenAI Models
  {
    id: 'openai-o3',
    name: 'o3',
    provider: 'OpenAI',
    description: 'Advanced reasoning model with enhanced problem-solving',
    capabilities: ['text', 'reasoning', 'code']
  },
  {
    id: 'openai-o3-mini',
    name: 'o3 Mini',
    provider: 'OpenAI',
    description: 'Compact version of o3 for faster responses',
    capabilities: ['text', 'reasoning', 'fast']
  },
  {
    id: 'openai-o4-mini',
    name: 'o4 Mini',
    provider: 'OpenAI',
    description: 'Next-generation compact reasoning model',
    capabilities: ['text', 'reasoning', 'fast']
  },
  {
    id: 'openai-gpt-4.1',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    description: 'Advanced reasoning with improved capabilities',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },
  {
    id: 'openai-gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    description: 'Streamlined version of GPT-4.1',
    capabilities: ['text', 'reasoning', 'fast']
  },
  {
    id: 'openai-gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'OpenAI',
    description: 'Ultra-fast lightweight model',
    capabilities: ['text', 'fast']
  },
  {
    id: 'openai-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Omni-modal flagship model',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  },
  {
    id: 'openai-gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Cost-effective multimodal model',
    capabilities: ['text', 'vision', 'fast']
  },
  {
    id: 'openai-gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks',
    capabilities: ['text', 'chat', 'fast']
  },

  // Anthropic Models
  {
    id: 'anthropic-claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },
  {
    id: 'anthropic-claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    description: 'Enhanced reasoning and analysis',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },
  {
    id: 'anthropic-claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    description: 'Next-generation reasoning capabilities',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },

  // Google Models
  {
    id: 'google-gemini-2.5-pro-preview-05-06',
    name: 'Gemini 2.5 Pro Preview',
    provider: 'Google',
    description: 'Latest experimental pro model',
    capabilities: ['text', 'vision', 'audio', 'reasoning', 'code']
  },
  {
    id: 'google-gemini-2.5-flash-preview-04-17',
    name: 'Gemini 2.5 Flash Preview',
    provider: 'Google',
    description: 'Ultra-fast experimental model',
    capabilities: ['text', 'vision', 'fast']
  },
  {
    id: 'google-gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro Experimental',
    provider: 'Google',
    description: 'Cutting-edge experimental features',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  },
  {
    id: 'google-gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Next-gen multimodal processing',
    capabilities: ['text', 'vision', 'audio', 'fast']
  },
  {
    id: 'google-gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Most capable multimodal model',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  },
  {
    id: 'google-gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro Latest',
    provider: 'Google',
    description: 'Latest version of Gemini 1.5 Pro',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  },
  {
    id: 'google-gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Fast multimodal processing',
    capabilities: ['text', 'vision', 'fast']
  },

  // Deepseek Models
  {
    id: 'deepseek-reasoner',
    name: 'Deepseek Reasoner',
    provider: 'Deepseek',
    description: 'Advanced reasoning and problem-solving',
    capabilities: ['text', 'reasoning', 'code']
  },
];

const getProviderColor = (provider: string, isDarkMode: boolean) => {
  const colors = {
    'OpenAI': isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
    'Anthropic': isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700',
    'Google': isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
    'Deepseek': isDarkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700',
  };
  return colors[provider as keyof typeof colors] || (isDarkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700');
};

const getCapabilityIcon = (capability: string) => {
  const icons = {
    'text': '📝',
    'vision': '👁️',
    'audio': '🎵',
    'code': '💻',
    'reasoning': '🧠',
    'chat': '💬',
    'fast': '⚡',
    'programming': '⚙️',
    'debugging': '🐛'
  };
  return icons[capability as keyof typeof icons] || '✨';
};

export default function LLMSelector({ isDarkMode, onSelectModel, llmDropdownRef }: LLMSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModels, setFilteredModels] = useState<LLMModel[]>(llmModels);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const filtered = llmModels.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredModels(filtered);
    setSelectedIndex(0);
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => prev < filteredModels.length - 1 ? prev + 1 : 0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredModels.length - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredModels[selectedIndex]) {
          const model = filteredModels[selectedIndex];
          onSelectModel(model.id, model.name, model.provider);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredModels, selectedIndex, onSelectModel]);

  return (
    <div
      ref={llmDropdownRef}
      className={`
        absolute left-14 top-[calc(50%+2.5rem)] -translate-y-1/2 z-30 w-80
        rounded-xl backdrop-blur-md shadow-xl border overflow-hidden
        animate-in slide-in-from-left-2 duration-300
        ${isDarkMode
          ? 'bg-slate-900/95 border-slate-700/50'
          : 'bg-white/95 border-gray-200/50'
        }
      `}
    >
      {/* Search Bar */}
      <div className={`
        px-4 py-3 border-b flex items-center
        ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}
      `}>
        <Search size={16} className={`mr-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="Search AI models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`
            w-full bg-transparent outline-none text-sm
            ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-500'}
          `}
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className={`
              ml-2 w-5 h-5 rounded flex items-center justify-center transition-colors
              ${isDarkMode
                ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                : 'hover:bg-gray-100/50 text-gray-400 hover:text-gray-600'
              }
            `}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Model List */}
      <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredModels.length > 0 ? (
          filteredModels.map((model, index) => (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id, model.name, model.provider)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full p-3 rounded-lg text-left transition-all duration-150
                flex flex-col space-y-2 border border-transparent
                ${index === selectedIndex
                  ? isDarkMode
                    ? 'bg-purple-600/20 border-purple-500/30 text-white'
                    : 'bg-purple-50 border-purple-200/50 text-gray-900'
                  : isDarkMode
                    ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                }
              `}
            >
              {/* Model Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles size={14} className={index === selectedIndex 
                    ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    : isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  } />
                  <span className="font-medium text-sm">{model.name}</span>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full font-medium
                  ${getProviderColor(model.provider, isDarkMode)}
                `}>
                  {model.provider}
                </span>
              </div>

              {/* Model Description */}
              <p className={`text-xs leading-relaxed ${
                index === selectedIndex
                  ? isDarkMode ? 'text-purple-200' : 'text-purple-700'
                  : isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {model.description}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1">
                {model.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className={`
                      inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full
                      ${index === selectedIndex
                        ? isDarkMode 
                          ? 'bg-purple-500/30 text-purple-200' 
                          : 'bg-purple-100 text-purple-700'
                        : isDarkMode 
                          ? 'bg-slate-600/50 text-slate-300' 
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    <span>{getCapabilityIcon(capability)}</span>
                    <span>{capability}</span>
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
            <p>No models found matching "{searchTerm}"</p>
            <p className="text-xs mt-1 opacity-75">Try searching by provider, capability, or model name</p>
          </div>
        )}
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className={`
        px-3 py-2 border-t text-xs
        ${isDarkMode
          ? 'border-slate-700/50 bg-slate-800/30 text-slate-400'
          : 'border-gray-200/50 bg-gray-50/30 text-gray-500'
        }
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <kbd className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode ? 'bg-slate-600/30' : 'bg-gray-200/50'}`}>
                ⏎
              </kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles size={12} />
            <span>{filteredModels.length} models</span>
          </div>
        </div>
      </div>
    </div>
  );
}