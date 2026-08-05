import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ArrowRight,
} from 'lucide-react';

export function BackupRestoreTab({
  showToast,
}: {
  showToast: (section: string, msg: string, db?: string) => void;
}) {
  const { data, updateData } = useCMS();
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [serverBackupInfo, setServerBackupInfo] = useState<any | null>(null);
  const [loadingServerInfo, setLoadingServerInfo] = useState(false);

  const fetchServerBackupInfo = async () => {
    setLoadingServerInfo(true);
    try {
      const res = await fetch('/api/cms/backups/list');
      const json = await res.json();
      if (json.success) {
        setServerBackupInfo(json);
      }
    } catch (err) {
      console.warn('Failed to load backup list:', err);
    } finally {
      setLoadingServerInfo(false);
    }
  };

  useEffect(() => {
    fetchServerBackupInfo();
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
      // Update local CMS context
      updateData(previewData);

      // Send to server to write cms_backup.json and sync MongoDB
      const res = await fetch('/api/cms/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const currentStats = {
    projects: data.projects?.length || 0,
    journey: data.journey?.length || 0,
    certificates: data.gallery?.length || 0,
    creative: data.creativePortfolio?.length || 0,
    resumes: data.resumes?.length || 0,
    messages: (data.contactMessages || data.messages || []).length,
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-zinc-950 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <HardDrive className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Database Backup & Instant Restore</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                JSON Engine v2.0
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Export full portfolio state to `.json` file or restore instantly from previous backups.
            </p>
          </div>
        </div>
        <button
          onClick={fetchServerBackupInfo}
          disabled={loadingServerInfo}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingServerInfo ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Grid: Download & Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Download Backup */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>1. Export & Download Backup</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                JSON File
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Downloads a complete snapshot of all custom projects, milestones, certificates, creative designs, resumes, and contact inbox messages.
            </p>

            {/* Current Snapshot Overview */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
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
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-[0.99]"
          >
            <Download className="w-4 h-4" /> Download Full JSON Backup
          </button>
        </div>

        {/* Card 2: Upload & Restore Backup */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>2. Upload & Restore Backup</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                .json Format
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload any previously saved `.json` portfolio backup file to replace current cards and sync directly with MongoDB Atlas.
            </p>

            {/* Dropzone / File Selector */}
            <label className="block relative cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="p-4 rounded-xl bg-zinc-900/90 border-2 border-dashed border-sky-500/40 hover:border-sky-400 text-center space-y-2 transition-all">
                <FileJson className="w-7 h-7 text-sky-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-white">
                    {selectedFile ? selectedFile.name : 'Click to select `.json` backup file'}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(2)} KB selected`
                      : 'Drag & drop or select from your computer'}
                  </p>
                </div>
              </div>
            </label>

            {parseError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview Summary if file is valid */}
            {previewData && (
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    Valid Portfolio JSON Detected
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Ready to Restore</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-300 space-y-1 pl-5">
                  <p>• Projects: {previewData.projects?.length || 0}</p>
                  <p>• Certificates / Awards: {previewData.gallery?.length || 0}</p>
                  <p>• Journey Milestones: {previewData.journey?.length || 0}</p>
                  <p>• Creative Items: {previewData.creativePortfolio?.length || 0}</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!previewData || isRestoring}
            onClick={handleRestoreUploadedData}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
            {isRestoring ? 'Restoring Database...' : 'Restore & Sync Uploaded JSON'}
          </button>
        </div>
      </div>

      {/* Auto-Recovery / Server Disk Snapshots */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>3. Server Auto-Recovery & Disk Snapshots</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            Automated Disk Store
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          The server automatically maintains an active disk backup (`cms_backup.json`) every time you edit cards. Even if browser localStorage is cleared, your data remains safely stored on disk.
        </p>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Primary Server File: cms_backup.json</span>
                {serverBackupInfo?.localDiskBackup && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
                    {serverBackupInfo.localDiskBackup.sizeFormatted}
                  </span>
                )}
              </h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
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
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
              Restore Server Snapshot
            </button>
            <a
              href="/api/cms/backup/download"
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
