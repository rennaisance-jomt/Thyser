import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node, Edge } from 'reactflow';
import { ChevronDown, Sparkles, Send, Loader2, Copy, Brain } from 'lucide-react';

interface AIModelNodeData {
  selectedModel: {
    id: string;
    name: string;
    provider: string;
    description: string;
    capabilities: string[];
  } | null;
  prompt: string;
  isLoading: boolean;
  error: string | null; // Keep error for the AIModelNode itself, e.g., if API key is missing
  showModelInfo: boolean;
  isActive: boolean;
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
    description: 'Advanced reasoning model with enhanced problem-solving capabilities for complex mathematical and scientific tasks.',
    capabilities: ['text', 'reasoning', 'code']
  },
  {
    id: 'openai-o3-mini',
    name: 'o3 Mini',
    provider: 'OpenAI',
    description: 'Compact version of o3 optimized for faster responses while maintaining strong reasoning abilities.',
    capabilities: ['text', 'reasoning', 'fast']
  },
  {
    id: 'openai-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Omni-modal flagship model capable of processing text, images, and audio with exceptional performance.',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  },
  {
    id: 'openai-gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Cost-effective multimodal model offering excellent performance for most everyday tasks.',
    capabilities: ['text', 'vision', 'fast']
  },
  // Anthropic Models
  {
    id: 'anthropic-claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed with excellent reasoning capabilities and safety features.',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },
  {
    id: 'anthropic-claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    description: 'Next-generation reasoning capabilities with enhanced understanding and analysis.',
    capabilities: ['text', 'vision', 'reasoning', 'code']
  },
  // Google Models
  {
    id: 'google-gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Next-generation multimodal processing with lightning-fast response times.',
    capabilities: ['text', 'vision', 'audio', 'fast']
  },
  {
    id: 'google-gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Most capable multimodal model with extensive context window and advanced reasoning.',
    capabilities: ['text', 'vision', 'audio', 'reasoning']
  }
];

const getProviderColor = (provider: string, isDarkMode: boolean) => {
  const colors = {
    'OpenAI': isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
    'Anthropic': isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700',
    'Google': isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
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
    'fast': '⚡'
  };
  return icons[capability as keyof typeof icons] || '✨';
};

