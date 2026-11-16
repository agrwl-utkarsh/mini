import { Card } from "../ui/Card";

export function CodeViewer({
  path,
  content,
  emptyLabel,
}: {
  path: string | null;
  content: string | null;
  emptyLabel: string;
}) {
  if (!path || content === null) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center p-6 text-sm text-slate-500">
        {emptyLabel}
      </Card>
    );
  }

  const lines = content.split("\n");

  return (
    <Card className="flex h-full min-h-[320px] flex-col overflow-hidden">
      <div className="border-b border-white/10 px-4 py-2 font-mono text-xs text-cyan-300">
        {path}
      </div>
      <pre className="flex-1 overflow-auto p-4 font-mono text-[13px] leading-6 text-slate-200">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="w-10 shrink-0 select-none pr-4 text-right text-slate-600">
              {index + 1}
            </span>
            <span className="whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </pre>
    </Card>
  );
}
