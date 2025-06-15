import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Upload, Link, X, Download, Eye, Search, EyeOff, Copy, Brain } from 'lucide-react';

interface DocumentNodeData {
  documentUrl: string;
  documentFile: File | null;
  uploadMethod: 'file' | 'url';
  isLoading: boolean;
  error: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount?: number;
  extractedText?: string;
  isPreviewOpen: boolean;
  isActive: boolean;
}

export default function DocumentNode({ data, selected }: NodeProps<DocumentNodeData>) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (data.isPreviewOpen === undefined) data.isPreviewOpen = false;
    if (!data.extractedText) data.extractedText = '';
    if (data.isActive === undefined) data.isActive = false;
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
    if (fileType.includes('text')) return '📃';
    return '📄';
  };

  const isValidDocumentUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Check for direct document file URLs
      const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
      const pathname = urlObj.pathname.toLowerCase();
      if (docExtensions.some(ext => pathname.endsWith(ext))) {
        return { isValid: true, type: 'direct' };
      }
      
      // Check for document hosting services
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com') ||
          hostname.includes('dropbox.com') || hostname.includes('onedrive.com')) {
        return { isValid: false, type: 'hosting', message: 'Cloud storage links require direct file URLs. Please use a direct download link instead.' };
      }
      
      // Assume it might be a direct document URL
      return { isValid: true, type: 'assumed' };
    } catch {
      return { isValid: false, type: 'invalid', message: 'Please enter a valid URL' };
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];
    
    // Clear previous errors
    data.error = null;
    
    if (!allowedTypes.includes(file.type)) {
      data.error = 'Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV)';
      return;
    }
    
    if (file.size > maxSize) {
      data.error = 'File size must be less than 25MB';
      return;
    }
    
    data.isLoading = true;
    data.documentFile = file;
    data.uploadMethod = 'file';
    data.fileName = file.name;
    data.fileSize = file.size;
    data.fileType = file.type;
    
    // Simulate text extraction for demo
    setTimeout(() => {
      try {
        data.extractedText = `This is a sample extracted text from ${file.name}. In a real implementation, this would contain the actual text content extracted from the document using appropriate libraries like PDF.js for PDFs or other document parsers.`;
        data.pageCount = Math.floor(Math.random() * 20) + 1;
        data.isLoading = false;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          data.documentUrl = e.target?.result as string;
        };
        reader.onerror = () => {
          data.error = 'Failed to read the document file';
          data.isLoading = false;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        data.error = 'Failed to process the document';
        data.isLoading = false;
      }
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      data.error = 'Please enter a document URL';
      return;
    }
    
    // Validate URL
    const validation = isValidDocumentUrl(trimmedUrl);
    
    if (!validation.isValid) {
      data.error = validation.message || 'Invalid document URL';
      return;
    }
    
    data.error = null;
    data.isLoading = true;
    data.documentUrl = trimmedUrl;
    data.uploadMethod = 'url';
    data.documentFile = null;
    data.fileName = trimmedUrl.split('/').pop() || 'Document';
    data.fileType = 'application/pdf';
    
    setTimeout(() => {
      try {
        data.isLoading = false;
        data.extractedText = 'This is sample extracted text from the URL document. In a real implementation, this would be processed server-side.';
        data.pageCount = Math.floor(Math.random() * 15) + 1;
        setShowUrlInput(false);
        setUrlInput('');
      } catch (error) {
        data.error = 'Failed to process the document from URL';
        data.isLoading = false;
      }
    }, 2000);
  };

  const clearDocument = () => {
    data.documentUrl = '';
    data.documentFile = null;
    data.error = null;
    data.isLoading = false;
    data.fileName = '';
    data.fileSize = 0;
    data.fileType = '';
    data.extractedText = '';
    data.pageCount = undefined;
    data.isPreviewOpen = false;
    setUrlInput('');
    setShowUrlInput(false);
    setSearchTerm('');
    setShowSearch(false);
  };

  const togglePreview = () => {
    data.isPreviewOpen = !data.isPreviewOpen;
  };

  const downloadDocument = () => {
    try {
      if (data.documentUrl && data.uploadMethod === 'file') {
        const link = document.createElement('a');
        link.href = data.documentUrl;
        link.download = data.fileName;
        link.click();
      } else if (data.documentUrl) {
        window.open(data.documentUrl, '_blank');
      }
    } catch (error) {
      data.error = 'Failed to download document';
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    try {
      const regex = new RegExp(`(${term})`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    } catch {
      return text;
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
          Document
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

        {data.extractedText && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Search in document"
          >
            <Search size={14} />
          </button>
        )}

        {/* Only show clear button when there's content */}
        {data.documentUrl && (
          <button
            onClick={clearDocument}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Clear document"
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
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border border-black'
          }
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Search Bar */}
        {showSearch && data.extractedText && (
          <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in document..."
              className={`
                w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
                ${isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500/30' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'
                }
              `}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
          {data.documentUrl ? (
            <div className="space-y-4">
              {/* Document Info */}
              <div className={`
                p-3 rounded-lg border
                ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}
              `}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(data.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {data.fileName}
                      </h4>
                      <div className={`text-xs mt-1 space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {data.fileSize > 0 && <p>Size: {formatFileSize(data.fileSize)}</p>}
                        {data.pageCount && <p>Pages: {data.pageCount}</p>}
                        <p>Type: {data.fileType.split('/').pop()?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {data.extractedText && (
                      <button
                        onClick={togglePreview}
                        className={`
                          p-1.5 rounded transition-colors
                          ${isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                          }
                        `}
                        title="Preview content"
                      >
                        {data.isPreviewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                    <button
                      onClick={downloadDocument}
                      className={`
                        p-1.5 rounded transition-colors
                        ${isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                        }
                      `}
                      title="Download document"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {data.isPreviewOpen && data.extractedText && (
                <div className={`
                  p-3 rounded-lg border max-h-40 overflow-y-auto
                  ${isDarkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}
                `}>
                  <div 
                    className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(data.extractedText, searchTerm)
                    }}
                  />
                </div>
              )}

              {data.isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Processing document...
                    </span>
                  </div>
                </div>
              )}
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
                  Drop document here or click to browse
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  PDF, DOC, XLS, PPT up to 25MB
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
                        placeholder="Enter document URL..."
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
                      Note: Cloud storage links require direct download URLs
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
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
