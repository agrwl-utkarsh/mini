import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Shield, Sparkles } from "lucide-react";
import { UrlForm } from "../components/analyze/UrlForm";
import { Card } from "../components/ui/Card";
import { Loader } from "../components/ui/Loader";
import { api } from "../api/client";

export function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError("");
    try {
      const summary = await api.analyze(url);
      navigate(`/workspace/${summary.repo_id}`, { state: { summary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse the repository.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid-glow min-h-screen">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-400">RepoSense</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Understand a GitHub codebase in minutes.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Paste a public repository URL. RepoSense clones it locally, maps the structure,
              and helps you read the code with a file explainer and a repository assistant.
            </p>
          </div>
        </header>

        <Card className="p-6 shadow-glow">
          <UrlForm onSubmit={handleAnalyze} loading={loading} />
          {loading ? (
            <Loader label="Cloning and scanning the repository. This can take a moment…" />
          ) : null}
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={GitBranch}
            title="Safe clone"
            body="Only public HTTPS GitHub URLs. Code is read, never executed."
          />
          <Feature
            icon={Sparkles}
            title="Optional Gemini"
            body="Add GEMINI_API_KEY for richer explanations, or use the labelled basic fallback."
          />
          <Feature
            icon={Shield}
            title="Sandboxed files"
            body="File access stays inside the cloned directory. Oversized repos are rejected."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof GitBranch;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="text-cyan-400" size={20} />
      <h2 className="mt-3 font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </Card>
  );
}
