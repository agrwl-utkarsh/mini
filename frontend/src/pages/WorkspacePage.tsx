import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AppShell, type WorkspaceSection } from "../components/layout/AppShell";
import { OverviewCards } from "../components/dashboard/OverviewCards";
import { FileTree } from "../components/explorer/FileTree";
import { CodeViewer } from "../components/explorer/CodeViewer";
import { ExplainPanel } from "../components/explainer/ExplainPanel";
import { ChatPanel } from "../components/assistant/ChatPanel";
import { Card } from "../components/ui/Card";
import { Loader } from "../components/ui/Loader";
import { api } from "../api/client";
import type { ChatMessage, ExplainResult, RepoSummary, TreeNode } from "../types";

export function WorkspacePage() {
  const { repoId = "" } = useParams();
  const location = useLocation();
  const seeded = (location.state as { summary?: RepoSummary } | null)?.summary;

  const [section, setSection] = useState<WorkspaceSection>("overview");
  const [summary, setSummary] = useState<RepoSummary | null>(seeded ?? null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [summaryData, treeData] = await Promise.all([
          seeded ? Promise.resolve(seeded) : api.summary(repoId),
          api.tree(repoId),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setTree(treeData.tree);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load repository session.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [repoId, seeded]);

  async function handleSelect(path: string) {
    setSelectedPath(path);
    setFileError("");
    setFileContent(null);
    setExplain(null);
    try {
      const file = await api.file(repoId, path);
      setFileContent(file.content);
      if (section === "explainer") {
        await loadExplanation(path);
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not open this file.");
    }
  }

  async function loadExplanation(path: string) {
    setExplainLoading(true);
    try {
      setExplain(await api.explain(repoId, path));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not explain this file.");
    } finally {
      setExplainLoading(false);
    }
  }

  useEffect(() => {
    if (section === "explainer" && selectedPath && !explain && fileContent !== null) {
      void loadExplanation(selectedPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  async function handleAsk(question: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    setMessages((current) => [...current, userMessage]);
    setAskLoading(true);
    try {
      const result = await api.ask(repoId, question);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          references: result.references,
          ai_mode: result.ai_mode,
          fallback_label: result.fallback_label,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: err instanceof Error ? err.message : "The assistant could not answer.",
        },
      ]);
    } finally {
      setAskLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid-glow min-h-screen">
        <Loader label="Loading workspace…" />
      </div>
    );
  }

  if (error || !summary || !tree) {
    return (
      <div className="grid-glow min-h-screen p-10">
        <Card className="mx-auto max-w-xl p-6 text-sm text-rose-300">
          {error || "Session expired. Analyse the repository again from the home page."}
        </Card>
      </div>
    );
  }

  return (
    <AppShell repoName={`${summary.owner}/${summary.name}`} section={section} onSectionChange={setSection}>
      {section === "overview" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{summary.owner}/{summary.name}</h2>
            <a className="text-sm text-cyan-300 hover:underline" href={summary.url} target="_blank" rel="noreferrer">
              {summary.url}
            </a>
          </div>
          <OverviewCards summary={summary} />
        </div>
      ) : null}

      {section === "explorer" ? (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="overflow-hidden p-3">
            <FileTree tree={tree} selectedPath={selectedPath} onSelect={handleSelect} />
          </Card>
          <div className="min-w-0">
            {fileError ? <p className="mb-3 text-sm text-rose-400">{fileError}</p> : null}
            <CodeViewer
              path={selectedPath}
              content={fileContent}
              emptyLabel="Select a file in the tree to view its contents."
            />
          </div>
        </div>
      ) : null}

      {section === "explainer" ? (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 xl:grid-cols-[240px_1fr_1fr]">
          <Card className="overflow-hidden p-3">
            <FileTree tree={tree} selectedPath={selectedPath} onSelect={handleSelect} />
          </Card>
          <CodeViewer
            path={selectedPath}
            content={fileContent}
            emptyLabel="Select a file to explain it beside the source."
          />
          <ExplainPanel result={explain} loading={explainLoading} />
        </div>
      ) : null}

      {section === "assistant" ? (
        <ChatPanel messages={messages} loading={askLoading} onAsk={handleAsk} />
      ) : null}
    </AppShell>
  );
}
