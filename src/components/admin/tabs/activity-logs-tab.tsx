import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Send,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Laptop,
  Bot,
  Bell,
  BellOff,
  Eye,
  Mail,
  FileText,
  Edit3,
  Power,
  Check,
} from 'lucide-react';
import {
  sendTelegramConsoleLog,
  getTelegramSettings,
  updateTelegramSettings,
  testTelegramBot,
  flushConsoleTimerLogs,
  TelegramSettings,
} from '../../../utils/telegram';

export interface ActivityLogItem {
  id: string;
  event: string;
  details: string;
  category: 'visit' | 'cms_update' | 'download' | 'contact' | 'security' | 'system';
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  clientIp?: string;
  metadata?: Record<string, any>;
}

export function ActivityLogsTab({
  showToast,
}: {
  showToast: (section: string, msg: string, db?: string) => void;
}) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [autoPoll, setAutoPoll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [sendingToTelegramId, setSendingToTelegramId] = useState<string | null>(null);

  const [tgSettings, setTgSettings] = useState<TelegramSettings>({
    masterEnabled: true,
    websiteVisit: true,
    contactInbox: true,
    cmsUpdates: true,
    consoleAlerts: true,
    resumeDownloads: true,
    consoleTimerEnabled: false,
    consoleTimerIntervalMinutes: 2,
  });
  const [testingBot, setTestingBot] = useState(false);
  const [isFlushingTimer, setIsFlushingTimer] = useState(false);
  const [pendingTimerCount, setPendingTimerCount] = useState(0);
  const [customIntervalInput, setCustomIntervalInput] = useState('2');
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const fetchTimerStatus = async () => {
    try {
      const res = await fetch('/api/telegram/timer/status');
      const data = await res.json();
      if (data.success) {
        setPendingTimerCount(data.pendingCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    getTelegramSettings().then((s) => {
      setTgSettings(s);
      if (s.consoleTimerIntervalMinutes) {
        setCustomIntervalInput(String(s.consoleTimerIntervalMinutes));
        const presets = [1, 2, 3, 5, 10];
        if (!presets.includes(s.consoleTimerIntervalMinutes)) {
          setIsCustomSelected(true);
        }
      }
    });
    fetchTimerStatus();
    const timerInterval = setInterval(fetchTimerStatus, 3000);
    return () => clearInterval(timerInterval);
  }, []);

  const handleSetConsoleTimer = async (enabled: boolean, minutes?: number) => {
    const targetMins = minutes !== undefined ? minutes : tgSettings.consoleTimerIntervalMinutes || 2;
    const newSettings = {
      ...tgSettings,
      consoleTimerEnabled: enabled,
      consoleTimerIntervalMinutes: targetMins,
    };
    setTgSettings(newSettings);

    const res = await updateTelegramSettings({
      consoleTimerEnabled: enabled,
      consoleTimerIntervalMinutes: targetMins,
    });

    if (res.success) {
      showToast(
        'Console Timer Updated',
        enabled
          ? `Console Timer ENABLED. Grouping logs every ${targetMins} min(s) during CMS edits.`
          : 'Console Timer DISABLED. Logs will be sent in instant real-time mode.',
        'Server Setting'
      );
    } else {
      showToast('Console Timer Error', 'Failed to update console timer setting', 'Error');
    }
  };

  const handleManualFlush = async () => {
    setIsFlushingTimer(true);
    const res = await flushConsoleTimerLogs();
    if (res.success) {
      setPendingTimerCount(0);
      showToast(
        'Console Timer Flushed',
        res.count > 0 ? `Sent ${res.count} grouped log(s) to Telegram` : 'Buffer is empty. No pending logs to send.',
        'Telegram API'
      );
    } else {
      showToast('Flush Error', res.message, 'Error');
    }
    setIsFlushingTimer(false);
  };

  useEffect(() => {
    getTelegramSettings().then((s) => setTgSettings(s));
  }, []);

  const handleToggleSetting = async (key: keyof TelegramSettings) => {
    const updatedValue = !tgSettings[key];
    const newSettings = { ...tgSettings, [key]: updatedValue };
    setTgSettings(newSettings);

    const labelMap: Record<keyof TelegramSettings, string> = {
      masterEnabled: 'Master Telegram Bot Switch',
      websiteVisit: 'Website Visit / Reload Notifications',
      contactInbox: 'Contact Inbox Message Alerts',
      cmsUpdates: 'CMS Content Update Notifications',
      consoleAlerts: 'Console & System Error Alerts',
      resumeDownloads: 'Resume / File Download Alerts',
      consoleTimerEnabled: 'Console Log Timer Mode',
      consoleTimerIntervalMinutes: 'Console Timer Interval Minutes',
    };

    const res = await updateTelegramSettings({ [key]: updatedValue });
    if (res.success) {
      showToast(
        'Telegram Toggle Updated',
        `${labelMap[key]} is now ${updatedValue ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`,
        'Server Memory & Disk'
      );
    } else {
      showToast('Toggle Update Error', 'Failed to update Telegram setting', 'Error');
    }
  };

  const handleTestBotClick = async () => {
    setTestingBot(true);
    const res = await testTelegramBot();
    if (res.success) {
      showToast('Telegram Bot Operational', res.message, 'Telegram API');
    } else {
      showToast('Telegram Bot Error', res.message, 'Error');
    }
    setTestingBot(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (!autoPoll) return;
    const interval = setInterval(fetchLogs, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, [autoPoll]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity console logs?')) return;
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        showToast('Console Logs Cleared', 'All activity log entries were wiped successfully', 'Memory & Disk');
        fetchLogs();
      }
    } catch (err) {
      showToast('Clear Failed', 'Failed to clear console logs', 'Error');
    }
  };

  const handleForwardToTelegram = async (log: ActivityLogItem) => {
    setSendingToTelegramId(log.id);
    const success = await sendTelegramConsoleLog(
      log.event,
      `${log.details}\n\nCategory: ${log.category.toUpperCase()}\nLevel: ${log.level.toUpperCase()}\nClient IP: ${log.clientIp || 'Unknown'}`,
      log.level
    );

    if (success) {
      showToast('Forwarded to Telegram', `Sent log "${log.event}" to @SathwikPortfolioNotification_bot`, 'Telegram API');
    } else {
      showToast('Telegram Send Error', 'Failed to forward log to Telegram', 'Error');
    }
    setSendingToTelegramId(null);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      log.event.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.clientIp && log.clientIp.toLowerCase().includes(q)) ||
      (log.metadata?.browser && log.metadata.browser.toLowerCase().includes(q)) ||
      (log.metadata?.os && log.metadata.os.toLowerCase().includes(q));

    return matchesCategory && matchesLevel && matchesQuery;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return {
          color: 'bg-red-950 text-red-400 border-red-500/40',
          icon: ShieldAlert,
          label: 'ERROR',
        };
      case 'warning':
        return {
          color: 'bg-amber-950 text-amber-400 border-amber-500/40',
          icon: AlertTriangle,
          label: 'WARNING',
        };
      case 'success':
        return {
          color: 'bg-emerald-950 text-emerald-400 border-emerald-500/40',
          icon: CheckCircle2,
          label: 'SUCCESS',
        };
      default:
        return {
          color: 'bg-sky-950 text-sky-400 border-sky-500/40',
          icon: Info,
          label: 'INFO',
        };
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'Mobile') return Smartphone;
    if (deviceType === 'Tablet') return Tablet;
    return Laptop;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/80 via-zinc-950 to-zinc-950 border border-sky-500/40 shadow-[0_0_25px_rgba(14,165,233,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-900/60 border border-sky-500/50 text-sky-400 shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Activity & Audit Console Log</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Live Monitor ({logs.length} events)
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tracks visitor opens/reloads, CMS edits, resume downloads, inbox messages, and security audits in real-time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoPoll
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoPoll ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            {autoPoll ? 'Live 5s Sync' : 'Sync Paused'}
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* CONSOLE TIMER CONTROL CARD */}
      <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Console Timer (Grouped Log Mode)</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    tgSettings.consoleTimerEnabled
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {tgSettings.consoleTimerEnabled
                    ? `🟡 ACTIVE: Every ${tgSettings.consoleTimerIntervalMinutes || 2}m`
                    : '⚪ REALTIME INSTANT'}
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prevents Telegram spam during CMS editing by buffering console logs and sending grouped summaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleManualFlush}
              disabled={isFlushingTimer}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Send className={`w-3.5 h-3.5 ${isFlushingTimer ? 'animate-spin' : ''}`} />
              {isFlushingTimer ? 'Flushing...' : `Flush Now (${pendingTimerCount} pending)`}
            </button>

            <button
              type="button"
              onClick={() => handleSetConsoleTimer(!tgSettings.consoleTimerEnabled)}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                tgSettings.consoleTimerEnabled
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/50 shadow-amber-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Timer Mode: {tgSettings.consoleTimerEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Timer Interval Presets & Custom Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-zinc-400 mr-1">Interval:</span>
            {[1, 2, 3, 5, 10].map((mins) => {
              const isSelected =
                tgSettings.consoleTimerEnabled &&
                !isCustomSelected &&
                tgSettings.consoleTimerIntervalMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setIsCustomSelected(false);
                    setCustomIntervalInput(String(mins));
                    handleSetConsoleTimer(true, mins);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}

            {/* Custom Option Toggle */}
            <button
              type="button"
              onClick={() => setIsCustomSelected(true)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                isCustomSelected
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              Custom Time
            </button>
          </div>

          {/* Custom Time Input Field */}
          {isCustomSelected && (
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-amber-500/40 p-1.5 rounded-xl">
              <span className="text-xs font-mono text-amber-300 pl-1.5">Custom (mins):</span>
              <input
                type="number"
                min="0.1"
                max="120"
                step="0.5"
                value={customIntervalInput}
                onChange={(e) => setCustomIntervalInput(e.target.value)}
                className="w-16 px-2 py-1 rounded bg-black border border-zinc-700 text-amber-300 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = parseFloat(customIntervalInput);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleSetConsoleTimer(true, parsed);
                  } else {
                    showToast('Invalid Time', 'Please enter a valid interval in minutes', 'Error');
                  }
                }}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold font-mono transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Notification Control Center & Toggles */}
      <div className="p-5 rounded-2xl bg-zinc-950/90 border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.12)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-400 shrink-0 shadow-[0_0_12px_rgba(14,165,233,0.25)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Telegram Notification Control Center</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    tgSettings.masterEnabled
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-950 text-red-400 border-red-500/30'
                  }`}
                >
                  {tgSettings.masterEnabled
                    ? `${Object.entries(tgSettings).filter(([k, v]) => k !== 'masterEnabled' && v === true).length}/5 Active`
                    : 'Muted'}
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bot: <span className="font-mono text-sky-300">@SathwikPortfolioNotification_bot</span> | Chat ID:{' '}
                <span className="font-mono text-zinc-300">5869091520</span>
              </p>
            </div>
          </div>

          {/* Master Switch & Test Bot Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleTestBotClick}
              disabled={testingBot}
              className="px-3.5 py-1.5 rounded-xl bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Send className={`w-3.5 h-3.5 ${testingBot ? 'animate-bounce' : ''}`} />
              {testingBot ? 'Testing...' : 'Test Bot'}
            </button>

            <button
              type="button"
              onClick={() => handleToggleSetting('masterEnabled')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                tgSettings.masterEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Master Switch: {tgSettings.masterEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Individual Notification Type Toggle Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Website Reload / Visit */}
          <div
            onClick={() => handleToggleSetting('websiteVisit')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              tgSettings.masterEnabled && tgSettings.websiteVisit
                ? 'bg-sky-950/40 border-sky-500/40 hover:border-sky-400/60 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tgSettings.masterEnabled && tgSettings.websiteVisit
                    ? 'bg-sky-900/60 text-sky-300 border border-sky-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Website Visit / Reload</h5>
                <p className="text-[10px] text-zinc-400">Page opens & reloads</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                tgSettings.masterEnabled && tgSettings.websiteVisit
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tgSettings.masterEnabled && tgSettings.websiteVisit
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {tgSettings.masterEnabled && tgSettings.websiteVisit ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* 2. Contact Form Inbox */}
          <div
            onClick={() => handleToggleSetting('contactInbox')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              tgSettings.masterEnabled && tgSettings.contactInbox
                ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tgSettings.masterEnabled && tgSettings.contactInbox
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Contact Form Inbox</h5>
                <p className="text-[10px] text-zinc-400">Visitor messages</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                tgSettings.masterEnabled && tgSettings.contactInbox
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tgSettings.masterEnabled && tgSettings.contactInbox
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {tgSettings.masterEnabled && tgSettings.contactInbox ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* 3. Portfolio CMS Edits */}
          <div
            onClick={() => handleToggleSetting('cmsUpdates')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              tgSettings.masterEnabled && tgSettings.cmsUpdates
                ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tgSettings.masterEnabled && tgSettings.cmsUpdates
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">CMS Content Saved</h5>
                <p className="text-[10px] text-zinc-400">Portfolio database edits</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                tgSettings.masterEnabled && tgSettings.cmsUpdates
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tgSettings.masterEnabled && tgSettings.cmsUpdates
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {tgSettings.masterEnabled && tgSettings.cmsUpdates ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* 4. Resume & Document Downloads */}
          <div
            onClick={() => handleToggleSetting('resumeDownloads')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              tgSettings.masterEnabled && tgSettings.resumeDownloads
                ? 'bg-purple-950/40 border-purple-500/40 hover:border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tgSettings.masterEnabled && tgSettings.resumeDownloads
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Resume Downloads</h5>
                <p className="text-[10px] text-zinc-400">Visitor PDF downloads</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                tgSettings.masterEnabled && tgSettings.resumeDownloads
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tgSettings.masterEnabled && tgSettings.resumeDownloads
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {tgSettings.masterEnabled && tgSettings.resumeDownloads ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* 5. Console & System Alerts */}
          <div
            onClick={() => handleToggleSetting('consoleAlerts')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              tgSettings.masterEnabled && tgSettings.consoleAlerts
                ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  tgSettings.masterEnabled && tgSettings.consoleAlerts
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-500/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Console & System Errors</h5>
                <p className="text-[10px] text-zinc-400">Warnings & errors</p>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                tgSettings.masterEnabled && tgSettings.consoleAlerts
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tgSettings.masterEnabled && tgSettings.consoleAlerts
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {tgSettings.masterEnabled && tgSettings.consoleAlerts ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs by IP, event title, browser, OS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-sky-500/50 outline-none font-mono"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono outline-none focus:border-sky-500/50 cursor-pointer"
          >
            <option value="all">Category: All ({logs.length})</option>
            <option value="visit">Visits & Reloads ({logs.filter((l) => l.category === 'visit').length})</option>
            <option value="cms_update">CMS Updates ({logs.filter((l) => l.category === 'cms_update').length})</option>
            <option value="contact">Inbox Submissions ({logs.filter((l) => l.category === 'contact').length})</option>
            <option value="download">Downloads ({logs.filter((l) => l.category === 'download').length})</option>
            <option value="security">Security & Auth ({logs.filter((l) => l.category === 'security').length})</option>
          </select>

          {/* Level Dropdown */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono outline-none focus:border-sky-500/50 cursor-pointer"
          >
            <option value="all">Level: All</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Logs Stream */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <Terminal className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-bold">No matching activity console logs found</p>
            <p className="text-xs text-zinc-600 font-mono">
              Events like site visits, CMS edits, or resume downloads will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getLevelBadge(log.level);
            const BadgeIcon = badge.icon;
            const isExpanded = expandedLogId === log.id;
            const DeviceIcon = getDeviceIcon(log.metadata?.deviceType);
            const istTime = new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            return (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
              >
                {/* Header Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shrink-0 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                      {log.category}
                    </span>

                    <h5 className="text-xs sm:text-sm font-bold text-white truncate min-w-0">
                      {log.event}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{istTime} IST</span>
                  </div>
                </div>

                {/* Main Details */}
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {log.details}
                </p>

                {/* Quick Metadata Pill Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-900 gap-2 flex-wrap text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    {log.clientIp && (
                      <span className="flex items-center gap-1 text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                        <Globe className="w-3 h-3" /> {log.clientIp}
                      </span>
                    )}

                    {log.metadata?.deviceType && (
                      <span className="flex items-center gap-1 text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        <DeviceIcon className="w-3 h-3 text-emerald-400" />
                        {log.metadata.deviceType}
                      </span>
                    )}

                    {log.metadata?.browser && (
                      <span className="text-zinc-400">
                        {log.metadata.browser} on {log.metadata.os || 'OS'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingToTelegramId === log.id}
                      onClick={() => handleForwardToTelegram(log)}
                      className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {sendingToTelegramId === log.id ? 'Sending...' : 'Send to Telegram'}
                    </button>

                    {log.metadata && (
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Toggle Detailed Metadata"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Detailed Metadata */}
                <AnimatePresence>
                  {isExpanded && log.metadata && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300"
                    >
                      <span className="text-[10px] font-bold text-zinc-500 block uppercase">Full Telemetry Metadata:</span>
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 text-[11px]">
                          <span className="text-sky-400 font-bold min-w-[100px]">{k}:</span>
                          <span className="text-zinc-200 break-all">{String(v)}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
