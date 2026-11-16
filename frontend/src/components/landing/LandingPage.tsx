import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { api } from '../../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/user/repo)');
      return;
    }

    setLoading(true);
    try {
      const response = await api.analyzeRepository(url);
      navigate(`/repo/${response.repo_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 mb-6 shadow-2xl shadow-sky-500/25">
            <Github className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-4 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            RepoSense
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            AI-powered codebase understanding platform. Enter a GitHub repository URL to analyze its structure, explore files, and get intelligent explanations.
          </p>
        </div>

        {/* Input Card */}
        <Card variant="elevated" padding="lg" className="animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                GitHub Repository URL
              </label>
              <div className="relative">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://github.com/user/repository"
                  leftIcon={<Github className="w-5 h-5" />}
                  fullWidth
                  disabled={loading}
                  aria-describedby={error ? 'url-error' : 'url-hint'}
                />
              </div>
              {error && (
                <p id="url-error" className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
              {!error && (
                <p id="url-hint" className="mt-2 text-sm text-slate-500">
                  Public repositories only. Private repos not supported.
                </p>
              )}
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} leftIcon={<ArrowRight className="w-5 h-5" />}>
              Analyze Repository
            </Button>
          </form>
        </Card>

        {/* Features */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📁', title: 'File Explorer', desc: 'Interactive tree view with syntax highlighting' },
            { icon: '🤖', title: 'AI Explanations', desc: 'Get file summaries with functions, classes & imports' },
            { icon: '💬', title: 'Code Assistant', desc: 'Ask questions about the codebase with context' },
          ].map((feature, i) => (
            <Card key={i} variant="outlined" padding="md" hover className="text-center">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-slate-100 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Examples */}
        <div className="mt-10">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Try these examples:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'https://github.com/facebook/react',
              'https://github.com/tensorflow/tensorflow',
              'https://github.com/microsoft/vscode',
              'https://github.com/vercel/next.js',
            ].map((exampleUrl) => (
              <button
                key={exampleUrl}
                onClick={() => handleUrlChange(exampleUrl)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors truncate max-w-[150px]"
                type="button"
              >
                {exampleUrl.replace('https://github.com/', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-600">
          <p>Built for learning • No code execution • Secure sandboxed analysis</p>
        </div>
      </div>
    </div>
  );
};