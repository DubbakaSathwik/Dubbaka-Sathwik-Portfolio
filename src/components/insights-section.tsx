import { useState } from 'react';
import { BookOpen, Calendar, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { BlogPost, EventItem } from '../types';
import { getBlogPath, getEventSlug, isItemPublished } from '../config/seo';

type InsightFilter = 'All' | 'Blogs' | 'Articles' | 'Events';

function navigatePath(path: string) {
  window.dispatchEvent(new CustomEvent('portfolio:navigate', { detail: { path } }));
}

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-emerald-950/30 to-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <BookOpen className="w-7 h-7 text-emerald-400/70 mb-2" />
        <span className="text-xs font-mono text-zinc-400 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

export function InsightsSection() {
  const { data } = useCMS();
  const [activeTab, setActiveTab] = useState<InsightFilter>('All');

  const publishedBlogs: BlogPost[] = (data.blogs || []).filter(isItemPublished);
  const publishedEvents: EventItem[] = (data.events || []).filter(isItemPublished);

  type CombinedCard =
    | { kind: 'Blog' | 'Article'; item: BlogPost; path: string }
    | { kind: 'Event'; item: EventItem; path: string };

  const blogCards: CombinedCard[] = publishedBlogs.map((b) => ({
    kind: b.kind === 'Article' ? 'Article' : 'Blog',
    item: b,
    path: getBlogPath(b),
  }));

  const eventCards: CombinedCard[] = publishedEvents.map((ev) => ({
    kind: 'Event',
    item: ev,
    path: `/events/${getEventSlug(ev)}`,
  }));

  const allCards: CombinedCard[] = [...blogCards, ...eventCards];

  const visibleCards = allCards
    .filter((entry) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Blogs') return entry.kind === 'Blog';
      if (activeTab === 'Articles') return entry.kind === 'Article';
      if (activeTab === 'Events') return entry.kind === 'Event';
      return true;
    })
    .slice(0, 6);

  if (allCards.length === 0) return null;

  return (
    <section
      id="insights"
      className="pt-8 pb-16 sm:pt-10 sm:pb-20 bg-[#050505] relative overflow-hidden scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 tracking-wide">
              Writing, Engineering Notes &amp; Live Campus Events
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
              Insights, Articles &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Events
              </span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Deep technical breakdowns, developer stories, and hackathons or NSS initiatives led by Dubbaka Sathwik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              {(['All', 'Blogs', 'Articles', 'Events'] as InsightFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigatePath('/insights')}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>All Insights</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        {visibleCards.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
            <p className="text-sm text-zinc-400">No published items in {activeTab} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCards.map((entry) => {
              if (entry.kind === 'Event') {
                const ev = entry.item;
                return (
                  <article
                    key={ev.id}
                    onClick={() => navigatePath(entry.path)}
                    className="group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col transition-all duration-200 cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-950 relative">
                      <ImageWithFallback src={ev.coverImage} alt={ev.title} />
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-emerald-400 font-semibold">{ev.eventStatus} Event</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.displayDate || ev.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 text-balance">
                          {ev.title}
                        </h3>
                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{ev.summary}</p>
                      </div>
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{ev.role}</span>
                        </span>
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                          Event Details
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              }

              const post = entry.item;
              return (
                <article
                  key={post.id}
                  onClick={() => navigatePath(entry.path)}
                  className="group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col transition-all duration-200 cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-950 relative">
                    <ImageWithFallback src={post.coverImage} alt={post.title} />
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                        <span className="text-emerald-400 font-semibold">{entry.kind}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 text-balance">
                        {post.title}
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{post.snippet}</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="truncate">{(post.tags || []).slice(0, 3).join(' · ')}</span>
                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        Read {entry.kind}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
