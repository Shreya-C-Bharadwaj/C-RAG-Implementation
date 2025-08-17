import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Trash2, Server } from 'lucide-react';
import { backendApi } from '../services/backendApi';
import { useDarkMode } from '../context/DarkModeContext';

interface BackendFileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  onClearFiles: () => void;
}

export const BackendFileUpload: React.FC<BackendFileUploadProps> = ({ 
  onFilesUploaded, 
  onClearFiles 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { isDarkMode } = useDarkMode();

  const themeClasses = {
    container: isDarkMode ? 'bg-gray-800' : 'bg-white',
    card: {
      base: isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-cyan-300 bg-white',
      active: isDarkMode ? 'border-blue-400 bg-blue-900/20' : 'border-cyan-500 bg-cyan-100/50',
      disabled: 'opacity-50 pointer-events-none'
    },
    text: {
      primary: isDarkMode ? 'text-white' : 'text-slate-800',
      secondary: isDarkMode ? 'text-gray-300' : 'text-slate-600',
      tertiary: isDarkMode ? 'text-gray-400' : 'text-slate-500',
    },
    error: isDarkMode ? 'bg-red-900/80 border-red-700 text-red-100' : 'bg-red-100 border-red-300 text-red-800',
    success: isDarkMode ? 'bg-green-900/80 border-green-700 text-green-100' : 'bg-green-100 border-green-300 text-green-800',
    button: {
      primary: isDarkMode ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700' : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
      danger: isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600',
      icon: isDarkMode ? 'text-gray-300' : 'text-slate-500'
    },
    spinner: isDarkMode ? 'border-cyan-400 border-t-transparent' : 'border-cyan-600 border-t-transparent'
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  }, []);

  const uploadFiles = async (files: File[]) => {
    const cppFiles = files.filter(file => /\.(c|cpp|h|hpp)$/i.test(file.name));

    if (cppFiles.length === 0) {
      setError('Please upload C/C++ files (.c, .cpp, .h, .hpp)');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Upload each file individually
      for (const file of cppFiles) {
        await backendApi.uploadCodeFiles(file);
      }
      
      const fileNames = cppFiles.map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      setSuccess(`Successfully uploaded ${cppFiles.length} file(s) to backend`);
      onFilesUploaded(cppFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFiles = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      await backendApi.clearCodebase();
      setUploadedFiles([]);
      setSuccess('Successfully cleared all files from backend');
      onClearFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl rounded-lg p-4 ${themeClasses.container}`}>
      {error && (
        <div className={`mb-4 p-4 ${themeClasses.error} border rounded-lg flex items-center`}>
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className={`mb-4 p-4 ${themeClasses.success} border rounded-lg flex items-center`}>
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          isDragging ? themeClasses.card.active : themeClasses.card.base
        } ${isProcessing ? themeClasses.card.disabled : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className={`animate-spin h-12 w-12 border-4 ${themeClasses.spinner} rounded-full mx-auto`}></div>
            <p className={themeClasses.text.secondary}>Processing files with backend...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Server className={`h-16 w-16 ${themeClasses.button.icon}`} />
              <Upload className={`h-12 w-12 ${themeClasses.button.icon}`} />
            </div>
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
                Upload to Backend Analysis
              </h3>
              <p className={`${themeClasses.text.secondary} mb-4`}>
                Upload your C/C++ files to the FastAPI backend for AI-powered analysis
              </p>
              <p className={`text-sm ${themeClasses.text.tertiary} mb-6`}>
                Supported formats: .c, .cpp, .h, .hpp
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <label className={`inline-flex items-center px-6 py-3 ${themeClasses.button.primary} rounded-lg cursor-pointer transition-all text-white shadow-lg hover:scale-105`}>
                <File className="h-5 w-5 mr-2" />
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".c,.cpp,.h,.hpp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              {uploadedFiles.length > 0 && (
                <button
                  onClick={handleClearFiles}
                  className={`inline-flex items-center px-6 py-3 ${themeClasses.button.danger} rounded-lg transition-all text-white shadow-lg hover:scale-105`}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear Backend
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className={`mt-6 p-4 ${themeClasses.card.base} rounded-lg border`}>
          <h4 className={`font-semibold mb-3 ${themeClasses.text.primary} flex items-center`}>
            <Server className="h-5 w-5 mr-2 text-green-500" />
            Files in Backend ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <div key={index} className={`flex items-center space-x-2 ${themeClasses.text.secondary}`}>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-mono text-sm">{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
