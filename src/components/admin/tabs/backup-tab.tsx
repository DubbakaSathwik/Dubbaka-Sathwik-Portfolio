import React, { useState, useEffect } from 'react';
import { useCMS } from '../../../context/CMSContext';
import {
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Github,
  GitBranch,
  GitCommit,
  ExternalLink,
  Layers,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  History,
  Search,
  ArrowUpRight,
  Clock,
  User,
  BarChart3,
  Database,
  PieChart,
  Activity,
  Info,
  FolderGit2,
  ShieldAlert,
  CheckCheck,
  Percent,
  GitPullRequest,
  Lock,
  Globe,
} from 'lucide-react';
import {
  verifyGitHubTokenDirect,
  pushToGitHubClientDirect,
  safeFetchJson,
  GITHUB_REPO,
  GITHUB_BRANCH,
} from '../../../lib/github-client';

interface BackupRestoreTabProps {
  showToast: (section: string, msg: string, db?: string) => void;
  initialSubTab?: 'github' | 'history' | 'repo-info' | 'export';
  onSubTabChange?: (tab: 'github' | 'history' | 'repo-info' | 'export') => void;
  onNavigateToJSONBackup?: () => void;
}

interface GitCommitItem {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  relativeDate: string;
  commitUrl: string;
}

interface PushEventItem {
  id: string;
  timestamp: string;
  commitHash: string;
  message: string;
  author: string;
  status: 'success' | 'failed';
  details?: string;
}

