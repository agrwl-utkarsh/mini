import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  RepoAnalyzeResponse,
  RepoStatusResponse,
  RepoTreeResponse,
  FileContentResponse,
  FileExplainResponse,
  AskResponse,
} from '../types';

// API Base URL configuration:
// 1. If VITE_API_BASE_URL env var is provided (local or production), use it
// 2. If running locally (localhost / 127.0.0.1), use local backend: http://localhost:8000/api/v1
// 3. In production (e.g. Vercel), use relative '/api/v1' which proxies via vercel.json rewrites
const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = viteApiBaseUrl || (isLocalhost ? 'http://localhost:8000/api/v1' : '/api/v1');

interface ApiErrorResponse {
  detail?: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000, // 2 minutes for clone operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
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
