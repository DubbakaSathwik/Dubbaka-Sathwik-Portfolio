import React, { useMemo, useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Cpu,
  Clock,
  Search,
  RefreshCw,
  Tag,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Lock,
  Save,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import type { VisitorLabel, VisitorRecord } from '../../../types';
import { triggerHumanVerificationTest } from '../../../utils/telemetry';

const LABEL_OPTIONS: { value: VisitorLabel; text: string; badgeClass: string }[] = [
  { value: 'unlabeled', text: 'Unlabeled', badgeClass: 'bg-zinc-900 text-zinc-400 border-zinc-800' },
  { value: 'myself', text: 'Myself', badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' },
  { value: 'test', text: 'Test', badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-500/40' },
  { value: 'company', text: 'Company / Recruiter', badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40' },
  { value: 'friends', text: 'Friends', badgeClass: 'bg-violet-950/60 text-violet-300 border-violet-500/40' },
  { value: 'other', text: 'Other', badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
];

function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${rem}s`;
  return `${rem}s`;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return 'Just now';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function VisitorsTab({
  showToast,
}: {
  showToast?: (sec: string, msg: string, db?: string) => void;
}) {
  const {
    visitors,
    visitorStats,
    refreshVisitors,
    updateVisitorLabel,
    deleteVisitorRecord,
  } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredVisitors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visitors.filter((v) => {
      if (labelFilter !== 'all' && v.label !== labelFilter) return false;
      if (classFilter !== 'all' && v.classification !== classFilter) return false;
      if (!q) return true;
      return (
        v.visitorId.toLowerCase().includes(q) ||
        v.browser.toLowerCase().includes(q) ||
        v.os.toLowerCase().includes(q) ||
        v.clientIp.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q) ||
        v.adminNotes.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
      );
    });
  }, [visitors, searchQuery, labelFilter, classFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshVisitors();
    setIsRefreshing(false);
    showToast?.('Visitors & Security', 'Synchronized visitor records and watch-time telemetry.', 'Telemetry');
  };

  const handleLabelChange = async (visitor: VisitorRecord, nextLabel: VisitorLabel) => {
    const draftNote =
      notesDraft[visitor.visitorId] !== undefined ? notesDraft[visitor.visitorId] : visitor.adminNotes;
    await updateVisitorLabel(visitor.visitorId, nextLabel, draftNote);
    showToast?.(
      'Visitor Label Saved',
      `Tagged ${visitor.visitorId} as "${LABEL_OPTIONS.find((l) => l.value === nextLabel)?.text || nextLabel}".`,
      'Visitors'
    );
  };

  const handleSaveNotes = async (visitor: VisitorRecord) => {
    const note = notesDraft[visitor.visitorId] ?? visitor.adminNotes;
    await updateVisitorLabel(visitor.visitorId, visitor.label, note);
    showToast?.('Visitor Notes Saved', `Updated notes for ${visitor.visitorId}.`, 'Visitors');
  };

  const handleDelete = async (visitorId: string) => {
    await deleteVisitorRecord(visitorId);
    showToast?.('Visitor Record Removed', `Deleted visitor ${visitorId}.`, 'Visitors');
  };

  const renderClassificationBadge = (v: VisitorRecord) => {
    if (v.classification === 'Bot') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-sky-950/60 text-sky-300 border border-sky-500/30 whitespace-nowrap">
          <Bot className="w-3.5 h-3.5" />
          <span>Bot (Crawler)</span>
        </span>
      );
    }
    if (v.classification === 'System') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-amber-950/60 text-amber-300 border border-amber-500/40 whitespace-nowrap">
          <Cpu className="w-3.5 h-3.5" />
          <span>System</span>
        </span>
      );
    }
    if (v.classification === 'Suspicious') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-rose-950/60 text-rose-300 border border-rose-500/40 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Suspicious</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{v.humanVerified ? 'Human (Verified)' : 'Human'}</span>
      </span>
    );
  };

  const renderDeviceIcon = (deviceType: string) => {
    const d = deviceType.toLowerCase();
    if (d.includes('mobile')) return <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    if (d.includes('tablet')) return <Tablet className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    return <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Visitors &amp; Security Shield</span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 tabular-nums">
              {visitorStats.totalUniqueVisitors} Unique IDs
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Silent background tracking with persistent Visitor IDs, active watch time, bot/system classification, and custom admin labels.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => triggerHumanVerificationTest()}
            className="px-3 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title='Preview the "I am not a bot" CAPTCHA verification modal'
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Test Human CAPTCHA</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Unique Visitors</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{visitorStats.totalUniqueVisitors}</p>
          <p className="text-[11px] font-mono text-zinc-500 tabular-nums">
            {visitorStats.totalVisits} total sessions
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Total Watch Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatDuration(visitorStats.totalWatchTimeSeconds)}
          </p>
          <p className="text-[11px] font-mono text-zinc-500 tabular-nums">
            Active visible engagement
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Humans vs Crawlers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {visitorStats.humanCount} <span className="text-sm font-normal text-zinc-500">/ {visitorStats.botCount} bots</span>
          </p>
          <p className="text-[11px] font-mono text-zinc-500">
            Search bots allowlisted
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Challenged / System</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {visitorStats.suspiciousCount + visitorStats.systemCount}
          </p>
          <p className="text-[11px] font-mono text-zinc-500 tabular-nums">
            {visitorStats.suspiciousCount} suspicious • {visitorStats.systemCount} system
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Visitor ID, IP, OS, Browser, Country, or Notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            aria-label="Filter by Visitor Label"
            className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono focus:border-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">All Labels ({visitors.length})</option>
            {LABEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.text}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Filter by Classification"
            className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono focus:border-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Human">Human</option>
            <option value="Bot">Bot (Crawler)</option>
            <option value="System">System</option>
            <option value="Suspicious">Suspicious</option>
          </select>
        </div>
      </div>

      {/* Visitors List */}
      {filteredVisitors.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No matching visitors recorded yet</p>
          <p className="text-xs font-mono text-zinc-500">
            Every unique visitor receives a persistent VIS-ID and watch-time tracking automatically without login prompts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisitors.map((v) => {
            const isExpanded = expandedId === v.visitorId;
            const currentNote =
              notesDraft[v.visitorId] !== undefined ? notesDraft[v.visitorId] : v.adminNotes;

            return (
              <div
                key={v.visitorId}
                className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden transition-colors hover:border-zinc-700"
              >
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Identity & Device Summary */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <code className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white whitespace-nowrap">
                        {v.visitorId}
                      </code>
                      {renderClassificationBadge(v)}
                      <span className="text-[11px] font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                        Visits: <strong className="text-zinc-200">{v.visitCount}</strong>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 tabular-nums whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(v.watchTimeSeconds)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                      {renderDeviceIcon(v.deviceType)}
                      <span className="text-zinc-300 font-medium">
                        {v.browser} on {v.os}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-mono text-[11px] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-zinc-500" />
                        {v.clientIp}
                        {v.country && v.country !== 'Unknown' ? ` (${v.country})` : ''}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        Last active: {formatTimestamp(v.lastSeenAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right Controls: Label Dropdown + Expand + Delete */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-zinc-500" />
                      <select
                        value={v.label}
                        onChange={(e) => handleLabelChange(v, e.target.value as VisitorLabel)}
                        aria-label={`Label for ${v.visitorId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        {LABEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : v.visitorId)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(v.visitorId)}
                      title="Delete visitor record"
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Inspector (Matches Telegram Intelligence + Admin Notes) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 border-t border-zinc-900 bg-zinc-900/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Safety &amp; Verification</span>
                        <p className="text-zinc-200">
                          Status: <strong>{v.safetyStatus}</strong> • Risk:{' '}
                          <strong className="tabular-nums">{v.riskScore}/100</strong>
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          CAPTCHA Gate: {v.challengeStatus}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Environment &amp; Screen</span>
                        <p className="text-zinc-200 truncate">{v.screenRes}</p>
                        <p className="text-zinc-400 text-[11px] truncate">
                          {v.timezone} ({v.language})
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Referrer &amp; First Seen</span>
                        <p className="text-zinc-200 truncate">{v.referrer || 'Direct Visit'}</p>
                        <p className="text-zinc-400 text-[11px]">
                          First seen: {formatTimestamp(v.firstSeenAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase block">Security Signals</span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {(v.securitySignals && v.securitySignals.length > 0
                            ? v.securitySignals
                            : ['Normal Browser Behavior']
                          ).join(' • ')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase block">Pages Visited</span>
                        <p className="text-emerald-300 text-[11px] break-all">
                          {(v.pagesVisited && v.pagesVisited.length > 0 ? v.pagesVisited : ['/']).join(', ')}
                        </p>
                      </div>
                    </div>

                    {v.userAgent && (
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase block">User-Agent</span>
                        <code className="text-[11px] text-zinc-400 break-all block">{v.userAgent}</code>
                      </div>
                    )}

                    {/* Admin Notes Editor */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={500}
                        placeholder="Add private admin note (e.g. Recruiter from Acme, My iPhone 15, Automated QA check)..."
                        value={currentNote}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({ ...prev, [v.visitorId]: e.target.value }))
                        }
                        className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(v)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
