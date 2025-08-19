import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Trash2, Copy, Edit3, Search, Filter, User, Share2, Users, Eye, EyeOff, X } from 'lucide-react';
import { AppView } from '../App';
import { canvasOperations, CanvasData } from '../lib/supabaseClient';

interface DashboardPageProps {
  isDarkMode: boolean;
  onNavigate: (view: AppView, canvasId?: string) => void;
}

interface ExtendedCanvasData extends CanvasData {
  isOwner?: boolean;
  permission?: 'view' | 'edit';
  sharedBy?: string;
}

export default function DashboardPage({ isDarkMode, onNavigate }: DashboardPageProps) {
  const [canvases, setCanvases] = useState<ExtendedCanvasData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allCanvases = await canvasOperations.loadAllCanvases();
      setCanvases(allCanvases);
    } catch (err) {
      console.error('Failed to load canvases:', err);
      setError('Failed to load canvases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewCanvas = () => {
    onNavigate('canvas');
  };

  const handleLoadCanvas = (canvas: ExtendedCanvasData) => {
    onNavigate('canvas', canvas.id);
  };

  const handleDuplicateCanvas = async (canvas: ExtendedCanvasData) => {
    try {
      const duplicatedCanvas = {
        nodes: canvas.nodes,
        edges: canvas.edges,
        viewport: canvas.viewport,
        canvasName: `${canvas.canvas_name} Copy`
      };
      
      await canvasOperations.saveCanvas(duplicatedCanvas);
      loadCanvases();
    } catch (err) {
      console.error('Failed to duplicate canvas:', err);
      setError('Failed to duplicate canvas');
    }
  };

  const handleDeleteCanvas = async (canvas: ExtendedCanvasData) => {
    if (window.confirm('Are you sure you want to delete this canvas?')) {
      try {
        await canvasOperations.deleteCanvas(canvas.id);
        loadCanvases();
      } catch (err) {
        console.error('Failed to delete canvas:', err);
        setError('Failed to delete canvas');
      }
    }
  };

  const handleRenameCanvas = async (canvasId: string, newName: string) => {
    try {
      await canvasOperations.renameCanvas(canvasId, newName);
      setEditingCanvasId(null);
      setEditingName('');
      loadCanvases();
    } catch (err) {
      console.error('Failed to rename canvas:', err);
      setError('Failed to rename canvas');
    }
  };

  const handleShareCanvas = async () => {
    if (!showShareModal || !shareUserId.trim()) return;

    try {
      await canvasOperations.shareCanvas(showShareModal, shareUserId.trim(), sharePermission);
      setShowShareModal(null);
      setShareUserId('');
      setSharePermission('view');
      loadCanvases();
    } catch (err) {
      console.error('Failed to share canvas:', err);
      setError('Failed to share canvas');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNodeCount = (nodes: any[]) => {
    return nodes?.length || 0;
  };

  const filteredCanvases = canvases
    .filter(canvas => 
      canvas.canvas_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.canvas_name.localeCompare(b.canvas_name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-stone-50'}`}>
      {/* Header */}
      <div className={`
        border-b backdrop-blur-md
        ${isDarkMode 
          ? 'bg-gray-900/50 border-gray-800' 
          : 'bg-white/50 border-gray-200'
        }
      `}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="group transition-all duration-300 hover:scale-105"
                title="Dashboard"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden transition-all duration-300 group-hover:brightness-110 group-hover:saturate-150">
                  <img
                    src="/src/assets/20250525_1704_Vibrant Color Wave_remix_01jw3kgy03ej5s8mrxmr2n8q8t.png"
                    alt="Canvas Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>

              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('profile')}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                  ${isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <User size={16} />
                <span className="text-sm font-medium">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search canvases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`
                  pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors w-64
                  ${isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500/30' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30'
                  }
                `}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'name')}
                className={`
                  px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/30' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/30'
                  }
                `}
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredCanvases.length} canvas{filteredCanvases.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`
            mb-6 p-4 rounded-lg border
            ${isDarkMode 
              ? 'bg-red-900/20 border-red-800/30 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-600'
            }
          `}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading canvases...
              </span>
            </div>
          </div>
        ) : (
          /* Canvas Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* New Canvas Card - Always first */}
            <div
              onClick={handleCreateNewCanvas}
              className={`
                group relative rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer
                ${isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl' 
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
                }
              `}
            >
              {/* New Canvas Preview */}
              <div className={`
                h-32 rounded-t-xl border-b flex items-center justify-center
                ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}
              `}>
                <div className="text-center">
                  <div className={`
                    w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110
                    bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 group-hover:from-emerald-500 group-hover:via-cyan-600 group-hover:to-blue-600
                    shadow-lg group-hover:shadow-xl text-white
                  `}>
                    <Plus size={20} />
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Create new
                  </div>
                </div>
              </div>

              {/* New Canvas Info */}
              <div className="p-4">
                <h3 className={`font-medium text-sm mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  New Canvas
                </h3>
                
                <div className="flex items-center justify-between text-xs">
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Start creating
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Canvas Cards */}
            {filteredCanvases.map((canvas) => (
              <div
                key={canvas.id}
                className={`
                  group relative rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer
                  ${isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
                  }
                `}
                onClick={() => handleLoadCanvas(canvas)}
              >
                {/* Canvas Preview with Thumbnail */}
                <div className={`
                  h-32 rounded-t-xl border-b flex items-center justify-center overflow-hidden
                  ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}
                `}>
                  {canvas.thumbnail_url ? (
                    <img 
                      src={canvas.thumbnail_url} 
                      alt={`${canvas.canvas_name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className={`text-2xl mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        🎨
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {getNodeCount(canvas.nodes)} nodes
                      </div>
                    </div>
                  )}
                </div>

                {/* Canvas Info */}
                <div className="p-4">
                  {editingCanvasId === canvas.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        if (editingName.trim() && editingName !== canvas.canvas_name) {
                          handleRenameCanvas(canvas.id, editingName.trim());
                        } else {
                          setEditingCanvasId(null);
                          setEditingName('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        } else if (e.key === 'Escape') {
                          setEditingCanvasId(null);
                          setEditingName('');
                        }
                      }}
                      className={`
                        w-full font-medium text-sm mb-2 px-2 py-1 rounded border
                        ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        }
                      `}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className={`font-medium text-sm mb-2 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {canvas.canvas_name}
                      {!canvas.isOwner && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          Shared
                        </span>
                      )}
                    </h3>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Clock size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {formatDate(canvas.updated_at)}
                        </span>
                      </div>
                      {!canvas.isOwner && canvas.permission && (
                        <div className="flex items-center space-x-1">
                          {canvas.permission === 'view' ? (
                            <Eye size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                          ) : (
                            <Edit3 size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                          )}
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {canvas.permission}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`
                  absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  flex items-center space-x-1
                `}>
                  {canvas.isOwner && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCanvasId(canvas.id);
                          setEditingName(canvas.canvas_name);
                        }}
                        className={`
                          w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white' 
                            : 'bg-white/80 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }
                        `}
                        title="Rename"
                      >
                        <Edit3 size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(canvas.id);
                        }}
                        className={`
                          w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white' 
                            : 'bg-white/80 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }
                        `}
                        title="Share"
                      >
                        <Share2 size={12} />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateCanvas(canvas);
                    }}
                    className={`
                      w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                      ${isDarkMode 
                        ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'bg-white/80 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }
                    `}
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  
                  {canvas.isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCanvas(canvas);
                      }}
                      className={`
                        w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                        ${isDarkMode 
                          ? 'bg-gray-800/80 hover:bg-red-900/50 text-gray-400 hover:text-red-400' 
                          : 'bg-white/80 hover:bg-red-50 text-gray-600 hover:text-red-600'
                        }
                      `}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State Message */}
            {filteredCanvases.length === 0 && !searchTerm && (
              <div className="col-span-full text-center py-12">
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to your Dashboard
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click the "New Canvas" card above to create your first canvas
                </p>
              </div>
            )}

            {/* No Search Results */}
            {filteredCanvases.length === 0 && searchTerm && (
              <div className="col-span-full text-center py-12">
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No canvases found
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(null)} />
          
          <div className={`
            relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden
            ${isDarkMode 
              ? 'bg-gray-900 border border-gray-700' 
              : 'bg-white border border-gray-200'
            }
          `}>
            <div className={`
              px-6 py-4 border-b flex items-center justify-between
              ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
            `}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Share Canvas
              </h3>
              <button
                onClick={() => setShowShareModal(null)}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  User ID
                </label>
                <input
                  type="text"
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  placeholder="Enter user ID to share with..."
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500/30' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'
                    }
                  `}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Permission
                </label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit')}
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-500/30' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/30'
                    }
                  `}
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => setShowShareModal(null)}
                  className={`
                    flex-1 px-4 py-2 rounded-lg border transition-colors
                    ${isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareCanvas}
                  disabled={!shareUserId.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}