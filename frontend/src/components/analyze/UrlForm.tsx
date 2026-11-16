import { FormEvent, useState } from "react";
import { Github } from "lucide-react";
import { Button } from "../ui/Button";

const GITHUB_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(?:\.git)?\/?$/;

export function UrlForm({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!GITHUB_RE.test(trimmed)) {
      setLocalError("Enter a public GitHub URL like https://github.com/owner/repo");
      return;
    }
    setLocalError("");
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <label className="block text-sm font-medium text-slate-300" htmlFor="repo-url">
        Public GitHub repository URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="repo-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/pallets/flask"
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-navy-900/80 py-3 pl-10 pr-4 text-sm text-white outline-none ring-cyan-400/40 placeholder:text-slate-500 focus:ring-2"
          />
        </div>
        <Button type="submit" disabled={loading} className="sm:min-w-40">
          {loading ? "Analysing…" : "Analyse repo"}
        </Button>
      </div>
      {localError ? <p className="text-sm text-rose-400">{localError}</p> : null}
    </form>
  );
}
