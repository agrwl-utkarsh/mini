import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingState } from './LoadingState';
import { RepoSummary } from './RepoSummary';
import { api } from '../../services/api';
import type { RepoStatusResponse, RepoStatus } from '../../types';

export const Dashboard: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RepoStatusResponse | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repoId) return;

    const pollStatus = async () => {
      try {
        const data = await api.getRepoStatus(repoId);
        setStatus(data);

        if (data.status === 'ready' || data.status === 'error') {
          setPolling(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setPolling(false);
      }
    };

    pollStatus();

    const interval = setInterval(() => {
      if (polling) pollStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [repoId, polling]);

  const handleRefresh = async () => {
    if (!repoId) return;
    setPolling(true);
    setError('');
    try {
      await api.deleteRepository(repoId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
      setPolling(false);
    }
  };

  const handleNewAnalysis = () => navigate('/');

  if (!repoId) {
    navigate('/');
    return null;
  }

  if (error && !status) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Failed to load repository</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={handleNewAnalysis} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!status || status.status === 'pending' || status.status === 'cloning' || status.status === 'scanning') {
    const stageMap: Record<RepoStatus, 'cloning' | 'scanning' | 'analyzing'> = {
      pending: 'cloning',
      cloning: 'cloning',
      scanning: 'scanning',
      ready: 'analyzing',
      error: 'analyzing',
    };

    return (
      <LoadingState
        stage={stageMap[status?.status || 'pending']}
        message={status?.progress}
        progress={status?.status === 'scanning' ? 50 : status?.status === 'cloning' ? 20 : 0}
      />
    );
  }

  if (status.status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Analysis Failed</h2>
          <p className="text-slate-400 mb-6">{status.error || 'Unknown error occurred'}</p>
          <button onClick={handleRefresh} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <RepoSummary summary={status.summary!} />;
};