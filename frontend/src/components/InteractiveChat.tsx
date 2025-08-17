// MultipleFiles/InteractiveChat.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Code, Clock, Brain, Search, AlertCircle, CheckCircle, History, MessageSquare, Code2, X } from 'lucide-react';
import { backendApi, QueryResponse, CodeChunk, DiagramPayload, DiagramResponse } from '../services/backendApi'; // Import DiagramPayload, DiagramResponse
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
    backendMode: 'api' | 'model'; // Ensure this prop is passed and typed correctly
    messages: ChatMessage[];
    setMessages: (messages: ChatMessage[]) => void;
    settings: ChatSettings;
    setSettings: (settings: ChatSettings) => void;
    onQueryComplete?: (query: string, response: QueryResponse, timestamp: Date) => void;
}

export const InteractiveChat: React.FC<InteractiveChatProps> = ({
    hasFiles,
    backendMode, // Use the prop directly
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

            console.log('Sending query:', userMessage.content, 'with backend mode:', backendMode); // Debug log

            if (backendMode === 'api') {
                response = await backendApi.askQuestion({
                    query: userMessage.content,
                    temperature: settings.temperature,
                    top_k: settings.top_k,
                    similarity_threshold: settings.similarity_threshold,
                });
            } else { // backendMode === 'model'
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

    // This function will now call the backend for diagram generation if in 'model' mode
    const generateMermaidForChunk = async (chunk: CodeChunk): Promise<string> => {
        if (backendMode === 'model') {
            try {
                const payload: DiagramPayload = { chunk: chunk };
                const response: DiagramResponse = await backendApi.generateChunkDiagram(payload);
                return response.mermaid_syntax;
            } catch (error) {
                console.error("Error generating chunk diagram from backend:", error);
                return `graph TD\n    A[Error generating diagram for ${chunk.function_name || chunk.source}]\n    A --> B[Check console for details]`;
            }
        } else {
            // Fallback for 'api' mode or if backend call fails
            let mermaidSyntax = '';
            if (chunk.function_name) {
                mermaidSyntax = `graph TD\n    A[Start ${chunk.function_name}] --> B{Process?}\n    B -- Yes --> C[Do Something]\n    C --> D[End]\n    B -- No --> D`;
            } else if (chunk.type === 'class' || chunk.content.includes('class ') || chunk.content.includes('struct ')) {
                mermaidSyntax = `classDiagram\n    class MyClass {\n        + myMethod()\n        - myField\n    }\n    MyClass <|-- AnotherClass\n    MyClass : +memberVariable\n    MyClass : +memberFunction()`;
            } else {
                mermaidSyntax = `graph TD\n    A[Code Chunk] --> B[Content Analysis]\n    B --> C[No specific structure found]`;
            }
            return mermaidSyntax;
        }
    };

    const handleViewChunkDiagram = async (chunk: CodeChunk) => {
        const mermaidSyntax = await generateMermaidForChunk(chunk); // Await the async function
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
    
        return (
            <div className={`flex flex-col h-full ${themeClasses.container}`}>
                {/* Add your chat interface JSX here */}
            </div>
        );
    };