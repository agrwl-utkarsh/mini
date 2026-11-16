// RepoSense Frontend Types

export interface UUID {
  uuid: string;
}

export type RepoStatus = 'pending' | 'cloning' | 'scanning' | 'ready' | 'error';

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface FrameworkInfo {
  name: string;
  config_files: string[];
  confidence: number;
}

export interface RepoSummary {
  total_files: number;
  total_dirs: number;
  total_lines: number;
  total_size_bytes: number;
  languages: LanguageStats[];
  frameworks: FrameworkInfo[];
  config_files: string[];
}

export interface RepoAnalyzeRequest {
  url: string;
}

export interface RepoAnalyzeResponse {
  repo_id: string;
  status: RepoStatus;
  message: string;
}

export interface RepoStatusResponse {
  repo_id: string;
  status: RepoStatus;
  summary?: RepoSummary;
  error?: string;
  progress?: string;
}

export interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  size?: number;
  language?: string;
  children?: TreeNode[];
  is_binary: boolean;
}

export interface RepoTreeResponse {
  repo_id: string;
  tree: TreeNode[];
}

export interface CodeSymbol {
  name: string;
  type: 'function' | 'class' | 'import';
  line_start: number;
  line_end: number;
  signature?: string;
  docstring?: string;
}

export interface FileContentResponse {
  repo_id: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lines: number;
  is_binary: boolean;
}

export interface FileExplainRequest {
  path: string;
}

export interface FileExplainResponse {
  repo_id: string;
  path: string;
  explanation: string;
  symbols: CodeSymbol[];
  imports: string[];
  functions: string[];
  classes: string[];
  fallback_used: boolean;
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

export interface FileReference {
  path: string;
  lines?: string;
  relevance?: string;
}

export interface AskRequest {
  question: string;
  history: ChatMessage[];
}

export interface AskResponse {
  repo_id: string;
  answer: string;
  references: FileReference[];
  fallback_used: boolean;
}

// UI State types
export interface FileTab {
  path: string;
  name: string;
  language: string;
  content?: string;
  isBinary: boolean;
  lines: number;
  size: number;
}

export interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}