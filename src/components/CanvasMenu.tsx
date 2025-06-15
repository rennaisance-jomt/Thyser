import React from 'react';
import { AppView } from '../App';

interface CanvasMenuProps {
  isDarkMode: boolean;
  onNavigate: (view: AppView) => void;
}

export default function CanvasMenu({ isDarkMode, onNavigate }: CanvasMenuProps) {
  const handleLogoClick = () => {
    onNavigate('dashboard');
  };

  return (
    <div className="absolute top-6 left-6 z-30">
      {/* Simple Logo Button - NO CIRCLE BACKGROUND */}
      <button
        onClick={handleLogoClick}
        className="group transition-all duration-300 hover:scale-105"
        title="Go to Dashboard"
      >
        {/* Logo Image Only */}
        <div className="w-10 h-10 rounded-lg overflow-hidden transition-all duration-300 group-hover:brightness-110 group-hover:saturate-150">
          <img
            src="/src/assets/20250525_1704_Vibrant Color Wave_remix_01jw3kgy03ej5s8mrxmr2n8q8t.png"
            alt="Canvas Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    </div>
  );
}