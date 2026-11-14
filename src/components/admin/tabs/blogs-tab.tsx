import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
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
import { BlogPost } from '../../../types';
import { PhotoDropdownSelector } from '../../ui/photo-dropdown';
import { SmartTagInput } from '../../ui/smart-tag-input';
import { MarkdownRenderer } from '../../ui/markdown-renderer';
import { SITE_CONFIG, getBlogPath } from '../../../config/seo';
import { sendTelegramConsoleLog } from '../../../utils/telegram';

interface BlogsTabProps {
  onShowToast: (label: string) => void;
}

const DEFAULT_BLOG_CATEGORIES = [
  'Web Engineering',
  'AI & ML',
  'Personal Story',
  'Creative Design',
  'System Architecture',
  'Hackathon Notes',
];

function estimateReadTime(text: string): string {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(2, Math.ceil(words / 180));
  return `${mins} min read`;
}

export function BlogsTab({ onShowToast }: BlogsTabProps) {
  const { data, authToken, addBlogPost, updateBlogPost, deleteBlogPost } = useCMS();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoStatus, setSeoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    kind: 'Blog' as 'Blog' | 'Article',
    difficulty: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced',
    category: 'Web Engineering',
    customCategory: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    readTime: '5 min read',
    snippet: '',
    tldr: '',
    content: '',
    tags: ['React', 'Full-Stack'],
    coverImage: '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
    relatedProjectId: '',
    externalUrl: '',
    featured: true,
    status: 'Published' as 'Published' | 'Draft',
    seoSlug: '',
    seoTitle: '',
    metaDescription: '',
    seoKeywordsInput: '',
    seoTldr: '',
  });

  const resetForm = () => {
    setEditingId(null);
    setSeoStatus(null);
    setEditorMode('write');
    setForm({
      title: '',
      kind: 'Blog',
      difficulty: 'Intermediate',
      category: 'Web Engineering',
      customCategory: '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      readTime: '5 min read',
      snippet: '',
      tldr: '',
      content: '',
      tags: ['React', 'Full-Stack'],
      coverImage: '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
      relatedProjectId: '',
      externalUrl: '',
      featured: true,
      status: 'Published',
      seoSlug: '',
      seoTitle: '',
      metaDescription: '',
      seoKeywordsInput: '',
      seoTldr: '',
    });
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setSeoStatus(null);
    const isStandardCat = DEFAULT_BLOG_CATEGORIES.includes(post.category);
    setForm({
      title: post.title || '',
      kind: post.kind === 'Article' ? 'Article' : 'Blog',
      difficulty: post.difficulty || 'Intermediate',
      category: isStandardCat ? post.category : 'Web Engineering',
      customCategory: isStandardCat ? '' : post.category || '',
      date: post.date || 'July 2026',
      readTime: post.readTime || '5 min read',
      snippet: post.snippet || '',
      tldr: post.tldr || '',
      content: post.content || '',
      tags: Array.isArray(post.tags) ? post.tags : ['Tech'],
      coverImage: post.coverImage || '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
      relatedProjectId: post.relatedProjectId || '',
      externalUrl: post.externalUrl || '',
      featured: post.featured ?? true,
      status: post.status === 'Draft' ? 'Draft' : 'Published',
      seoSlug: post.seo?.slug || post.slug || '',
      seoTitle: post.seo?.seoTitle || '',
      metaDescription: post.seo?.metaDescription || '',
      seoKeywordsInput: Array.isArray(post.seo?.keywords) ? post.seo.keywords.join(', ') : '',
      seoTldr: post.seo?.tldr || '',
    });
  };

  const handleGenerateSeo = async () => {
    if (!form.title || form.title.trim().length < 2) {
      setSeoStatus({ type: 'error', message: 'Enter a Title first to generate SEO metadata.' });
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
          type: form.kind === 'Article' ? 'article' : 'blog',
          title: form.title,
          summary: form.snippet,
          description: form.content || form.snippet,
          category: form.customCategory.trim() || form.category,
          tags: form.tags,
          year: form.date,
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
        tldr: prev.tldr || meta.tldr || '',
      }));
      setSeoStatus({
        type: 'success',
        message: 'Generated SEO & AI Search metadata with Gemini! Review or edit below.',
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
      kind: form.kind,
      difficulty: form.difficulty,
      category: finalCategory,
      date: form.date.trim() || 'July 2026',
      readTime: form.readTime.trim() || estimateReadTime(form.content),
      snippet: form.snippet.trim(),
      tldr: form.tldr.trim() || form.seoTldr.trim() || undefined,
      content: form.content,
      tags: form.tags,
      coverImage: form.coverImage.trim() || '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
      relatedProjectId: form.relatedProjectId || undefined,
      externalUrl: form.externalUrl.trim() || undefined,
      featured: form.featured,
      status: form.status,
      seo: seoPayload,
    };

    if (editingId) {
      updateBlogPost({ id: editingId, ...payload });
      onShowToast(`${form.kind} Updated`);
    } else {
      addBlogPost(payload);
      onShowToast(`${form.kind} Published`);
    }
    resetForm();
  };

  const handleAnnounceTelegram = async (post: BlogPost) => {
    setAnnouncingId(post.id);
    try {
      const fullUrl = `${SITE_CONFIG.baseUrl}${getBlogPath(post)}`;
      await sendTelegramConsoleLog(
        `New ${post.kind || 'Blog'} Published`,
        `${post.title}\nCategory: ${post.category}\nURL: ${fullUrl}`,
        'success'
      );
      onShowToast('Telegram Announcement Sent');
    } finally {
      setAnnouncingId(null);
    }
  };

  const posts = data.blogs || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Blogs &amp; Journal Studio</span>
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Write Markdown personal blogs or technical notes with automatic TOC, preview modal reader, and Gemini SEO metadata.
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

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-mono font-bold text-emerald-400">
            {editingId ? 'Edit Journal Entry' : 'Create New Journal Entry'}
          </h4>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, kind: p.kind === 'Article' ? 'Blog' : 'Article' }))}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-emerald-300 cursor-pointer"
            >
              Section: {form.kind === 'Article' ? 'Technical Notes' : 'Personal Blog'}
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, status: p.status === 'Draft' ? 'Published' : 'Draft' }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border cursor-pointer ${
                form.status === 'Published'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-amber-500/50 text-amber-300'
              }`}
            >
              {form.status === 'Published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{form.status}</span>
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
            <label className="text-xs font-mono text-zinc-400 block mb-1">Post Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. How I Built Natural Language SQL Generation with Gemini"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Category</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DEFAULT_BLOG_CATEGORIES.map((cat) => (
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
              placeholder="Or custom category..."
              value={form.customCategory}
              onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Date</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="July 2026"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Read Time</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                placeholder="5 min read"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <SmartTagInput
          tags={form.tags}
          onChange={(tags) => setForm({ ...form, tags })}
          label="Topics & Tags"
          placeholder="Add tag (e.g. React, System Design, Gemini)..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhotoDropdownSelector
            label="Cover Image"
            multilineMode={false}
            currentPhotos={form.coverImage ? [form.coverImage] : []}
            onUpdatePhotoList={(list) => setForm((p) => ({ ...p, coverImage: list[0] || '' }))}
          />
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Cover Image URL</label>
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Link Related Project (Optional)</label>
              <select
                value={form.relatedProjectId}
                onChange={(e) => setForm({ ...form, relatedProjectId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
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
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Short Card Snippet *</label>
          <textarea
            rows={2}
            required
            placeholder="1–2 sentence hook displayed on Homepage & Insights cards..."
            value={form.snippet}
            onChange={(e) => setForm({ ...form, snippet: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
          />
        </div>

        {/* Markdown Editor with Live Preview */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-mono text-emerald-400 font-semibold">
              Full Content (Supports ## Headings for Table of Contents, Code Blocks, Lists, Bold &amp; Links)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, readTime: estimateReadTime(p.content) }))}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                Auto Read Time
              </button>
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className={`px-3 py-1 rounded-md text-xs font-mono cursor-pointer ${
                    editorMode === 'write' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 rounded-md text-xs font-mono cursor-pointer ${
                    editorMode === 'preview' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>
          </div>

          {editorMode === 'write' ? (
            <textarea
              rows={10}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={`## Overview\nExplain the problem...\n\n### Architecture\n\`\`\`ts\nconsole.log('Clean code blocks supported!');\n\`\`\``}
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white leading-relaxed focus:outline-none focus:border-emerald-500/50"
            />
          ) : (
            <div className="p-5 rounded-xl bg-[#0c0c0e] border border-zinc-800 max-h-96 overflow-y-auto">
              {form.content.trim() ? (
                <MarkdownRenderer content={form.content} />
              ) : (
                <p className="text-xs text-zinc-500 font-mono">Nothing written yet to preview.</p>
              )}
            </div>
          )}
        </div>

        {/* SEO & Gemini AI Metadata */}
        <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h6 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>SEO, Google &amp; AI Chat Search Metadata</span>
              </h6>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Controls /{form.kind === 'Article' ? 'articles' : 'blog'}/[slug], sitemap.xml, and ChatGPT/Gemini discovery.
              </p>
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
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">URL Slug</label>
              <input
                type="text"
                value={form.seoSlug}
                onChange={(e) => setForm({ ...form, seoSlug: e.target.value })}
                placeholder="auto-generated-from-title"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-emerald-300 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">SEO Page Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Title | Dubbaka Sathwik"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Search Keywords (comma-separated)</label>
              <input
                type="text"
                value={form.seoKeywordsInput}
                onChange={(e) => setForm({ ...form, seoKeywordsInput: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">TL;DR Summary Box</label>
              <input
                type="text"
                value={form.tldr || form.seoTldr}
                onChange={(e) => setForm({ ...form, tldr: e.target.value, seoTldr: e.target.value })}
                placeholder="1–2 sentence key takeaway shown at top of article..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{editingId ? 'Save Changes to Post' : 'Publish Blog / Article'}</span>
        </button>
      </form>

      {/* Existing Posts List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Saved Blogs &amp; Articles ({posts.length})
        </h4>
        <div className="space-y-2.5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold">{post.kind || 'Blog'}</span>
                  <span className="text-zinc-500">·</span>
                  <span className={post.status === 'Draft' ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                    {post.status}
                  </span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{post.category}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{post.date}</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{post.title}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAnnounceTelegram(post)}
                  disabled={announcingId === post.id}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1 cursor-pointer"
                  title="Send Telegram channel notification"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{announcingId === post.id ? 'Sending...' : 'Announce'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(post)}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                  title="Edit Post"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteBlogPost(post.id);
                    onShowToast('Post Deleted');
                  }}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 cursor-pointer"
                  title="Delete Post"
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
