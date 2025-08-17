import React, { useState } from 'react';
import { Code2, MessageSquare, User, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import DarkModeToggle from './DarkModeToggle';

interface AuthPageProps {
  onBack?: () => void;
}

interface ThemeClasses {
  background: string;
  text: string;
  cardBg: string;
  buttonPrimary: string;
  buttonSecondary: string;
  accent: string;
  secondaryText: string;
  inputBg: string;
  inputText: string;
  placeholder: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDarkMode } = useDarkMode();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { login, signup } = useAuth();

  // Theme classes with full type safety
  const themeClasses: ThemeClasses = {
    background: isDarkMode 
      ? 'bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-900' 
      : 'bg-gradient-to-br from-cyan-50 via-sky-100 to-teal-100',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    cardBg: isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white/90 border-cyan-200',
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700' 
      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
      : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
    accent: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-slate-600',
    inputBg: isDarkMode 
      ? 'bg-gray-700 border-gray-600' 
      : 'bg-white border-cyan-200',
    inputText: isDarkMode ? 'text-white' : 'text-slate-800',
    placeholder: isDarkMode ? 'placeholder-gray-400' : 'placeholder-slate-400',
    errorBg: isDarkMode ? 'bg-red-900' : 'bg-red-100',
    errorBorder: isDarkMode ? 'border-red-700' : 'border-red-300',
    errorText: isDarkMode ? 'text-red-100' : 'text-red-800'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${themeClasses.background}`}>
      <div className="max-w-md w-full">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className={`mb-6 ${themeClasses.secondaryText} hover:${themeClasses.text} transition-colors flex items-center space-x-2`}
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <MessageSquare className={`h-8 w-8 ${themeClasses.accent}`} />
              <DarkModeToggle />
            </div>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${themeClasses.text}`}>Chat With Your Code</h1>
          <p className={themeClasses.secondaryText}>
            Interact with your C/C++ codebase using natural language via RAG
          </p>
        </div>

        {/* Auth Form */}
        <div className={`rounded-lg shadow-xl p-8 border transition-colors duration-300 ${themeClasses.cardBg}`}>
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-center rounded-l-lg transition-colors ${
                isLogin ? themeClasses.buttonPrimary : themeClasses.buttonSecondary
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-center rounded-r-lg transition-colors ${
                !isLogin ? themeClasses.buttonPrimary : themeClasses.buttonSecondary
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${themeClasses.errorBg} ${themeClasses.errorBorder} ${themeClasses.errorText}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.secondaryText}`} />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-200 ${themeClasses.inputBg} ${themeClasses.inputText} ${themeClasses.placeholder}`}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.secondaryText}`} />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-200 ${themeClasses.inputBg} ${themeClasses.inputText} ${themeClasses.placeholder}`}
                required
              />
            </div>

            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.secondaryText}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-200 ${themeClasses.inputBg} ${themeClasses.inputText} ${themeClasses.placeholder}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.secondaryText} hover:${themeClasses.text} transition-colors`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 font-medium transition-all flex items-center justify-center space-x-2 text-white shadow-lg ${themeClasses.buttonPrimary} disabled:opacity-50`}
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <span>{isLogin ? 'Login' : 'Sign Up'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${themeClasses.secondaryText}`}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className={`${themeClasses.accent} hover:underline`}
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className={`mt-8 backdrop-blur-md rounded-lg p-6 border transition-colors duration-300 ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-cyan-200/50'}`}>
          <h3 className={`font-semibold mb-4 ${themeClasses.text}`}>Core Features</h3>
          <ul className={`text-sm space-y-2 ${themeClasses.secondaryText}`}>
            <li>🔍 Semantic search on code using vector embeddings</li>
            <li>🧠 LLM-based answer generation</li>
            <li>📄 Source linking to exact code lines</li>
            <li>📊 Performance evaluation and metrics</li>
            <li>💬 Query logs and function references</li>
          </ul>
        </div>
      </div>
    </div>
  );
};