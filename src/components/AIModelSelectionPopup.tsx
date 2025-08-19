import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface AIModelSelectionPopupProps {
  isDarkMode: boolean;
  onSelectModel: (modelId: string, modelName: string, provider: string) => void;
  onClose: () => void;
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
  };
  return icons[capability as keyof typeof icons] || '✨';
};

export default function AIModelSelectionPopup({ isDarkMode, onSelectModel, onClose }: AIModelSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<string>('all');
  const [filteredModels, setFilteredModels] = useState<LLMModel[]>(llmModels);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get unique providers and capabilities
  const providers = ['all', ...Array.from(new Set(llmModels.map(model => model.provider)))];
  const capabilities = ['all', ...Array.from(new Set(llmModels.flatMap(model => model.capabilities)))];

  // Filter models based on search and filters
  useEffect(() => {
    let filtered = llmModels;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply provider filter
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(model => model.provider === selectedProvider);
    }

    // Apply capability filter
    if (selectedCapability !== 'all') {
      filtered = filtered.filter(model => model.capabilities.includes(selectedCapability));
    }

    setFilteredModels(filtered);
  }, [searchTerm, selectedProvider, selectedCapability]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle escape key to close popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleModelSelect = (model: LLMModel) => {
    onSelectModel(model.id, model.name, model.provider);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvider('all');
    setSelectedCapability('all');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className={`
        relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-2xl shadow-2xl overflow-hidden
        animate-in zoom-in-95 duration-300
        ${isDarkMode 
          ? 'bg-gray-900/95 border border-gray-700/50' 
          : 'bg-white/95 border border-gray-200/50'
        }
      `}>
        {/* Header */}
        <div className={`
          px-6 py-4 border-b flex items-center justify-between
          ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}
        `}>
          <div className="flex items-center space-x-3">
            <Sparkles size={24} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select AI Model
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${isDarkMode
                ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100/50 text-gray-400 hover:text-gray-600'
              }
            `}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className={`
          px-6 py-4 border-b space-y-4
          ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}
        `}>
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search AI models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                ${isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500/30' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-purple-500/30'
                }
              `}
            />
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Provider Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className={`
                  w-full p-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500/30' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/30'
                  }
                `}
              >
                {providers.map(provider => (
                  <option key={provider} value={provider}>
                    {provider === 'all' ? 'All Providers' : provider}
                  </option>
                ))}
              </select>
            </div>

            {/* Capability Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Capability
              </label>
              <select
                value={selectedCapability}
                onChange={(e) => setSelectedCapability(e.target.value)}
                className={`
                  w-full p-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500/30' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500/30'
                  }
                `}
              >
                {capabilities.map(capability => (
                  <option key={capability} value={capability}>
                    {capability === 'all' ? 'All Capabilities' : capability}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-2">
            {(selectedProvider !== 'all' || selectedCapability !== 'all') && (
              <button
                onClick={clearFilters}
                className={`
                  text-sm transition-colors
                  ${isDarkMode 
                    ? 'text-purple-400 hover:text-purple-300' 
                    : 'text-purple-600 hover:text-purple-700'
                  }
                `}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Models Grid */}
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className={`
                    p-4 rounded-xl text-left transition-all duration-200 border hover:scale-105
                    ${isDarkMode
                      ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-purple-500/30 shadow-lg hover:shadow-purple-500/10'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-purple-300/50 shadow-md hover:shadow-purple-500/10'
                    }
                  `}
                >
                  {/* Model Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles size={16} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
                      <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {model.name}
                      </h3>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs rounded-full font-medium
                      ${getProviderColor(model.provider, isDarkMode)}
                    `}>
                      {model.provider}
                    </span>
                  </div>

                  {/* Model Description */}
                  <p className={`text-xs leading-relaxed mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {model.description}
                  </p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className={`
                          inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full
                          ${isDarkMode 
                            ? 'bg-gray-700/50 text-gray-300' 
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
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No models found</h3>
              <p className="text-sm">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`
          px-6 py-4 border-t
          ${isDarkMode
            ? 'border-gray-700/50 bg-gray-800/30'
            : 'border-gray-200/50 bg-gray-50/30'
          }
        `}>
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center space-x-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center space-x-1">
                <kbd className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}>
                  Esc
                </kbd>
                <span>Close</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles size={12} />
                <span>{filteredModels.length} models</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}