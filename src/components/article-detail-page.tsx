import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { BlogPost, Project } from '../types';
import { MarkdownRenderer, extractMarkdownHeadings } from './ui/markdown-renderer';
import {
  SITE_CONFIG,
  applyDynamicDocumentMeta,
  buildBlogStructuredData,
  getBlogPath,
  getBlogSlug,
  getProjectSlug,
  isItemPublished,
  stripFormattingMarkers,
} from '../config/seo';

interface ArticleDetailPageProps {
  slug: string;
  onNavigate: (path: string, options?: { scrollToId?: string; prefillSubject?: string }) => void;
}

export function ArticleDetailPage({ slug, onNavigate }: ArticleDetailPageProps) {
  const { data } = useCMS();
  const [readProgress, setReadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const publishedPosts = useMemo(() => (data.blogs || []).filter(isItemPublished), [data.blogs]);
  const postIndex = publishedPosts.findIndex((p) => getBlogSlug(p) === slug);
  const post: BlogPost | undefined = postIndex >= 0 ? publishedPosts[postIndex] : undefined;

  const prevPost = postIndex > 0 ? publishedPosts[postIndex - 1] : null;
  const nextPost =
    postIndex >= 0 && postIndex < publishedPosts.length - 1 ? publishedPosts[postIndex + 1] : null;

  const relatedProject: Project | undefined = useMemo(() => {
    if (!post?.relatedProjectId) return undefined;
    return (data.projects || []).find((p) => p.id === post.relatedProjectId && isItemPublished(p));
  }, [data.projects, post]);

  const tocHeadings = useMemo(() => (post ? extractMarkdownHeadings(post.content) : []), [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) {
      const seoTitle = post.seo?.seoTitle || `${post.title} — ${SITE_CONFIG.author.name}`;
      const metaDesc =
        post.seo?.metaDescription ||
        stripFormattingMarkers(post.snippet || post.content || '').slice(0, 158);
      const keywords =
        post.seo?.keywords && post.seo.keywords.length > 0
          ? post.seo.keywords
          : [post.title, post.category, 'Dubbaka Sathwik', ...(post.tags || [])];

      applyDynamicDocumentMeta({
        title: seoTitle,
        description: metaDesc,
        keywords,
        pathname: getBlogPath(post),
        image: post.coverImage || SITE_CONFIG.defaultImage,
        ogType: 'article',
        structuredData: buildBlogStructuredData(post),
      });
    } else {
      applyDynamicDocumentMeta({
        title: `Post Not Found | ${SITE_CONFIG.siteName}`,
        description: SITE_CONFIG.defaultDescription,
        pathname: `/blog/${slug}`,
      });
    }
  }, [post, slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setReadProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${post ? getBlogPath(post) : `/blog/${slug}`}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!post) {
    return (
      <section className="min-h-[75vh] pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-[#050505] flex items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800 text-center space-y-5">
          <BookOpen className="w-10 h-10 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">Article Not Found</h1>
          <p className="text-sm text-zinc-400">
            This post may have moved or is currently saved as a draft.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/insights')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Insights</span>
          </button>
        </div>
      </section>
    );
  }

  const kindLabel = post.kind === 'Article' ? 'Technical Article' : 'Blog Post';
  const summaryTakeaway = post.tldr || post.seo?.tldr;

  return (
    <article className="min-h-screen pt-24 sm:pt-28 pb-20 bg-[#050505] relative overflow-hidden">
      {/* Reading Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-0.5 bg-zinc-900 z-40 pointer-events-none">
        <div
          className="h-full bg-emerald-400 transition-[width] duration-100"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Top Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <button type="button" onClick={() => onNavigate('/')} className="hover:text-emerald-400 cursor-pointer">
              Home
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => onNavigate('/insights')}
              className="hover:text-emerald-400 cursor-pointer"
            >
              Insights
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {post.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => onNavigate('/insights')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Insights</span>
          </button>
        </div>

        {/* Header */}
        <header className="space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="text-emerald-400 font-semibold">{kindLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>{post.date}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readTime}</span>
            {post.difficulty && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.difficulty} Level</span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-balance">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400">
            Written by <span className="text-white font-semibold">Dubbaka Sathwik</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
            </button>

            {post.externalUrl && (
              <a
                href={post.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>External Reference</span>
              </a>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-[440px]">
            <img
              src={post.coverImage}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[440px] object-cover"
            />
          </div>
        )}

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {summaryTakeaway && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0c0c0e] border border-emerald-500/30 space-y-2">
                <p className="text-xs font-mono font-bold text-emerald-400">TL;DR — Key Takeaway</p>
                <p className="text-sm sm:text-base text-zinc-100 leading-relaxed">{summaryTakeaway}</p>
              </div>
            )}

            <div className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800">
              <MarkdownRenderer content={post.content} />
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="text-xs text-zinc-400 pt-2">
                <span className="font-semibold text-zinc-300 mr-2">Topics covered:</span>
                <span>{post.tags.join(' · ')}</span>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {tocHeadings.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-3">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {tocHeadings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(h.id);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`block text-xs text-zinc-400 hover:text-emerald-400 transition-colors ${
                        h.level === 3 ? 'pl-3' : 'font-medium text-zinc-200'
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {relatedProject && (
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-3">
                <p className="text-xs font-mono text-emerald-400 font-semibold">Related Project</p>
                <h3 className="text-base font-bold text-white">{relatedProject.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{relatedProject.summary}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(`/projects/${getProjectSlug(relatedProject)}`)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Project Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-emerald-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Discuss This With Sathwik</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Have questions on architecture, implementation details, or want to collaborate on a build?
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate('/', {
                    scrollToId: 'contact',
                    prefillSubject: `Discussion about: ${post.title}`,
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send a Direct Message</span>
              </button>
            </div>
          </aside>
        </div>

        {/* Previous / Next Navigation */}
        {(prevPost || nextPost) && (
          <div className="pt-8 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost ? (
              <button
                type="button"
                onClick={() => onNavigate(getBlogPath(prevPost))}
                className="p-5 rounded-2xl bg-[#0c0c0e] hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
              >
                <span className="text-xs font-mono text-zinc-400 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Previous
                </span>
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 mt-1 line-clamp-1">
                  {prevPost.title}
                </p>
              </button>
            ) : (
              <div />
            )}

            {nextPost && (
              <button
                type="button"
                onClick={() => onNavigate(getBlogPath(nextPost))}
                className="p-5 rounded-2xl bg-[#0c0c0e] hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-right transition-all cursor-pointer group"
              >
                <span className="text-xs font-mono text-zinc-400 inline-flex items-center gap-1 justify-end">
                  Next <ArrowRight className="w-3 h-3" />
                </span>
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 mt-1 line-clamp-1">
                  {nextPost.title}
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
