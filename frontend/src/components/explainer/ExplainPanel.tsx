import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Loader } from "../ui/Loader";
import type { ExplainResult } from "../../types";

export function ExplainPanel({
  result,
  loading,
}: {
  result: ExplainResult | null;
  loading: boolean;
}) {
  return (
    <Card className="flex h-full min-h-[320px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">File explanation</h2>
        {result?.fallback_label ? <Badge>{result.fallback_label}</Badge> : null}
        {result?.ai_mode === "gemini" ? <Badge>Gemini</Badge> : null}
      </div>
      <div className="flex-1 overflow-auto p-4 text-sm leading-6 text-slate-300">
        {loading ? <Loader label="Explaining this file…" /> : null}
        {!loading && !result ? (
          <p className="text-slate-500">Select a file to see what it does.</p>
        ) : null}
        {!loading && result ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{result.explanation}</p>
            <SymbolList title="Imports" items={result.symbols.imports} />
            <SymbolList title="Classes" items={result.symbols.classes} />
            <SymbolList title="Functions" items={result.symbols.functions} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SymbolList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 16).map((item) => (
          <span
            key={item}
            className="rounded-md bg-navy-700 px-2 py-1 font-mono text-xs text-cyan-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
