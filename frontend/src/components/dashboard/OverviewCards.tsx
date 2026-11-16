import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { RepoSummary } from "../../types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OverviewCards({ summary }: { summary: RepoSummary }) {
  const languageEntries = Object.entries(summary.languages);
  const totalLangFiles = languageEntries.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-400">Files</p>
          <p className="mt-2 text-3xl font-semibold text-white">{summary.stats.files}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400">Folders</p>
          <p className="mt-2 text-3xl font-semibold text-white">{summary.stats.folders}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-400">Clone size</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {formatBytes(summary.stats.size_bytes)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Languages
        </h2>
        <div className="mt-4 space-y-3">
          {languageEntries.length === 0 ? (
            <p className="text-sm text-slate-500">No common source languages detected.</p>
          ) : (
            languageEntries.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-slate-400">{count} files</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${Math.max(6, (count / totalLangFiles) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Frameworks and config
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.frameworks.length === 0 ? (
            <p className="text-sm text-slate-500">No common frameworks detected.</p>
          ) : (
            summary.frameworks.map((item) => <Badge key={item}>{item}</Badge>)
          )}
        </div>
      </Card>
    </div>
  );
}
