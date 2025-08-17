import { FileData } from '../services/api';

export interface FunctionInfo {
  name: string;
  returnType: string;
  parameters: string[];
  calls: string[];
  line: number;
}

export interface ClassInfo {
  name: string;
  methods: string[];
  members: string[];
  line: number;
}

export interface CodeStructure {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  includes: string[];
  defines: string[];
}

export class CodeAnalyzer {
  static analyzeCode(files: FileData[]): CodeStructure {
    const structure: CodeStructure = {
      functions: [],
      classes: [],
      includes: [],
      defines: []
    };

    files.forEach(file => {
      const lines = file.content.split('\n');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Extract includes
        if (trimmedLine.startsWith('#include')) {
          const include = trimmedLine.match(/#include\s*[<"](.*?)[>"]/);
          if (include && !structure.includes.includes(include[1])) {
            structure.includes.push(include[1]);
          }
        }
        
        // Extract defines
        if (trimmedLine.startsWith('#define')) {
          const define = trimmedLine.match(/#define\s+(\w+)/);
          if (define && !structure.defines.includes(define[1])) {
            structure.defines.push(define[1]);
          }
        }
        
        // Extract functions
        const functionMatch = trimmedLine.match(/^(\w+(?:\s*\*)?)\s+(\w+)\s*\([^)]*\)\s*(?:\{|;)/);
        if (functionMatch && !trimmedLine.includes('class') && !trimmedLine.includes('struct')) {
          const returnType = functionMatch[1];
          const functionName = functionMatch[2];
          
          // Extract parameters
          const paramMatch = trimmedLine.match(/\(([^)]*)\)/);
          const parameters = paramMatch ? 
            paramMatch[1].split(',').map(p => p.trim()).filter(p => p && p !== 'void') : [];
          
          // Find function calls within this function
          const calls: string[] = [];
          let braceCount = 0;
          let inFunction = false;
          
          for (let i = index; i < lines.length; i++) {
            const currentLine = lines[i].trim();
            if (currentLine.includes('{')) {
              braceCount += (currentLine.match(/\{/g) || []).length;
              inFunction = true;
            }
            if (currentLine.includes('}')) {
              braceCount -= (currentLine.match(/\}/g) || []).length;
              if (braceCount <= 0 && inFunction) break;
            }
            
            if (inFunction) {
              const callMatches = currentLine.match(/(\w+)\s*\(/g);
              if (callMatches) {
                callMatches.forEach(match => {
                  const callName = match.replace(/\s*\($/, '');
                  if (callName !== functionName && !calls.includes(callName)) {
                    calls.push(callName);
                  }
                });
              }
            }
          }
          
          structure.functions.push({
            name: functionName,
            returnType,
            parameters,
            calls,
            line: index + 1
          });
        }
        
        // Extract classes
        const classMatch = trimmedLine.match(/^class\s+(\w+)/);
        if (classMatch) {
          const className = classMatch[1];
          const methods: string[] = [];
          const members: string[] = [];
          
          // Find class methods and members
          let braceCount = 0;
          let inClass = false;
          
          for (let i = index; i < lines.length; i++) {
            const currentLine = lines[i].trim();
            if (currentLine.includes('{')) {
              braceCount += (currentLine.match(/\{/g) || []).length;
              inClass = true;
            }
            if (currentLine.includes('}')) {
              braceCount -= (currentLine.match(/\}/g) || []).length;
              if (braceCount <= 0 && inClass) break;
            }
            
            if (inClass && braceCount > 0) {
              // Extract methods
              const methodMatch = currentLine.match(/(\w+)\s+(\w+)\s*\([^)]*\)\s*(?:\{|;)/);
              if (methodMatch && !currentLine.includes('class')) {
                methods.push(methodMatch[2]);
              }
              
              // Extract member variables
              const memberMatch = currentLine.match(/^(\w+(?:\s*\*)?)\s+(\w+)\s*(?:=|;)/);
              if (memberMatch && !currentLine.includes('(')) {
                members.push(memberMatch[2]);
              }
            }
          }
          
          structure.classes.push({
            name: className,
            methods,
            members,
            line: index + 1
          });
        }
      });
    });

    return structure;
  }

  static generateFlowchartDiagram(structure: CodeStructure): string {
    if (structure.functions.length === 0) {
      return `flowchart TD
    Start([Program Start])
    NoFunctions[No Functions Found]
    Start --> NoFunctions
    
    classDef startNode fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef errorNode fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
    class Start startNode
    class NoFunctions errorNode`;
    }

    let diagram = 'flowchart TD\n';
    
    // Add main entry point
    diagram += '    Start([Program Start])\n\n';
    
    // Add functions as nodes
    structure.functions.forEach((func, index) => {
      const nodeId = `F${index}`;
      diagram += `    ${nodeId}["${func.name}()"]\n`;
    });
    diagram += '\n';
    
    // Add connections based on function calls
    let hasConnections = false;
    structure.functions.forEach((func, index) => {
      const nodeId = `F${index}`;
      
      if (func.name === 'main') {
        diagram += `    Start --> ${nodeId}\n`;
        hasConnections = true;
      }
      
      func.calls.forEach(call => {
        const calledFuncIndex = structure.functions.findIndex(f => f.name === call);
        if (calledFuncIndex !== -1) {
          diagram += `    ${nodeId} --> F${calledFuncIndex}\n`;
          hasConnections = true;
        }
      });
    });

    // If no connections found, connect all functions to start
    if (!hasConnections) {
      structure.functions.forEach((func, index) => {
        diagram += `    Start --> F${index}\n`;
      });
    }
    
    // Add styling
    diagram += '\n    classDef functionNode fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000\n';
    diagram += '    classDef startNode fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px\n';
    diagram += '    class Start startNode\n';
    
    structure.functions.forEach((_, index) => {
      if (index < structure.functions.length - 1) {
        diagram += `    class F${index} functionNode\n`;
      } else {
        diagram += `    class F${index} functionNode`;
      }
    });
    
    return diagram;
  }

  static generateClassDiagram(structure: CodeStructure): string {
    if (structure.classes.length === 0) {
      return `classDiagram
    class NoClasses {
        +message : "No classes found in uploaded files"
        +suggestion : "Upload C++ files with class definitions"
    }`;
    }

    let diagram = 'classDiagram\n';
    
    structure.classes.forEach(cls => {
      diagram += `    class ${cls.name.replace(/[^a-zA-Z0-9_]/g, '_')} {\n`;
      
      // Add member variables
      cls.members.forEach(member => {
        diagram += `        +${member.replace(/[^a-zA-Z0-9_]/g, '_')}\n`;
      });
      
      // Add methods
      cls.methods.forEach(method => {
        diagram += `        +${method.replace(/[^a-zA-Z0-9_]/g, '_')}()\n`;
      });
      
      diagram += '    }\n\n';
    });
    
    return diagram;
  }

  static generateCallGraphDiagram(structure: CodeStructure): string {
    if (structure.functions.length === 0) {
      return `graph LR
    NoFunctions["No Functions Found"]
    Upload["Upload C/C++ files with functions"]
    NoFunctions --> Upload`;
    }

    let diagram = 'graph LR\n';
    
    structure.functions.forEach((func, index) => {
      const nodeId = `F${index}`;
      diagram += `    ${nodeId}["${func.name.replace(/[^a-zA-Z0-9_]/g, '_')}()"]\n`;
    });
    diagram += '\n';
    
    let hasConnections = false;
    structure.functions.forEach((func, index) => {
      const nodeId = `F${index}`;
      func.calls.forEach(call => {
        const calledFuncIndex = structure.functions.findIndex(f => f.name === call);
        if (calledFuncIndex !== -1) {
          diagram += `    ${nodeId} --> F${calledFuncIndex}\n`;
          hasConnections = true;
        }
      });
    });

    // If no connections, show isolated functions
    if (!hasConnections) {
      diagram += '\n    %% No function calls detected - showing isolated functions\n';
    }
    
    return diagram;
  }
}