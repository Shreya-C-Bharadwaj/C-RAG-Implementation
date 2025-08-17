import React, { useState, useEffect } from 'react';
import { FileData } from '../services/api';
import { CodeAnalyzer, CodeStructure } from '../utils/codeAnalyzer';
import { MermaidDiagram } from './MermaidDiagram';
import { GitBranch, Layers, Network, Download, RefreshCw } from 'lucide-react';

interface CodeDiagramsProps {
  files: FileData[];
  isDarkMode: boolean;
}

export const CodeDiagrams: React.FC<CodeDiagramsProps> = ({ files, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'class' | 'callgraph'>('flowchart');
  const [structure, setStructure] = useState<CodeStructure | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const themeClasses = {
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white/90',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    secondaryText: isDarkMode ? 'text-gray-400' : 'text-slate-600',
    border: isDarkMode ? 'border-gray-600' : 'border-cyan-200',
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700' 
      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700 hover:bg-gray-600' 
      : 'bg-cyan-100 hover:bg-cyan-200',
    tabActive: isDarkMode 
      ? 'bg-cyan-600 text-white' 
      : 'bg-cyan-500 text-white',
    tabInactive: isDarkMode 
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  };

  useEffect(() => {
    if (files.length > 0) {
      analyzeCode();
    }
  }, [files]);

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const analyzedStructure = CodeAnalyzer.analyzeCode(files);
      setStructure(analyzedStructure);
    } catch (error) {
      console.error('Code analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCurrentDiagram = () => {
    if (!structure) return '';
    
    switch (activeTab) {
      case 'flowchart':
        return CodeAnalyzer.generateFlowchartDiagram(structure);
      case 'class':
        return CodeAnalyzer.generateClassDiagram(structure);
      case 'callgraph':
        return CodeAnalyzer.generateCallGraphDiagram(structure);
      default:
        return '';
    }
  };

  const downloadDiagram = () => {
    const diagram = getCurrentDiagram();
    const blob = new Blob([diagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-diagram.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'flowchart' as const, label: 'Flowchart', icon: GitBranch },
    { id: 'class' as const, label: 'Class Diagram', icon: Layers },
    { id: 'callgraph' as const, label: 'Call Graph', icon: Network }
  ];

  if (files.length === 0) {
    return (
      <div className={`${themeClasses.cardBg} rounded-lg p-8 text-center border ${themeClasses.border}`}>
        <GitBranch className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
        <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>No Code to Analyze</h3>
        <p className={themeClasses.secondaryText}>Upload some C/C++ files to generate diagrams.</p>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Code Diagrams</h2>
            <p className={`${themeClasses.secondaryText} mt-1`}>
              Visual representation of your codebase structure
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={analyzeCode}
              disabled={isAnalyzing}
              className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg transition-all flex items-center space-x-2`}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={downloadDiagram}
              disabled={!structure}
              className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg transition-all flex items-center space-x-2 text-white disabled:opacity-50`}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
                activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className={`h-12 w-12 ${themeClasses.secondaryText} animate-spin mx-auto mb-4`} />
              <p className={`${themeClasses.secondaryText} text-lg`}>Analyzing your code...</p>
            </div>
          </div>
        ) : structure ? (
          <div>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${themeClasses.text}`}>{structure.functions.length}</div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Functions</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${themeClasses.text}`}>{structure.classes.length}</div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Classes</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${themeClasses.text}`}>{structure.includes.length}</div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Includes</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${themeClasses.text}`}>{files.length}</div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Files</div>
              </div>
            </div>

            {/* Diagram */}
            <div className={`border rounded-lg overflow-hidden ${themeClasses.border}`}>
              <MermaidDiagram chart={getCurrentDiagram()} isDarkMode={isDarkMode} />
            </div>

            {/* Diagram Info */}
            <div className={`mt-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <h3 className={`font-semibold mb-2 ${themeClasses.text}`}>
                {activeTab === 'flowchart' && 'Program Flow Diagram'}
                {activeTab === 'class' && 'Class Structure Diagram'}
                {activeTab === 'callgraph' && 'Function Call Graph'}
              </h3>
              <p className={`text-sm ${themeClasses.secondaryText}`}>
                {activeTab === 'flowchart' && 'Shows the execution flow and relationships between functions in your code.'}
                {activeTab === 'class' && 'Displays the structure of classes including their methods and member variables.'}
                {activeTab === 'callgraph' && 'Visualizes which functions call other functions in your codebase.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <GitBranch className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
            <p className={`${themeClasses.secondaryText} text-lg`}>Click "Refresh" to analyze your code</p>
          </div>
        )}
      </div>
    </div>
  );
};