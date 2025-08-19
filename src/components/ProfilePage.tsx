import React, { useState } from 'react';
import { User, Mail, Calendar, Settings, LogOut, Edit3, Save, X } from 'lucide-react';
import { AppView } from '../App';

interface ProfilePageProps {
  isDarkMode: boolean;
  onNavigate: (view: AppView) => void;
}

export default function ProfilePage({ isDarkMode, onNavigate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'Creative User',
    email: 'user@example.com',
    joinDate: '2024-01-15',
    bio: 'Passionate about creating beautiful visual experiences with AI-powered tools.',
  });
  const [editedInfo, setEditedInfo] = useState(userInfo);

  const handleSave = () => {
    setUserInfo(editedInfo);
    setIsEditing(false);
    console.log('Saving user info:', editedInfo);
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      console.log('Logging out...');
      onNavigate('canvas');
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
                Profile
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('settings')}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                  ${isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Settings size={16} />
                <span className="text-sm font-medium">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                  ${isDarkMode 
                    ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                  }
                `}
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className={`
              rounded-xl border p-6 text-center
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
              }
            `}>
              {/* Avatar */}
              <div className={`
                w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold
                bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 text-white
              `}>
                {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>

              <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {userInfo.name}
              </h2>
              
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {userInfo.email}
              </p>

              <div className="flex items-center justify-center space-x-2 text-sm">
                <Calendar size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Joined {formatJoinDate(userInfo.joinDate)}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`
              mt-6 rounded-xl border p-6
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
              }
            `}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Canvases Created
                  </span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    1
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    AI Models Used
                  </span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    3
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Nodes
                  </span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    12
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className={`
              rounded-xl border
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
              }
            `}>
              {/* Header */}
              <div className={`
                px-6 py-4 border-b flex items-center justify-between
                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Profile Information
                </h3>
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Edit3 size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                        ${isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                        }
                      `}
                    >
                      <X size={16} />
                      <span className="text-sm font-medium">Cancel</span>
                    </button>
                    
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Save size={16} />
                      <span className="text-sm font-medium">Save</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedInfo.name}
                      onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                      className={`
                        w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                        ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-emerald-500/30' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500/30'
                        }
                      `}
                    />
                  ) : (
                    <div className={`
                      px-3 py-2 rounded-lg border
                      ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                    `}>
                      {userInfo.name}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedInfo.email}
                      onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                      className={`
                        w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors
                        ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-emerald-500/30' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500/30'
                        }
                      `}
                    />
                  ) : (
                    <div className={`
                      px-3 py-2 rounded-lg border
                      ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                    `}>
                      {userInfo.email}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedInfo.bio}
                      onChange={(e) => setEditedInfo({ ...editedInfo, bio: e.target.value })}
                      rows={4}
                      className={`
                        w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors resize-none
                        ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-emerald-500/30' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500/30'
                        }
                      `}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className={`
                      px-3 py-2 rounded-lg border min-h-[100px]
                      ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                    `}>
                      {userInfo.bio || (
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                          No bio added yet
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Join Date (Read-only) */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Member Since
                  </label>
                  <div className={`
                    px-3 py-2 rounded-lg border
                    ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}
                  `}>
                    {formatJoinDate(userInfo.joinDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}