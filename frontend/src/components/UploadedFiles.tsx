import React, { useState, useEffect } from 'react';
import { File, Code, Eye, Download, Trash2, FolderOpen } from 'lucide-react';
import { backendApi } from '../services/backendApi';

interface FileData {
  name: string;
  content: string;
  type: string;
}

interface UploadedFilesProps {
  isDarkMode: boolean;
}

export const UploadedFiles: React.FC<UploadedFilesProps> = ({ isDarkMode }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [showContent, setShowContent] = useState(false);

  const themeClasses = {
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white/90',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    secondaryText: isDarkMode ? 'text-gray-400' : 'text-slate-600',
    border: isDarkMode ? 'border-gray-600' : 'border-cyan-200',
    borderHover: isDarkMode ? 'hover:border-gray-500' : 'hover:border-cyan-300',
    selectedBorder: isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-cyan-500 bg-cyan-100/50',
    itemBg: isDarkMode ? 'bg-gray-700/50' : 'bg-white/60',
    contentBg: isDarkMode ? 'bg-gray-900' : 'bg-slate-100',
    buttonPrimary: isDarkMode
      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700'
      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    iconColors: {
      cpp: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      c: isDarkMode ? 'text-green-400' : 'text-green-600',
      h: isDarkMode ? 'text-purple-400' : 'text-purple-600',
      default: isDarkMode ? 'text-gray-400' : 'text-slate-400'
    }
  };

  useEffect(() => {
    loadFilesFromBackend();
  }, []);

  const loadFilesFromBackend = async () => {
    try {
      // 🔹 New endpoint you’ll add in main.py: /list_codebase
      const backendFiles = await backendApi.listCodebaseFiles();
      setFiles(backendFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(backendFiles)); // optional sync
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      // 🔹 You could make a backend delete endpoint if needed
      const updatedFiles = files.filter(file => file.name !== fileName);
      setFiles(updatedFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));

      if (selectedFile?.name === fileName) {
        setSelectedFile(null);
        setShowContent(false);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const downloadFile = (file: FileData) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'cpp':
      case 'cc':
      case 'cxx':
        return <Code className={`h-5 w-5 ${themeClasses.iconColors.cpp}`} />;
      case 'c':
        return <Code className={`h-5 w-5 ${themeClasses.iconColors.c}`} />;
      case 'h':
      case 'hpp':
      case 'hxx':
        return <File className={`h-5 w-5 ${themeClasses.iconColors.h}`} />;
      default:
        return <File className={`h-5 w-5 ${themeClasses.iconColors.default}`} />;
    }
  };

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const countLines = (content: string) => {
    return content.split('\n').length;
  };

  if (files.length === 0) {
    return (
      <div className={`${themeClasses.cardBg} rounded-lg p-8 text-center border ${themeClasses.border}`}>
        <FolderOpen className={`h-16 w-16 ${themeClasses.iconColors.default} mx-auto mb-4`} />
        <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>No Files Uploaded</h3>
        <p className={themeClasses.secondaryText}>Upload some C/C++ files to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* File List */}
      <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center ${themeClasses.text}`}>
          <FolderOpen className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          Uploaded Files ({files.length})
        </h2>

        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedFile?.name === file.name
                  ? themeClasses.selectedBorder
                  : `${themeClasses.border} ${themeClasses.borderHover} ${themeClasses.itemBg}`
              }`}
              onClick={() => {
                setSelectedFile(file);
                setShowContent(false);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <h3 className={`font-medium ${themeClasses.text}`}>{file.name}</h3>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>
                      {formatFileSize(file.content)} • {countLines(file.content)} lines
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(file);
                      setShowContent(true);
                    }}
                    className={`p-2 ${themeClasses.secondaryText}`}
                    title="View content"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file);
                    }}
                    className={`p-2 ${themeClasses.secondaryText}`}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.name);
                    }}
                    className={`p-2 ${themeClasses.secondaryText} hover:text-red-500`}
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Content Viewer */}
      <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
        {selectedFile ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold flex items-center ${themeClasses.text}`}>
                {getFileIcon(selectedFile.name)}
                <span className="ml-2">{selectedFile.name}</span>
              </h2>
              <button
                onClick={() => setShowContent(!showContent)}
                className={`px-3 py-1 ${themeClasses.buttonPrimary} rounded text-sm transition-all text-white`}
              >
                {showContent ? 'Hide Content' : 'Show Content'}
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={themeClasses.secondaryText}>File Size:</span>
                  <span className={`ml-2 ${themeClasses.text}`}>{formatFileSize(selectedFile.content)}</span>
                </div>
                <div>
                  <span className={themeClasses.secondaryText}>Lines:</span>
                  <span className={`ml-2 ${themeClasses.text}`}>{countLines(selectedFile.content)}</span>
                </div>
                <div>
                  <span className={themeClasses.secondaryText}>Type:</span>
                  <span className={`ml-2 ${themeClasses.text}`}>{selectedFile.type}</span>
                </div>
                <div>
                  <span className={themeClasses.secondaryText}>Extension:</span>
                  <span className={`ml-2 ${themeClasses.text}`}>.{selectedFile.name.split('.').pop()}</span>
                </div>
              </div>
            </div>

            {showContent && (
              <div className={`${themeClasses.contentBg} rounded-lg p-4 max-h-96 overflow-auto border ${themeClasses.border}`}>
                <pre className={`text-sm ${themeClasses.secondaryText} whitespace-pre-wrap font-mono`}>
                  {selectedFile.content}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center ${themeClasses.secondaryText} py-8`}>
            <Code className={`h-16 w-16 mx-auto mb-4 opacity-50 ${themeClasses.iconColors.default}`} />
            <p>Select a file from the list to view its details</p>
          </div>
        )}
      </div>
    </div>
  );
};