export default function AIModelNode({ data, selected, xPos, yPos }: NodeProps<AIModelNodeData>) {
  const { setNodes, addEdge, getViewport, screenToFlowPosition } = useReactFlow();
  const [showDropdown, setShowDropdown] = useState(false);
  const [promptValue, setPromptValue] = useState(data.prompt || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

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

  // Initialize defaults and ensure model has full data
  useEffect(() => {
    if (!data.selectedModel) {
      // Set default model with full data
      const defaultModel = llmModels[0];
      data.selectedModel = {
        id: defaultModel.id,
        name: defaultModel.name,
        provider: defaultModel.provider,
        description: defaultModel.description,
        capabilities: defaultModel.capabilities
      };
    } else if (data.selectedModel && (!data.selectedModel.description || !data.selectedModel.capabilities)) {
      // If model exists but missing data, find and populate it
      const fullModelData = llmModels.find(m => m.id === data.selectedModel?.id);
      if (fullModelData) {
        data.selectedModel = {
          ...data.selectedModel,
          description: fullModelData.description,
          capabilities: fullModelData.capabilities
        };
      }
    }
    
    if (data.showModelInfo === undefined) data.showModelInfo = false;
    if (data.isActive === undefined) data.isActive = false;
    if (!data.prompt) data.prompt = '';
    if (data.isLoading === undefined) data.isLoading = false;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation in dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showDropdown) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => prev < llmModels.length - 1 ? prev + 1 : 0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : llmModels.length - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleModelSelect(llmModels[selectedIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown, selectedIndex]);

  // Auto-resize textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${Math.max(80, promptRef.current.scrollHeight)}px`;
    }
  }, [promptValue]);

  const handleModelSelect = (model: LLMModel) => {
    data.selectedModel = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      capabilities: model.capabilities
    };
    setShowDropdown(false);
    setSelectedIndex(0);
  };

  const toggleModelInfo = () => {
    data.showModelInfo = !data.showModelInfo;
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPromptValue(value);
    data.prompt = value;
  };

  const handleSubmit = async () => {
    if (!promptValue.trim() || !data.selectedModel) return;
    
    data.isLoading = true;
    data.error = null;
    
    try {
      // Simulate AI response - in real implementation, this would call the AI SDK
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const responseText = `This is a simulated response from ${data.selectedModel.name} (${data.selectedModel.provider}).

Your prompt: "${promptValue}"

The response would be generated based on the model's capabilities: ${data.selectedModel.capabilities.join(', ')}.

This is currently a mock implementation. To enable real AI functionality, you would need to:
1. Add API keys for the respective providers
2. Integrate with the AI SDK
3. Replace this mock response with actual API calls`;
      
      // Get current position of the AIModelNode
      const currentViewport = getViewport();
      const nodePosition = screenToFlowPosition({ x: xPos, y: yPos });

      // Create a new LLMOutputNode
      const newOutputNode: Node = {
        id: `llm-output-${Date.now()}`, // Unique ID
        type: 'llmOutputNode',
        position: { 
          x: nodePosition.x + 450, // Position relative to AIModelNode
          y: nodePosition.y + 50 
        }, 
        data: {
          response: responseText,
          prompt: promptValue,
          modelName: data.selectedModel.name,
          provider: data.selectedModel.provider,
          isDarkMode: isDarkMode,
        },
      };

      setNodes((nds) => nds.concat(newOutputNode));

      // Create an edge between the AIModelNode and the new LLMOutputNode
      const newEdge: Edge = {
        id: `e${data.id}-${newOutputNode.id}`,
        source: data.id,
        target: newOutputNode.id,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: isDarkMode ? '#06b6d4' : '#0891b2', 
          strokeWidth: 2 
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      data.isLoading = false;
    } catch (error) {
      data.error = 'Failed to generate response. Please try again.';
      data.isLoading = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDuplicate = () => {
    console.log('Duplicate AI Model node');
  };

  const toggleActive = () => {
    data.isActive = !data.isActive;
  };

  return (
    <div className="relative">
      {/* Floating Title */}
      <div className="absolute -top-8 left-0 z-10">
        <span className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
          AI Model
        </span>
      </div>

      {/* Floating Action Icons */}
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
      </div>

      {/* Main Node */}
      <div 
        className={`
          relative transition-all duration-300 min-w-[350px] max-w-[450px]
          ${selected 
            ? isDarkMode
              ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' 
              : 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/15'
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
        <div className="p-6 space-y-4">
          {/* Model Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`
                w-full p-3 border rounded-lg text-left transition-colors flex items-center justify-between
                ${isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Sparkles size={16} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
                <div>
                  <div className="font-medium text-sm">{data.selectedModel?.name || 'Select Model'}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {data.selectedModel?.provider || 'No provider'}
                  </div>
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className={`
                absolute top-full left-0 right-0 mt-1 z-30 max-h-60 overflow-y-auto
                rounded-lg border shadow-lg
                ${isDarkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-300'
                }
              `}>
                {llmModels.map((model, index) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      w-full p-3 text-left transition-colors border-b last:border-b-0
                      ${index === selectedIndex
                        ? isDarkMode
                          ? 'bg-purple-600/20 border-purple-500/30 text-white'
                          : 'bg-purple-50 border-purple-200/50 text-gray-900'
                        : isDarkMode
                          ? 'hover:bg-gray-700 border-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {model.name}
                        </div>
                        <div className={`text-xs ${
                          index === selectedIndex
                            ? isDarkMode ? 'text-purple-200' : 'text-purple-700'
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {model.provider}
                        </div>
                      </div>
                      <span className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${getProviderColor(model.provider, isDarkMode)}
                      `}>
                        {model.provider}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Info Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleModelInfo}
              className={`
                flex items-center space-x-2 text-sm transition-colors
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <span>Model Info</span>
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${data.showModelInfo ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Model Info Panel */}
          {data.showModelInfo && data.selectedModel && (
            <div className={`
              p-4 rounded-lg border
              ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}
            `}>
              <div className="space-y-3">
                {/* Model Description */}
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Description
                  </h4>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {data.selectedModel.description}
                  </p>
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.selectedModel.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className={`
                          inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full
                          ${isDarkMode 
                            ? 'bg-gray-700/50 text-gray-300' 
                            : 'bg-gray-200 text-gray-600'
                          }
                        `}
                      >
                        <span>{getCapabilityIcon(capability)}</span>
                        <span className="capitalize">{capability}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Provider Info */}
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Provider
                  </h4>
                  <span className={`
                    inline-block px-3 py-1 text-sm rounded-full font-medium
                    ${getProviderColor(data.selectedModel.provider, isDarkMode)}
                  `}>
                    {data.selectedModel.provider}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                ref={promptRef}
                value={promptValue}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prompt here..."
                className={`
                  w-full p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500/30' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500/30'
                  }
                `}
                style={{ minHeight: '80px' }}
                disabled={data.isLoading}
              />
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!promptValue.trim() || data.isLoading}
                className={`
                  absolute bottom-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${promptValue.trim() && !data.isLoading
                    ? isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                    : isDarkMode 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {data.isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )
              }
              </button>
            </div>
          </div>

          {/* Error Message (for AIModelNode specific errors like API key missing) */}
          {data.error && (
            <div className={`
              p-3 rounded-lg border
              ${isDarkMode 
                ? 'bg-red-900/20 border-red-800/30 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
              }
            `}>
              <p className="text-sm">{data.error}</p>
            </div>
          )}
        </div>

        {/* Connection Handles */}
        <Handle 
          type="source" 
          position={Position.Right} 
          className={`
            w-3 h-3 border-2 hover:bg-purple-500 transition-colors rounded-full
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
            w-3 h-3 border-2 hover:bg-purple-500 transition-colors rounded-full
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
