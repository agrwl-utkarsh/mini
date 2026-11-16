import React from 'react';
import { classNames } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';

interface LoadingStateProps {
  stage: 'cloning' | 'scanning' | 'analyzing';
  message?: string;
  progress?: number;
}

const stages = [
  { id: 'cloning', label: 'Cloning Repository', icon: '⬇️' },
  { id: 'scanning', label: 'Scanning Structure', icon: '🔍' },
  { id: 'analyzing', label: 'Analyzing Code', icon: '🧠' },
];

export const LoadingState: React.FC<LoadingStateProps> = ({ stage, message, progress }) => {
  const currentIndex = stages.findIndex((s) => s.id === stage);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {stages.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div
                  className={classNames(
                    'w-12 h-12 rounded-full flex items-center justify-center text-xl font-medium transition-all',
                    i < currentIndex
                      ? 'bg-green-500 text-white'
                      : i === currentIndex
                      ? 'bg-sky-500 text-white animate-pulse ring-4 ring-sky-500/30'
                      : 'bg-slate-800 text-slate-500'
                  )}
                >
                  {i < currentIndex ? '✓' : s.icon}
                </div>
                <span className={classNames('text-xs text-center mt-2', i <= currentIndex ? 'text-slate-300' : 'text-slate-500')}>
                  {s.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={classNames(
                    'flex-1 h-1 mx-2 rounded transition-colors',
                    i < currentIndex ? 'bg-green-500' : 'bg-slate-800'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current Status */}
        <div className="text-center">
          <div className="mb-4">
            <Spinner size="lg" color="primary" />
          </div>
          <h3 className="text-lg font-medium text-slate-100 mb-2">
            {stages[currentIndex]?.label || 'Processing...'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">{message || 'Please wait...'}</p>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};