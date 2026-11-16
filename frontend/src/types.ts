export type AiMode = "gemini" | "fallback";

export type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string | null;
  children?: TreeNode[];
};

export type RepoSummary = {
  repo_id: string;
  name: string;
  owner: string;
  url: string;
  stats: {
    files: number;
    folders: number;
    size_bytes: number;
  };
  languages: Record<string, number>;
  frameworks: string[];
  ai_mode: AiMode;
};

export type FileContent = {
  path: string;
  content: string;
  language: string | null;
};

export type ExplainResult = {
  path: string;
  language: string | null;
  explanation: string;
  symbols: {
    imports: string[];
    classes: string[];
    functions: string[];
  };
  ai_mode: AiMode;
  fallback_label: string | null;
};

export type AskResult = {
  answer: string;
  references: { path: string; reason: string }[];
  ai_mode: AiMode;
  fallback_label: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: { path: string; reason: string }[];
  ai_mode?: AiMode;
  fallback_label?: string | null;
};
