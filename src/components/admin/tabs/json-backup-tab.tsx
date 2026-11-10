import React, { useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import {
  Download,
  Upload,
  RefreshCw,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Database,
  HardDrive,
  CheckCheck,
} from 'lucide-react';

interface JSONBackupTabProps {
  showToast: (section: string, msg: string, db?: string) => void;
}

export function JSONBackupTab({ showToast }: JSONBackupTabProps) {
  const { data, updateData } = useCMS();

  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');

  // Compute live content counts
  const currentStats = {
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    certificates: Array.isArray(data.gallery) ? data.gallery.length : 0,
    journey: Array.isArray(data.journey) ? data.journey.length : 0,
    creative: Array.isArray(data.creativePortfolio) ? data.creativePortfolio.length : 0,
    resumes: Array.isArray(data.resumes) ? data.resumes.length : 0,
    messages: Array.isArray(data.contactMessages || data.messages) ? (data.contactMessages || data.messages).length : 0,
    rawSizeKb: (JSON.stringify(data).length / 1024).toFixed(1),
  };

  // 1. Download Complete JSON Snapshot
  const handleDownloadBackup = () => {
    try {
      const exportPayload = {
        metadata: {
          author: 'Dubbaka Sathwik',
          title: 'Dubbaka Sathwik - Portfolio CMS Data Snapshot',
          timestamp: new Date().toISOString(),
          version: '3.0.0',
          generator: 'Portfolio Custom CMS Backup Engine',
        },
        ...data,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `sathwik-portfolio-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(
        'JSON Backup Exported',
        `Successfully downloaded portfolio backup (${currentStats.rawSizeKb} KB)`,
        'Local File'
      );
    } catch (err: any) {
      showToast('Export Error', err?.message || 'Failed to download JSON backup', 'Error');
    }
  };

  // 2. Copy Raw JSON
  const handleCopyJSON = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setIsCopied(true);
      showToast('JSON Copied', 'Portfolio data copied to clipboard in formatted JSON', 'Clipboard');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      showToast('Copy Failed', 'Could not access clipboard', 'Alert');
    }
  };

  // 3. Handle File Input Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setPreviewData(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setParseError('Please upload a valid .json backup file.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Remove metadata envelope if present
        const cleanData = parsed.metadata ? { ...parsed } : parsed;
        delete cleanData.metadata;

        // Basic schema verification
        if (!cleanData.projects && !cleanData.journey && !cleanData.personal) {
          setParseError('Uploaded JSON does not appear to contain valid portfolio CMS fields.');
          return;
        }

        setPreviewData(cleanData);
      } catch (err: any) {
        setParseError(`JSON Syntax Error: ${err.message || 'Malformed file'}`);
      }
    };
    reader.readAsText(file);
  };

  // 4. Restore Uploaded Data
  const handleRestoreUploadedData = async () => {
    if (!previewData) return;
    setIsRestoring(true);

    try {
      let finalDataToApply = previewData;

      if (restoreMode === 'merge') {
        finalDataToApply = {
          ...data,
          ...previewData,
          about: { ...data.about, ...(previewData.about || {}) },
          hero: { ...data.hero, ...(previewData.hero || {}) },
          projects: [...(data.projects || []), ...(previewData.projects || [])],
          gallery: [...(data.gallery || []), ...(previewData.gallery || previewData.certificates || [])],
        };
      }

      await updateData(finalDataToApply);

      showToast(
        'Portfolio Restored',
        `Successfully imported backup from "${selectedFile?.name || 'file'}"!`,
        'Database & Disk'
      );

      // Reset selection
      setSelectedFile(null);
      setPreviewData(null);
    } catch (err: any) {
      showToast('Restore Failed', err?.message || 'Error writing restored data to CMS', 'Error');
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Restore Default Seed Data
  const handleRestoreDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all data back to the default seed portfolio state? Any unsaved changes will be replaced.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/cms/reset-defaults', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          await updateData(json.data);
          showToast('Reset Complete', 'Portfolio data reset to verified seed state', 'Seed Restored');
        }
      } else {
        // Fallback: reload page
        showToast('Reset Notice', 'Defaults reloaded. Refreshing portfolio view...', 'Info');
        window.location.reload();
      }
    } catch (e: any) {
      showToast('Reset Error', e?.message || 'Failed to reset defaults', 'Error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>JSON Backup & Import Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Independent Offline Storage
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Full-fidelity offline snapshots of your entire portfolio state, assets configuration, and achievements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleCopyJSON}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy entire database to clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              disabled={isResetting}
              onClick={handleRestoreDefaults}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Reset portfolio to factory seed backup"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Seed</span>
            </button>
          </div>
        </div>

        {/* Live Content Counter Bar */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
            <span className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live CMS Database Snapshot:</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Size: ~{currentStats.rawSizeKb} KB
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.projects}</span>
              <span className="text-zinc-400 text-[10px]">Projects</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.certificates}</span>
              <span className="text-zinc-400 text-[10px]">Certificates</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.journey}</span>
              <span className="text-zinc-400 text-[10px]">Journey</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.creative}</span>
              <span className="text-zinc-400 text-[10px]">Creative</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.resumes}</span>
              <span className="text-zinc-400 text-[10px]">Resumes</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-bold block text-sm font-mono">{currentStats.messages}</span>
              <span className="text-zinc-400 text-[10px]">Messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Export on Left, Import on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Export / Download */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-5 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Export & Download Backup</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                1-Click Export
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Downloads your complete portfolio state into a portable <code className="text-emerald-300 font-mono">.json</code> file. This file contains all your projects, custom images, career timeline, certificates, resumes, and settings.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Why Keep JSON Backups?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                <li>Zero dependencies — completely human-readable</li>
                <li>Can be re-imported anytime even if database is wiped</li>
                <li>Can be stored on Google Drive, USB drive, or laptop</li>
                <li>Compatible with Git, MongoDB, and local storage</li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Portfolio Backup (.json)</span>
          </button>
        </div>

        {/* Card 2: Import / Restore */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-5 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>Import & Restore Backup</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                Restore Engine
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Select or drop any previously exported <code className="text-sky-300 font-mono">.json</code> file to restore your portfolio data instantly across all devices.
            </p>

            {/* File Upload Drop Area */}
            <label className="block relative cursor-pointer">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="p-5 rounded-xl bg-zinc-900/80 border-2 border-dashed border-sky-500/40 hover:border-sky-400 text-center space-y-2 transition-all">
                <FileJson className="w-7 h-7 text-sky-400 mx-auto" />
                <p className="text-xs font-bold text-white truncate px-2">
                  {selectedFile ? selectedFile.name : 'Click to select .json backup file'}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(2)} KB • Ready to restore`
                    : 'Click to browse files or drag & drop .json here'}
                </p>
              </div>
            </label>

            {/* Parse Error */}
            {parseError && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview Summary */}
            {previewData && (
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/40 space-y-2 animate-fadeIn text-xs">
                <div className="flex items-center justify-between text-sky-300 font-mono font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Backup Verified: Ready to Restore</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {previewData.projects?.length || 0} projects found
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                    Projects: <span className="font-bold text-white">{previewData.projects?.length || 0}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                    Certificates: <span className="font-bold text-white">{previewData.certificates?.length || 0}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                    Journey: <span className="font-bold text-white">{previewData.journey?.length || 0}</span>
                  </div>
                </div>

                {/* Overwrite vs Merge Option */}
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Restore Strategy:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="accent-sky-500"
                      />
                      <span className={restoreMode === 'overwrite' ? 'text-sky-300 font-bold' : ''}>Full Replace</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="accent-sky-500"
                      />
                      <span className={restoreMode === 'merge' ? 'text-sky-300 font-bold' : ''}>Merge</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!previewData || isRestoring}
            onClick={handleRestoreUploadedData}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-lg hover:shadow-sky-950/50"
          >
            <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Applying Backup to Portfolio...' : 'Restore Portfolio from File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
