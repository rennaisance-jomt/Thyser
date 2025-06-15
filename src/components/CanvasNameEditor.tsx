import React, { useState, useRef, useEffect } from 'react';

interface CanvasNameEditorProps {
  isDarkMode: boolean;
  canvasName: string;
  onNameChange: (newName: string) => void;
}

export default function CanvasNameEditor({ isDarkMode, canvasName, onNameChange }: CanvasNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(canvasName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when canvasName prop changes
  useEffect(() => {
    setEditingName(canvasName);
  }, [canvasName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== canvasName) {
      onNameChange(trimmedName);
    } else if (!trimmedName) {
      setEditingName(canvasName); // Reset to original if empty
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingName(canvasName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
      <div className="group relative transition-all duration-300">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`
              bg-transparent border-none outline-none text-sm font-medium text-center
              min-w-[120px] max-w-[300px]
              ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}
            `}
            placeholder="Canvas name..."
          />
        ) : (
          <div 
            className="cursor-pointer"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit canvas name"
          >
            <span className={`
              text-sm font-medium transition-colors duration-200
              ${isDarkMode ? 'text-white' : 'text-gray-900'}
            `}>
              {canvasName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}