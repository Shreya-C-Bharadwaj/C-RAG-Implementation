import React, { useState, useEffect } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { Network, Download, RefreshCw, FileCode, AlertCircle } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

// Define an interface for the function object
interface CodeFunction {
  name: string;
  line: number;
  type: string;
}

interface ModuleStructureDiagramProps {
  files: Array<{ name: string; content: string }>;
  retrievedContext?: Array<{
    source: string;
    function_name?: string;
    type: string;
    start_line: number;
  }>;
}

export const ModuleStructureDiagram: React.FC<ModuleStructureDiagramProps> = ({ 
  files, 
  retrievedContext = [] 
}) => {
  const [diagram, setDiagram] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();

  const themeClasses = {
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-600' : 'border-gray-200',
    buttonPrimary: isDarkMode 
      ? 'bg-cyan-600 hover:bg-cyan-700' 
      : 'bg-cyan-500 hover:bg-cyan-600',
  };

  const generateModuleDiagram = () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      interface ModuleInfo {
        name: string;
        functions: CodeFunction[];
        includes: string[];
        type: 'header' | 'source';
      }

      const modules = new Map<string, ModuleInfo>();
      const functions = new Map();
      const includes = new Set();
      
      files.forEach(file => {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        modules.set(fileName, {
          name: fileName,
          functions: [],
          includes: [],
          type: file.name.endsWith('.h') ? 'header' : 'source'
        });
        
        const lines = file.content.split('\n');
        lines.forEach((line, lineNum) => {
          const trimmedLine = line.trim();
          
          const funcMatches = [
            trimmedLine.match(/^(?:static\s+)?(?:inline\s+)?(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/),
            trimmedLine.match(/^(\w+)\s*\([^)]*\)\s*\{/),
            trimmedLine.match(/^(?:extern\s+)?(\w+)\s+(\w+)\s*\([^)]*\);/)
          ];
          
          funcMatches.forEach(match => {
            if (match) {
              const funcName = match[2] || match[1];
              if (funcName && !['if', 'while', 'for', 'switch', 'return', 'sizeof', 'typedef'].includes(funcName)) {
                modules.get(fileName)!.functions.push({
                  name: funcName,
                  line: lineNum + 1,
                  type: match[0].includes(';') ? 'declaration' : 'definition'
                });
                functions.set(funcName, fileName);
              }
            }
          });
          
          const includeMatch = trimmedLine.match(/#include\s*[<"]([^>"]+)[>"]/);
          if (includeMatch) {
            const includePath = includeMatch[1];
            modules.get(fileName)!.includes.push(includePath);
            includes.add(includePath);
          }
        });
      });

      let mermaidCode = 'graph TB\n';
      
      const headerFiles = Array.from(modules.entries()).filter(([_, _module]) => _module.type === 'header');
      const sourceFiles = Array.from(modules.entries()).filter(([_, _module]) => _module.type === 'source');
      
      if (headerFiles.length > 0) {
        mermaidCode += '    subgraph Headers["Header Files"]\n';
        headerFiles.forEach(([moduleName, _module]) => {
          const cleanName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
          mermaidCode += `        ${cleanName}["📄 ${moduleName}.h"]\n`;
        });
        mermaidCode += '    end\n\n';
      }
      
      if (sourceFiles.length > 0) {
        mermaidCode += '    subgraph Sources["Source Files"]\n';
        sourceFiles.forEach(([moduleName, _module]) => {
          const cleanName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
          mermaidCode += `        ${cleanName}["📄 ${moduleName}.c"]\n`;
        });
        mermaidCode += '    end\n\n';
      }
      
      // Add functions as separate nodes and apply classes correctly
      modules.forEach((_module, moduleName) => {
        const cleanModuleName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
        
        _module.functions.slice(0, 10).forEach((func: CodeFunction) => {
          const isHighlighted = retrievedContext.some(ctx => ctx.function_name === func.name);
          const cleanFuncName = `${cleanModuleName}_${func.name}`.replace(/[^a-zA-Z0-9]/g, '_');
          
          // Define the node
          mermaidCode += `    ${cleanFuncName}["🔧 ${func.name}()"]\n`;
          // Apply the class on a new line
          if (isHighlighted) {
            mermaidCode += `    class ${cleanFuncName} highlighted\n`;
          } else {
            mermaidCode += `    class ${cleanFuncName} function\n`;
          }
          
          mermaidCode += `    ${cleanModuleName} --> ${cleanFuncName}\n`;
        });
        
        if (_module.functions.length > 10) {
          const remaining = _module.functions.length - 10;
          const moreNode = `${cleanModuleName}_more`;
          mermaidCode += `    ${moreNode}["... +${remaining} more"]\n`; // Define node
          mermaidCode += `    class ${moreNode} more\n`; // Apply class
          mermaidCode += `    ${cleanModuleName} --> ${moreNode}\n`;
        }
      });
      
      // Add include relationships (limit for performance)
      modules.forEach((_module, moduleName) => {
        const cleanModuleName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
        
        _module.includes.slice(0, 5).forEach((include: string) => {
          const includeName = include.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
          if (modules.has(include.replace(/\.[^/.]+$/, ""))) { 
            mermaidCode += `    ${cleanModuleName} -.-> ${includeName}\n`;
          }
        });
      });
      
      // Add styling (classDef remains the same)
      mermaidCode += `
        classDef highlighted fill:#ff6b6b,stroke:#d63031,stroke-width:3px,color:#fff
        classDef function fill:#74b9ff,stroke:#0984e3,stroke-width:2px,color:#fff
        classDef more fill:#fdcb6e,stroke:#e17055,stroke-width:2px,color:#2d3436
      `;
      
      setDiagram(mermaidCode);
      console.log("Generated Mermaid Code:", mermaidCode); // Keep this for debugging
    } catch (error: any) {
      console.error('Error generating module diagram:', error);
      setError(error.message || 'An unknown error occurred during diagram generation.');
      setDiagram('');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (files.length > 0) {
      generateModuleDiagram();
    } else {
      setDiagram('');
      setError(null);
    }
  }, [files, retrievedContext]);

  const downloadDiagram = () => {
    if (!diagram) {
      console.warn("No diagram to download.");
      return;
    }
    const blob = new Blob([diagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'module-structure.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (files.length === 0) {
    return (
      <div className={`${themeClasses.cardBg} rounded-lg p-8 text-center border ${themeClasses.border}`}>
        <FileCode className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
        <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>No Code to Analyze</h3>
        <p className={themeClasses.secondaryText}>Upload some C/C++ files to generate module diagrams.</p>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-cyan-500" />
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Module Structure</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateModuleDiagram}
              disabled={isGenerating}
              className={`px-3 py-1 text-sm rounded ${themeClasses.buttonPrimary} text-white transition-colors flex items-center space-x-1`}
            >
              <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={downloadDiagram}
              disabled={!diagram}
              className={`px-3 py-1 text-sm rounded ${themeClasses.buttonPrimary} text-white transition-colors flex items-center space-x-1 disabled:opacity-50`}
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className={`h-12 w-12 ${themeClasses.secondaryText} animate-spin mx-auto mb-4`} />
              <p className={`${themeClasses.secondaryText} text-lg`}>Generating module structure...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold">Diagram Generation Error:</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Please check the console for more details or ensure your code files are valid.</p>
          </div>
        ) : diagram ? (
          <div>
            <MermaidDiagram chart={diagram} isDarkMode={isDarkMode} />
            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${themeClasses.secondaryText}`}>
                This diagram shows the relationships between modules, functions, and includes in your codebase. 
                Highlighted functions are from your recent query context.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Network className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
            <p className={`${themeClasses.secondaryText} text-lg`}>Click "Refresh" to generate module structure</p>
          </div>
        )}
      </div>
    </div>
  );
};
