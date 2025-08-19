import React, { useState, useEffect } from 'react';
import FlowCanvas from './components/FlowCanvas';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';

export type AppView = 'canvas' | 'dashboard' | 'profile' | 'settings';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentCanvasId, setCurrentCanvasId] = useState<string | undefined>();

  const handleNavigate = (view: AppView, canvasId?: string) => {
    setCurrentView(view);
    if (view === 'canvas') {
      setCurrentCanvasId(canvasId);
    }
  };

  // Add a console log to track isDarkMode state changes in App.tsx
  useEffect(() => {
    console.log('App.tsx: isDarkMode changed to', isDarkMode);
  }, [isDarkMode]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage isDarkMode={isDarkMode} onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />;
      case 'canvas':
      default:
        return (
          <FlowCanvas 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            onNavigate={handleNavigate}
            canvasId={currentCanvasId}
          />
        );
    }
  };

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-black' : 'bg-stone-50'} overflow-hidden`}>
      {renderCurrentView()}
    </div>
  );
}

export default App;
