import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  isDarkMode: boolean;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isDarkMode }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [diagramId, setDiagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Re-generate ID when chart changes to ensure re-rendering
  useEffect(() => {
    setDiagramId(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  }, [chart]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20
      }
    });
  }, [isDarkMode]);

  useEffect(() => {
    const renderDiagram = async () => {
      setRenderError(null);
      if (!elementRef.current || !chart.trim()) return;

      try {
        elementRef.current.innerHTML = '';
        const { svg } = await mermaid.render(diagramId, chart);
        elementRef.current.innerHTML = svg;
      } catch (error: any) {
        console.error('Mermaid rendering error:', error);
        setRenderError(error.message || 'Unknown error occurred');
      }
    };

    renderDiagram();
  }, [chart, diagramId]);

  if (!chart.trim()) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <p>No diagram data available</p>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <p>Error rendering diagram:</p>
        <pre className="text-xs mt-2 text-left overflow-auto w-full bg-red-100 p-2 rounded">
          {renderError}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`mermaid-diagram w-full overflow-auto p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
      }`}
      style={{ minHeight: '300px' }}
    />
  );
};
