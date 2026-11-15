import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Search, Calendar, BookOpen, MapPin, FolderGit2, Award } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { BlogPost, EventItem } from '../types';
import {
  SITE_CONFIG,
  applyDynamicDocumentMeta,
  getBlogPath,
  getEventSlug,
  getProjectSlug,
  isItemPublished,
  stripFormattingMarkers,
} from '../config/seo';

interface InsightsDirectoryPageProps {
  onNavigate: (path: string, options?: { scrollToId?: string; prefillSubject?: string }) => void;
}

type TypeFilter = 'All' | 'Blogs' | 'Articles' | 'Events';

export function InsightsDirectoryPage({ onNavigate }: InsightsDirectoryPageProps) {
  const { data } = useCMS();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const publishedBlogs = useMemo(() => (data.blogs || []).filter(isItemPublished), [data.blogs]);
  const publishedEvents = useMemo(() => (data.events || []).filter(isItemPublished), [data.events]);
  const publishedProjects = useMemo(() => (data.projects || []).filter(isItemPublished), [data.projects]);
  const publishedJourney = useMemo(() => (data.journey || []).filter(isItemPublished), [data.journey]);

  useEffect(() => {
    window.scrollTo(0, 0);
    applyDynamicDocumentMeta({
      title: `Insights, Articles & Events | ${SITE_CONFIG.siteName}`,
      description:
        'Technical engineering articles, developer blogs, hackathons, IEEE workshops, and featured software case studies by Dubbaka Sathwik.',
      keywords: [
        'Dubbaka Sathwik blog',
        'Dubbaka Sathwik articles',
        'Dubbaka Sathwik events',
        'Dubbaka Sathwik projects',
        'MVSR Engineering College',
        'Full-Stack Developer notes',
      ],
      pathname: '/insights',
      image: SITE_CONFIG.defaultImage,
      ogType: 'website',
    });
  }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>(['All']);
    publishedBlogs.forEach((b) => b.category && set.add(b.category));
    publishedEvents.forEach((e) => e.category && set.add(e.category));
    return Array.from(set);
  }, [publishedBlogs, publishedEvents]);

  type DirectoryItem =
    | { kind: 'Blog' | 'Article'; item: BlogPost; path: string; category: string; searchBlob: string }
    | { kind: 'Event'; item: EventItem; path: string; category: string; searchBlob: string };

  const combinedItems: DirectoryItem[] = useMemo(() => {
    const blogs: DirectoryItem[] = publishedBlogs.map((b) => ({
      kind: b.kind === 'Article' ? 'Article' : 'Blog',
      item: b,
      path: getBlogPath(b),
      category: b.category || 'Tech',
      searchBlob: `${b.title} ${b.snippet} ${b.category} ${(b.tags || []).join(' ')}`.toLowerCase(),
    }));
    const events: DirectoryItem[] = publishedEvents.map((ev) => ({
      kind: 'Event',
      item: ev,
      path: `/events/${getEventSlug(ev)}`,
      category: ev.category || 'Event',
      searchBlob: `${ev.title} ${ev.summary} ${ev.venue} ${ev.role} ${ev.category}`.toLowerCase(),
    }));
    return [...blogs, ...events];
  }, [publishedBlogs, publishedEvents]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combinedItems.filter((entry) => {
      if (typeFilter === 'Blogs' && entry.kind !== 'Blog') return false;
      if (typeFilter === 'Articles' && entry.kind !== 'Article') return false;
      if (typeFilter === 'Events' && entry.kind !== 'Event') return false;
      if (topicFilter !== 'All' && entry.category !== topicFilter) return false;
      if (q && !entry.searchBlob.includes(q)) return false;
      return true;
    });
  }, [combinedItems, typeFilter, topicFilter, searchQuery]);

  return (
    <section className="min-h-screen pt-24 sm:pt-28 pb-20 bg-[#050505] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Top Bar & Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="hover:text-emerald-400 cursor-pointer"
              >
                Home
              </a>
              <span aria-hidden="true">/</span>
              <span className="text-emerald-400 font-semibold">Insights &amp; Events</span>
            </nav>

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Back to Portfolio</span>
            </button>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
              Engineering Notes, Stories &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Events
              </span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Archive of technical deep dives, software case studies, campus leadership experiences, hackathons, and design notes by{' '}
              <span className="text-white font-semibold">Dubbaka Sathwik</span> at MVSR Engineering College, Hyderabad.
            </p>
          </div>
        </div>

        {/* Search + Filter Controls when Journal / Event items exist */}
        {combinedItems.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, blogs, events, or topics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto">
                {(['All', 'Blogs', 'Articles', 'Events'] as TypeFilter[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTypeFilter(tab)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      typeFilter === tab
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setTopicFilter(topic)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                    topicFilter === topic
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Directory */}
        {combinedItems.length === 0 ? (
          <div className="space-y-12">
            {/* Editorial Note */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Published Case Studies &amp; Campus Leadership</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Upcoming Writing &amp; Verified Engineering Work
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Standalone essays and event recaps are updated here as new events conclude. Explore all {publishedProjects.length} documented engineering builds and {publishedJourney.length} campus and hackathon milestones below.
                </p>
              </div>
              <a
                href="/#projects"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/', { scrollToId: 'projects' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Full Portfolio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Technical Case Studies Grid */}
            {publishedProjects.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <FolderGit2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Technical Case Studies by Dubbaka Sathwik
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedProjects.map((proj) => {
                    const slug = getProjectSlug(proj);
                    const href = `/projects/${slug}`;
                    const summary = stripFormattingMarkers(proj.description || proj.summary || '');
                    return (
                      <article
                        key={proj.id}
                        className="group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between transition-all"
                      >
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(href);
                          }}
                          className="flex flex-col flex-1 justify-between"
                        >
                          <div>
                            {proj.thumbnail && (
                              <div className="aspect-[16/10] w-full bg-zinc-950 overflow-hidden">
                                <img
                                  src={proj.thumbnail}
                                  alt={proj.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <div className="p-5 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                                <span className="text-emerald-400 font-semibold">{proj.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{proj.year || '2026'}</span>
                              </div>
                              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {proj.title}
                              </h3>
                              <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">{summary}</p>
                            </div>
                          </div>
                          <div className="px-5 py-3.5 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-400">
                            <span className="truncate">
                              {(proj.technologies || proj.tags || []).slice(0, 3).join(' · ')}
                            </span>
                            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                              Read Case Study <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </a>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hackathons, NSS & IEEE Journey Highlights */}
            {publishedJourney.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Hackathons, NSS Leadership &amp; Milestones
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publishedJourney.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-emerald-400 font-semibold">{item.category || 'Milestone'}</span>
                        <span className="text-zinc-500">{item.year}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        {item.role} · {item.organization}
                      </p>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {stripFormattingMarkers(item.detailedDescription || item.description || '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0c0c0e] border border-zinc-800 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-emerald-400/70 mx-auto" />
            <h2 className="text-lg font-bold text-white">No Entries Match This Filter</h2>
            <p className="text-sm text-zinc-400">Try clearing the search query or selecting another filter tab.</p>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('All');
                setTopicFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((entry) => {
              if (entry.kind === 'Event') {
                const ev = entry.item;
                return (
                  <article
                    key={ev.id}
                    onClick={() => onNavigate(entry.path)}
                    className="group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col transition-all cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full bg-zinc-950 overflow-hidden">
                      <img
                        src={ev.coverImage}
                        alt={ev.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-emerald-400 font-semibold">{ev.eventStatus} Event</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.displayDate || ev.date}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 text-balance">
                          {ev.title}
                        </h2>
                        <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">{ev.summary}</p>
                      </div>
                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </span>
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                          View Event <ArrowUpRight className="w-3.5 h-3.5" />
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
                  onClick={() => onNavigate(entry.path)}
                  className="group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col transition-all cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                        <span className="text-emerald-400 font-semibold">{entry.kind}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 text-balance">
                        {post.title}
                      </h2>
                      <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">{post.snippet}</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{(post.tags || []).slice(0, 2).join(' · ')}</span>
                      </span>
                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        Read {entry.kind} <ArrowUpRight className="w-3.5 h-3.5" />
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
