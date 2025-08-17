import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { UploadedFiles } from './UploadedFiles';
import { CodeDiagrams } from './CodeDiagrams';
import { Header } from './Header';
import { FileData } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';

export const Dashboard: React.FC = () => {
  const [hasFiles, setHasFiles] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Consolidated theme classes with better type safety
  const themeClasses = {
    background: isDarkMode 
      ? 'bg-slate-900' 
      : 'bg-gradient-to-br from-cyan-50 to-sky-100',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    cardBg: isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white/80 border-cyan-200',
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700' 
      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    buttonSecondary: isDarkMode 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-red-500 hover:bg-red-600',
    accent: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-slate-600',
    gradientText: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400',
    border: isDarkMode ? 'border-gray-700' : 'border-cyan-200'
  };

  useEffect(() => {
    checkExistingFiles();
  }, []);

  const checkExistingFiles = async () => {
    try {
      const savedFiles = localStorage.getItem('uploadedFiles');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles);
        setHasFiles(parsedFiles.length > 0);
      }
    } catch (error) {
      console.error('Error checking files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = async (files: File[]) => {
    try {
      const fileData: FileData[] = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
          type: file.name.split('.').pop() || 'unknown'
        }))
      );

      localStorage.setItem('uploadedFiles', JSON.stringify(fileData));
      setHasFiles(true);
      setFiles(fileData);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} flex items-center justify-center transition-colors duration-300`}>
        <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} transition-colors duration-300`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleDarkMode} />
      
      <main className="container mx-auto px-4 py-8">
        {!hasFiles ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h1 className={`text-4xl font-bold mb-4 ${themeClasses.gradientText} bg-clip-text text-transparent`}>
                Upload Your C/C++ Codebase
              </h1>
              <p className={`${themeClasses.secondaryText} text-lg max-w-2xl`}>
                Upload your C/C++ files to view and manage your codebase.
              </p>
            </div>
            <FileUpload 
              onFilesUploaded={handleFilesUploaded} 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
              <h1 className="text-3xl font-bold">Your Uploaded Files</h1>
              <button
                onClick={() => {
                  localStorage.removeItem('uploadedFiles');
                  setHasFiles(false);
                  setFiles([]);
                }}
                className={`px-4 py-2 rounded-lg transition-all text-white ${themeClasses.buttonSecondary}`}
              >
                Clear All Files
              </button>
            </div>
            
            <UploadedFiles isDarkMode={isDarkMode} />
            
            <CodeDiagrams files={files} isDarkMode={isDarkMode} />
            
            <div className={`mt-8 p-6 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
              <h2 className="text-xl font-semibold mb-4">Upload More Files</h2>
              <FileUpload 
                onFilesUploaded={handleFilesUploaded} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};