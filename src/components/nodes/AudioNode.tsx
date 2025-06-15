import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Mic, Upload, Link, X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Copy, Brain } from 'lucide-react';

interface AudioNodeData {
  audioUrl: string;
  audioFile: File | null;
  uploadMethod: 'file' | 'url';
  isLoading: boolean;
  error: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isActive: boolean;
}

export default function AudioNode({ data, selected }: NodeProps<AudioNodeData>) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>();

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
    if (data.isActive === undefined) data.isActive = false;
    
    // Sync local state with data
    setLocalIsPlaying(data.isPlaying);
    setLocalCurrentTime(data.currentTime);
    setLocalDuration(data.duration);
  }, []);

  // Real-time update loop for audio progress
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && localIsPlaying) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 0;
        
        setLocalCurrentTime(currentTime);
        setLocalDuration(duration);
        
        // Update data object
        data.currentTime = currentTime;
        data.duration = duration;
        
        // Continue the loop
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (localIsPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [localIsPlaying, data]);

  // Generate fake waveform data for visualization
  useEffect(() => {
    const generateWaveform = () => {
      const points = 50;
      const data = [];
      for (let i = 0; i < points; i++) {
        data.push(Math.random() * 0.8 + 0.2);
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [data.audioUrl]);

  const isValidAudioUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Check for direct audio file URLs
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const pathname = urlObj.pathname.toLowerCase();
      if (audioExtensions.some(ext => pathname.endsWith(ext))) {
        return { isValid: true, type: 'direct' };
      }
      
      // Check for streaming platforms
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('spotify.com') || hostname.includes('soundcloud.com') || hostname.includes('apple.com')) {
        return { isValid: false, type: 'platform', message: 'Streaming platforms require special embedding. Please use a direct audio file URL instead.' };
      }
      
      // Assume it might be a direct audio URL
      return { isValid: true, type: 'assumed' };
    } catch {
      return { isValid: false, type: 'invalid', message: 'Please enter a valid URL' };
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg', 'audio/x-m4a'];
    
    // Clear previous errors
    data.error = null;
    
    if (!allowedTypes.includes(file.type)) {
      data.error = 'Please select a valid audio file (MP3, WAV, OGG, M4A, AAC)';
      return;
    }
    
    if (file.size > maxSize) {
      data.error = 'File size must be less than 50MB';
      return;
    }
    
    data.isLoading = true;
    data.audioFile = file;
    data.uploadMethod = 'file';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      data.audioUrl = e.target?.result as string;
      data.isLoading = false;
    };
    reader.onerror = () => {
      data.error = 'Failed to read the audio file';
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
      data.error = 'Please enter an audio URL';
      return;
    }
    
    // Validate URL
    const validation = isValidAudioUrl(trimmedUrl);
    
    if (!validation.isValid) {
      data.error = validation.message || 'Invalid audio URL';
      return;
    }
    
    data.error = null;
    data.isLoading = true;
    data.audioUrl = trimmedUrl;
    data.uploadMethod = 'url';
    data.audioFile = null;
    
    // Test if the audio can actually load
    const testAudio = document.createElement('audio');
    testAudio.src = trimmedUrl;
    
    const loadTimeout = setTimeout(() => {
      data.error = 'Audio failed to load. Please check the URL and ensure it\'s a direct audio file link.';
      data.isLoading = false;
      data.audioUrl = '';
    }, 8000); // 8 second timeout
    
    testAudio.onloadedmetadata = () => {
      clearTimeout(loadTimeout);
      data.isLoading = false;
      setShowUrlInput(false);
      setUrlInput('');
    };
    
    testAudio.onerror = () => {
      clearTimeout(loadTimeout);
      data.error = 'Failed to load audio. Please ensure the URL points to a valid audio file.';
      data.isLoading = false;
      data.audioUrl = '';
    };
  };

  const clearAudio = () => {
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Cancel any pending animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Reset all state
    data.audioUrl = '';
    data.audioFile = null;
    data.error = null;
    data.isLoading = false;
    data.isPlaying = false;
    data.currentTime = 0;
    data.duration = 0;
    
    setLocalIsPlaying(false);
    setLocalCurrentTime(0);
    setLocalDuration(0);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (localIsPlaying) {
        audioRef.current.pause();
        setLocalIsPlaying(false);
        data.isPlaying = false;
      } else {
        audioRef.current.play().catch(() => {
          data.error = 'Failed to play audio. The audio format may not be supported.';
        });
        setLocalIsPlaying(true);
        data.isPlaying = true;
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !data.isMuted;
      audioRef.current.muted = newMutedState;
      data.isMuted = newMutedState;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
      data.currentTime = newTime;
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(localDuration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
      data.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 0;
      
      setLocalCurrentTime(currentTime);
      setLocalDuration(duration);
      data.currentTime = currentTime;
      data.duration = duration;
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration || 0;
      setLocalDuration(duration);
      data.duration = duration;
    }
  };

  const handlePlay = () => {
    setLocalIsPlaying(true);
    data.isPlaying = true;
  };

  const handlePause = () => {
    setLocalIsPlaying(false);
    data.isPlaying = false;
  };

  const handleEnded = () => {
    setLocalIsPlaying(false);
    data.isPlaying = false;
    setLocalCurrentTime(0);
    data.currentTime = 0;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleAudioError = () => {
    data.error = 'Failed to load audio. Please check the file format or URL.';
    data.audioUrl = '';
    data.isLoading = false;
    setLocalIsPlaying(false);
    data.isPlaying = false;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && localDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * localDuration;
      
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
      data.currentTime = newTime;
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && localDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * localDuration;
      
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
      data.currentTime = newTime;
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
          Audio
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
        {data.audioUrl && (
          <button
            onClick={clearAudio}
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-700 hover:text-gray-800'
              }
            `}
            title="Clear audio"
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
          {data.audioUrl ? (
            <div className="space-y-4">
              {/* Waveform Visualization */}
              <div 
                className={`
                  h-20 rounded-lg p-3 cursor-pointer transition-colors
                  ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}
                `}
                onClick={handleWaveformClick}
              >
                <div className="flex items-end justify-center h-full space-x-1">
                  {waveformData.map((height, index) => (
                    <div
                      key={index}
                      className={`
                        w-1 rounded-full transition-all duration-100
                        ${index / waveformData.length <= (localCurrentTime / localDuration || 0)
                          ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }
                      `}
                      style={{ height: `${height * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={skipBackward}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <SkipBack size={14} />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isDarkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'}
                      text-white
                    `}
                  >
                    {localIsPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                  
                  <button
                    onClick={skipForward}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <SkipForward size={14} />
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    {data.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>

                {/* Time Display */}
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(localCurrentTime)} / {formatTime(localDuration)}
                </div>
              </div>

              {/* Progress Bar */}
              {localDuration > 0 && (
                <div className="space-y-1">
                  <div 
                    className={`h-1 rounded-full overflow-hidden cursor-pointer ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                    onClick={handleProgressBarClick}
                  >
                    <div 
                      className="h-full bg-blue-500 transition-all duration-100"
                      style={{ width: `${(localCurrentTime / localDuration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {data.uploadMethod === 'file' ? data.audioFile?.name : data.audioUrl}
              </p>

              {/* Hidden Audio Element */}
              <audio
                ref={audioRef}
                src={data.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleAudioError}
                crossOrigin="anonymous"
              />
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
                  Drop audio here or click to browse
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  MP3, WAV, OGG up to 50MB
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
                        placeholder="Enter direct audio URL..."
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
                      Note: Streaming platforms require direct audio file URLs (ending in .mp3, .wav, etc.)
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
        accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/mpeg,audio/x-m4a"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
