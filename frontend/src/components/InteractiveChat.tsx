import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Code, Clock, Brain, Search, AlertCircle, CheckCircle, History, MessageSquare, Code2, X } from 'lucide-react';
import { backendApi, QueryResponse, CodeChunk } from '../services/backendApi';
import { useDarkMode } from '../context/DarkModeContext';
import { MermaidDiagram } from './MermaidDiagram';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    response?: QueryResponse;
    isLoading?: boolean;
}

interface ChatSettings {
    temperature: number;
    top_k: number;
    similarity_threshold: number;
}

interface InteractiveChatProps {
    hasFiles: boolean;
    backendMode?: 'api' | 'model';
    messages: ChatMessage[];
    setMessages: (messages: ChatMessage[]) => void;
    settings: ChatSettings;
    setSettings: (settings: ChatSettings) => void;
    onQueryComplete?: (query: string, response: QueryResponse, timestamp: Date) => void;
}

export const InteractiveChat: React.FC<InteractiveChatProps> = ({
    hasFiles,
    backendMode = (localStorage.getItem('backendMode') as 'api' | 'model') || 'api',
    messages,
    setMessages,
    settings,
    setSettings,
    onQueryComplete
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [rightSidebarTab, setRightSidebarTab] = useState<'functions' | 'history'>('functions');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { isDarkMode } = useDarkMode();
    
    const [showChunkDiagramModal, setShowChunkDiagramModal] = useState(false);
    const [currentChunkDiagram, setCurrentChunkDiagram] = useState<{ chunk: CodeChunk; mermaidSyntax: string } | null>(null);

    const themeClasses = {
        container: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
        chatBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
        userMessage: isDarkMode ? 'bg-cyan-600' : 'bg-cyan-500',
        botMessage: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        border: isDarkMode ? 'border-gray-600' : 'border-gray-200',
        inputBg: isDarkMode ? 'bg-gray-700' : 'bg-white',
        buttonPrimary: isDarkMode
            ? 'bg-cyan-600 hover:bg-cyan-700'
            : 'bg-cyan-500 hover:bg-cyan-600',
        settingsBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
        sidebarBg: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
        tabActive: isDarkMode ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white',
        tabInactive: isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !hasFiles) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };

        // Add both messages first
        const newMessages = [...messages, userMessage, botMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            let response: QueryResponse;

            console.log('Sending query:', userMessage.content); // Debug log

            if (backendMode === 'api') {
                response = await backendApi.askQuestion({
                    query: userMessage.content,
                    temperature: settings.temperature,
                    top_k: settings.top_k,
                    similarity_threshold: settings.similarity_threshold,
                });
            } else {
                response = await backendApi.askModelQuestion({
                    query: userMessage.content,
                    temperature: settings.temperature,
                    top_k: settings.top_k,
                    similarity_threshold: settings.similarity_threshold,
                });
            }

            console.log('Received response:', response); // Debug log

            // Update the bot message with the response
            const updatedMessages = newMessages.map((msg: ChatMessage) =>
                msg.id === botMessage.id
                    ? { 
                        ...msg, 
                        content: response.answer || 'No response received', 
                        response, 
                        isLoading: false 
                      }
                    : msg
            );
            setMessages(updatedMessages);

            if (onQueryComplete) {
                onQueryComplete(userMessage.content, response, new Date());
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error); // Debug log
            
            setMessages(newMessages.map((msg: ChatMessage) =>
                msg.id === botMessage.id
                    ? {
                        ...msg,
                        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                        isLoading: false
                      }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const generateMermaidForChunk = (chunk: CodeChunk): string => {
        let mermaidSyntax = '';

        if (chunk.function_name) {
            mermaidSyntax = `graph TD\n    A[Start ${chunk.function_name}] --> B{Process?}\n    B -- Yes --> C[Do Something]\n    C --> D[End]\n    B -- No --> D`;
        } else if (chunk.type === 'class' || chunk.content.includes('class ') || chunk.content.includes('struct ')) {
            mermaidSyntax = `classDiagram\n    class MyClass {\n        + myMethod()\n        - myField\n    }\n    MyClass <|-- AnotherClass\n    MyClass : +memberVariable\n    MyClass : +memberFunction()`;
        } else {
            mermaidSyntax = `graph TD\n    A[Code Chunk] --> B[Content Analysis]\n    B --> C[No specific structure found]`;
        }
        return mermaidSyntax;
    };

    const handleViewChunkDiagram = (chunk: CodeChunk) => {
        const mermaidSyntax = generateMermaidForChunk(chunk);
        setCurrentChunkDiagram({ chunk, mermaidSyntax });
        setShowChunkDiagramModal(true);
    };

    const renderCodeChunk = (chunk: CodeChunk, index: number) => (
        <div key={index} className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.settingsBg} mb-2`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-cyan-500" />
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                        {chunk.source} (Line {chunk.start_line})
                    </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${chunk.type === 'code' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {chunk.type}
                    </span>
                    {chunk.distance && (
                        <span className={`px-2 py-1 rounded bg-gray-100 text-gray-800`}>
                            {chunk.distance.toFixed(3)}
                        </span>
                    )}
                </div>
            </div>
            {chunk.function_name && (
                <div className={`text-sm ${themeClasses.secondaryText} mb-2`}>
                    Function: <code className="font-mono">{chunk.function_name}</code>
                </div>
            )}
            <pre className={`text-sm ${themeClasses.secondaryText} overflow-x-auto font-mono bg-black/10 p-2 rounded`}>
                {chunk.content}
            </pre>
            {(chunk.function_name || chunk.type === 'class' || chunk.content.includes('class ') || chunk.content.includes('struct ')) && (
                <button
                    onClick={() => handleViewChunkDiagram(chunk)}
                    className={`mt-2 px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors
                        ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                >
                    <Code2 className="h-3 w-3" />
                    <span>View Diagram</span>
                </button>
            )}
        </div>
    );

    const extractMermaidDiagram = (content: string) => {
        const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/;
        const match = content.match(mermaidRegex);
        if (match) {
            return {
                diagram: match[1].trim(),
                textWithoutDiagram: content.replace(mermaidRegex, '').trim()
            };
        }
        return { diagram: null, textWithoutDiagram: content };
    };

    const renderFunctionReferences = () => {
        const lastBotMessage = [...messages].reverse().find(m => m.type === 'bot' && m.response);
        const functions = lastBotMessage?.response?.retrieved_context || [];
        const uniqueFunctions = functions.filter((chunk, index, arr) =>
            chunk.function_name && arr.findIndex(c => c.function_name === chunk.function_name) === index
        );

        return (
            <div className="space-y-3">
                {uniqueFunctions.map((chunk, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.chatBg}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-mono text-sm font-medium ${themeClasses.text}`}>
                                {chunk.function_name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${themeClasses.settingsBg} ${themeClasses.secondaryText}`}>
                                Line {chunk.start_line}
                            </span>
                        </div>
                        <div className={`text-xs ${themeClasses.secondaryText} mb-2`}>
                            📁 {chunk.source}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                                chunk.type === 'code' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                                {chunk.type}
                            </span>
                            <span className={`text-xs ${themeClasses.secondaryText}`}>
                                Score: {chunk.distance?.toFixed(3)}
                            </span>
                        </div>
                    </div>
                ))}

                {uniqueFunctions.length === 0 && (
                    <div className={`text-center py-8 ${themeClasses.secondaryText}`}>
                        <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No functions found yet.</p>
                        <p className="text-xs">Ask about your code to see function references.</p>
                    </div>
                )}

                {lastBotMessage?.response && (
                    <div className={`mt-4 p-3 rounded-lg ${themeClasses.border} border`}>
                        <h4 className={`font-medium text-sm mb-2 ${themeClasses.text}`}>Query Metrics</h4>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className={themeClasses.secondaryText}>Chunks Retrieved:</span>
                                <span className={themeClasses.text}>{lastBotMessage.response.debug_info?.retrieved_chunk_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={themeClasses.secondaryText}>Temperature:</span>
                                <span className={themeClasses.text}>{lastBotMessage.response.debug_info?.llm_temperature || settings.temperature}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={themeClasses.secondaryText}>Top K:</span>
                                <span className={themeClasses.text}>{lastBotMessage.response.debug_info?.query_top_k || settings.top_k}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderChatHistory = () => {
        const userMessages = messages.filter(m => m.type === 'user');
        const botMessages = messages.filter(m => m.type === 'bot' && !m.isLoading);

        return (
            <div className="space-y-4">
                {userMessages.length === 0 ? (
                    <div className={`text-center py-8 ${themeClasses.secondaryText}`}>
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No chat history yet.</p>
                        <p className="text-xs">Start a conversation to see your history.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {userMessages.map((msg, index) => {
                            const correspondingBot = botMessages[index];
                            return (
                                <div key={msg.id} className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.chatBg}`}>
                                    <div className="mb-2">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <User className="h-3 w-3 text-cyan-500" />
                                            <span className={`text-xs ${themeClasses.secondaryText}`}>
                                                {msg.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${themeClasses.text} font-medium`}>{msg.content}</p>
                                    </div>

                                    {correspondingBot && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Bot className="h-3 w-3 text-cyan-500" />
                                                <span className={`text-xs ${themeClasses.secondaryText}`}>Response</span>
                                            </div>
                                            <p className={`text-xs ${themeClasses.secondaryText} line-clamp-3`}>
                                                {correspondingBot.content.substring(0, 150)}...
                                            </p>
                                            {correspondingBot.response && (
                                                <div className={`mt-1 text-xs ${themeClasses.secondaryText}`}>
                                                    {correspondingBot.response.debug_info?.retrieved_chunk_count || 0} chunks retrieved
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (!hasFiles) {
        return (
            <div className={`${themeClasses.chatBg} rounded-lg p-8 text-center border ${themeClasses.border}`}>
                <Bot className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
                <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>Upload Code Files First</h3>
                <p className={themeClasses.secondaryText}>
                    Upload your C/C++ files to start chatting with your codebase.
                </p>
            </div>
        );
    }

    return (
        <div className={`${themeClasses.chatBg} rounded-lg border ${themeClasses.border} flex flex-col h-[700px]`}>
            {/* Header */}
            <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-cyan-500" />
                    <h2 className={`text-lg font-semibold ${themeClasses.text}`}>Code Assistant</h2>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`px-3 py-1 text-sm rounded ${themeClasses.buttonPrimary} text-white transition-colors`}
                >
                    Settings
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className={`p-4 border-b ${themeClasses.border} ${themeClasses.settingsBg}`}>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                                Temperature: {settings.temperature}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.temperature}
                                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                                Top K: {settings.top_k}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={settings.top_k}
                                onChange={(e) => setSettings({ ...settings, top_k: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                                Similarity: {settings.similarity_threshold}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.similarity_threshold}
                                onChange={(e) => setSettings({ ...settings, similarity_threshold: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <Bot className={`h-12 w-12 ${themeClasses.secondaryText} mx-auto mb-4 opacity-50`} />
                                <p className={themeClasses.secondaryText}>
                                    Ask me anything about your uploaded code!
                                </p>
                                <div className="mt-4 space-y-2 text-sm">
                                    <p className={`${themeClasses.secondaryText} italic`}>Try asking:</p>
                                    <div className="space-y-1">
                                        <p className={`${themeClasses.secondaryText} text-xs`}>"What does the main function do?"</p>
                                        <p className={`${themeClasses.secondaryText} text-xs`}>"Explain the reverse_string function"</p>
                                        <p className={`${themeClasses.secondaryText} text-xs`}>"Show me all the functions that use loops"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                                    <div className="flex items-center space-x-2 mb-1">
                                        {message.type === 'user' ? (
                                            <User className="h-4 w-4 text-cyan-500" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-cyan-500" />
                                        )}
                                        <span className={`text-xs ${themeClasses.secondaryText}`}>
                                            {message.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className={`p-4 rounded-lg ${
                                        message.type === 'user'
                                            ? `${themeClasses.userMessage} text-white`
                                            : `${themeClasses.botMessage} ${themeClasses.text}`
                                    }`}>
                                        {message.isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                                                <span>Thinking...</span>
                                            </div>
                                        ) : (
                                            <div>
                                                {message.type === 'bot' && message.response ? (
                                                    <div>
                                                        {(() => {
                                                            const { diagram, textWithoutDiagram } = extractMermaidDiagram(message.content);
                                                            return (
                                                                <div>
                                                                    <div className="whitespace-pre-wrap mb-4 leading-relaxed">{textWithoutDiagram}</div>
                                                                    {diagram && (
                                                                        <div className="mb-4">
                                                                            <h4 className={`font-semibold mb-2 ${themeClasses.text}`}>Generated Diagram:</h4>
                                                                            <MermaidDiagram chart={diagram} isDarkMode={isDarkMode} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Debug Info */}
                                                        <div className={`mt-3 p-2 rounded text-xs ${themeClasses.settingsBg} ${themeClasses.secondaryText}`}>
                                                            <div className="flex items-center space-x-4">
                                                                <span className="flex items-center space-x-1">
                                                                    <Search className="h-3 w-3" />
                                                                    <span>{message.response.debug_info?.retrieved_chunk_count || 0} chunks</span>
                                                                </span>
                                                                <span className="flex items-center space-x-1">
                                                                    <Brain className="h-3 w-3" />
                                                                    <span>T: {message.response.debug_info?.llm_temperature || settings.temperature}</span>
                                                                </span>
                                                                <span className="flex items-center space-x-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>K: {message.response.debug_info?.query_top_k || settings.top_k}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Retrieved Context */}
                                                        {message.response.retrieved_context && message.response.retrieved_context.length > 0 && (
                                                            <details className="mt-3">
                                                                <summary className={`cursor-pointer text-sm font-medium ${themeClasses.text} hover:text-cyan-500`}>
                                                                    View Retrieved Code Context ({message.response.retrieved_context.length} chunks)
                                                                </summary>
                                                                <div className="mt-2 space-y-2">
                                                                    {message.response.retrieved_context.map((chunk, index) =>
                                                                        renderCodeChunk(chunk, index)
                                                                    )}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className={`p-4 border-t ${themeClasses.border}`}>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about your code..."
                                className={`flex-1 p-3 rounded-lg border ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className={`px-4 py-3 ${themeClasses.buttonPrimary} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className={`w-80 border-l ${themeClasses.border} ${themeClasses.sidebarBg} flex flex-col`}>
                    {/* Sidebar Tabs */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setRightSidebarTab('functions')}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                                    rightSidebarTab === 'functions' ? themeClasses.tabActive : themeClasses.tabInactive
                                }`}
                            >
                                <Code className="h-3 w-3" />
                                <span>Functions</span>
                            </button>
                            <button
                                onClick={() => setRightSidebarTab('history')}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                                    rightSidebarTab === 'history' ? themeClasses.tabActive : themeClasses.tabInactive
                                }`}
                            >
                                <History className="h-3 w-3" />
                                <span>History</span>
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {rightSidebarTab === 'functions' ? (
                            <div>
                                <h3 className={`font-semibold mb-3 ${themeClasses.text} flex items-center`}>
                                    <Code className="h-4 w-4 mr-2" />
                                    Function References
                                </h3>
                                {renderFunctionReferences()}
                            </div>
                        ) : (
                            <div>
                                <h3 className={`font-semibold mb-3 ${themeClasses.text} flex items-center`}>
                                    <History className="h-4 w-4 mr-2" />
                                    Chat History
                                </h3>
                                {renderChatHistory()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mermaid Diagram Modal */}
            {showChunkDiagramModal && currentChunkDiagram && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className={`relative ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
                        <div className={`p-4 border-b ${themeClasses.border} flex justify-between items-center`}>
                            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                                Diagram for: {currentChunkDiagram.chunk.function_name || currentChunkDiagram.chunk.source} (Line {currentChunkDiagram.chunk.start_line})
                            </h3>
                            <button
                                onClick={() => setShowChunkDiagramModal(false)}
                                className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${themeClasses.text}`}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <MermaidDiagram chart={currentChunkDiagram.mermaidSyntax} isDarkMode={isDarkMode} />
                            <h4 className={`mt-4 font-semibold ${themeClasses.text}`}>Original Code Snippet:</h4>
                            <pre className={`text-sm ${themeClasses.secondaryText} overflow-x-auto font-mono bg-black/10 p-2 rounded mt-2`}>
                                {currentChunkDiagram.chunk.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractiveChat; 