# Chat With Your Code - Interactive RAG Assistant

An interactive web application that allows developers to chat with their C/C++ codebase using natural language through Retrieval-Augmented Generation (RAG).

## Features

### 🤖 AI-Powered Chat Interface
- Interactive chat with your codebase using natural language
- Real-time responses with code context and explanations
- Mermaid diagram generation for visual code understanding
- Adjustable AI parameters (temperature, top-k, similarity threshold)

### 📁 Smart File Management
- Upload C/C++ files (.c, .cpp, .h, .hpp) to backend
- File content viewer with syntax highlighting
- Automatic code chunking and semantic indexing
- File statistics and metadata display

### 📊 Code Visualization
- Interactive flowchart diagrams
- Class structure diagrams
- Function call graphs
- Downloadable Mermaid diagrams

### 🎨 Modern UI/UX
- Dark/Light mode toggle
- Responsive design for all devices
- Real-time status indicators
- Smooth animations and transitions

## Architecture

### Frontend (React + TypeScript + Vite)
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for styling and responsive design
- **Lucide React** for consistent iconography
- **Mermaid** for diagram generation
- **Context API** for state management

### Backend (FastAPI + Python)
- **FastAPI** for high-performance API endpoints
- **ChromaDB** for vector storage and semantic search
- **Sentence Transformers** for code embeddings
- **Google Gemini** for LLM-powered responses
- **Python multipart** for file upload handling

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend/

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env file

# Start the FastAPI server
python main.py
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Usage

1. **Upload Code Files**: Use the file upload interface to upload your C/C++ files to the backend
2. **Start Chatting**: Ask questions about your code in natural language
3. **Explore Diagrams**: View automatically generated flowcharts and class diagrams
4. **Adjust Settings**: Fine-tune AI parameters for better responses
5. **View Context**: Examine the retrieved code chunks that inform each response

### Example Queries
- "What does the main function do?"
- "Explain how the reverse_string function works"
- "Show me all functions that use loops"
- "What are the memory allocation patterns in this code?"
- "Generate a flowchart for the sorting algorithm"

## API Endpoints

### File Management
- `POST /upload_code_file` - Upload a single code file
- `POST /clear_codebase` - Clear all uploaded files

### Query Interface
- `POST /ask/` - Ask questions about the codebase
- `GET /` - Health check endpoint

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_google_gemini_api_key
```

### AI Parameters
- **Temperature** (0.0-1.0): Controls response creativity
- **Top K** (1-20): Number of code chunks to retrieve
- **Similarity Threshold** (0.0-2.0): Minimum similarity for chunk inclusion

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Lucide React for icons
- Mermaid for diagrams

### Backend
- FastAPI for API framework
- ChromaDB for vector database
- Sentence Transformers for embeddings
- Google Gemini for LLM responses
- Python multipart for file handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini for powerful language model capabilities
- ChromaDB for efficient vector storage
- The React and FastAPI communities for excellent documentation
- Mermaid for beautiful diagram generation