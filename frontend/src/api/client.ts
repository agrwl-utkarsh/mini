import type { AskResult, ExplainResult, FileContent, RepoSummary, TreeNode } from "../types";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((item: { msg?: string }) => item.msg || "Request error").join(" ");
    }
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; ai_mode: string }>("/api/health"),
  analyze: (url: string) =>
    request<RepoSummary>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  summary: (repoId: string) => request<RepoSummary>(`/api/repos/${repoId}`),
  tree: (repoId: string) => request<{ tree: TreeNode }>(`/api/repos/${repoId}/tree`),
  file: (repoId: string, path: string) =>
    request<FileContent>(`/api/repos/${repoId}/file?path=${encodeURIComponent(path)}`),
  explain: (repoId: string, path: string) =>
    request<ExplainResult>(`/api/repos/${repoId}/explain`, {
      method: "POST",
      body: JSON.stringify({ path }),
    }),
  ask: (repoId: string, question: string) =>
    request<AskResult>(`/api/repos/${repoId}/ask`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
