import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../../context/CMSContext';
import {
  Download,
  Upload,
  Database,
  RefreshCw,
  HardDrive,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
  Bookmark,
  Check,
  ChevronDown,
  FileCheck2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Github,
  GitBranch,
  GitCommit,
  ExternalLink,
} from 'lucide-react';

export function BackupRestoreTab({
  showToast,
}: {
  showToast: (section: string, msg: string, db?: string) => void;
}) {
  const {
    data,
    updateData,
    authToken,
    loadStaticBackup,
    saveAsStaticBackup,
    selectStaticBackup,
    staticBackupStats,
    staticBackupFiles,
    refreshStaticBackupInfo,
  } = useCMS();

  const [activeSubTab, setActiveSubTab] = useState<'static' | 'github' | 'general'>('static');
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [serverBackupInfo, setServerBackupInfo] = useState<any | null>(null);
  const [loadingServerInfo, setLoadingServerInfo] = useState(false);

  // GitHub Sync State
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [customCommitMessage, setCustomCommitMessage] = useState('');

  // Static Backup Tab State
  const [selectedStaticFileId, setSelectedStaticFileId] = useState<string>('active_static');
  const [staticUploadFile, setStaticUploadFile] = useState<File | null>(null);
  const [staticUploadPreview, setStaticUploadPreview] = useState<any | null>(null);
  const [staticUploadError, setStaticUploadError] = useState<string>('');
  const [isSavingStatic, setIsSavingStatic] = useState(false);
  const [isLoadingStatic, setIsLoadingStatic] = useState(false);

  const fetchServerBackupInfo = async () => {
    setLoadingServerInfo(true);
    try {
      const res = await fetch('/api/cms/backups/list');
      const json = await res.json();
      if (json.success) {
        setServerBackupInfo(json);
      }
      await refreshStaticBackupInfo();
    } catch (err) {
      console.warn('Failed to load backup list:', err);
    } finally {
      setLoadingServerInfo(false);
    }
  };

  const fetchGithubStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) {
        const json = await res.json();
        setGithubStatus(json);
      }
    } catch (e) {}
  };

  const handleSyncGithub = async () => {
    setIsSyncingGithub(true);
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: customCommitMessage.trim() || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('GitHub Sync Succeeded', `Pushed commit ${json.commit} to ${json.branch}!`, 'GitHub');
        setCustomCommitMessage('');
        await fetchGithubStatus();
      } else {
        showToast('GitHub Sync Failed', json.message || 'Push failed', 'Error');
      }
    } catch (err: any) {
      showToast('GitHub Sync Error', err?.message || 'Network error during GitHub push', 'Error');
    } finally {
      setIsSyncingGithub(false);
    }
  };

  useEffect(() => {
    fetchServerBackupInfo();
    fetchGithubStatus();
  }, []);

  // 1. Download Backup as JSON
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

    showToast('JSON Backup', 'Full Portfolio Database downloaded successfully as JSON file', 'Local Download');
  };

  // 2. Parse uploaded JSON file
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
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed !== 'object' || parsed === null) {
          setParseError('Invalid JSON structure. Root must be an object.');
          return;
        }
        setPreviewData(parsed);
      } catch (err: any) {
        setParseError(`JSON Syntax Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // 3. Restore uploaded JSON to app & server
  const handleRestoreUploadedData = async () => {
    if (!previewData) return;
    setIsRestoring(true);

    try {
      updateData(previewData);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/cms/restore', {
        method: 'POST',
        headers,
        body: JSON.stringify(previewData),
      });

      const resJson = await res.json();

      if (resJson.success) {
        showToast('Database Restored', 'Portfolio data restored and synced successfully!', resJson.database || 'MongoDB Atlas');
        setSelectedFile(null);
        setPreviewData(null);
        fetchServerBackupInfo();
      } else {
        showToast('Restore Warning', resJson.message || 'Restored locally, server sync failed.', 'Local Only');
      }
    } catch (err: any) {
      showToast('Restore Failed', err?.message || 'Could not restore backup file', 'Error');
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Restore from Server Disk Backup
  const handleRestoreFromDisk = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch('/api/cms');
      const resJson = await res.json();
      if (resJson.data) {
        updateData(resJson.data);
        showToast('Server Snapshot Restored', 'Restored latest server disk backup (cms_backup.json)', resJson.database || 'Server Disk');
      }
    } catch (err: any) {
      showToast('Restore Failed', err?.message || 'Could not fetch server disk backup', 'Error');
    } finally {
      setIsRestoring(false);
    }
  };

  // ==========================================
  // STATIC BACKUP HANDLERS
  // ==========================================

  // Save current portfolio as Static Backup
  const handleSaveCurrentAsStatic = async () => {
    setIsSavingStatic(true);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `static_snapshot_${dateStr}_${Date.now().toString().slice(-4)}.json`;
    const res = await saveAsStaticBackup(filename);
    setIsSavingStatic(false);
    if (res.success) {
      showToast('Static Backup Saved', 'Current portfolio state saved as the active Static Backup. It will load on reload & logo click!', 'Static Storage');
      fetchServerBackupInfo();
    } else {
      showToast('Static Backup Error', res.message, 'Error');
    }
  };

  // Switch Static Backup from Dropdown
  const handleSelectStaticBackupFromDropdown = async (fileItem: any) => {
    if (!fileItem) return;
    setIsLoadingStatic(true);
    const res = await selectStaticBackup(fileItem.filename || fileItem.id);
    setIsLoadingStatic(false);
    if (res.success) {
      showToast(
        'Static Backup Switched',
        `Active Static Backup set to "${fileItem.name || fileItem.filename}". Automatically loaded!`,
        'Static Storage'
      );
      fetchServerBackupInfo();
    } else {
      showToast('Switch Error', res.message, 'Error');
    }
  };

  // Parse uploaded Static Backup file
  const handleStaticFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaticUploadError('');
    setStaticUploadPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setStaticUploadError('Please select a valid .json file');
      return;
    }

    setStaticUploadFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed !== 'object' || parsed === null || !parsed.hero) {
          setStaticUploadError('Invalid JSON structure. Must contain portfolio sections (hero, projects, etc.)');
          return;
        }
        setStaticUploadPreview(parsed);
      } catch (err: any) {
        setStaticUploadError(`JSON Syntax Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Upload and Apply Static Backup
  const handleUploadAndSetStaticBackup = async () => {
    if (!staticUploadPreview || !staticUploadFile) return;
    setIsSavingStatic(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/cms/static-backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: staticUploadPreview,
          filename: staticUploadFile.name,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        updateData(staticUploadPreview);
        showToast(
          'Static Backup Uploaded',
          `"${staticUploadFile.name}" is now the active Static Backup! It will load on reload & logo click.`,
          'Static Storage'
        );
        setStaticUploadFile(null);
        setStaticUploadPreview(null);
        fetchServerBackupInfo();
      } else {
        showToast('Upload Error', resJson.error?.message || 'Failed to set static backup', 'Error');
      }
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Error uploading static backup', 'Error');
    } finally {
      setIsSavingStatic(false);
    }
  };

  // Explicit Load Static Backup Now
  const handleLoadStaticBackupNow = async () => {
    setIsLoadingStatic(true);
    const res = await loadStaticBackup(false);
    setIsLoadingStatic(false);
    if (res.success) {
      showToast('Static Backup Loaded', 'Active Static Backup has been applied to the live website.', 'Static Storage');
    } else {
      showToast('Load Error', res.message, 'Error');
    }
  };

  const currentStats = {
    projects: data.projects?.length || 0,
    journey: data.journey?.length || 0,
    certificates: data.gallery?.length || 0,
    creative: data.creativePortfolio?.length || 0,
    resumes: data.resumes?.length || 0,
    messages: (data.contactMessages || data.messages || []).length,
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Navigation Segment */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Backup & Data Management</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                JSON Storage
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage authoritative Static Backups, export current state, or restore past snapshots.
            </p>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('static')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'static'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Static Backup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('github')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'github'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Sync (100% Static)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'general'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual Import / Export</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: STATIC BACKUP (FEATURED & NEAT) */}
      {/* ========================================================= */}
      {activeSubTab === 'static' && (
        <div className="space-y-6">
          {/* Static Backup Overview Card */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] space-y-6">
            {/* Header Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Static Backup Auto-Load Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Auto-Loads on Reload & Logo Click
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  This backup is loaded automatically on every visit, page reload, and when clicking <strong>"Dubbaka Sathwik"</strong> logo in the navbar.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadStaticBackupNow}
                  disabled={isLoadingStatic}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Reload active static backup into live page now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatic ? 'animate-spin' : ''}`} />
                  <span>Load Now</span>
                </button>

                <a
                  href="/api/cms/static-backup/download"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download</span>
                </a>
              </div>
            </div>

            {/* Status & Stats Bar */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Active File:</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-zinc-950 border border-emerald-500/30">
                      {staticBackupStats?.filename || 'static_backup.json'}
                    </span>
                    {staticBackupStats?.sizeFormatted && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        ({staticBackupStats.sizeFormatted})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Last updated:{' '}
                    <span className="font-mono text-zinc-300">
                      {staticBackupStats?.lastModified
                        ? new Date(staticBackupStats.lastModified).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
                        : 'Active'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Records Badges Grid */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                  📁 {staticBackupStats?.recordCounts?.projects ?? currentStats.projects} Projects
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                  🎓 {staticBackupStats?.recordCounts?.certificates ?? currentStats.certificates} Certs
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                  🗺️ {staticBackupStats?.recordCounts?.journey ?? currentStats.journey} Journey
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                  📄 {staticBackupStats?.recordCounts?.resumes ?? currentStats.resumes} Resumes
                </span>
              </div>
            </div>

            {/* 2-Column Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option A: Dropdown Selector */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      Option A: Select From Saved Snapshots
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {staticBackupFiles.length} Snapshot(s)
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Select a previously saved snapshot to designate as the active Static Backup:
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                      Snapshot Preset:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedStaticFileId}
                        onChange={(e) => {
                          setSelectedStaticFileId(e.target.value);
                          const fileItem = staticBackupFiles.find((f) => f.id === e.target.value || f.filename === e.target.value);
                          if (fileItem) {
                            handleSelectStaticBackupFromDropdown(fileItem);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none cursor-pointer appearance-none pr-8"
                      >
                        {staticBackupFiles.length > 0 ? (
                          staticBackupFiles.map((file) => (
                            <option key={file.id} value={file.id}>
                              {file.name} ({file.sizeFormatted})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="active_static">Current Active Static Backup (static_backup.json)</option>
                            <option value="cms_backup">CMS Disk Backup (cms_backup.json)</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsStatic}
                    disabled={isSavingStatic}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSavingStatic ? 'Saving Snapshot...' : 'Save Current State as Static Backup'}</span>
                  </button>
                </div>
              </div>

              {/* Option B: File Upload */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-sky-400" />
                      Option B: Upload `.json` Backup File
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      .json
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload a `.json` backup file to set as the active Static Backup:
                  </p>

                  <label className="block relative cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleStaticFileSelect}
                      className="sr-only"
                    />
                    <div className="p-3.5 rounded-xl bg-zinc-950 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 text-center space-y-1.5 transition-all">
                      <FileJson className="w-5 h-5 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-white truncate px-2">
                        {staticUploadFile ? staticUploadFile.name : 'Click to select `.json` file'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {staticUploadFile
                          ? `${(staticUploadFile.size / 1024).toFixed(2)} KB ready`
                          : 'Select or drop a portfolio backup file'}
                      </p>
                    </div>
                  </label>

                  {staticUploadError && (
                    <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{staticUploadError}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!staticUploadPreview || isSavingStatic}
                    onClick={handleUploadAndSetStaticBackup}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingStatic ? 'Setting Static Backup...' : 'Upload & Set as Static Backup'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB: GITHUB REPOSITORY SYNC (100% STATIC & ZERO DB) */}
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
                      <span>GitHub Repository Sync</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> 100% Static
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Synchronize all projects, milestones, certs, and photos directly to your GitHub repository with zero database dependency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchGithubStatus}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Check latest commit status"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Refresh Status</span>
                </button>

                <a
                  href={githubStatus?.repoUrl || 'https://github.com/DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Repo</span>
                </a>
              </div>
            </div>

            {/* Status & Repository Info Bar */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">Target Repository:</span>
                  <a
                    href={`https://github.com/${githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-emerald-400 hover:underline font-bold px-2 py-0.5 rounded bg-zinc-950 border border-emerald-500/30 flex items-center gap-1"
                  >
                    <Github className="w-3 h-3" />
                    <span>{githubStatus?.repo || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio'}</span>
                  </a>
                  <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-sky-400" />
                    <span>{githubStatus?.branch || 'main'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Latest Commit:</span>
                  <span className="font-mono text-zinc-300 font-semibold truncate max-w-md">
                    {githubStatus?.lastCommit || '93688b0 - feat: 100% static portfolio with organized public/images'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Git PAT Active</span>
                </div>
              </div>
            </div>

            {/* Sync Action Form */}
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Push Updated Portfolio to GitHub</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Stages all updated project JSON data (<code className="text-emerald-400 font-mono">src/seed_data.json</code>) and organized images (<code className="text-emerald-400 font-mono">public/images/</code>) and pushes a clean commit to your GitHub repository.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                    Commit Message (Optional):
                  </label>
                  <input
                    type="text"
                    value={customCommitMessage}
                    onChange={(e) => setCustomCommitMessage(e.target.value)}
                    placeholder="e.g. update: added new project screenshot and updated bio"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Zero secrets leaked. Secrets (<code className="text-zinc-300 font-mono">.env</code>) remain completely ignored by git.</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingGithub}
                    onClick={handleSyncGithub}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGithub ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGithub ? 'Pushing to GitHub...' : 'Push Now to GitHub Repository'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  📁 Physical Image Assets
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  All 82 photos reside in <code className="text-emerald-400 font-mono">public/images/</code> as genuine PNG/JPG files committed right inside your repository.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  ⚡ Zero Database Dependency
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  If MongoDB Atlas is ever disconnected or offline, the site never breaks or shows blank screens—it falls back instantly to local JSON files.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  🌐 100% Free Static Hosting
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  You can deploy this repository directly on GitHub Pages, Vercel, or Netlify with standard static SPA build (<code className="text-emerald-400 font-mono">npm run build</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: GENERAL IMPORT / EXPORT & DISK SNAPSHOTS */}
      {/* ========================================================= */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Download Live JSON */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Download className="w-4 h-4" />
                    <span>Export Live JSON Backup</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Live Memory
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Downloads a complete snapshot of all custom projects, milestones, certificates, creative designs, resumes, and inbox messages.
                </p>

                {/* Summary Box */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-mono text-zinc-400 block font-semibold">Live Snapshot Summary:</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.projects}</span>
                      <span className="text-zinc-500 text-[10px]">Projects</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.certificates}</span>
                      <span className="text-zinc-500 text-[10px]">Certificates</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.journey}</span>
                      <span className="text-zinc-500 text-[10px]">Journey</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.creative}</span>
                      <span className="text-zinc-500 text-[10px]">Creative</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.resumes}</span>
                      <span className="text-zinc-500 text-[10px]">Resumes</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">{currentStats.messages}</span>
                      <span className="text-zinc-500 text-[10px]">Messages</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Full JSON Backup
              </button>
            </div>

            {/* Card 2: Upload General Backup */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload & Restore General Backup</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    .json Format
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload any previously saved `.json` portfolio backup file to replace live cards and sync with MongoDB Atlas.
                </p>

                <label className="block relative cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <div className="p-3.5 rounded-xl bg-zinc-900 border-2 border-dashed border-sky-500/40 hover:border-sky-400 text-center space-y-1.5 transition-all">
                    <FileJson className="w-5 h-5 text-sky-400 mx-auto" />
                    <p className="text-xs font-bold text-white truncate px-2">
                      {selectedFile ? selectedFile.name : 'Click to select `.json` backup file'}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(2)} KB selected`
                        : 'Select or drop a `.json` backup file'}
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
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring...' : 'Restore Uploaded JSON'}</span>
              </button>
            </div>
          </div>

          {/* Disk Snapshot Recovery Card */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Server Disk Snapshots (`cms_backup.json`)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Persistent Disk
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              The server automatically maintains an active disk backup (`cms_backup.json`) whenever cards are edited.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">cms_backup.json</span>
                    {serverBackupInfo?.localDiskBackup && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
                        {serverBackupInfo.localDiskBackup.sizeFormatted}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Last modified:{' '}
                    <span className="font-mono text-zinc-300">
                      {serverBackupInfo?.localDiskBackup?.lastModified
                        ? new Date(serverBackupInfo.localDiskBackup.lastModified).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
                        : 'Active'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleRestoreFromDisk}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                  Restore Snapshot
                </button>
                <a
                  href="/api/cms/backup/download"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

