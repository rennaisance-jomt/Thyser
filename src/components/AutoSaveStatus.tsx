import React from 'react';

interface AutoSaveStatusProps {
  isDarkMode: boolean;
  lastSavedTime: string;
  isSaving: boolean;
}

export default function AutoSaveStatus({ isDarkMode, lastSavedTime, isSaving }: AutoSaveStatusProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className={`
        flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-300
        backdrop-blur-md shadow-sm border text-xs
        ${isDarkMode
          ? 'bg-slate-900/60 border-slate-700/30'
          : 'bg-white/60 border-gray-200/30'
        }
      `}>
        {/* Status Indicator - Smaller */}
        <div className={`
          w-1.5 h-1.5 rounded-full transition-colors duration-300
          ${isSaving 
            ? isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'
            : isDarkMode ? 'bg-green-400' : 'bg-green-500'
          }
          ${isSaving ? 'animate-pulse' : ''}
        `} />
        
        {/* Status Text - Smaller */}
        <span className={`
          text-xs font-medium
          ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
        `}>
          {isSaving ? 'Saving...' : `Saved ${lastSavedTime}`}
        </span>
      </div>
    </div>
  );
}