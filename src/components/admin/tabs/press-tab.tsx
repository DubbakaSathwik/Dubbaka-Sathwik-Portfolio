import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useCMS } from '../../../context/CMSContext';
import { PressMention } from '../../../types';
import { PhotoDropdownSelector } from '../../ui/photo-dropdown';
import { SITE_CONFIG, getPressSlug } from '../../../config/seo';
import { sendTelegramConsoleLog } from '../../../utils/telegram';

interface PressTabProps {
  onShowToast: (label: string) => void;
}

const DEFAULT_PRESS_CATEGORIES = [
  'Competitions & Awards',
  'Press & Media',
  'Developer Profiles',
  'Fellowships & Spotlights',
  'College & Community',
];

export function PressTab({ onShowToast }: PressTabProps) {
  const { data, authToken, addPressMention, updatePressMention, deletePressMention } = useCMS();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoStatus, setSeoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    sourceName: '',
    externalUrl: '',
    category: 'Competitions & Awards',
    customCategory: '',
    date: '2026',
    summary: '',
    detailedNotes: '',
    highlightsInput: '',
    coverImage: '/uploads/assets/static_asset_projects_0_thumbnail_hc35tyd7.png',
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
      sourceName: '',
      externalUrl: '',
      category: 'Competitions & Awards',
      customCategory: '',
      date: '2026',
      summary: '',
      detailedNotes: '',
      highlightsInput: '',
      coverImage: '/uploads/assets/static_asset_projects_0_thumbnail_hc35tyd7.png',
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

  const handleStartEdit = (item: PressMention) => {
    setEditingId(item.id);
    setSeoStatus(null);
    const isStandard = DEFAULT_PRESS_CATEGORIES.includes(item.category);
    setForm({
      title: item.title || '',
      sourceName: item.sourceName || '',
      externalUrl: item.externalUrl || '',
      category: isStandard ? item.category : 'Press & Media',
      customCategory: isStandard ? '' : item.category || '',
      date: item.date || '2026',
      summary: item.summary || '',
      detailedNotes: item.detailedNotes || '',
      highlightsInput: (item.highlights || []).join('\n'),
      coverImage: item.coverImage || '/uploads/assets/static_asset_projects_0_thumbnail_hc35tyd7.png',
      relatedProjectId: item.relatedProjectId || '',
      featured: item.featured ?? true,
      visibility: item.visibility === 'Draft' ? 'Draft' : 'Published',
      seoSlug: item.seo?.slug || item.slug || '',
      seoTitle: item.seo?.seoTitle || '',
      metaDescription: item.seo?.metaDescription || '',
      seoKeywordsInput: Array.isArray(item.seo?.keywords) ? item.seo.keywords.join(', ') : '',
      seoTldr: item.seo?.tldr || '',
    });
  };

  const handleGenerateSeo = async () => {
    if (!form.title || form.title.trim().length < 2) {
      setSeoStatus({ type: 'error', message: 'Enter a Headline / Title first to generate SEO metadata.' });
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
          type: 'press',
          title: form.title,
          summary: form.summary,
          description: form.detailedNotes || form.summary,
          category: form.customCategory.trim() || form.category,
          tags: [form.sourceName, form.category].filter(Boolean),
          year: form.date,
          sourceName: form.sourceName,
          externalUrl: form.externalUrl,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('SEO endpoint returned non-JSON response.');
      }
      const json = await res.json();
      if (!res.ok || !json.success || !json.metadata) {
        throw new Error(json?.error?.message || 'Failed to generate metadata via Gemini');
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
        message: 'Generated Google & AI Search metadata! Review or edit below.',
      });
    } catch (err: any) {
      setSeoStatus({
        type: 'error',
        message: err?.message || 'Could not generate metadata right now.',
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

    const highlights = form.highlightsInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const keywords = form.seoKeywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const seoPayload =
      form.seoSlug.trim() ||
      form.seoTitle.trim() ||
      form.metaDescription.trim() ||
      keywords.length > 0 ||
      form.seoTldr.trim()
        ? {
            slug: cleanSlug,
            seoTitle: form.seoTitle.trim() || undefined,
            metaDescription: form.metaDescription.trim() || undefined,
            keywords: keywords.length > 0 ? keywords : undefined,
            tldr: form.seoTldr.trim() || undefined,
          }
        : undefined;

    const payload: Omit<PressMention, 'id'> = {
      title: form.title.trim(),
      slug: cleanSlug,
      sourceName: form.sourceName.trim() || 'External Publication',
      externalUrl: form.externalUrl.trim(),
      category: finalCategory,
      date: form.date.trim() || '2026',
      summary: form.summary.trim(),
      detailedNotes: form.detailedNotes.trim() || form.summary.trim(),
      highlights,
      coverImage: form.coverImage.trim() || '/uploads/assets/static_asset_projects_0_thumbnail_hc35tyd7.png',
      relatedProjectId: form.relatedProjectId || undefined,
      featured: form.featured,
      visibility: form.visibility,
      seo: seoPayload,
    };

    if (editingId) {
      updatePressMention({ id: editingId, ...payload });
      onShowToast('Feature / Press Updated');
    } else {
      addPressMention(payload);
      onShowToast('Feature / Press Added');
    }
    resetForm();
  };

  const handleAnnounceTelegram = async (item: PressMention) => {
    setAnnouncingId(item.id);
    try {
      const fullUrl = `${SITE_CONFIG.baseUrl}/press/${getPressSlug(item)}`;
      await sendTelegramConsoleLog(
        `New Feature & Press Mention: ${item.sourceName}`,
        `${item.title}\nSource: ${item.sourceName}\nExternal: ${item.externalUrl || 'N/A'}\nPortfolio: ${fullUrl}`,
        'success'
      );
      onShowToast('Telegram Announcement Sent');
    } finally {
      setAnnouncingId(null);
    }
  };

  const items = data.pressMentions || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <span>Features, Press &amp; External Links Studio</span>
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Curate external articles, competition archives (e.g. Cultivating Art), developer profiles, and news links mentioning Dubbaka Sathwik.
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

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-mono font-bold text-emerald-400">
            {editingId ? 'Edit Feature / Press Mention' : 'Add Feature / Press Link'}
          </h4>

          <div className="flex items-center gap-2">
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
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{form.featured ? 'Featured' : 'Standard'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-mono text-zinc-400 block mb-1">Feature Headline / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Warangal Open Art Competition — Student Feature Profile"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Source / Website Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cultivating Art, devSemble, edupodx"
              value={form.sourceName}
              onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Date / Archive Year</label>
            <input
              type="text"
              placeholder="e.g. 2026 or Featured Archive"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-mono text-zinc-400 block mb-1">External Article / Profile URL *</label>
            <input
              type="url"
              required
              placeholder="https://cultivatingart.in/profiles/DubbakaSathwik"
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-mono text-zinc-400 block mb-1">Category</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DEFAULT_PRESS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat, customCategory: '' })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                    form.category === cat && !form.customCategory
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
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
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Card Summary (1-2 Sentences) *</label>
          <textarea
            rows={2}
            required
            placeholder="Brief description of where you were featured and what this link highlights..."
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Background &amp; Significance (Modal Details)</label>
          <textarea
            rows={3}
            placeholder="Additional context for visitors inspecting the preview modal..."
            value={form.detailedNotes}
            onChange={(e) => setForm({ ...form, detailedNotes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Key Highlights (One per line)</label>
            <textarea
              rows={3}
              placeholder="Recognized in Warangal Open Art Competition&#10;Published on official portal"
              value={form.highlightsInput}
              onChange={(e) => setForm({ ...form, highlightsInput: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-4">
            <PhotoDropdownSelector
              label="Feature Screenshot / Cover Image"
              multilineMode={false}
              currentPhotos={form.coverImage ? [form.coverImage] : []}
              onUpdatePhotoList={(list) => setForm((p) => ({ ...p, coverImage: list[0] || '' }))}
            />

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Related Project (Optional)</label>
              <select
                value={form.relatedProjectId}
                onChange={(e) => setForm({ ...form, relatedProjectId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">None</option>
                {(data.projects || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SEO & AI Search Metadata with Gemini Generate Meta Data */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-emerald-500/25 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Google Search &amp; AI Discoverability Metadata</span>
              </h5>
              <p className="text-[11px] font-mono text-zinc-400">
                Connects this external link to Dubbaka Sathwik in Google Search, Gemini, ChatGPT, and Claude.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSeo}
              disabled={isGeneratingSeo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
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
              className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                seoStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/60 border border-red-500/30 text-red-300'
              }`}
            >
              {seoStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{seoStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">URL Slug</label>
              <input
                type="text"
                placeholder="cultivating-art-warangal-profile"
                value={form.seoSlug}
                onChange={(e) => setForm({ ...form, seoSlug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">SEO Title</label>
              <input
                type="text"
                placeholder="Headline — Source | Dubbaka Sathwik"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Meta Description</label>
              <textarea
                rows={2}
                placeholder="Concise description linking Dubbaka Sathwik to this external feature..."
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Keywords (comma separated)</label>
              <input
                type="text"
                placeholder="Dubbaka Sathwik, Cultivating Art, Warangal Open Art Competition..."
                value={form.seoKeywordsInput}
                onChange={(e) => setForm({ ...form, seoKeywordsInput: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? 'Save Changes' : 'Add Feature / Press Link'}</span>
          </button>
        </div>
      </form>

      {/* Existing Press & Features List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Managed Features &amp; Press ({items.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold truncate">
                    {item.sourceName} · {item.category}
                  </span>
                  <span
                    className={
                      item.visibility === 'Draft' ? 'text-amber-400 font-bold' : 'text-emerald-400'
                    }
                  >
                    {item.visibility || 'Published'}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-white line-clamp-2">{item.title}</h5>
                <p className="text-xs text-zinc-400 line-clamp-2">{item.summary}</p>
                {item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline truncate max-w-full"
                  >
                    <span className="truncate">{item.externalUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-emerald-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnnounceTelegram(item)}
                    disabled={announcingId === item.id}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-sky-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{announcingId === item.id ? 'Sending...' : 'Telegram'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    deletePressMention(item.id);
                    onShowToast('Feature / Press Deleted');
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 cursor-pointer"
                  aria-label={`Delete ${item.title}`}
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
