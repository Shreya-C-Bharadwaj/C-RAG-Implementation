import React, { useState } from 'react';
import { Code, Brain, Search, FileText, BarChart3, MessageSquare, ArrowRight, CheckCircle, Users, Zap, Shield } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import DarkModeToggle from './DarkModeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const { isDarkMode } = useDarkMode();

  // Consolidated theme classes with better type safety
  const themeClasses = {
    background: isDarkMode 
      ? 'bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-900' 
      : 'bg-gradient-to-br from-cyan-50 via-sky-100 to-teal-100',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    cardBg: isDarkMode 
      ? 'bg-black/20 backdrop-blur-md border-white/10' 
      : 'bg-white/60 backdrop-blur-md border-cyan-200/50',
    navBg: isDarkMode 
      ? 'bg-black/20 backdrop-blur-md border-white/10' 
      : 'bg-white/30 backdrop-blur-md border-cyan-200/30',
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700' 
      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
    buttonSecondary: isDarkMode 
      ? 'border-white/20 hover:bg-white/10' 
      : 'border-cyan-300/50 hover:bg-cyan-100/50',
    accent: isDarkMode ? 'text-cyan-400' : 'text-cyan-600',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-slate-600',
    cardHover: isDarkMode 
      ? 'hover:border-cyan-400/50' 
      : 'hover:border-cyan-500/50',
    gradientText: isDarkMode 
      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400' 
      : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600',
    border: isDarkMode ? 'border-white/10' : 'border-cyan-200/50',
    emerald: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
    yellow: isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
  };

  const features = [
    {
      icon: Search,
      title: 'Semantic Search',
      description: 'Advanced vector embeddings using CodeBERT and OpenAI for intelligent code search'
    },
    {
      icon: Brain,
      title: 'LLM-Powered Responses',
      description: 'AI-generated answers using state-of-the-art language models for accurate code explanations'
    },
    {
      icon: FileText,
      title: 'Source Linking',
      description: 'Direct links to exact code lines and comprehensive documentation references'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Real-time metrics on response latency, accuracy, and hallucination rates'
    },
    {
      icon: MessageSquare,
      title: 'Query Logging',
      description: 'Complete conversation history with function references and search analytics'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your code stays secure with local processing and encrypted communications'
    }
  ];

  const benefits = [
    'Faster code onboarding for new team members',
    'Streamlined debugging and troubleshooting',
    'Enhanced code documentation and understanding',
    'Reduced time spent searching through large codebases',
    'Improved code quality through better comprehension'
  ];

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full ${themeClasses.navBg} border-b z-50 transition-colors duration-300`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                <Code className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">RAGCode Assistant</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setActiveSection('overview')}
                className={`hover:${themeClasses.accent} transition-colors ${activeSection === 'overview' ? themeClasses.accent : themeClasses.secondaryText}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSection('features')}
                className={`hover:${themeClasses.accent} transition-colors ${activeSection === 'features' ? themeClasses.accent : themeClasses.secondaryText}`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveSection('about')}
                className={`hover:${themeClasses.accent} transition-colors ${activeSection === 'about' ? themeClasses.accent : themeClasses.secondaryText}`}
              >
                About
              </button>
              <DarkModeToggle />
              <button
                onClick={onGetStarted}
                className={`px-6 py-2 ${themeClasses.buttonPrimary} rounded-lg transition-all transform hover:scale-105`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full shadow-lg">
              <Code className="h-16 w-16" />
            </div>
          </div>
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${themeClasses.gradientText} bg-clip-text text-transparent`}>
            Chat With Your Code
          </h1>
          <p className={`text-xl md:text-2xl ${themeClasses.secondaryText} mb-8 max-w-4xl mx-auto`}>
            Interact with your C/C++ codebase using natural language via Retrieval-Augmented Generation (RAG)
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className={`px-8 py-4 ${themeClasses.buttonPrimary} rounded-lg text-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2 text-white shadow-lg`}
            >
              <span>Start Chatting</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveSection('features')}
              className={`px-8 py-4 border ${themeClasses.buttonSecondary} rounded-lg text-lg font-semibold transition-all`}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-6 pb-20">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section className={`${themeClasses.cardBg} rounded-2xl p-8 md:p-12 border ${themeClasses.border} transition-colors duration-300`}>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Project Overview</h2>
                <div className="mb-6 md:hidden">
                  <img 
                    src="/intro1.png" 
                    alt="Team of developers collaborating around a laptop showing code development interface" 
                    className={`w-full h-64 object-cover rounded-xl border ${themeClasses.border}`}
                  />
                </div>
                <p className={`${themeClasses.secondaryText} text-lg mb-6`}>
                  Chat With Your Code allows developers to interact with their C/C++ codebase using natural language. 
                  It leverages advanced retrieval and generation techniques to answer questions about functions, 
                  variables, memory logic, and more.
                </p>
                <p className={`${themeClasses.secondaryText} text-lg mb-8`}>
                  This tool enhances productivity, simplifies onboarding, and supports faster debugging and 
                  documentation by combining code chunking, semantic search, and LLM-based responses.
                </p>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className={`h-5 w-5 ${themeClasses.emerald} flex-shrink-0`} />
                      <span className={themeClasses.secondaryText}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img 
                  src="/intro1.png" 
                  alt="Team of developers collaborating around a laptop displaying code development interface" 
                  className={`w-full h-80 object-cover rounded-xl border ${themeClasses.border} mb-6`}
                />
                <div className={`bg-gradient-to-r ${isDarkMode ? 'from-cyan-600/20 to-teal-600/20' : 'from-cyan-100/60 to-teal-100/60'} rounded-xl p-8 border ${themeClasses.border}`}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 ${themeClasses.emerald} rounded-full`}></div>
                      <span className={`text-sm ${themeClasses.secondaryText}`}>Code Analysis Active</span>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white/80'} rounded-lg p-4 font-mono text-sm`}>
                      <div className={themeClasses.accent}>$ chat "What does init_printer() do?"</div>
                      <div className={`${themeClasses.secondaryText} mt-2`}>
                        The init_printer() function initializes the printer subsystem by setting up the communication 
                        protocol and configuring default print settings...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {activeSection === 'features' && (
          <section className={`${themeClasses.cardBg} rounded-2xl p-8 md:p-12 border ${themeClasses.border} transition-colors duration-300`}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Core Features</h2>
              <p className={`${themeClasses.secondaryText} text-lg`}>
                Powerful AI-driven tools to understand and interact with your codebase
              </p>
              <div className="mt-8">
                <img 
                  src="/features1.png" 
                  alt="AI-powered features diagram showing LLM generation, semantic search, and code analysis capabilities" 
                  className={`w-full h-64 object-cover rounded-xl border ${themeClasses.border}`}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/40'} rounded-xl p-6 border ${themeClasses.border} ${themeClasses.cardHover} transition-all`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className={themeClasses.secondaryText}>{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* About Section */}
        {activeSection === 'about' && (
          <section className={`${themeClasses.cardBg} rounded-2xl p-8 md:p-12 border ${themeClasses.border} transition-colors duration-300`}>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">About the Project</h2>
                <div className="mb-6 md:hidden">
                  <img 
                    src="/about1.png" 
                    alt="Developer working with AI assistant on C++ code with chat interface" 
                    className={`w-full h-64 object-cover rounded-xl border ${themeClasses.border}`}
                  />
                </div>
                <p className={`${themeClasses.secondaryText} text-lg mb-6`}>
                  We are a passionate team of developers and innovators on a mission to redefine how code is 
                  understood and debugged. With our "Chat With Your Code" assistant, we've combined cutting-edge 
                  AI—with capabilities like Retrieval-Augmented Generation, NLP pipelines, and vector search—to 
                  break down the complexity of C/C++ codebases.
                </p>
                <p className={`${themeClasses.secondaryText} text-lg mb-8`}>
                  Our motive is simple: empower developers by making code more accessible, understandable, and 
                  interactive. We believe that by harnessing advanced language models, we can turn even the most 
                  daunting code into a comprehensible dialogue, paving the way for faster onboarding, streamlined 
                  debugging, and continuous innovation.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Users className={`h-8 w-8 ${themeClasses.accent}`} />
                    </div>
                    <div className="text-2xl font-bold">10K+</div>
                    <div className={`text-sm ${themeClasses.secondaryText}`}>Developers</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Zap className={`h-8 w-8 ${themeClasses.yellow}`} />
                    </div>
                    <div className="text-2xl font-bold">99.9%</div>
                    <div className={`text-sm ${themeClasses.secondaryText}`}>Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <MessageSquare className={`h-8 w-8 ${themeClasses.emerald}`} />
                    </div>
                    <div className="text-2xl font-bold">1M+</div>
                    <div className={`text-sm ${themeClasses.secondaryText}`}>Queries</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="/about1.png" 
                  alt="Developer using AI assistant to analyze C++ code with chat interface showing code explanations" 
                  className={`w-full h-80 object-cover rounded-xl border ${themeClasses.border} mb-6`}
                />
                <div className={`bg-gradient-to-r ${isDarkMode ? 'from-teal-600/20 to-cyan-600/20' : 'from-teal-100/60 to-cyan-100/60'} rounded-xl p-8 border ${themeClasses.border}`}>
                  <h3 className="text-2xl font-bold mb-6">Technology Stack</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Vector Embeddings</span>
                      <div className={`w-32 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
                        <div className="bg-cyan-500 h-2 rounded-full w-28"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>LLM Integration</span>
                      <div className={`w-32 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
                        <div className="bg-teal-500 h-2 rounded-full w-30"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Code Analysis</span>
                      <div className={`w-32 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
                        <div className={`${themeClasses.emerald} h-2 rounded-full w-32`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className={`border-t ${themeClasses.border} py-8`}>
        <div className="container mx-auto px-6 text-center">
          <p className={themeClasses.secondaryText}>
            &copy; 2025 Chat With Your Code. Empowering developers through AI-driven code understanding.
          </p>
        </div>
      </footer>
    </div>
  );
};