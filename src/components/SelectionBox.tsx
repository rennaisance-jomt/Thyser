import React from 'react';

interface SelectionBoxProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  isDarkMode: boolean;
}

export default function SelectionBox({ start, end, isDarkMode }: SelectionBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className={`
        absolute pointer-events-none z-30 border-2 border-dashed
        ${isDarkMode 
          ? 'border-blue-400 bg-blue-400/10' 
          : 'border-blue-500 bg-blue-500/10'
        }
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}