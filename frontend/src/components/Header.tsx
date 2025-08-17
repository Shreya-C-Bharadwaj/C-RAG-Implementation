import React from 'react';
import { Code2, MessageSquare, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext'; // Import the dark mode context

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode(); // Use the dark mode context

  const themeClasses = {
    background: isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white/90 backdrop-blur-md border-cyan-200',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-slate-600',
    accent: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700 hover:bg-gray-600' 
      : 'bg-cyan-100 hover:bg-cyan-200',
    buttonDanger: isDarkMode 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-red-500 hover:bg-red-600'
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={`${themeClasses.background} border-b transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <MessageSquare className={`h-6 w-6 ${themeClasses.accent}`} />
            <div>
              <h1 className={`text-xl font-bold ${themeClasses.text}`}>CodeChat</h1>
              <p className={`text-sm ${themeClasses.secondaryText}`}>RAG-Powered C/C++ Assistant</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${themeClasses.secondaryText}`}>
                <User className="h-5 w-5" />
                <span className="text-sm">Welcome, {user.name}</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${themeClasses.buttonSecondary} transition-all hover:scale-105`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-3 py-2 ${themeClasses.buttonDanger} rounded-lg transition-all text-sm text-white`}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};