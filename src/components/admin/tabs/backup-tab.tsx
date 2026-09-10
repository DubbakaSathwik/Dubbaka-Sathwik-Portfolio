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
} from 'lucide-react';

interface BackupRestoreTabProps {
  showToast: (section: string, msg: string, db?: string) => void;
  initialSubTab?: 'github' | 'history' | 'export';
  onSubTabChange?: (tab: 'github' | 'history' | 'export') => void;
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
}: BackupRestoreTabProps) {
  const {
    data,
    updateData,
  } = useCMS();

  const [activeSubTab, setActiveSubTab] = useState<'github' | 'history' | 'export'>(initialSubTab);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string>('');

  // GitHub Sync State
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [customCommitMessage, setCustomCommitMessage] = useState('');
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [savedToken, setSavedToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [showSavedKey, setShowSavedKey] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [isSavingToken, setIsSavingToken] = useState<boolean>(false);
  const [rememberKey, setRememberKey] = useState<boolean>(true);

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

  const handleSubTabChange = (tab: 'github' | 'history' | 'export') => {
    setActiveSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // 1. Fetch GitHub Status & Saved Token
  const fetchGithubStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const json = await res.json();
        setGithubStatus(json);
      }
    } catch (e) {
      console.warn('Failed to fetch GitHub status:', e);
    }
  };

  const fetchSavedToken = async () => {
    try {
      // First check localStorage
      const local = localStorage.getItem('sathwik_git_token') || '';
      if (local) {
        setSavedToken(local);
        if (!personalAccessToken) {
          setPersonalAccessToken(local);
        }
      }

      // Then check backend
      const res = await fetch('/api/github/token');
      if (res.ok) {
        const json = await res.json();
        if (json.hasToken && json.token) {
          setSavedToken(json.token);
          localStorage.setItem('sathwik_git_token', json.token);
          if (!personalAccessToken) {
            setPersonalAccessToken(json.token);
          }
          // Quiet background verification
          fetch('/api/github/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: json.token }),
          })
            .then((r) => r.json())
            .then((v) => {
              if (v.valid) setVerificationResult(v);
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Failed to load saved git token:', e);
    }
  };

  // Live Token Verification Handler
  const handleVerifyToken = async (customToken?: string) => {
    const key = (customToken !== undefined ? customToken : (personalAccessToken || savedToken)).trim();
    if (!key) {
      showToast('Token Required', 'Please enter or save a GitHub token to verify.', 'Alert');
      return;
    }

    setIsVerifyingToken(true);
    try {
      const res = await fetch('/api/github/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: key }),
      });
      const json = await res.json();
      setVerificationResult(json);

      if (json.valid && json.hasRepoScope) {
        showToast('Token Verified!', `Connected to @${json.login} with full repository write permissions!`, 'Verified');
      } else if (json.valid) {
        showToast('Scope Warning', `Valid token for @${json.login}, but missing the "repo" scope!`, 'Alert');
      } else {
        showToast('Verification Failed', json.message || 'Invalid GitHub token. Please re-generate PAT.', 'Error');
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
      const res = await fetch('/api/github/history');
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json);
      }
    } catch (e) {
      console.warn('Failed to load git history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchGithubStatus();
    fetchSavedToken();
    fetchGitHistory();
  }, []);

  // When subtab switches to history, re-fetch
  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchGitHistory();
    }
  }, [activeSubTab]);

  // 3. Save Git Token
  const handleSaveToken = async (tokenToSave?: string) => {
    const key = (tokenToSave !== undefined ? tokenToSave : personalAccessToken).trim();
    if (!key) {
      showToast('Key Empty', 'Please enter a GitHub Personal Access Token to save.', 'Alert');
      return;
    }

    setIsSavingToken(true);
    try {
      // Save locally in browser
      localStorage.setItem('sathwik_git_token', key);
      setSavedToken(key);

      // Save to server backend
      const res = await fetch('/api/github/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: key }),
      });
      const json = await res.json();

      if (json.success) {
        showToast('Git Key Saved', 'GitHub Token saved securely! You can copy or push anytime.', 'Key Vault');
        await fetchGithubStatus();
      } else {
        showToast('Save Warning', json.message || 'Token saved in browser storage only.', 'Notice');
      }
    } catch (e: any) {
      showToast('Token Saved Locally', 'Key saved in browser localStorage successfully.', 'Key Vault');
    } finally {
      setIsSavingToken(false);
    }
  };

  // 4. Copy Token to Clipboard
  const handleCopyToken = (tokenToCopy?: string) => {
    const key = (tokenToCopy !== undefined ? tokenToCopy : (savedToken || personalAccessToken)).trim();
    if (!key) {
      showToast('No Key Available', 'No token to copy. Enter a token first.', 'Alert');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(key);
      setCopiedToken(true);
      showToast('Key Copied!', 'GitHub Access Token copied to clipboard.', 'Clipboard');
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = key;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToken(true);
      showToast('Key Copied!', 'GitHub Access Token copied to clipboard.', 'Clipboard');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // 5. Insert Saved Key into Token Field
  const handleInsertSavedKey = () => {
    if (!savedToken) {
      showToast('No Saved Key', 'No saved token found. Please enter and save one.', 'Alert');
      return;
    }
    setPersonalAccessToken(savedToken);
    showToast('Key Inserted', 'Saved GitHub token placed in token input field.', 'Ready');
  };

  // 6. Clear / Delete Saved Key
  const handleClearSavedKey = async () => {
    localStorage.removeItem('sathwik_git_token');
    setSavedToken('');
    try {
      await fetch('/api/github/token', { method: 'DELETE' });
    } catch (e) {}
    showToast('Saved Key Removed', 'Saved GitHub token has been cleared.', 'Storage');
    await fetchGithubStatus();
  };

  // 7. Copy Commit Hash
  const handleCopyCommitHash = (hash: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedCommitHash(hash);
      showToast('Commit SHA Copied', `Hash ${hash.slice(0, 7)} copied to clipboard.`, 'Git');
      setTimeout(() => setCopiedCommitHash(null), 2000);
    }
  };

  // 8. Trigger Git Push
  const handleSyncGithub = async () => {
    const effectiveToken = (personalAccessToken.trim() || savedToken.trim());
    if (!effectiveToken) {
      showToast('Token Required', 'Please enter your GitHub Personal Access Token or save one.', 'Error');
      return;
    }

    setIsSyncingGithub(true);
    try {
      const payload: Record<string, any> = {
        token: effectiveToken,
        message: customCommitMessage.trim() || undefined,
        saveToken: rememberKey,
      };

      // Also ensure it's saved if rememberKey is true
      if (rememberKey && effectiveToken) {
        localStorage.setItem('sathwik_git_token', effectiveToken);
        setSavedToken(effectiveToken);
      }

      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast('GitHub Sync Succeeded', `Pushed commit ${json.commit} to ${json.branch}!`, 'GitHub');
        setCustomCommitMessage('');
        await fetchGithubStatus();
        await fetchGitHistory();
      } else {
        showToast('GitHub Sync Failed', json.message || 'Push failed', 'Error');
      }
    } catch (err: any) {
      showToast('GitHub Sync Error', err?.message || 'Network error during GitHub push', 'Error');
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

        {/* 3 Sub-tabs Selector */}
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
            <span>GitHub Sync & Push</span>
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
          <button
            type="button"
            onClick={() => handleSubTabChange('export')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'export'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Export & Import JSON</span>
          </button>
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
                {savedToken || githubStatus?.configured ? (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Git Key Ready & Active</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Token Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* GITHUB KEY VAULT & SAVE MANAGER */}
            {/* ========================================================= */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Key className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      GitHub Key Manager & Saved Access Token
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      Vault
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Save your GitHub Personal Access Token (PAT) here once. You can copy it with one click, insert it into the push field, or push automatically.
                  </p>
                </div>

                {savedToken && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(savedToken)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copy saved token to clipboard"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? 'Copied!' : 'Copy Saved Key'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertSavedKey}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Insert saved key into push input field"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Use Key</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Saved Key Status Display Box */}
              {savedToken ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Key Stored & Protected</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                        Browser & Server
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                        {showSavedKey
                          ? savedToken
                          : `${savedToken.slice(0, 4)}••••••••••••••••••••••••${savedToken.slice(-4)}`}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowSavedKey(!showSavedKey)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                        title={showSavedKey ? 'Hide key' : 'Show key'}
                      >
                        {showSavedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(savedToken)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{copiedToken ? 'Copied' : 'Copy Key'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSavedKey}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear saved token from storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>No Git key saved yet. Save your token below so you don't have to enter it again!</span>
                  </div>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono underline hover:text-white text-amber-300 shrink-0 flex items-center gap-1"
                  >
                    <span>Get GitHub PAT</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Input for Saving/Updating the Key */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-zinc-300 font-medium">
                    {savedToken ? 'Update / Re-Save GitHub Token:' : 'Enter & Save Your GitHub Token (PAT):'}
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Requires <code className="text-amber-400">repo</code> permissions
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type={showTokenInput ? 'text' : 'password'}
                      value={personalAccessToken}
                      onChange={(e) => setPersonalAccessToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
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
                      {personalAccessToken && (
                        <button
                          type="button"
                          onClick={() => handleCopyToken(personalAccessToken)}
                          className="p-1 rounded text-zinc-400 hover:text-emerald-400 cursor-pointer"
                          title="Copy input text"
                        >
                          {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isVerifyingToken || (!personalAccessToken.trim() && !savedToken)}
                      onClick={() => handleVerifyToken()}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      title="Verify this token against GitHub API"
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingToken ? 'animate-spin' : ''}`} />
                      <span>{isVerifyingToken ? 'Verifying...' : 'Verify Key'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingToken || !personalAccessToken.trim()}
                      onClick={() => handleSaveToken()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{isSavingToken ? 'Saving...' : 'Save Key'}</span>
                    </button>
                  </div>
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
                            ? `Authenticated for ${verificationResult.name || verificationResult.login}. Ready for pushing changes to GitHub!`
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
            </div>

            {/* ========================================================= */}
            {/* PUSH CHANGES ACTION FORM */}
            {/* ========================================================= */}
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Push Changes to GitHub</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Stages all updated project JSON data (<code className="text-emerald-400 font-mono">src/seed_data.json</code>) and uploaded images (<code className="text-emerald-400 font-mono">public/images/</code>) and pushes a clean commit to your GitHub repository.
                </p>
              </div>

              {/* Token prompt if neither saved nor entered */}
              {!savedToken && !personalAccessToken && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Enter your GitHub token with <code className="text-amber-300 font-mono">repo</code> scope, or save it above to push smoothly.
                  </p>
                  <input
                    type="password"
                    value={personalAccessToken}
                    onChange={(e) => setPersonalAccessToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              )}

              <div className="space-y-3">
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

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberKey}
                      onChange={(e) => setRememberKey(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Remember and keep key saved for future pushes</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Safe & secure. Token is authenticated directly against GitHub and remains protected.</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingGithub}
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
