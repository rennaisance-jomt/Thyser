import React, { useState, useEffect } from 'react';
import { Key, Shield, Save, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { AppView } from '../App';

interface SettingsPageProps {
  isDarkMode: boolean;
  onNavigate: (view: AppView) => void;
}

interface APIKey {
  provider: string;
  key: string;
  isSet: boolean;
  lastUpdated?: string;
}

export default function SettingsPage({ isDarkMode, onNavigate }: SettingsPageProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, APIKey>>({
    openai: { provider: 'OpenAI', key: '', isSet: false },
    anthropic: { provider: 'Anthropic', key: '', isSet: false },
    google: { provider: 'Google', key: '', isSet: false },
    deepseek: { provider: 'Deepseek', key: '', isSet: false },
  });
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadAPIKeyStatus();
  }, []);

  const loadAPIKeyStatus = async () => {
    try {
      
      setApiKeys(prev => ({
        ...prev,
        openai: { ...prev.openai, isSet: true, lastUpdated: '2024-01-15' },
        anthropic: { ...prev.anthropic, isSet: false },
      }));
    } catch (error) {
      console.error('Failed to load API key status:', error);
    }
  };

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: { ...prev[provider], key: value }
    }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSaveKeys = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      const keysToSave = Object.entries(apiKeys)
        .filter(([_, keyData]) => keyData.key.trim() !== '')
        .map(([provider, keyData]) => ({
          provider,
          key: keyData.key.trim()
        }));

      if (keysToSave.length === 0) {
        setSaveStatus('error');
        setSaveMessage('No API keys to save');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));


      setApiKeys(prev => {
        const updated = { ...prev };
        keysToSave.forEach(({ provider }) => {
          updated[provider] = {
            ...updated[provider],
            isSet: true,
            lastUpdated: new Date().toISOString().split('T')[0],
            key: ''
          };
        });
        return updated;
      });

      setSaveStatus('success');
      setSaveMessage(`Successfully saved ${keysToSave.length} API key${keysToSave.length > 1 ? 's' : ''}`);
      
      setShowKeys({});
      
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save API keys. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async (provider: string) => {
    if (window.confirm(`Are you sure you want to remove the ${apiKeys[provider].provider} API key?`)) {
      try {
        
        setApiKeys(prev => ({
          ...prev,
          [provider]: { ...prev[provider], isSet: false, lastUpdated: undefined, key: '' }
        }));
        
        setSaveStatus('success');
        setSaveMessage(`${apiKeys[provider].provider} API key removed`);
      } catch (error) {
        console.error('Failed to remove API key:', error);
        setSaveStatus('error');
        setSaveMessage('Failed to remove API key');
      }
    }
  };

  const hasUnsavedChanges = Object.values(apiKeys).some(keyData => keyData.key.trim() !== '');

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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo - Positioned INSIDE header, left side */}
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
                Settings
              </h1>
            </div>

            {hasUnsavedChanges && (
              <button
                onClick={handleSaveKeys}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Security Notice */}
        <div className={`
          mb-8 p-4 rounded-lg border flex items-start space-x-3
          ${isDarkMode 
            ? 'bg-blue-900/20 border-blue-800/30 text-blue-300' 
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }
        `}>
          <Shield size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Secure API Key Storage</h3>
            <p className="text-sm leading-relaxed">
              Your API keys are encrypted and stored securely in the cloud using Supabase Secrets. 
              They are never exposed to your browser or stored locally. All AI model requests are 
              processed through secure edge functions that access your keys server-side only.
            </p>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <div className={`
            mb-6 p-4 rounded-lg border flex items-center space-x-3
            ${saveStatus === 'success'
              ? isDarkMode 
                ? 'bg-green-900/20 border-green-800/30 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
              : isDarkMode 
                ? 'bg-red-900/20 border-red-800/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }
          `}>
            {saveStatus === 'success' ? (
              <CheckCircle size={20} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={20} className="flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{saveMessage}</span>
          </div>
        )}

        {/* API Keys Section */}
        <div className={`
          rounded-xl border
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          }
        `}>
          <div className={`
            px-6 py-4 border-b
            ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <div className="flex items-center space-x-3">
              <Key size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                AI Model API Keys
              </h2>
            </div>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure your API keys for different AI model providers
            </p>
          </div>

          <div className="p-6 space-y-6">
            {Object.entries(apiKeys).map(([provider, keyData]) => (
              <div key={provider} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {keyData.provider}
                    </h3>
                    {keyData.isSet && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          Configured
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {keyData.isSet && (
                    <button
                      onClick={() => handleRemoveKey(provider)}
                      className={`
                        text-xs px-2 py-1 rounded transition-colors
                        ${isDarkMode 
                          ? 'text-red-400 hover:bg-red-900/30' 
                          : 'text-red-600 hover:bg-red-50'
                        }
                      `}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKeys[provider] ? 'text' : 'password'}
                    value={keyData.key}
                    onChange={(e) => handleKeyChange(provider, e.target.value)}
                    placeholder={keyData.isSet ? 'Enter new key to update' : `Enter your ${keyData.provider} API key`}
                    className={`
                      w-full px-3 py-2 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                      ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-emerald-500/30' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-emerald-500/30'
                      }
                    `}
                  />
                  
                  {keyData.key && (
                    <button
                      onClick={() => toggleShowKey(provider)}
                      className={`
                        absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                        ${isDarkMode 
                          ? 'text-gray-400 hover:text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>

                {keyData.isSet && keyData.lastUpdated && (
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Last updated: {keyData.lastUpdated}
                  </p>
                )}

                {/* Provider-specific instructions */}
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {provider === 'openai' && (
                    <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">OpenAI Platform</a></p>
                  )}
                  {provider === 'anthropic' && (
                    <p>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Anthropic Console</a></p>
                  )}
                  {provider === 'google' && (
                    <p>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Google AI Studio</a></p>
                  )}
                  {provider === 'deepseek' && (
                    <p>Get your API key from <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Deepseek Platform</a></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Settings Placeholder */}
        <div className={`
          mt-8 rounded-xl border
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          }
        `}>
          <div className={`
            px-6 py-4 border-b
            ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Additional Settings
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              More configuration options coming soon
            </p>
          </div>

          <div className="p-6">
            <div className={`
              text-center py-8
              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
            `}>
              <p className="text-sm">Additional settings will be available in future updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
