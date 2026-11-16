import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatBytes, formatNumber, getLanguageColor, getLanguageIcon } from '../../utils/formatters';
import type { RepoSummary as RepoSummaryType, LanguageStats, FrameworkInfo } from '../../types';

interface RepoSummaryProps {
  summary: RepoSummaryType;
}

export const RepoSummary: React.FC<RepoSummaryProps> = ({ summary }) => {
  const topLanguages = summary.languages.slice(0, 5);
  const otherLanguagesCount = summary.languages.length - 5;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Files"
          value={formatNumber(summary.total_files)}
          icon="📄"
          color="sky"
        />
        <StatCard
          label="Directories"
          value={formatNumber(summary.total_dirs)}
          icon="📁"
          color="indigo"
        />
        <StatCard
          label="Lines of Code"
          value={formatNumber(summary.total_lines)}
          icon="📝"
          color="emerald"
        />
        <StatCard
          label="Total Size"
          value={formatBytes(summary.total_size_bytes)}
          icon="💾"
          color="amber"
        />
      </div>

      {/* Languages */}
      {summary.languages.length > 0 && (
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Languages</h3>
            <Badge variant="default" size="sm">{summary.languages.length}</Badge>
          </div>
          <div className="space-y-3">
            {topLanguages.map((lang) => (
              <LanguageBar key={lang.language} lang={lang} />
            ))}
            {otherLanguagesCount > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>+ {otherLanguagesCount} more languages</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Frameworks */}
      {summary.frameworks.length > 0 && (
        <Card variant="outlined" padding="md">
          <h3 className="font-semibold text-slate-100 mb-3">Detected Frameworks</h3>
          <div className="flex flex-wrap gap-2">
            {summary.frameworks.map((fw) => (
              <FrameworkBadge key={fw.name} framework={fw} />
            ))}
          </div>
        </Card>
      )}

      {/* Config Files */}
      {summary.config_files.length > 0 && (
        <Card variant="outlined" padding="md">
          <h3 className="font-semibold text-slate-100 mb-3">Configuration Files</h3>
          <div className="flex flex-wrap gap-2">
            {summary.config_files.slice(0, 12).map((file) => (
              <span
                key={file}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono truncate max-w-[120px]"
              >
                {file}
              </span>
            ))}
            {summary.config_files.length > 12 && (
              <Badge variant="default" size="sm">+{summary.config_files.length - 12} more</Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'sky' | 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorMap = {
    sky: 'from-sky-500 to-sky-600',
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    violet: 'from-violet-500 to-violet-600',
    rose: 'from-rose-500 to-rose-600',
  };

  return (
    <Card variant="outlined" padding="md" className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="mt-3 h-1 bg-gradient-to-r rounded-full" style={{ background: colorMap[color] }} />
    </Card>
  );
};

interface LanguageBarProps {
  lang: LanguageStats;
}

const LanguageBar: React.FC<LanguageBarProps> = ({ lang }) => {
  const color = getLanguageColor(lang.language);
  const icon = getLanguageIcon(lang.language);

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300 truncate pr-2">{lang.language}</span>
          <span className="text-slate-500 whitespace-nowrap">{formatNumber(lang.files)} files · {lang.percentage}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${lang.percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
};

interface FrameworkBadgeProps {
  framework: FrameworkInfo;
}

const FrameworkBadge: React.FC<FrameworkBadgeProps> = ({ framework }) => {
  const confidenceColor =
    framework.confidence > 0.8 ? 'success' : framework.confidence > 0.5 ? 'warning' : 'info';

  return (
    <Badge variant={confidenceColor as any} size="sm" dot>
      {framework.name}
      <span className="text-xs opacity-75 ml-1">({Math.round(framework.confidence * 100)}%)</span>
    </Badge>
  );
};