import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  RepoAnalyzeRequest,
  RepoAnalyzeResponse,
  RepoStatusResponse,
  RepoTreeResponse,
  FileContentResponse,
  FileExplainRequest,
  FileExplainResponse,
  AskRequest,
  AskResponse,
} from '../types';

// On Vercel: use relative URLs (rewrites proxy to Render backend)
// Local dev: use VITE_API_BASE_URL env var
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
const API_BASE_URL = isVercel ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1');

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL || undefined,
      timeout: 120000, // 2 minutes for clone operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = error.response?.data?.detail || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Repository endpoints
  async analyzeRepository(url: string): Promise<RepoAnalyzeResponse> {
    const response = await this.client.post<RepoAnalyzeResponse>('/repos/analyze', { url });
    return response.data;
  }

  async getRepoStatus(repoId: string): Promise<RepoStatusResponse> {
    const response = await this.client.get<RepoStatusResponse>(`/repos/${repoId}/status`);
    return response.data;
  }

  async getRepoTree(repoId: string): Promise<RepoTreeResponse> {
    const response = await this.client.get<RepoTreeResponse>(`/repos/${repoId}/tree`);
    return response.data;
  }

  async deleteRepository(repoId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/repos/${repoId}`);
    return response.data;
  }

  // File endpoints
  async getFileContent(repoId: string, filePath: string): Promise<FileContentResponse> {
    const response = await this.client.get<FileContentResponse>(`/repos/${repoId}/files/${encodeURIComponent(filePath)}`);
    return response.data;
  }

  async explainFile(repoId: string, filePath: string): Promise<FileExplainResponse> {
    const response = await this.client.post<FileExplainResponse>(`/repos/${repoId}/explain`, { path: filePath });
    return response.data;
  }

  // Chat endpoint
  async askQuestion(repoId: string, question: string, history: Array<{ role: string; content: string }>): Promise<AskResponse> {
    const response = await this.client.post<AskResponse>(`/repos/${repoId}/ask`, {
      question,
      history,
    });
    return response.data;
  }
}

export const api = new ApiService();