// MultipleFiles/services/backendApi.ts

// Define the base URLs for both backends
const API_BASE_URL = 'http://localhost:8000'; // API
const LOCAL_MODEL_API_BASE_URL = 'http://localhost:8001'; // local model backend

export interface CodeChunk {
  content: string;
  source: string;
  start_line: number;
  type: string;
  distance?: number;
  function_name?: string;
  class_name?: string;
  struct_name?: string;
}

export interface QueryResponse {
  answer: string;
  retrieved_context: CodeChunk[];
  debug_info: {
    retrieved_chunk_count: number;
    query_top_k: number;
    query_similarity_threshold: number;
    llm_temperature: number;
  };
}

export interface QueryRequest {
  query: string;
  temperature?: number;
  top_k?: number;
  similarity_threshold?: number;
  filter_type?: string;
}

// New interfaces for diagram generation payloads and responses
export interface DiagramPayload {
  files?: Array<{ name: string; content: string; type: string }>; // For module diagram
  chunk?: CodeChunk; // For chunk diagram
  retrieved_context?: CodeChunk[]; // If needed for highlighting in module diagram
}

export interface DiagramResponse {
  mermaid_syntax: string;
}


class BackendApiService {
  // Helper method to get the correct base URL based on the mode
  private getBaseUrl(mode: 'api' | 'model'): string { // Changed to 'api' | 'model' to match EnhancedDashboard state
    return mode === 'api' ? API_BASE_URL : LOCAL_MODEL_API_BASE_URL;
  }

  // Modified request helper to accept a 'mode' parameter
  // This helper is for JSON requests. File uploads are handled separately.
  private async request(endpoint: string, options: RequestInit = {}, mode: 'api' | 'model' = 'api') {
    const baseUrl = this.getBaseUrl(mode);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  // --- Existing Methods (now explicitly using 'api' mode for main backend operations) ---

  // Health check will always hit the main API backend
  async checkHealth(): Promise<{ message: string }> {
    return this.request('/health', {}, 'api'); // Assuming /health endpoint
  }

  // File listing will always hit the main API backend
  async listCodebaseFiles(): Promise<Array<{ name: string; content: string; type: string }>> {
    return this.request('/list_codebase', {}, 'api');
  }
 
  // File upload will always hit the main API backend
  async uploadCodeFiles(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload_codebase`, { // Explicitly use API_BASE_URL
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upload failed: ${err}`);
    }
    return response.json();
  }

  // Clear codebase will always hit the main API backend
  async clearCodebase(): Promise<{ message: string }> {
    return this.request('/clear_codebase', {
      method: 'POST',
    }, 'api');
  }

  // Ask question for the friend's API RAG
  async askQuestion(request: QueryRequest): Promise<QueryResponse> {
    return this.request('/ask/', {
      method: 'POST',
      body: JSON.stringify({
        query: request.query,
        temperature: request.temperature || 0.2,
        top_k: request.top_k || 5,
        similarity_threshold: request.similarity_threshold || 0.7,
        filter_type: request.filter_type,
      }),
    }, 'api'); // Explicitly use 'api' mode
  }

  // Ask question for your local model RAG (on port 8001)
  async askModelQuestion(request: QueryRequest): Promise<QueryResponse> {
    return this.request('/ask_model', {
      method: 'POST',
      body: JSON.stringify({
        question: request.query, // Your local model backend expects 'question'
        temperature: request.temperature || 0.2,
        top_k: request.top_k || 5,
        similarity_threshold: request.similarity_threshold || 0.7,
      }),
    }, 'model'); // Explicitly use 'model' mode
  }

  // --- NEW Methods for Diagram Generation (for your local model backend) ---

  async generateModuleDiagram(payload: DiagramPayload): Promise<DiagramResponse> {
    // This endpoint will be on your local model backend (port 8001)
    return this.request('/generate_module_diagram', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 'model'); // Explicitly use 'model' mode
  }

  async generateChunkDiagram(payload: DiagramPayload): Promise<DiagramResponse> {
    // This endpoint will be on your local model backend (port 8001)
    return this.request('/generate_chunk_diagram', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 'model'); // Explicitly use 'model' mode
  }
}

export const backendApi = new BackendApiService();
