import React, { useState, useEffect } from 'react';
import { BackendFileUpload } from './BackendFileUpload';
import { InteractiveChat } from './InteractiveChat';
import { UploadedFiles } from './UploadedFiles';
import { CodeDiagrams } from './CodeDiagrams';
import { ModuleStructureDiagram } from './ModuleStructureDiagram';
import { PerformanceEvaluation } from './PerformanceEvaluation';
import { Header } from './Header';
import { QueryResponse, CodeChunk } from '../services/backendApi'; // Import QueryResponse and CodeChunk
import { backendApi } from '../services/backendApi';
import { useDarkMode } from '../context/DarkModeContext';
import { Server, MessageSquare, FileText, BarChart3, AlertCircle, CheckCircle, Network, TrendingUp } from 'lucide-react';

// Define FileData interface locally since it's not exported from backendApi
interface FileData {
  name: string;
  content: string;
  type: string;
}


// Define ChatMessage interface here so it's accessible to both components
interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  response?: QueryResponse;
  isLoading?: boolean;
}

// Define ChatSettings interface for persistence
interface ChatSettings {
  temperature: number;
  top_k: number;
  similarity_threshold: number;
}

export const EnhancedDashboard: React.FC = () => {
  const [hasBackendFiles, setHasBackendFiles] = useState(false);
  const [localFiles, setLocalFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'diagrams' | 'modules' | 'performance'>('chat');
  const { isDarkMode } = useDarkMode();

  // New state for chat messages, lifted from InteractiveChat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
 // near the top with other useState calls
const [backendMode, setBackendMode] = useState<'api' | 'model'>(
  (localStorage.getItem('backendMode') as 'api' | 'model') || 'api'
);


  // New state for chat settings, lifted from InteractiveChat
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    temperature: 0.2,
    top_k: 5,
    similarity_threshold: 0.7,
  });

  const [queryHistory, setQueryHistory] = useState<Array<any>>([]);
  const [lastRetrievedContext, setLastRetrievedContext] = useState<Array<any>>([]);

  const themeClasses = {
    background: isDarkMode
      ? 'bg-slate-900'
      : 'bg-gradient-to-br from-cyan-50 to-sky-100',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    cardBg: isDarkMode
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white/80 border-cyan-200',
    tabActive: isDarkMode
      ? 'bg-cyan-600 text-white border-cyan-600'
      : 'bg-cyan-500 text-white border-cyan-500',
    tabInactive: isDarkMode
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300',
    statusConnected: isDarkMode ? 'text-green-400' : 'text-green-600',
    statusDisconnected: isDarkMode ? 'text-red-400' : 'text-red-600',
    gradientText: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400',
    border: isDarkMode ? 'border-gray-700' : 'border-cyan-200'
  };

  useEffect(() => {
    checkBackendStatus();
    checkLocalFiles();
    // Load persisted chat messages and settings from localStorage on mount
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      // Re-hydrate Date objects correctly
      const parsedMessages = JSON.parse(savedMessages).map((msg: ChatMessage) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setChatMessages(parsedMessages);
    }
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      setChatSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Effect to save chat messages and settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  const checkBackendStatus = async () => {
    try {
      await backendApi.checkHealth();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const checkLocalFiles = async () => {
    try {
      const savedFiles = localStorage.getItem('uploadedFiles');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setLocalFiles(parsedFiles);
        setHasBackendFiles(parsedFiles.length > 0); // Update hasBackendFiles based on local storage
      }
    } catch (error) {
      console.error('Error checking local files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackendFilesUploaded = async (files: File[]) => {
    setHasBackendFiles(true);

    // Also save to localStorage for local features
    try {
      const fileData: FileData[] = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
          type: file.name.split('.').pop() || 'unknown'
        }))
      );

      const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const newFiles = fileData.filter(newFile =>
        !existingFiles.some((existing: FileData) => existing.name === newFile.name)
      );

      const updatedFiles = [...existingFiles, ...newFiles];
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
      setLocalFiles(updatedFiles);
    } catch (error) {
      console.error('Error saving files locally:', error);
    }
  };

  const handleClearBackendFiles = () => {
    setHasBackendFiles(false);
    // Clear chat messages when files are cleared (optional, but makes sense)
    setChatMessages([]);
  };

  // Callback to update chat messages from InteractiveChat
  const handleUpdateChatMessages = (newMessages: ChatMessage[]) => {
    setChatMessages(newMessages);
  };

  // Callback to update chat settings from InteractiveChat
  const handleUpdateChatSettings = (newSettings: ChatSettings) => {
    setChatSettings(newSettings);
  };


  const tabs = [
    { id: 'chat' as const, label: 'AI Chat', icon: MessageSquare },
    { id: 'files' as const, label: 'File Manager', icon: FileText },
    { id: 'diagrams' as const, label: 'Code Diagrams', icon: BarChart3 },
    { id: 'modules' as const, label: 'Module Structure', icon: Network },
    { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} flex items-center justify-center transition-colors duration-300`}>
        <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} transition-colors duration-300`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className={`mb-6 p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border} flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span className="font-medium">Backend Status:</span>
              <span className={`flex items-center space-x-1 ${
                backendStatus === 'connected' ? themeClasses.statusConnected : themeClasses.statusDisconnected
              }`}>
                {backendStatus === 'connected' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="capitalize">{backendStatus}</span>
              </span>
            </div>
            {hasBackendFiles && (
              <div className={`flex items-center space-x-2 ${themeClasses.statusConnected}`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Files loaded in backend</span>
              </div>
            )}
          </div>
          <button
            onClick={checkBackendStatus}
            className="px-3 py-1 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Upload Section */}
        {!hasBackendFiles && (
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="text-center mb-8">
              <h1 className={`text-4xl font-bold mb-4 ${themeClasses.gradientText} bg-clip-text text-transparent`}>
                Interactive Code Analysis
              </h1>
              <p className={`text-lg max-w-2xl mx-auto opacity-80`}>
                Upload your C/C++ files to the backend for AI-powered analysis and interactive chat
              </p>
            </div>
            <BackendFileUpload
              onFilesUploaded={handleBackendFilesUploaded}
              onClearFiles={handleClearBackendFiles}
            />
          </div>
        )}

        {/* Main Content */}
        {hasBackendFiles && (
          <div className="space-y-6">

            {/* Tab Navigation */}
            <div className={`flex space-x-1 p-1 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {activeTab === 'chat' && (
   <>
                  <div className="flex items-center mb-4 space-x-4">
                    <label className="font-medium">Backend Mode:</label>

                    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
                      <button
                        onClick={() => {
                          setBackendMode('api');
                          localStorage.setItem('backendMode', 'api');
                        }}
                        className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                          backendMode === 'api'
                            ? 'bg-cyan-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        API Backend
                      </button>
                      <button
                        onClick={() => {
                          setBackendMode('model');
                          localStorage.setItem('backendMode', 'model');
                        }}
                        className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
                          backendMode === 'model'
                            ? 'bg-cyan-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        Local Model
                      </button>
                    </div>

                    <span className="text-sm text-gray-500">Active: {backendMode}</span>
                  </div>

                  <InteractiveChat
                    hasFiles={hasBackendFiles}
                    backendMode={backendMode}           // <--- PASS IT DOWN
                    messages={chatMessages}
                    setMessages={handleUpdateChatMessages}
                    settings={chatSettings}
                    setSettings={handleUpdateChatSettings}
                    onQueryComplete={(query, response, timestamp) => {
                      setQueryHistory(prev => [...prev, { query, response, timestamp }]);
                      if (response?.retrieved_context) {
                        setLastRetrievedContext(response.retrieved_context);
                      }
                    }}
                  />
                </>
              )}

              {activeTab === 'files' && (
                <div className="space-y-6">
                  <UploadedFiles isDarkMode={isDarkMode} />
                  <div className={`p-6 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                    <h2 className="text-xl font-semibold mb-4">Upload More Files</h2>
                    <BackendFileUpload
                      onFilesUploaded={handleBackendFilesUploaded}
                      onClearFiles={handleClearBackendFiles}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'diagrams' && (
                <CodeDiagrams files={localFiles} isDarkMode={isDarkMode} />
              )}
              {activeTab === 'modules' && (
                <ModuleStructureDiagram
                  files={localFiles}
                  retrievedContext={lastRetrievedContext}
                />
              )}
              {activeTab === 'performance' && (
                <PerformanceEvaluation queryHistory={queryHistory} />
              )}
            </div>

            {/* Clear All Button */}
            <div className={`flex justify-center pt-6 border-t ${themeClasses.border}`}>
              <button
                onClick={() => {
                  handleClearBackendFiles();
                  localStorage.removeItem('uploadedFiles');
                  setLocalFiles([]);
                  setChatMessages([]); // Also clear chat messages on clear all
                }}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}

        {/* Backend Connection Error */}
        {backendStatus === 'disconnected' && (
          <div className={`mt-8 p-6 rounded-lg border border-red-300 bg-red-100 dark:bg-red-900/20 dark:border-red-700`}>
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">Backend Connection Failed</h3>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mb-3">
              Cannot connect to the FastAPI backend at http://localhost:8000
            </p>
            <div className="text-sm text-red-600 dark:text-red-400">
              <p className="font-medium mb-1">To start the backend:</p>
              <ol className="list-decimal list-inside space-y-1 font-mono text-xs">
                <li>cd backend/</li>
                <li>pip install -r requirements.txt</li>
                <li>python main.py</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};