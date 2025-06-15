import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  useReactFlow,
  ReactFlowProvider,
  OnSelectionChangeParams,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sun, Moon, ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';
import NeuralScaffold from './NeuralScaffold';
import Sidebar from './Sidebar';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import VideoNode from './nodes/VideoNode';
import AudioNode from './nodes/AudioNode';
import DocumentNode from './nodes/DocumentNode';
import UrlNode from './nodes/UrlNode';
import AIModelNode from './nodes/AIModelNode';
import SelectionBox from './SelectionBox';
import AIModelSelectionPopup from './AIModelSelectionPopup';
import CanvasMenu from './CanvasMenu';
import AutoSaveStatus from './AutoSaveStatus';
import CanvasNameEditor from './CanvasNameEditor';
import { canvasOperations } from '../lib/supabaseClient';
import { AppView } from '../App';

// Register custom node types
const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  audioNode: AudioNode,
  documentNode: DocumentNode,
  urlNode: UrlNode,
  aiModelNode: AIModelNode,
};

interface FlowCanvasProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  onNavigate: (view: AppView, canvasId?: string) => void;
  canvasId?: string;
}

function FlowCanvasInner({ isDarkMode, setIsDarkMode, onNavigate, canvasId }: FlowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isAIModelSelectionPopupOpen, setIsAIModelSelectionPopupOpen] = useState(false);
  
  // Auto-save state
  const [lastSavedTime, setLastSavedTime] = useState('just now');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [canvasName, setCanvasName] = useState('My Canvas');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveDataRef = useRef<string>('');
  
  const { zoomIn, zoomOut, fitView, setViewport: setReactFlowViewport, project, screenToFlowPosition, getViewport } = useReactFlow();

  // Load canvas data on mount
  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        setIsSaving(true);
        let canvasData;

        if (canvasId) {
          // Load specific canvas by ID
          canvasData = await canvasOperations.loadCanvas(canvasId);
          setCurrentCanvasId(canvasId);
        } else {
          // Load default canvas
          canvasData = await canvasOperations.loadCanvas();
          setCurrentCanvasId(canvasData?.id || null);
        }
        
        if (canvasData) {
          setNodes(canvasData.nodes || []);
          setEdges(canvasData.edges || []);
          setCanvasName(canvasData.canvas_name || 'My Canvas');
          
          if (canvasData.viewport) {
            setViewport(canvasData.viewport);
            setReactFlowViewport(canvasData.viewport);
          }
          
          // Update node counter based on existing nodes
          const maxId = Math.max(
            0,
            ...(canvasData.nodes || []).map((node: Node) => {
              const match = node.id.match(/-(\d+)$/);
              return match ? parseInt(match[1], 10) : 0;
            })
          );
          setNodeIdCounter(maxId + 1);
          
          setLastSavedTime('just now');
        } else {
          setLastSavedTime('never');
          setCanvasName('My Canvas');
        }
      } catch (error) {
        setSaveError('Failed to load canvas data');
        setLastSavedTime('error');
      } finally {
        setIsSaving(false);
        setIsLoaded(true);
      }
    };

    loadCanvasData();
  }, [setReactFlowViewport, canvasId]);

  // Auto-save functionality with debouncing and thumbnail generation
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete

    const saveCanvasData = async () => {
      try {
        const currentViewport = getViewport();
        const dataToSave = {
          nodes,
          edges,
          viewport: currentViewport
        };

        // Create a hash of the current data to avoid unnecessary saves
        const currentDataHash = JSON.stringify(dataToSave);
        
        // Only save if data has actually changed
        if (currentDataHash === lastSaveDataRef.current) {
          return;
        }

        setIsSaving(true);
        setSaveError(null);

        // Generate thumbnail if we have nodes
        let thumbnailUrl;
        if (nodes.length > 0) {
          try {
            thumbnailUrl = await canvasOperations.generateThumbnail(
              currentCanvasId || 'temp',
              nodes,
              edges,
              currentViewport
            );
          } catch (thumbnailError) {
            console.warn('Failed to generate thumbnail:', thumbnailError);
          }
        }

        const savedCanvas = await canvasOperations.saveCanvas({
          ...dataToSave,
          canvasName,
          canvasId: currentCanvasId || undefined,
          thumbnailUrl
        });
        
        // Update current canvas ID if this was a new canvas
        if (!currentCanvasId && savedCanvas?.id) {
          setCurrentCanvasId(savedCanvas.id);
        }
        
        // Clean up old versions to keep only the latest
        await canvasOperations.cleanupOldVersions(canvasName);
        
        lastSaveDataRef.current = currentDataHash;
        setLastSavedTime('just now');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveError('Auto-save failed');
        setLastSavedTime('error');
      } finally {
        setIsSaving(false);
      }
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced saving
    saveTimeoutRef.current = setTimeout(saveCanvasData, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, viewport, isLoaded, getViewport, currentCanvasId, canvasName]);

  // Update last saved time periodically
  useEffect(() => {
    const updateTimeInterval = setInterval(() => {
      if (lastSavedTime === 'just now') {
        setLastSavedTime('1m ago');
      } else if (lastSavedTime.includes('m ago')) {
        const minutes = parseInt(lastSavedTime.match(/(\d+)m/)?.[1] || '1', 10);
        if (minutes < 60) {
          setLastSavedTime(`${minutes + 1}m ago`);
        } else {
          setLastSavedTime('1h ago');
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(updateTimeInterval);
  }, [lastSavedTime]);

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setCanvasDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Track viewport changes for neural scaffold
  useEffect(() => {
    const updateViewport = () => {
      const currentViewport = getViewport();
      setViewport(currentViewport);
    };

    // Initial viewport
    updateViewport();

    // Listen for viewport changes
    const interval = setInterval(updateViewport, 16); // ~60fps
    return () => clearInterval(interval);
  }, [getViewport]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: isDarkMode ? '#06b6d4' : '#0891b2', 
          strokeWidth: 2 
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [isDarkMode]
  );

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes.map(node => node.id));
  }, []);

  // Handle mouse down for selection box
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setIsSelecting(true);
        setSelectionStart({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        setSelectionEnd({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    }
  }, []);

  // Handle mouse move for selection box
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isSelecting && selectionStart && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSelectionEnd({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });

      // Calculate selection area in flow coordinates
      const flowStart = screenToFlowPosition({
        x: Math.min(selectionStart.x, event.clientX - rect.left),
        y: Math.min(selectionStart.y, event.clientY - rect.top)
      });
      const flowEnd = screenToFlowPosition({
        x: Math.max(selectionStart.x, event.clientX - rect.left),
        y: Math.max(selectionStart.y, event.clientY - rect.top)
      });

      // Select nodes within the selection box
      const selectedNodeIds = nodes
        .filter(node => {
          const nodeX = node.position.x;
          const nodeY = node.position.y;
          const nodeWidth = 250; // Approximate node width
          const nodeHeight = 150; // Approximate node height

          return (
            nodeX >= flowStart.x &&
            nodeY >= flowStart.y &&
            nodeX + nodeWidth <= flowEnd.x &&
            nodeY + nodeHeight <= flowEnd.y
          );
        })
        .map(node => node.id);

      // Update node selection
      setNodes(prevNodes =>
        prevNodes.map(node => ({
          ...node,
          selected: selectedNodeIds.includes(node.id)
        }))
      );
    }
  }, [isSelecting, selectionStart, nodes, screenToFlowPosition]);

  // Handle mouse up for selection box
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      
      // Delete selected nodes
      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id);
        if (selectedNodeIds.length > 0) {
          setNodes(prevNodes => prevNodes.filter(node => !selectedNodeIds.includes(node.id)));
          setEdges(prevEdges => prevEdges.filter(edge => 
            !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
          ));
        }
      }

      // Duplicate selected nodes
      if ((event.ctrlKey || event.metaKey) && key === 'd') {
        event.preventDefault();
        duplicateSelectedNodes();
      }

      // Select all nodes
      if ((event.ctrlKey || event.metaKey) && key === 'a') {
        event.preventDefault();
        setNodes(prevNodes => prevNodes.map(node => ({ ...node, selected: true })));
      }

      // Organize nodes
      if (key === 'o') {
        event.preventDefault();
        organizeNodes();
      }

      // Manual save
      if ((event.ctrlKey || event.metaKey) && key === 's') {
        event.preventDefault();
        manualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes]);

  // Manual save function
  const manualSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const currentViewport = getViewport();
      
      // Generate thumbnail if we have nodes
      let thumbnailUrl;
      if (nodes.length > 0) {
        try {
          thumbnailUrl = await canvasOperations.generateThumbnail(
            currentCanvasId || 'temp',
            nodes,
            edges,
            currentViewport
          );
        } catch (thumbnailError) {
          console.warn('Failed to generate thumbnail:', thumbnailError);
        }
      }

      const savedCanvas = await canvasOperations.saveCanvas({
        nodes,
        edges,
        viewport: currentViewport,
        canvasName,
        canvasId: currentCanvasId || undefined,
        thumbnailUrl
      });

      // Update current canvas ID if this was a new canvas
      if (!currentCanvasId && savedCanvas?.id) {
        setCurrentCanvasId(savedCanvas.id);
      }

      await canvasOperations.cleanupOldVersions(canvasName);
      
      setLastSavedTime('just now');
    } catch (error) {
      console.error('Manual save failed:', error);
      setSaveError('Save failed');
      setLastSavedTime('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate selected nodes
  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodesList = nodes.filter(node => node.selected);
    if (selectedNodesList.length === 0) return;

    const newNodes = selectedNodesList.map(node => {
      const newId = `${node.type?.replace('Node', '') || 'node'}-${nodeIdCounter + nodes.length}`;
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        selected: false,
        data: {
          ...node.data,
          title: node.data.title ? `${node.data.title} Copy` : 'Copy',
          isActive: node.data.isActive || false
        }
      };
    });

    setNodes(prevNodes => [...prevNodes.map(node => ({ ...node, selected: false })), ...newNodes]);
    setNodeIdCounter(prev => prev + newNodes.length);
  }, [nodes, nodeIdCounter]);

  // Organize nodes in a grid layout
  const organizeNodes = useCallback(() => {
    if (nodes.length === 0) return;

    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 300;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((Math.ceil(nodes.length / cols) - 1) * spacing) / 2;

    setNodes(prevNodes =>
      prevNodes.map((node, index) => ({
        ...node,
        position: {
          x: startX + (index % cols) * spacing,
          y: startY + Math.floor(index / cols) * spacing
        }
      }))
    );
  }, [nodes]);

  // Create new node
  const handleCreateNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    const id = `${nodeType}-${nodeIdCounter}`;
    setNodeIdCounter(prev => prev + 1);

    // Convert screen coordinates to flow coordinates
    const flowPosition = screenToFlowPosition(position);

    let newNode: Node;

    switch (nodeType) {
      case 'text':
        newNode = {
          id,
          type: 'textNode',
          position: flowPosition,
          data: {
            text: '',
            title: 'Text Input',
            isRichText: true,
            isMultiline: true,
            alignment: 'left',
            formatting: {
              bold: false,
              italic: false,
            },
            isActive: false,
            suggestionPrompt: 'A description of a haunted mansion in winter',
          },
        };
        break;
      case 'image':
        newNode = {
          id,
          type: 'imageNode',
          position: flowPosition,
          data: {
            imageUrl: '',
            imageFile: null,
            uploadMethod: 'file',
            isLoading: false,
            error: null,
            isActive: false,
          },
        };
        break;
      case 'video':
        newNode = {
          id,
          type: 'videoNode',
          position: flowPosition,
          data: {
            videoUrl: '',
            videoFile: null,
            uploadMethod: 'file',
            isLoading: false,
            error: null,
            isPlaying: false,
            isMuted: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            isActive: false,
          },
        };
        break;
      case 'audio':
        newNode = {
          id,
          type: 'audioNode',
          position: flowPosition,
          data: {
            audioUrl: '',
            audioFile: null,
            uploadMethod: 'file',
            isLoading: false,
            error: null,
            isPlaying: false,
            isMuted: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            isActive: false,
          },
        };
        break;
      case 'document':
        newNode = {
          id,
          type: 'documentNode',
          position: flowPosition,
          data: {
            documentUrl: '',
            documentFile: null,
            uploadMethod: 'file',
            isLoading: false,
            error: null,
            fileName: '',
            fileSize: 0,
            fileType: '',
            pageCount: undefined,
            extractedText: '',
            isPreviewOpen: false,
            isActive: false,
          },
        };
        break;
      case 'url':
        newNode = {
          id,
          type: 'urlNode',
          position: flowPosition,
          data: {
            url: '',
            title: '',
            description: '',
            favicon: '',
            isLoading: false,
            error: null,
            isPreviewVisible: true,
            lastFetched: null,
            isActive: false,
          },
        };
        break;
      case 'aiModel':
        newNode = {
          id,
          type: 'aiModelNode',
          position: flowPosition,
          data: {
            selectedModel: null,
            prompt: '',
            response: '',
            isLoading: false,
            error: null,
            showModelInfo: false,
            isActive: false,
          },
        };
        break;
      default:
        newNode = {
          id,
          type: 'default',
          position: flowPosition,
          data: {
            label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
          },
        };
    }

    setNodes((nds) => [...nds, newNode]);
  }, [nodeIdCounter, screenToFlowPosition]);

  // Handle AI model selection
  const handleSelectAIModel = useCallback((modelId: string, modelName: string, provider: string) => {
    // Create an AI Model node with the selected model
    const centerX = window.innerWidth / 2 - 175;
    const centerY = window.innerHeight / 2 - 100;
    
    const flowPosition = screenToFlowPosition({ x: centerX, y: centerY });
    const id = `aiModel-${nodeIdCounter}`;
    setNodeIdCounter(prev => prev + 1);

    const newNode: Node = {
      id,
      type: 'aiModelNode',
      position: flowPosition,
      data: {
        selectedModel: {
          id: modelId,
          name: modelName,
          provider: provider,
          description: '',
          capabilities: []
        },
        prompt: '',
        response: '',
        isLoading: false,
        error: null,
        showModelInfo: false,
        isActive: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsAIModelSelectionPopupOpen(false);
  }, [nodeIdCounter, screenToFlowPosition]);

  // Handle canvas name change
  const handleCanvasNameChange = useCallback((newName: string) => {
    setCanvasName(newName);
  }, []);

  // Convert nodes to active positions for neural scaffold (in flow coordinates)
  const activeNodes = nodes.map(node => ({
    x: node.position.x + 125, // Center of node
    y: node.position.y + 75,  // Center of node
    selected: node.selected || false
  }));

  // Convert edges to connections for neural scaffold (in flow coordinates)
  const connections = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      return {
        source: { x: sourceNode.position.x + 125, y: sourceNode.position.y + 75 },
        target: { x: targetNode.position.x + 125, y: targetNode.position.y + 75 }
      };
    }
    return null;
  }).filter(Boolean) as Array<{ source: { x: number; y: number }; target: { x: number; y: number } }>;

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Neural Scaffold Background */}
      <NeuralScaffold
        isDarkMode={isDarkMode}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        activeNodes={activeNodes}
        connections={connections}
        viewport={viewport}
      />
      
      {/* Canvas Menu */}
      <CanvasMenu isDarkMode={isDarkMode} onNavigate={onNavigate} />
      
      {/* Canvas Name Editor */}
      <CanvasNameEditor 
        isDarkMode={isDarkMode}
        canvasName={canvasName}
        onNameChange={handleCanvasNameChange}
      />
      
      {/* Auto-Save Status */}
      <AutoSaveStatus 
        isDarkMode={isDarkMode}
        lastSavedTime={saveError ? 'error' : lastSavedTime}
        isSaving={isSaving}
      />
      
      {/* Sidebar */}
      <Sidebar 
        isDarkMode={isDarkMode} 
        onCreateNode={handleCreateNode}
        onOpenAIModelSelection={() => setIsAIModelSelectionPopupOpen(true)}
      />

      {/* Selection Box */}
      {isSelecting && selectionStart && selectionEnd && (
        <SelectionBox
          start={selectionStart}
          end={selectionEnd}
          isDarkMode={isDarkMode}
        />
      )}

      {/* AI Model Selection Popup */}
      {isAIModelSelectionPopupOpen && (
        <AIModelSelectionPopup
          isDarkMode={isDarkMode}
          onSelectModel={handleSelectAIModel}
          onClose={() => setIsAIModelSelectionPopupOpen(false)}
        />
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
        deleteKeyCode={[]}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        selectionKeyCode={['Shift']}
        proOptions={{ hideAttribution: true }}
        className={`${isDarkMode ? 'bg-black' : 'bg-stone-50'} relative z-10`}
        style={{ background: 'transparent' }}
      >
        {/* Canvas Controls */}
        <div className="absolute bottom-6 right-6 z-20">
          <div className={`
            flex flex-col space-y-2 p-2 rounded-xl backdrop-blur-md
            ${isDarkMode 
              ? 'bg-slate-900/70' 
              : 'bg-white/70'
            }
            shadow-lg border border-white/10
          `}>
            <button
              onClick={() => zoomIn()}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105
                ${isDarkMode 
                  ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white' 
                  : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-800'
                }
              `}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            
            <button
              onClick={() => zoomOut()}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105
                ${isDarkMode 
                  ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white' 
                  : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-800'
                }
              `}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            
            <button
              onClick={() => fitView()}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105
                ${isDarkMode 
                  ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white' 
                  : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-800'
                }
              `}
              title="Fit View"
            >
              <Maximize size={16} />
            </button>
            
            <button
              onClick={() => setReactFlowViewport({ x: 0, y: 0, zoom: 1 })}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105
                ${isDarkMode 
                  ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white' 
                  : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-800'
                }
              `}
              title="Reset View"
            >
              <Move size={16} />
            </button>
            
            <div className={`w-6 h-px mx-auto my-1 ${isDarkMode ? 'bg-slate-600/50' : 'bg-gray-300/50'}`} />
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105
                ${isDarkMode 
                  ? 'hover:bg-slate-700/50 text-yellow-400 hover:text-yellow-300' 
                  : 'hover:bg-gray-100/50 text-orange-500 hover:text-orange-600'
                }
              `}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </ReactFlow>

      {/* Save Error Toast */}
      {saveError && (
        <div className="absolute bottom-6 left-6 z-30">
          <div className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
            backdrop-blur-md shadow-md border
            ${isDarkMode
              ? 'bg-red-900/80 border-red-700/50 text-red-300'
              : 'bg-red-50/80 border-red-200/50 text-red-700'
            }
          `}>
            <span className="text-sm font-medium">{saveError}</span>
            <button
              onClick={() => setSaveError(null)}
              className={`
                w-4 h-4 rounded flex items-center justify-center transition-colors
                ${isDarkMode 
                  ? 'hover:bg-red-800/50 text-red-400 hover:text-red-300' 
                  : 'hover:bg-red-100/50 text-red-600 hover:text-red-700'
                }
              `}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
