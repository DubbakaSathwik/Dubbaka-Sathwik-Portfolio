import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Layers,
  LayoutGrid,
  MessageSquare,
  Share2,
  X,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { BlogPost } from '../types';
import { getBlogPath, getProjectSlug, isItemPublished, SITE_CONFIG } from '../config/seo';
import { MarkdownRenderer } from './ui/markdown-renderer';
import { StackedCardDeck } from './ui/stacked-card-deck';

type JournalFilter = 'All' | 'Personal Blog' | 'Technical Notes';

export function BlogsSection() {
  const { data } = useCMS();
  const posts = (data.blogs || []).filter(isItemPublished);
  const publishedProjects = (data.projects || []).filter(isItemPublished);

  const [filter, setFilter] = useState<JournalFilter>('All');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'stack' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 6;

  const filteredPosts = posts.filter((post) => {
    if (filter === 'All') return true;
    if (filter === 'Personal Blog') return post.kind !== 'Article';
    if (filter === 'Technical Notes') return post.kind === 'Article';
    return true;
  });

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFilterSelect = (tab: JournalFilter) => {
    setFilter(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const section = document.getElementById('journal');
      if (section) {
        const navOffset = 85;
        const offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      }
    }, 50);
  };

  const handleCopyShare = async (post: BlogPost) => {
    const shareUrl = `${SITE_CONFIG.baseUrl}${getBlogPath(post)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {}
  };

  const relatedProject = selectedPost?.relatedProjectId
    ? publishedProjects.find((p) => p.id === selectedPost.relatedProjectId)
    : null;

  return (
    <section
      id="journal"
      className="pt-8 pb-16 sm:pt-10 sm:pb-20 bg-[#050505] relative overflow-hidden border-t border-zinc-900 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header + Personal Blog / Technical Notes Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-10">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 tracking-wide">
              Writing &amp; Developer Journal
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
              Blogs &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Journal
              </span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Personal coding stories, design workflows, and practical engineering notes from my builds. Tap any card to read in a quick preview.
            </p>
          </div>

          <div className="flex flex-nowrap items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0 self-start lg:self-auto">
            {(['All', 'Personal Blog', 'Technical Notes'] as JournalFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleFilterSelect(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filter === tab
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Switcher (Stack Deck vs Grid View) */}
        {posts.length > 0 && (
          <div className="md:hidden flex items-center justify-between gap-1 mb-3 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-full overflow-hidden">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 pl-1 shrink-0 whitespace-nowrap">
              Mobile Layout:
            </span>
            <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setMobileViewMode('stack')}
                className={`px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  mobileViewMode === 'stack'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>Stack Deck</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('grid')}
                className={`px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  mobileViewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3 shrink-0" />
                <span>Grid View</span>
              </button>
            </div>
          </div>
        )}

        {/* Content / Empty State */}
        {posts.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-center space-y-2 my-4">
            <BookOpen className="w-7 h-7 text-emerald-400/70 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-white">No Journal Entries Published Yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Personal coding stories and technical articles authored in the Admin CMS will appear here with instant reading previews.
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center my-4">
            <p className="text-sm text-zinc-400">No entries in {filter} yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile Stack Deck View */}
            {mobileViewMode === 'stack' && (
              <div className="md:hidden w-full my-2">
                <StackedCardDeck
                  items={filteredPosts}
                  keyExtractor={(post) => post.id}
                  onCardClick={(post) => setSelectedPost(post)}
                  cardHeightClass="h-[410px]"
                  renderCard={(post) => {
                    const typeLabel = post.kind === 'Article' ? 'Technical Notes' : 'Personal Blog';
                    return (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950 text-left">
                        <div>
                          <div className="relative h-36 w-full rounded-xl overflow-hidden bg-zinc-900 mb-3">
                            {post.coverImage ? (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-emerald-400/60">
                                <BookOpen className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none" />
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1.5">
                            <span className="text-emerald-400 font-semibold">{typeLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.readTime}</span>
                          </div>

                          <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                            {post.title}
                          </h3>

                          <p className="text-xs text-zinc-400 line-clamp-3 mt-1.5 leading-relaxed">
                            {post.snippet}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs text-zinc-400 mt-2">
                          <span className="truncate font-mono text-[10px]">{post.date}</span>
                          <span className="text-emerald-400 text-[11px] font-bold whitespace-nowrap shrink-0">
                            Read Preview &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}

            {/* Journal Cards Grid (2-col on Mobile, 2-col on Tablet, 3-col on Desktop) */}
            <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} flex-wrap justify-center gap-3 sm:gap-6 lg:gap-8`}>
              {currentPosts.map((post) => {
                const typeLabel = post.kind === 'Article' ? 'Technical Notes' : 'Personal Blog';
                return (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="w-[calc(50%-0.375rem)] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-1 shadow-xl"
                  >
                    <div>
                      <div className="h-28 sm:h-48 w-full overflow-hidden bg-zinc-950 relative">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-emerald-400/60">
                            <BookOpen className="w-7 h-7" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-70 pointer-events-none" />
                      </div>

                      <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-zinc-400">
                          <span className="text-emerald-400 font-semibold">{typeLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{post.category}</span>
                          <span className="hidden sm:inline" aria-hidden="true">·</span>
                          <span className="hidden sm:inline">{post.readTime}</span>
                        </div>

                        <h3 className="text-xs sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug text-balance">
                          {post.title}
                        </h3>

                        <p className="text-[11px] sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                          {post.snippet}
                        </p>
                      </div>
                    </div>

                    <div className="px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5 text-[10px] sm:text-xs text-zinc-400">
                      <span className="truncate">
                        {post.date}
                      </span>
                      <span className="text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                        Read &rarr;
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} mt-10 flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800/80`}>
                <p className="text-xs font-mono text-zinc-400">
                  Showing{' '}
                  <span className="text-emerald-400 font-bold">
                    {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredPosts.length)}
                  </span>{' '}
                  of <span className="text-white font-bold">{filteredPosts.length}</span> entries
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-600 disabled:opacity-30 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white font-bold border border-emerald-500'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-600 disabled:opacity-30 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Blog / Journal Reader Preview Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)] overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col"
            >
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 z-40 p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer shadow-lg"
                aria-label="Close journal preview"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Scrollable Article Preview Body */}
              <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-8 space-y-5 sm:space-y-6">
                {selectedPost.coverImage && (
                  <div className="w-full h-44 sm:h-64 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img
                      src={selectedPost.coverImage}
                      alt={selectedPost.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <header className="space-y-2.5 pr-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="text-emerald-400 font-semibold">
                      {selectedPost.kind === 'Article' ? 'Technical Notes' : 'Personal Blog'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPost.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPost.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPost.readTime}</span>
                  </div>

                  <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight text-balance">
                    {selectedPost.title}
                  </h3>
                </header>

                {(selectedPost.tldr || selectedPost.seo?.tldr || selectedPost.snippet) && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/25 space-y-1">
                    <p className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Quick Summary
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                      {selectedPost.tldr || selectedPost.seo?.tldr || selectedPost.snippet}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80">
                  <MarkdownRenderer content={selectedPost.content || selectedPost.snippet} />
                </div>

                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap gap-3 text-xs font-mono text-zinc-400">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky Preview Modal Footer */}
              <div className="p-3.5 sm:px-8 border-t border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyShare(selectedPost)}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedId === selectedPost.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Share Link</span>
                      </>
                    )}
                  </button>

                  {relatedProject && (
                    <button
                      type="button"
                      onClick={() => {
                        const slug = getProjectSlug(relatedProject);
                        setSelectedPost(null);
                        window.dispatchEvent(
                          new CustomEvent('portfolio:navigate', {
                            detail: { path: `/projects/${slug}` },
                          })
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>{relatedProject.title}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const title = selectedPost.title;
                      setSelectedPost(null);
                      const contactEl = document.getElementById('contact');
                      if (contactEl) {
                        const header = document.getElementById('main-header');
                        const headerHeight = header ? header.getBoundingClientRect().height : 80;
                        const top = contactEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                      }
                      window.dispatchEvent(
                        new CustomEvent('portfolio:prefill-contact', {
                          detail: { subject: `Discussion on: ${title}` },
                        })
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discuss</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