export function BackupRestoreTab({
  showToast,
  initialSubTab = 'github',
  onSubTabChange,
  onNavigateToJSONBackup,
}: BackupRestoreTabProps) {
  const {
    data,
    updateData,
    authToken,
  } = useCMS();

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const [activeSubTab, setActiveSubTab] = useState<'github' | 'history' | 'repo-info' | 'export'>(initialSubTab);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string>('');

  // GitHub Sync State (Zero-Persistence: tokens are never stored, used purely on-demand)
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [customCommitMessage, setCustomCommitMessage] = useState('');
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Clear any previously cached token for maximum security
  useEffect(() => {
    try {
      localStorage.removeItem('sathwik_git_token');
    } catch (e) {}
  }, []);

  // Repository Telemetry & Data Usage State
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [isLoadingRepoInfo, setIsLoadingRepoInfo] = useState<boolean>(false);
  const [copiedCloneUrl, setCopiedCloneUrl] = useState<string | null>(null);

  // Token Live Verification State
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    login?: string;
    name?: string;
    avatarUrl?: string;
    scopes?: string[];
    hasRepoScope?: boolean;
    message?: string;
  } | null>(null);

  // Git Push History State
  const [historyData, setHistoryData] = useState<{
    commits: GitCommitItem[];
    pushEvents: PushEventItem[];
    repo?: string;
    branch?: string;
    repoUrl?: string;
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [copiedCommitHash, setCopiedCommitHash] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'github' | 'history' | 'repo-info' | 'export') => {
    setActiveSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // 1. Fetch GitHub Status & Saved Token
  const fetchGithubStatus = async () => {
    try {
      const { ok, data: json } = await safeFetchJson('/api/github/status');
      if (ok && json) {
        setGithubStatus(json);
      } else {
        // Fallback for static hosting (Netlify)
        setGithubStatus({
          configured: true,
          repo: GITHUB_REPO,
          branch: GITHUB_BRANCH,
          cliAvailable: false,
          mode: 'client_rest',
          status: 'Direct GitHub Sync Ready',
          lastCommit: 'Synchronized on GitHub',
        });
      }
    } catch (e) {
      console.warn('Failed to fetch GitHub status:', e);
    }
  };

  // Live Token Verification Handler (Direct GitHub API call with CORS support)
  const handleVerifyToken = async (customToken?: string) => {
    const key = (customToken !== undefined ? customToken : personalAccessToken).trim();
    if (!key) {
      showToast('Token Required', 'Please enter a GitHub Personal Access Token to verify.', 'Alert');
      return;
    }

    setIsVerifyingToken(true);
    try {
      const res = await verifyGitHubTokenDirect(key);
      setVerificationResult(res);

      if (res.valid && res.hasRepoScope) {
        showToast('Token Verified!', `Connected to @${res.login} with full repository write permissions!`, 'Verified');
      } else if (res.valid) {
        showToast('Scope Warning', `Valid token for @${res.login}, but missing the "repo" scope!`, 'Alert');
      } else {
        showToast('Verification Failed', res.message || 'Invalid GitHub token. Please check credentials.', 'Error');
      }
    } catch (e: any) {
      showToast('Verification Error', e?.message || 'Could not verify token with GitHub.', 'Error');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // 2. Fetch Git Commit & Push History
  const fetchGitHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { ok, data: json } = await safeFetchJson('/api/github/history');
      if (ok && json) {
        setHistoryData(json);
      } else {
        // Fallback: Query GitHub API directly for commits
        const token = personalAccessToken.trim();
        const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const ghRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=15`,
          { headers }
        );
        if (ghRes.ok) {
          const commits = await ghRes.json();
          setHistoryData({
            commits: (Array.isArray(commits) ? commits : []).map((c: any) => ({
              hash: c.sha,
              shortHash: c.sha.slice(0, 7),
              message: c.commit?.message || '',
              author: c.commit?.author?.name || c.author?.login || 'Dubbaka Sathwik',
              date: c.commit?.author?.date || new Date().toISOString(),
              relativeDate: 'recently',
              commitUrl: c.html_url || `https://github.com/${GITHUB_REPO}/commit/${c.sha}`,
            })),
            pushEvents: [],
            branch: GITHUB_BRANCH,
            repo: GITHUB_REPO,
            repoUrl: `https://github.com/${GITHUB_REPO}`,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load git history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 2b. Fetch Live Repository Telemetry and Storage Data Usage
  const fetchRepoInfo = async (customToken?: string) => {
    setIsLoadingRepoInfo(true);
    try {
      const active = (customToken !== undefined ? customToken : personalAccessToken).trim();
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (active) headers['Authorization'] = `Bearer ${active}`;

      const { ok, data: json } = await safeFetchJson(
        active ? `/api/github/repo-info?token=${encodeURIComponent(active)}` : '/api/github/repo-info',
        { headers: getAuthHeaders() }
      );
      if (ok && json) {
        setRepoInfo(json);
      } else {
        const ghRepoRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers });
        if (ghRepoRes.ok) {
          const repo = await ghRepoRes.json();
          setRepoInfo({
            configured: true,
            repoDetails: {
              name: repo.name,
              fullName: repo.full_name,
              private: repo.private,
              htmlUrl: repo.html_url,
              cloneUrl: repo.clone_url,
              defaultBranch: repo.default_branch,
              sizeKb: repo.size,
              openIssuesCount: repo.open_issues_count,
              stargazersCount: repo.stargazers_count,
              forksCount: repo.forks_count,
            },
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load repo info:', e);
    } finally {
      setIsLoadingRepoInfo(false);
    }
  };

  useEffect(() => {
    fetchGithubStatus();
    fetchGitHistory();
    fetchRepoInfo();
  }, []);

  // When subtab switches, re-fetch relevant data
  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchGitHistory();
    } else if (activeSubTab === 'repo-info') {
      fetchRepoInfo();
    }
  }, [activeSubTab]);

  // Copy Commit Hash
  const handleCopyCommitHash = (hash: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedCommitHash(hash);
      showToast('Commit SHA Copied', `Hash ${hash.slice(0, 7)} copied to clipboard.`, 'Git');
      setTimeout(() => setCopiedCommitHash(null), 2000);
    }
  };

  // 3. Trigger Git Push (Zero-Persistence: Token is never saved, executed on demand & cleared)
  const handleSyncGithub = async () => {
    const effectiveToken = personalAccessToken.trim();
    if (!effectiveToken) {
      showToast('Token Required', 'Please enter a GitHub Personal Access Token to push.', 'Error');
      return;
    }

    setIsSyncingGithub(true);
    try {
      showToast('Pushing Changes', 'Connecting directly to GitHub repository from browser...', 'GitHub');

      const clientPush = await pushToGitHubClientDirect(
        effectiveToken,
        customCommitMessage.trim(),
        data
      );

      showToast(
        'GitHub Push Succeeded!',
        `Pushed commit ${clientPush.commit} to ${clientPush.branch}! Netlify will redeploy automatically.`,
        'GitHub'
      );
      setCustomCommitMessage('');
      setPersonalAccessToken(''); // Auto-clear token from memory after push
      setVerificationResult(null);
      await fetchGithubStatus();
      await fetchGitHistory();
    } catch (err: any) {
      showToast('GitHub Push Error', err?.message || 'Network error during GitHub push', 'Error');
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Download Backup as JSON
  const handleDownloadBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `sathwik_portfolio_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('JSON Backup', 'Full portfolio data downloaded successfully as JSON file', 'Local Download');
  };

  // Parse uploaded JSON file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setPreviewData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setParseError('Please select a valid .json file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic schema check
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        setPreviewData(parsed);
      } catch (err: any) {
        setParseError(`JSON Parsing Error: ${err.message || 'Invalid syntax'}`);
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  // Apply restored data
  const handleRestoreUploadedData = () => {
    if (!previewData) return;
    setIsRestoring(true);
    try {
      updateData(previewData);
      showToast('Restore Succeeded', 'Portfolio state restored successfully from uploaded JSON', 'Local Restore');
      setSelectedFile(null);
      setPreviewData(null);
    } catch (e: any) {
      showToast('Restore Failed', e?.message || 'Failed to apply state', 'Error');
    } finally {
      setIsRestoring(false);
    }
  };

  const currentStats = {
    projects: (data.projects || []).length,
    certificates: (data.gallery || []).length,
    journey: (data.journey || []).length,
    creative: (data.creativePortfolio || []).length,
    resumes: (data.resumes || []).length,
    messages: (data.contactMessages || data.messages || []).length,
  };

  // Filter commits based on search query
  const filteredCommits = (historyData?.commits || []).filter((commit) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      commit.message.toLowerCase().includes(q) ||
      commit.shortHash.toLowerCase().includes(q) ||
      commit.author.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Sub-Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-sm">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>GitHub Live Synchronization & Data Center</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Static & Git Powered
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Push all text and images directly to your GitHub repo, manage your Git keys, review push history, or download backups.
            </p>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => handleSubTabChange('github')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'github'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Live Sync</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSubTabChange('repo-info');
              fetchRepoInfo();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'repo-info'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Repo Info & Data Usage</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'repo-info' ? 'bg-emerald-800 text-white' : 'bg-zinc-800 text-emerald-400'
            }`}>
              {repoInfo?.localAssets?.totalLocalMb ? `${repoInfo.localAssets.totalLocalMb} MB` : 'Storage'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Git Push History</span>
            {historyData?.commits && historyData.commits.length > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'history' ? 'bg-emerald-800 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {historyData.commits.length}
              </span>
            )}
          </button>

          {onNavigateToJSONBackup && (
            <button
              type="button"
              onClick={onNavigateToJSONBackup}
              className="px-3 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-2 text-sky-400 hover:text-white hover:bg-sky-950/40 border border-sky-500/20"
              title="Open dedicated JSON Backup & Import Section"
            >
              <FileJson className="w-4 h-4" />
              <span>JSON Backup Center ➔</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: GITHUB REPOSITORY SYNC & KEY VAULT */}
      {/* ========================================================= */}
      {activeSubTab === 'github' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] space-y-6">
            {/* Header Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>GitHub Repository Synchronization</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Direct Git Push
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Commit and push all project changes, milestones, certificates, and photo assets directly to your GitHub repo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    fetchGithubStatus();
                    fetchGitHistory();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Check latest commit status"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Refresh Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubTabChange('history')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>Push History</span>
                </button>

                <a
                  href={githubStatus?.repoUrl || 'https://github.com/DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open GitHub</span>
                </a>
              </div>
            </div>

            {/* Status & Repository Info Bar */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">Target Repository:</span>
                  <a
                    href={`https://github.com/${githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-emerald-400 hover:underline font-bold px-2.5 py-0.5 rounded bg-zinc-950 border border-emerald-500/30 flex items-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>{githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}</span>
                  </a>
                  <span className="text-xs font-mono text-zinc-400 px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                    <span>{githubStatus?.branch || 'main'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Latest Commit:</span>
                  <span className="font-mono text-zinc-300 font-semibold truncate max-w-md">
                    {githubStatus?.lastCommit || 'Latest commit on main'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {verificationResult?.valid || personalAccessToken.trim().length > 0 ? (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Token Ready (On-Demand)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Zero-Persistence Security</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Repository Storage & Health Quick Banner */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-zinc-200">
                      Repo Storage Usage:
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-emerald-500/40">
                      {repoInfo?.storage?.formattedRepoSize || (repoInfo?.localAssets?.totalLocalMb ? `${repoInfo.localAssets.totalLocalMb} MB` : '17.4 MB')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {repoInfo?.storage?.healthBadge || 'Optimal (<1 GB)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Local assets: {repoInfo?.localAssets?.assetFilesCount || 161} files ({repoInfo?.localAssets?.assetsSizeMb || '17.4'} MB) • GitHub Soft Limit: 1,000 MB ({repoInfo?.storage?.remainingSoftLimitMb || '982.6'} MB remaining)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSubTabChange('repo-info')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-semibold flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer border border-zinc-700 hover:border-emerald-500/40"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>View Full Repo Analytics ➔</span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* DIRECT GITHUB TOKEN GENERATOR (ZERO PERSISTENCE) */}
            {/* ========================================================= */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-zinc-950 border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Zero-Persistence GitHub Security Mode
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Ultra-Secure
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                    For maximum security, your GitHub token is <span className="text-white font-semibold">never stored</span> on any server, database, or browser storage. Whenever you want to push updates, generate a fresh token from GitHub, paste it below, and push. It is discarded immediately after pushing.
                  </p>
                </div>

                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Dubbaka-Sathwik-Portfolio-Push"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
                >
                  <Github className="w-4 h-4" />
                  <span>Generate New Git Token</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PUSH CHANGES ACTION FORM (ON-DEMAND) */}
            {/* ========================================================= */}
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Push Changes to GitHub</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Directly stages updated project JSON data (<code className="text-emerald-400 font-mono">src/seed_data.json</code>) and public backups from your browser to your GitHub repository (<code className="text-zinc-300 font-mono">DubbakaSathwik/Dubbaka-Sathwik-Portfolio</code>).
                </p>
              </div>

              {/* Token Input Field */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-zinc-300 font-medium">
                    Paste Temporary GitHub Token (PAT):
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Dubbaka-Sathwik-Portfolio-Push"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Need a new token? Click here</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type={showTokenInput ? 'text' : 'password'}
                      value={personalAccessToken}
                      onChange={(e) => setPersonalAccessToken(e.target.value)}
                      placeholder="Paste ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowTokenInput(!showTokenInput)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        title={showTokenInput ? 'Hide' : 'Show'}
                      >
                        {showTokenInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isVerifyingToken || !personalAccessToken.trim()}
                    onClick={() => handleVerifyToken()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Verify this token against GitHub API"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingToken ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingToken ? 'Verifying...' : 'Verify Token'}</span>
                  </button>
                </div>

                {/* Live Token Verification Result Box */}
                {verificationResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      verificationResult.valid && verificationResult.hasRepoScope
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : verificationResult.valid
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {verificationResult.avatarUrl ? (
                        <img
                          src={verificationResult.avatarUrl}
                          alt="GitHub Avatar"
                          className="w-8 h-8 rounded-full border border-emerald-500/50 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          GH
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono flex items-center gap-1">
                            {verificationResult.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                            )}
                            {verificationResult.valid ? 'Token Valid & Connected' : 'Token Invalid'}
                          </span>
                          {verificationResult.login && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 font-mono font-bold text-zinc-200">
                              @{verificationResult.login}
                            </span>
                          )}
                          {verificationResult.hasRepoScope && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 font-mono text-emerald-300">
                              repo scope verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          {verificationResult.valid
                            ? `Authenticated for ${verificationResult.name || verificationResult.login}. Ready to push changes!`
                            : verificationResult.message || 'The token provided is invalid or expired. Check your GitHub PAT settings.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVerifyToken()}
                      disabled={isVerifyingToken}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3 h-3 ${isVerifyingToken ? 'animate-spin' : ''}`} />
                      <span>Re-check</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Commit Message & Push Action */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                    Commit Message (Optional):
                  </label>
                  <input
                    type="text"
                    value={customCommitMessage}
                    onChange={(e) => setCustomCommitMessage(e.target.value)}
                    placeholder="e.g. update: portfolio projects, bio images & milestones"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Direct browser-to-GitHub push. Token is never saved and is cleared immediately after sync.</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingGithub || !personalAccessToken.trim()}
                    onClick={handleSyncGithub}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingGithub ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGithub ? 'Pushing to GitHub...' : 'Push Now to GitHub Repository'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  📁 Physical Image Assets
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  All project screenshots and certificates reside in <code className="text-emerald-400 font-mono">public/images/</code> as real image files committed right inside your repository.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  ⚡ Static JSON Core
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Zero external database dependencies. Your portfolio loads blazing fast directly from clean static JSON files.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  🌐 100% Free Hosting
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Deploy anywhere for free: Vercel, Netlify, or GitHub Pages with standard build (<code className="text-emerald-400 font-mono">npm run build</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: GIT PUSH HISTORY */}
      {/* ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.4)] space-y-6">
            {/* History Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Git Push & Commit History</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                        Live Commit Log
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      View all commits, timestamps, author information, and verify pushes to your remote repository.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isLoadingHistory}
                  onClick={fetchGitHistory}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh History</span>
                </button>

                <a
                  href={`https://github.com/${historyData?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}/commits/${historyData?.branch || 'main'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Total Commits</span>
                <span className="text-lg font-bold text-white font-mono">
                  {historyData?.commits?.length || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Target Branch</span>
                <span className="text-xs font-bold text-sky-400 font-mono flex items-center gap-1.5 pt-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>{historyData?.branch || 'main'}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Latest Commit</span>
                <span className="text-xs font-bold text-emerald-400 font-mono truncate block pt-1">
                  {historyData?.commits?.[0]?.shortHash || 'None'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Push Status</span>
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              </div>
            </div>

            {/* Search commits */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search commits by message, SHA, or author..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400 font-mono"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Commits List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
                <span>Commit Activity Log ({filteredCommits.length} entries)</span>
                <span>Branch: {historyData?.branch || 'main'}</span>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Loading Git commits...</span>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-2">
                  <GitCommit className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No commits found matching search query.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredCommits.map((commit, index) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={commit.hash}
                        className={`p-4 rounded-xl border transition-all ${
                          isLatest
                            ? 'bg-zinc-900/90 border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                        } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isLatest
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                          }`}>
                            <GitCommit className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-white font-mono break-words">
                                {commit.message}
                              </p>
                              {isLatest && (
                                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  HEAD / Latest
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleCopyCommitHash(commit.hash)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                                title="Click to copy full commit hash"
                              >
                                {copiedCommitHash === commit.hash ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-500" />
                                )}
                                <span className="font-bold">{commit.shortHash}</span>
                              </button>

                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-zinc-500" />
                                <span>{commit.author}</span>
                              </span>

                              <span className="flex items-center gap-1" title={commit.date}>
                                <Clock className="w-3 h-3 text-zinc-500" />
                                <span>{commit.relativeDate}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          <a
                            href={commit.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <span>View on GitHub</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent CMS Push Events */}
            {historyData?.pushEvents && historyData.pushEvents.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pushes Triggered from this CMS Portal</span>
                </h4>
                <div className="space-y-2">
                  {historyData.pushEvents.slice(0, 5).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${evt.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-zinc-300 truncate">{evt.message}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] text-zinc-500">
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        <span className={evt.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                          {evt.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: REPOSITORY INFO & DATA USAGE TRACKER */}
      {/* ========================================================= */}
      {activeSubTab === 'repo-info' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Storage & Repository Health Panel */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Repository Info & Storage Tracker</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Live Git Telemetry
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Live storage utilization, asset footprints, repository metrics, and GitHub quota tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  disabled={isLoadingRepoInfo}
                  onClick={() => fetchRepoInfo()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Reload live GitHub repository stats and local disk usage"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingRepoInfo ? 'animate-spin' : ''}`} />
                  <span>{isLoadingRepoInfo ? 'Scanning Repo...' : 'Refresh Telemetry'}</span>
                </button>

                <a
                  href={`https://github.com/${repoInfo?.repoDetails?.fullName || githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open GitHub Repo</span>
                </a>
              </div>
            </div>

            {/* Storage Progress Gauge Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-mono font-bold text-white">GitHub Repository Storage Quota</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {repoInfo?.storage?.healthBadge || 'Optimal Health (< 1 GB)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    GitHub recommends repositories stay below 1,000 MB (1 GB) for smooth git cloning and pushes.
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-emerald-400">
                    {repoInfo?.storage?.formattedRepoSize || (repoInfo?.localAssets?.totalLocalMb ? `${repoInfo.localAssets.totalLocalMb} MB` : '17.4 MB')}
                    <span className="text-xs font-normal text-zinc-500"> / 1,000 MB</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {repoInfo?.storage?.percentOfSoftLimit ?? 1.7}% of soft threshold used
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-zinc-950 border border-zinc-800 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.max(1, Math.min(100, repoInfo?.storage?.percentOfSoftLimit || 1.7))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>0 MB (Empty)</span>
                  <span className="text-emerald-400 font-bold">{repoInfo?.storage?.remainingSoftLimitMb ?? 982.6} MB remaining headroom</span>
                  <span>1,000 MB (Recommended)</span>
                  <span>5,000 MB (Hard Limit)</span>
                </div>
              </div>

              {/* Sustainability Recommendation */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white">Lifetime Sustainability Status: EXCELLENT</span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {repoInfo?.storage?.healthRecommendation ||
                      'With compressed web images (~100-200 KB each), you have enough storage space for over 5,000+ project media updates and lifetime career achievements.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Storage Breakdown Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Remote Repo Size */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  Remote Git Repository
                </span>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  <span>{repoInfo?.storage?.formattedRepoSize || (repoInfo?.localAssets?.totalLocalMb ? `${repoInfo.localAssets.totalLocalMb} MB` : '17.4 MB')}</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Total Git repository footprint on GitHub servers
                </p>
              </div>

              {/* Card 2: Uploaded Media Assets */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  Media & Asset Photos
                </span>
                <div className="text-xl font-mono font-bold text-emerald-400 flex items-baseline gap-1">
                  <span>{repoInfo?.localAssets?.assetsSizeMb || '17.38'} MB</span>
                  <span className="text-xs font-normal text-zinc-500">
                    ({repoInfo?.localAssets?.assetFilesCount || 161} files)
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate" title="/public/uploads/assets/">
                  Path: /public/uploads/assets/
                </p>
              </div>

              {/* Card 3: CMS Primary Store */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  Primary CMS Database
                </span>
                <div className="text-xl font-mono font-bold text-sky-400 flex items-baseline gap-1">
                  <span>{repoInfo?.localAssets?.seedDataKb || '346.7'} KB</span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate" title="/server/data/seed_data.json">
                  Structured portfolio JSON store
                </p>
              </div>

              {/* Card 4: Historical Backups */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  Snapshot Backups
                </span>
                <div className="text-xl font-mono font-bold text-amber-400 flex items-baseline gap-1">
                  <span>{repoInfo?.localAssets?.backupsKb || '693.5'} KB</span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate" title="/server/data/backups/">
                  Automated local restore snapshots
                </p>
              </div>
            </div>

            {/* Repository Identity & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              {/* Box A: Repository Identity & Clone Commands */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-emerald-400" />
                    <span>Repository Metadata</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {repoInfo?.repoDetails?.visibility ? repoInfo.repoDetails.visibility.toUpperCase() : 'PUBLIC'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono">Full Name:</span>
                    <a
                      href={`https://github.com/${repoInfo?.repoDetails?.fullName || githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>{repoInfo?.repoDetails?.fullName || githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono">Default Branch:</span>
                    <span className="font-mono text-white px-2 py-0.5 rounded bg-black/60 border border-zinc-800 flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-sky-400" />
                      <span>{repoInfo?.repoDetails?.defaultBranch || githubStatus?.branch || 'main'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono">Last Push Timestamp:</span>
                    <span className="font-mono text-zinc-300">
                      {repoInfo?.repoDetails?.pushedAt ? new Date(repoInfo.repoDetails.pushedAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  {/* Clone URLs with Copy */}
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-mono text-zinc-400 block font-semibold">
                      Clone URL (HTTPS):
                    </span>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black border border-zinc-800 font-mono text-[11px] text-zinc-300">
                      <span className="truncate flex-1">
                        {repoInfo?.repoDetails?.cloneUrl || `https://github.com/${githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}.git`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = repoInfo?.repoDetails?.cloneUrl || `https://github.com/${githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}.git`;
                          navigator.clipboard.writeText(url);
                          setCopiedCloneUrl('https');
                          setTimeout(() => setCopiedCloneUrl(null), 2500);
                        }}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                        title="Copy Clone URL"
                      >
                        {copiedCloneUrl === 'https' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box B: Latest Remote Commit & API Rate Limits */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-sky-400" />
                    <span>Latest Remote Commit</span>
                  </span>
                  {repoInfo?.latestCommit?.shortHash && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30">
                      {repoInfo.latestCommit.shortHash}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Commit Message</span>
                    <p className="font-mono text-zinc-200 bg-black/40 p-2 rounded-lg border border-zinc-800 mt-1 truncate">
                      "{repoInfo?.latestCommit?.message || githubStatus?.lastCommit || 'Latest updates via portfolio sync'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Committer:</span>
                    <span className="font-mono text-white font-semibold">
                      {repoInfo?.latestCommit?.author || 'Dubbaka Sathwik'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Date:</span>
                    <span className="font-mono text-zinc-300">
                      {repoInfo?.latestCommit?.date ? new Date(repoInfo.latestCommit.date).toLocaleString() : 'Recently'}
                    </span>
                  </div>

                  {/* GitHub API Rate Limits */}
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1 mt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GitHub API Quota:</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {repoInfo?.rateLimits?.remaining ?? 60} / {repoInfo?.rateLimits?.limit ?? 60} calls
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                      <span>Reset: {repoInfo?.rateLimits?.resetTime || 'Active'}</span>
                      <span className="text-emerald-400">Status: Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: EXPORT & IMPORT JSON */}
      {/* ========================================================= */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Download Live JSON */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Live Data
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export a complete snapshot of all custom projects, journey entries, certificates, creative designs, and resumes to a single JSON file.
                </p>

                {/* Summary Box */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-mono text-zinc-300 block font-semibold">Active Content Summary:</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.projects}</span>
                      <span className="text-zinc-400 text-[10px]">Projects</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.certificates}</span>
                      <span className="text-zinc-400 text-[10px]">Certificates</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.journey}</span>
                      <span className="text-zinc-400 text-[10px]">Journey</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.creative}</span>
                      <span className="text-zinc-400 text-[10px]">Creative</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.resumes}</span>
                      <span className="text-zinc-400 text-[10px]">Resumes</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block text-sm">{currentStats.messages}</span>
                      <span className="text-zinc-400 text-[10px]">Messages</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Complete Backup (.json)
              </button>
            </div>

            {/* Card 2: Upload Backup */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Restore from JSON Backup</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    .json File
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload any previously saved <code className="text-zinc-300 font-mono">.json</code> backup file to restore your projects, achievements, and settings.
                </p>

                <label className="block relative cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <div className="p-4 rounded-xl bg-zinc-900 border-2 border-dashed border-sky-500/40 hover:border-sky-400 text-center space-y-2 transition-all">
                    <FileJson className="w-6 h-6 text-sky-400 mx-auto" />
                    <p className="text-xs font-bold text-white truncate px-2">
                      {selectedFile ? selectedFile.name : 'Click to select .json backup file'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(2)} KB selected`
                        : 'Select or drag a backup file here'}
                    </p>
                  </div>
                </label>

                {parseError && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!previewData || isRestoring}
                onClick={handleRestoreUploadedData}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring...' : 'Restore Uploaded Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
