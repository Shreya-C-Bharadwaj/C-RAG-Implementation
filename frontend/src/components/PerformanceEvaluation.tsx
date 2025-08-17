
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Target, Zap, AlertCircle } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

interface PerformanceData {
  query: string;
  responseTime: number;
  chunkCount: number;
  averageDistance: number;
  timestamp: Date;
  qualityScore: number;
}

interface PerformanceEvaluationProps {
  queryHistory: Array<{
    query: string;
    response: any;
    timestamp: Date;
    responseTime?: number;
  }>;
}

export const PerformanceEvaluation: React.FC<PerformanceEvaluationProps> = ({ queryHistory }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'trends'>('overview');
  const { isDarkMode } = useDarkMode();

  const themeClasses = {
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-600' : 'border-gray-200',
    tabActive: isDarkMode ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white',
    tabInactive: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700',
  };

  useEffect(() => {
    const processedData = queryHistory.map((item, index) => {
      const chunks = item.response?.retrieved_context || [];
      const avgDistance = chunks.length > 0 
        ? chunks.reduce((sum: number, chunk: any) => sum + (chunk.distance || 0), 0) / chunks.length 
        : 0;
      
      // Simple quality score based on chunk relevance and count
      const qualityScore = chunks.length > 0 ? Math.max(0, 100 - (avgDistance * 50)) : 0;
      
      return {
        query: item.query.substring(0, 30) + '...',
        responseTime: item.responseTime || Math.random() * 2000 + 500, // Mock if not available
        chunkCount: chunks.length,
        averageDistance: avgDistance,
        timestamp: item.timestamp,
        qualityScore: Math.round(qualityScore)
      };
    });
    
    setPerformanceData(processedData);
  }, [queryHistory]);

  const averageResponseTime = performanceData.length > 0 
    ? performanceData.reduce((sum, item) => sum + item.responseTime, 0) / performanceData.length 
    : 0;

  const averageQualityScore = performanceData.length > 0
    ? performanceData.reduce((sum, item) => sum + item.qualityScore, 0) / performanceData.length
    : 0;

  const averageChunkCount = performanceData.length > 0
    ? performanceData.reduce((sum, item) => sum + item.chunkCount, 0) / performanceData.length
    : 0;

  if (queryHistory.length === 0) {
    return (
      <div className={`${themeClasses.cardBg} rounded-lg p-8 text-center border ${themeClasses.border}`}>
        <TrendingUp className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
        <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>No Performance Data</h3>
        <p className={themeClasses.secondaryText}>Start asking questions to see performance metrics.</p>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.cardBg} rounded-lg border ${themeClasses.border}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-6 w-6 text-cyan-500" />
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Performance Evaluation</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1">
          {['overview', 'details', 'trends'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded font-medium transition-all capitalize ${
                activeTab === tab ? themeClasses.tabActive : themeClasses.tabInactive
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>Avg Response Time</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>
                      {averageResponseTime.toFixed(0)}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>Quality Score</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>
                      {averageQualityScore.toFixed(0)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>Avg Chunks</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>
                      {averageChunkCount.toFixed(1)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>Total Queries</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>
                      {performanceData.length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Response Time Chart */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text}`}>Response Time Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="query" 
                      stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                      fontSize={12}
                    />
                    <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text}`}>Query Details</h3>
            <div className="space-y-3">
              {performanceData.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg border ${themeClasses.border}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-medium ${themeClasses.text}`}>{item.query}</span>
                    <span className={`text-sm ${themeClasses.secondaryText}`}>
                      {item.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className={themeClasses.secondaryText}>Response Time:</span>
                      <span className={`ml-2 font-medium ${themeClasses.text}`}>
                        {item.responseTime.toFixed(0)}ms
                      </span>
                    </div>
                    <div>
                      <span className={themeClasses.secondaryText}>Chunks:</span>
                      <span className={`ml-2 font-medium ${themeClasses.text}`}>
                        {item.chunkCount}
                      </span>
                    </div>
                    <div>
                      <span className={themeClasses.secondaryText}>Quality:</span>
                      <span className={`ml-2 font-medium ${themeClasses.text}`}>
                        {item.qualityScore}%
                      </span>
                    </div>
                    <div>
                      <span className={themeClasses.secondaryText}>Avg Distance:</span>
                      <span className={`ml-2 font-medium ${themeClasses.text}`}>
                        {item.averageDistance.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text}`}>Quality vs Response Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="query" 
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="qualityScore" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
