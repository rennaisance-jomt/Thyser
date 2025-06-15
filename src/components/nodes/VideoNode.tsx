import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Video, Upload, Link, X, Play, Pause, Volume2, VolumeX, ExternalLink, Copy, Brain } from 'lucide-react';

interface VideoNodeData {
  videoUrl: string;
  videoFile: File | null;
  uploadMethod: 'file' | 'url';
  isLoading: boolean;
  error: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isEmbedded?: boolean;
  embedType?: 'youtube' | 'vimeo' | 'direct';
  originalUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  showThumbnail?: boolean;
  isActive: boolean;
}

export default function VideoNode({ data, selected }: NodeProps<VideoNodeData>) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    if (data.isPlaying === undefined) data.isPlaying = false;
    if (data.isMuted === undefined) data.isMuted = false;
    if (data.volume === undefined) data.volume = 1;
    if (data.currentTime === undefined) data.currentTime = 0;
    if (data.duration === undefined) data.duration = 0;
    if (data.isEmbedded === undefined) data.isEmbedded = false;
    if (data.showThumbnail === undefined) data.showThumbnail = true;
    if (data.isActive === undefined) data.isActive = false;
  }, []);

  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // YouTube URLs
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId = '';
        
        if (hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else if (hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v') || '';
          // Handle youtube.com/embed/ URLs
          if (!videoId && urlObj.pathname.includes('/embed/')) {
            videoId = urlObj.pathname.split('/embed/')[1];
          }
        }
        
        if (videoId) {
          // Clean up video ID (remove any additional parameters)
          videoId = videoId.split('&')[0].split('?')[0];
          
          return {
            id: videoId,
            platform: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            fallbackThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          };
        }
      }
      
      // Vimeo URLs
      if (hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        if (videoId) {
          return {
            id: videoId,
            platform: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`,
            thumbnailUrl: null
          };
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const isValidVideoUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Check for direct video file URLs
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'];
      const pathname = urlObj.pathname.toLowerCase();
      if (videoExtensions.some(ext => pathname.endsWith(ext))) {
        return { isValid: true, type: 'direct' };
      }
      
      // Check for supported video platforms
      const hostname = urlObj.hostname.toLowerCase();
      
      // YouTube URLs
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return { isValid: true, type: 'youtube' };
      }
      
      // Vimeo URLs
      if (hostname.includes('vimeo.com')) {
        return { isValid: true, type: 'vimeo' };
      }
      
      // Other video platforms
      if (hostname.includes('dailymotion.com') || hostname.includes('twitch.tv')) {
        return { isValid: false, type: 'platform', message: 'This platform is not yet supported. Please use YouTube, Vimeo, or direct video file URLs.' };
      }
      
      // Assume it might be a direct video URL
      return { isValid: true, type: 'assumed' };
    } catch {
      return { isValid: false, type: 'invalid', message: 'Please enter a valid URL' };
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
    
    // Clear previous errors
    data.error = null;
    setEmbedError(false);
    
    if (!allowedTypes.includes(file.type)) {
      data.error = 'Please select a valid video file (MP4, WebM, OGG, AVI, MOV)';
      return;
    }
    
    if (file.size > maxSize) {
      data.error = 'File size must be less than 100MB';
      return;
    }
    
    data.isLoading = true;
    data.videoFile = file;
    data.uploadMethod = 'file';
    data.isEmbedded = false;
    data.embedType = 'direct';
    data.showThumbnail = false;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      data.videoUrl = e.target?.result as string;
      data.isLoading = false;
    };
    reader.onerror = () => {
      data.error = 'Failed to read the video file';
      data.isLoading = false;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    
    if (!trimmedUrl) {
      data.error = 'Please enter a video URL';
      return;
    }
    
    // Validate URL
    const validation = isValidVideoUrl(trimmedUrl);
    
    if (!validation.isValid) {
      data.error = validation.message || 'Invalid video URL';
      return;
    }
    
    data.error = null;
    setEmbedError(false);
    data.isLoading = true;
    data.uploadMethod = 'url';
    data.videoFile = null;
    data.originalUrl = trimmedUrl;
    
    // Extract video info for supported platforms
    const videoInfo = extractVideoId(trimmedUrl);
    
    if (videoInfo) {
      // Platform video (YouTube, Vimeo)
      data.videoUrl = videoInfo.embedUrl;
      data.isEmbedded = true;
      data.embedType = videoInfo.platform as 'youtube' | 'vimeo';
      data.videoId = videoInfo.id;
      data.thumbnailUrl = videoInfo.thumbnailUrl || undefined;
      data.showThumbnail = true;
      data.isLoading = false;
      setShowUrlInput(false);
      setUrlInput('');
    } else {
      // Direct video URL
      data.videoUrl = trimmedUrl;
      data.isEmbedded = false;
      data.embedType = 'direct';
      data.showThumbnail = false;
      
      // Test if the video can actually load for direct URLs
      const testVideo = document.createElement('video');
      testVideo.src = trimmedUrl;
      
      const loadTimeout = setTimeout(() => {
        data.error = 'Video failed to load. Please check the URL and ensure it\'s a direct video file link.';
        data.isLoading = false;
        data.videoUrl = '';
      }, 10000); // 10 second timeout
      
      testVideo.onloadedmetadata = () => {
        clearTimeout(loadTimeout);
        data.isLoading = false;
        setShowUrlInput(false);
        setUrlInput('');
      };
      
      testVideo.onerror = () => {
        clearTimeout(loadTimeout);
        data.error = 'Failed to load video. Please ensure the URL points to a valid video file.';
        data.isLoading = false;
        data.videoUrl = '';
      };
    }
  };

  const clearVideo = () => {
    data.videoUrl = '';
    data.videoFile = null;
    data.error = null;
    data.isLoading = false;
    data.isPlaying = false;
    data.isEmbedded = false;
    data.embedType = undefined;
    data.originalUrl = '';
    data.thumbnailUrl = undefined;
    data.videoId = undefined;
    data.showThumbnail = false;
    setUrlInput('');
    setShowUrlInput(false);
    setEmbedError(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (data.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          data.error = 'Failed to play video. The video format may not be supported.';
        });
      }
      data.isPlaying = !data.isPlaying;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !data.isMuted;
      data.isMuted = !data.isMuted;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      data.currentTime = videoRef.current.currentTime;
      data.duration = videoRef.current.duration || 0;
    }
  };

  const handleVideoError = () => {
    data.error = 'Failed to load video. Please check the file format or URL.';
    data.videoUrl = '';
    data.isLoading = false;
  };

  const handleIframeError = () => {
    setEmbedError(true);
    data.showThumbnail = true;
  };

  const openOriginalUrl = () => {
    if (data.originalUrl) {
      try {
        window.open(data.originalUrl, '_blank', 'noopener,noreferrer');
      } catch (error) {
        data.error = 'Failed to open video URL';
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleThumbnailClick = () => {
    if (data.originalUrl) {
      openOriginalUrl();
    }
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Try fallback thumbnail for YouTube
    if (data.embedType === 'youtube' && data.videoId) {
      const img = e.target as HTMLImageElement;
      if (img.src.includes('maxresdefault')) {
        img.src = `https://img.youtube.com/vi/${data.videoId}/hqdefault.jpg`;
      } else {
        // Hide thumbnail if both fail
        data.showThumbnail = false;
      }
    } else {
      data.showThumbnail = false;
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
          Video
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

        {/* Only show clear button when there's content */}
        {data.videoUrl && (
          <button
            onClick={clearVideo}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Clear video"
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
          {data.videoUrl ? (
            <div className="space-y-0">
              <div 
                className="relative group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {data.isEmbedded && !embedError ? (
                  // Try to embed first, fallback to thumbnail if it fails
                  <div className="relative">
                    {data.showThumbnail && data.thumbnailUrl ? (
                      // Show thumbnail with play button overlay
                      <div 
                        className="relative cursor-pointer"
                        onClick={handleThumbnailClick}
                      >
                        <img
                          src={data.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-40 object-cover rounded-lg"
                          onError={handleThumbnailError}
                        />
                        
                        {/* Minimal play button overlay */}
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center group-hover:bg-black/30 transition-colors">
                          <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <Play size={18} className="text-white ml-0.5" />
                          </div>
                        </div>
                        
                        {/* External link indicator */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <ExternalLink size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Try iframe embedding (hidden, will trigger error handler if blocked)
                      <div className="relative">
                        <iframe
                          ref={iframeRef}
                          src={data.videoUrl}
                          className="w-full h-40 rounded-lg"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title="Embedded video"
                          referrerPolicy="strict-origin-when-cross-origin"
                          onError={handleIframeError}
                          onLoad={() => {
                            // Check if iframe actually loaded content
                            setTimeout(() => {
                              try {
                                if (iframeRef.current) {
                                  // If we can't access the iframe content, it might be blocked
                                  const iframeDoc = iframeRef.current.contentDocument;
                                  if (!iframeDoc) {
                                    handleIframeError();
                                  }
                                }
                              } catch {
                                handleIframeError();
                              }
                            }, 1000);
                          }}
                        />
                        
                        {/* Overlay for embedded videos with external link */}
                        {data.originalUrl && (
                          <div className={`
                            absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          `}>
                            <button
                              onClick={openOriginalUrl}
                              className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink size={12} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Direct video file
                  <>
                    <video
                      ref={videoRef}
                      src={data.videoUrl}
                      className="w-full h-40 object-cover rounded-lg bg-black"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleTimeUpdate}
                      onError={handleVideoError}
                      crossOrigin="anonymous"
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className={`
                      absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center
                      transition-opacity duration-200
                      ${showControls || !data.isPlaying ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={togglePlay}
                          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          {data.isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-1" />}
                        </button>
                        
                        <button
                          onClick={toggleMute}
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          {data.isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {data.duration > 0 && (
                      <div className={`
                        absolute bottom-2 left-2 right-2 transition-opacity duration-200
                        ${showControls ? 'opacity-100' : 'opacity-0'}
                      `}>
                        <div className="flex items-center space-x-2 text-xs text-white">
                          <span>{formatTime(data.currentTime)}</span>
                          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-100"
                              style={{ width: `${(data.currentTime / data.duration) * 100}%` }}
                            />
                          </div>
                          <span>{formatTime(data.duration)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {data.isLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white text-xs">Loading video...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Embedding info for platform videos */}
              {data.isEmbedded && embedError && (
                <div className={`
                  mt-3 p-2 rounded-lg border text-xs
                  ${isDarkMode 
                    ? 'bg-yellow-900/20 border-yellow-800/30 text-yellow-400' 
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }
                `}>
                  <p>Embedding blocked by platform. Click thumbnail to watch on {data.embedType === 'youtube' ? 'YouTube' : 'Vimeo'}.</p>
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
                  Drop video here or click to browse
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  MP4, WebM, OGG up to 100MB
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
                        placeholder="YouTube, Vimeo, or direct video URL..."
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
                      Platform videos show thumbnails with links to original source
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
        accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
