const API_BASE_URL = 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface FileData {
  name: string;
  content: string;
  type: string;
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ user: User | null }> {
    return this.request('/user');
  }

  async uploadFiles(files: FileData[]): Promise<{ success: boolean; message: string }> {
    return this.request('/upload-files', {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  }

  async getFiles(): Promise<{ files: FileData[] }> {
    return this.request('/files');
  }

  async sendChatMessage(query: string): Promise<{ success: boolean; response: string }> {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getQueryLogs(): Promise<{ logs: Array<{ query: string; response: string; timestamp: string }> }> {
    return this.request('/query-logs');
  }
}

export const apiService = new ApiService();