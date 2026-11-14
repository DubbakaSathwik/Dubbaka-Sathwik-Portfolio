import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { EventItem } from '../../../types';
import { PhotoDropdownSelector } from '../../ui/photo-dropdown';
import { RichTextEditor } from '../../../lib/text-formatter';
import { SITE_CONFIG, getEventSlug } from '../../../config/seo';
import { sendTelegramConsoleLog } from '../../../utils/telegram';

interface EventsTabProps {
  onShowToast: (label: string) => void;
}

const DEFAULT_EVENT_CATEGORIES = [
  'Hackathons',
  'NSS Drives',
  'IEEE Workshops',
  'Tech Talks',
  'Media & Editing',
];

export function EventsTab({ onShowToast }: EventsTabProps) {
  const { data, authToken, addEventItem, updateEventItem, deleteEventItem } = useCMS();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoStatus, setSeoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Hackathons',
    customCategory: '',
    role: 'Team Captain & Full-Stack Engineer',
    date: new Date().toISOString().split('T')[0],
    displayDate: '',
    endDate: '',
    eventStatus: 'Upcoming' as 'Upcoming' | 'Past',
    venue: 'MVSR Engineering College, Hyderabad',
    summary: '',
    detailedDescription: '',
    highlightsInput: '',
    statsInput: '',
    photoUrlsInput: '/uploads/assets/static_asset_gallery_0_image_yrodqodp.jpg',
    videoUrl: '',
    registrationUrl: '',
    certificateUrl: '',
    relatedProjectId: '',
    featured: true,
    visibility: 'Published' as 'Published' | 'Draft',
    seoSlug: '',
    seoTitle: '',
    metaDescription: '',
    seoKeywordsInput: '',
    seoTldr: '',
  });

  const resetForm = () => {
    setEditingId(null);
    setSeoStatus(null);
    setForm({
      title: '',
      category: 'Hackathons',
      customCategory: '',
      role: 'Team Captain & Full-Stack Engineer',
      date: new Date().toISOString().split('T')[0],
      displayDate: '',
      endDate: '',
      eventStatus: 'Upcoming',
      venue: 'MVSR Engineering College, Hyderabad',
      summary: '',
      detailedDescription: '',
      highlightsInput: '',
      statsInput: '',
      photoUrlsInput: '/uploads/assets/static_asset_gallery_0_image_yrodqodp.jpg',
      videoUrl: '',
      registrationUrl: '',
      certificateUrl: '',
      relatedProjectId: '',
      featured: true,
      visibility: 'Published',
      seoSlug: '',
      seoTitle: '',
      metaDescription: '',
      seoKeywordsInput: '',
      seoTldr: '',
    });
  };

  const handleStartEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setSeoStatus(null);
    const isStandard = DEFAULT_EVENT_CATEGORIES.includes(ev.category);
    const photos =
      ev.images && ev.images.length > 0 ? ev.images.join('\n') : ev.coverImage || '';
    setForm({
      title: ev.title || '',
      category: isStandard ? ev.category : 'Hackathons',
      customCategory: isStandard ? '' : ev.category || '',
      role: ev.role || '',
      date: ev.date || '',
      displayDate: ev.displayDate || '',
      endDate: ev.endDate || '',
      eventStatus: ev.eventStatus === 'Upcoming' ? 'Upcoming' : 'Past',
      venue: ev.venue || '',
      summary: ev.summary || '',
      detailedDescription: ev.detailedDescription || '',
      highlightsInput: (ev.highlights || []).join('\n'),
      statsInput: (ev.stats || []).join(', '),
      photoUrlsInput: photos,
      videoUrl: ev.videoUrl || '',
      registrationUrl: ev.registrationUrl || '',
      certificateUrl: ev.certificateUrl || '',
      relatedProjectId: ev.relatedProjectId || '',
      featured: ev.featured ?? true,
      visibility: ev.visibility === 'Draft' ? 'Draft' : 'Published',
      seoSlug: ev.seo?.slug || ev.slug || '',
      seoTitle: ev.seo?.seoTitle || '',
      metaDescription: ev.seo?.metaDescription || '',
      seoKeywordsInput: Array.isArray(ev.seo?.keywords) ? ev.seo.keywords.join(', ') : '',
      seoTldr: ev.seo?.tldr || '',
    });
  };

  const handleGenerateSeo = async () => {
    if (!form.title || form.title.trim().length < 2) {
      setSeoStatus({ type: 'error', message: 'Enter an Event Title first to generate SEO metadata.' });
      return;
    }

    setIsGeneratingSeo(true);
    setSeoStatus(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/seo/generate-metadata', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'event',
          title: form.title,
          summary: form.summary,
          description: form.detailedDescription || form.summary,
          category: form.customCategory.trim() || form.category,
          tags: form.statsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          year: form.displayDate || form.date,
          venue: form.venue,
          role: form.role,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('SEO endpoint returned non-JSON response.');
      }
      const json = await res.json();
      if (!res.ok || !json.success || !json.metadata) {
        throw new Error(json?.error?.message || 'Failed to generate SEO metadata via Gemini');
      }

      const meta = json.metadata;
      setForm((prev) => ({
        ...prev,
        seoSlug: meta.slug || prev.seoSlug,
        seoTitle: meta.seoTitle || prev.seoTitle,
        metaDescription: meta.metaDescription || prev.metaDescription,
        seoKeywordsInput: Array.isArray(meta.keywords) ? meta.keywords.join(', ') : prev.seoKeywordsInput,
        seoTldr: meta.tldr || prev.seoTldr,
      }));
      setSeoStatus({
        type: 'success',
        message: 'Generated Event SEO & AI Search metadata with Gemini!',
      });
    } catch (err: any) {
      setSeoStatus({
        type: 'error',
        message: err?.message || 'Could not generate event metadata right now.',
      });
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const finalCategory = form.customCategory.trim() || form.category;
    const cleanSlug = (
      form.seoSlug.trim() ||
      form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    ).slice(0, 80);

    const photos = form.photoUrlsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
    const coverImage = photos[0] || '/uploads/assets/static_asset_gallery_0_image_yrodqodp.jpg';

    const highlights = form.highlightsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const stats = form.statsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedKeywords = form.seoKeywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const seoPayload =
      form.seoSlug.trim() ||
      form.seoTitle.trim() ||
      form.metaDescription.trim() ||
      parsedKeywords.length > 0 ||
      form.seoTldr.trim()
        ? {
            slug: cleanSlug || undefined,
            seoTitle: form.seoTitle.trim() || undefined,
            metaDescription: form.metaDescription.trim() || undefined,
            keywords: parsedKeywords.length > 0 ? parsedKeywords : undefined,
            tldr: form.seoTldr.trim() || undefined,
          }
        : undefined;

    const payload = {
      title: form.title.trim(),
      slug: cleanSlug,
      category: finalCategory,
      role: form.role.trim() || 'Participant',
      date: form.date.trim() || '2026-08-15',
      displayDate: form.displayDate.trim() || form.date.trim(),
      endDate: form.endDate.trim() || undefined,
      eventStatus: form.eventStatus,
      venue: form.venue.trim() || 'MVSR Engineering College, Hyderabad',
      summary: form.summary.trim(),
      detailedDescription: form.detailedDescription || form.summary,
      highlights,
      stats,
      coverImage,
      images: photos.length > 0 ? photos : [coverImage],
      videoUrl: form.videoUrl.trim() || undefined,
      registrationUrl: form.registrationUrl.trim() || undefined,
      certificateUrl: form.certificateUrl.trim() || undefined,
      relatedProjectId: form.relatedProjectId || undefined,
      featured: form.featured,
      visibility: form.visibility,
      seo: seoPayload,
    };

    if (editingId) {
      updateEventItem({ id: editingId, ...payload });
      onShowToast('Event Updated');
    } else {
      addEventItem(payload);
      onShowToast('Event Published');
    }
    resetForm();
  };

  const handleAnnounceTelegram = async (ev: EventItem) => {
    setAnnouncingId(ev.id);
    try {
      const fullUrl = `${SITE_CONFIG.baseUrl}/events/${getEventSlug(ev)}`;
      await sendTelegramConsoleLog(
        `Event Highlight: ${ev.eventStatus}`,
        `${ev.title}\nRole: ${ev.role} | Venue: ${ev.venue}\nURL: ${fullUrl}`,
        'success'
      );
      onShowToast('Event Telegram Alert Sent');
    } finally {
      setAnnouncingId(null);
    }
  };

  const events = data.events || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Events, Hackathons &amp; Workshops Studio</span>
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Showcase upcoming/past hackathons, NSS drives, IEEE sessions, calendar invites, and SEO Event schema.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
          >
            Cancel Edit &amp; Create New
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-mono font-bold text-emerald-400">
            {editingId ? 'Edit Event' : 'Add New Event / Workshop'}
          </h4>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, eventStatus: p.eventStatus === 'Upcoming' ? 'Past' : 'Upcoming' }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                form.eventStatus === 'Upcoming'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              Timeline: {form.eventStatus}
            </button>

            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, visibility: p.visibility === 'Draft' ? 'Published' : 'Draft' }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border cursor-pointer ${
                form.visibility === 'Published'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-amber-500/50 text-amber-300'
              }`}
            >
              {form.visibility === 'Published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{form.visibility}</span>
            </button>

            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, featured: !p.featured }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 border cursor-pointer ${
                form.featured
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{form.featured ? 'Featured' : 'Standard'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. IEEE Web Engineering Workshop"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Your Role *</label>
            <input
              type="text"
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. NSS Digital Co-Lead, Speaker, Team Lead"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Event Date (ISO YYYY-MM-DD)</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Display Date Label</label>
            <input
              type="text"
              value={form.displayDate}
              onChange={(e) => setForm({ ...form, displayDate: e.target.value })}
              placeholder="e.g. August 2026"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Venue / City</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Event Category</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DEFAULT_EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat, customCategory: '' })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer ${
                  form.category === cat && !form.customCategory
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type custom category..."
            value={form.customCategory}
            onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Summary *</label>
            <textarea
              rows={3}
              required
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Concise summary shown on Homepage & Insights cards..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Impact Stats (comma-separated)</label>
            <input
              type="text"
              value={form.statsInput}
              onChange={(e) => setForm({ ...form, statsInput: e.target.value })}
              placeholder="e.g. Top 4 Finalist, 120+ Attendees, 24-Hour Build"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white mb-2"
            />
            <label className="text-xs font-mono text-zinc-400 block mb-1">Key Contributions (one per line)</label>
            <textarea
              rows={2}
              value={form.highlightsInput}
              onChange={(e) => setForm({ ...form, highlightsInput: e.target.value })}
              placeholder="Led API integration..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>

        <RichTextEditor
          value={form.detailedDescription}
          onChange={(val) => setForm({ ...form, detailedDescription: val })}
          label="Detailed Event Story & Breakdown"
          placeholder="Full breakdown displayed on /events/[slug]..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhotoDropdownSelector
            label="Event Photos & Gallery"
            multilineMode={true}
            currentPhotos={form.photoUrlsInput.split('\n').map((s) => s.trim()).filter(Boolean)}
            onUpdatePhotoList={(list) =>
              setForm((p) => ({ ...p, photoUrlsInput: Array.from(new Set(list)).join('\n') }))
            }
          />
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Photo URLs (one per line)</label>
            <textarea
              rows={3}
              value={form.photoUrlsInput}
              onChange={(e) => setForm({ ...form, photoUrlsInput: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Registration / Event Link</label>
            <input
              type="text"
              value={form.registrationUrl}
              onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Recap Video Link</label>
            <input
              type="text"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Certificate Link</label>
            <input
              type="text"
              value={form.certificateUrl}
              onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Related Project</label>
            <select
              value={form.relatedProjectId}
              onChange={(e) => setForm({ ...form, relatedProjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            >
              <option value="">None</option>
              {(data.projects || []).map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SEO & Gemini AI Metadata */}
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h6 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>SEO, Google Event Schema &amp; AI Search Metadata</span>
              </h6>
            </div>
            <button
              type="button"
              onClick={handleGenerateSeo}
              disabled={isGeneratingSeo}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingSeo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Meta Data</span>
                </>
              )}
            </button>
          </div>

          {seoStatus && (
            <div
              className={`p-2.5 rounded-lg text-[11px] font-mono flex items-center gap-2 border ${
                seoStatus.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              {seoStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{seoStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">URL Slug (/events/...)</label>
              <input
                type="text"
                value={form.seoSlug}
                onChange={(e) => setForm({ ...form, seoSlug: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-emerald-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">SEO Page Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Keywords (comma-separated)</label>
            <input
              type="text"
              value={form.seoKeywordsInput}
              onChange={(e) => setForm({ ...form, seoKeywordsInput: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{editingId ? 'Save Event Changes' : 'Publish Event'}</span>
        </button>
      </form>

      {/* Saved Events */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Saved Events ({events.length})
        </h4>
        <div className="space-y-2.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold">{ev.eventStatus}</span>
                  <span className="text-zinc-500">·</span>
                  <span className={ev.visibility === 'Draft' ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                    {ev.visibility || 'Published'}
                  </span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{ev.category}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{ev.displayDate || ev.date}</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{ev.title}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAnnounceTelegram(ev)}
                  disabled={announcingId === ev.id}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{announcingId === ev.id ? 'Sending...' : 'Announce'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(ev)}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteEventItem(ev.id);
                    onShowToast('Event Deleted');
                  }}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
