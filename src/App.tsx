import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import FlowCanvas from './components/FlowCanvas';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';

export type AppView = 'canvas' | 'dashboard' | 'profile' | 'settings';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  const handleNavigate = (view: AppView, canvasId?: string) => {
    switch (view) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'canvas':
        navigate(canvasId ? `/canvas/${canvasId}` : '/canvas');
        break;
    }
  };

  // Add a console log to track isDarkMode state changes in App.tsx
  useEffect(() => {
    console.log('App.tsx: isDarkMode changed to', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-black' : 'bg-stone-50'} overflow-hidden`}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />} />
        <Route path="/profile" element={<ProfilePage isDarkMode={isDarkMode} onNavigate={handleNavigate} />} />
        <Route path="/settings" element={<SettingsPage isDarkMode={isDarkMode} onNavigate={handleNavigate} />} />
        <Route path="/canvas/:canvasId?" element={
          <FlowCanvas
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onNavigate={handleNavigate}
          />
        } />
      </Routes>
    </div>
  );
}

export default App;
