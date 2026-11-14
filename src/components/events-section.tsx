import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderGit2,
  Layers,
  LayoutGrid,
  MapPin,
  Play,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { EventItem } from '../types';
import { getEventSlug, getProjectSlug, isItemPublished } from '../config/seo';
import { FormattedText } from '../lib/text-formatter';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';
import { StackedCardDeck } from './ui/stacked-card-deck';

function buildGoogleCalendarUrl(ev: EventItem): string {
  const cleanDate = (ev.date || '2026-08-15').replace(/[^0-9]/g, '').slice(0, 8);
  const start = cleanDate.length === 8 ? cleanDate : '20260815';
  const end = ev.endDate
    ? ev.endDate.replace(/[^0-9]/g, '').slice(0, 8) || start
    : start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.title} (${ev.role})`,
    dates: `${start}/${end}`,
    details: `${ev.summary}\n\nMore details: https://dubbakasathwik.netlify.app/events/${getEventSlug(ev)}`,
    location: ev.venue || 'MVSR Engineering College, Hyderabad',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventsSection() {
  const { data } = useCMS();
  const events = (data.events || []).filter(isItemPublished);
  const publishedProjects = (data.projects || []).filter(isItemPublished);

  const [filter, setFilter] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'stack' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 6;
  const categories = Array.from(new Set(events.map((ev) => ev.category).filter(Boolean)));
  const filterTabs = ['All', 'Upcoming', 'Past', ...categories];

  const filteredEvents = events.filter((ev) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return ev.eventStatus === 'Upcoming';
    if (filter === 'Past') return ev.eventStatus === 'Past';
    return ev.category === filter;
  });

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFilterSelect = (tab: string) => {
    setFilter(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const section = document.getElementById('events');
      if (section) {
        const navOffset = 85;
        const offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      }
    }, 50);
  };

  const modalPhotos = selectedEvent
    ? (selectedEvent.images && selectedEvent.images.length > 0
        ? selectedEvent.images
        : [selectedEvent.coverImage]
      ).filter(Boolean)
    : [];

  const linkedProject = selectedEvent?.relatedProjectId
    ? publishedProjects.find((p) => p.id === selectedEvent.relatedProjectId)
    : null;

  return (
    <section
      id="events"
      className="pt-8 pb-16 sm:pt-10 sm:pb-20 bg-[#050505] relative overflow-hidden border-t border-zinc-900 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-10">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 tracking-wide">
              Hackathons, IEEE Workshops &amp; NSS Leadership
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
              Events &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Workshops
              </span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Live hackathons, campus leadership drives, workshops, and speaking or organizing milestones. Tap any event for a full preview.
            </p>
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleFilterSelect(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
        {events.length > 0 && (
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
        {events.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-center space-y-2 my-4">
            <Calendar className="w-7 h-7 text-emerald-400/70 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-white">No Events Published Yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Real hackathons, IEEE workshops, and NSS campus drives added from the Admin CMS will appear here automatically.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center my-4">
            <p className="text-sm text-zinc-400">No events matching &quot;{filter}&quot; yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile Stack Deck View */}
            {mobileViewMode === 'stack' && (
              <div className="md:hidden w-full my-2">
                <StackedCardDeck
                  items={filteredEvents}
                  keyExtractor={(ev) => ev.id}
                  onCardClick={(ev) => setSelectedEvent(ev)}
                  cardHeightClass="h-[410px]"
                  renderCard={(ev) => (
                    <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950 text-left">
                      <div>
                        <div className="relative h-36 w-full rounded-xl overflow-hidden bg-zinc-900 mb-3">
                          {ev.coverImage ? (
                            <img
                              src={ev.coverImage}
                              alt={ev.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-emerald-400/60">
                              <Calendar className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none" />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1.5">
                          <span className={ev.eventStatus === 'Upcoming' ? 'text-emerald-400 font-semibold' : 'text-zinc-300 font-semibold'}>
                            {ev.eventStatus}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.displayDate || ev.date}</span>
                        </div>

                        <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                          {ev.title}
                        </h3>

                        <p className="text-xs text-zinc-400 line-clamp-3 mt-1.5 leading-relaxed">
                          {ev.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs text-zinc-400 mt-2">
                        <span className="inline-flex items-center gap-1 truncate font-mono text-[10px]">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{ev.role}</span>
                        </span>
                        <span className="text-emerald-400 text-[11px] font-bold whitespace-nowrap shrink-0">
                          Preview &rarr;
                        </span>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Events Grid (2-col on Mobile, 2-col on Tablet, 3-col on Desktop) */}
            <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} flex-wrap justify-center gap-3 sm:gap-6 lg:gap-8`}>
              {currentEvents.map((ev) => (
                <article
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-[calc(50%-0.375rem)] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] group rounded-2xl bg-[#0c0c0e] border border-zinc-800/90 hover:border-emerald-500/40 overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-1 shadow-xl"
                >
                  <div>
                    <div className="h-28 sm:h-48 w-full overflow-hidden bg-zinc-950 relative">
                      {ev.coverImage ? (
                        <img
                          src={ev.coverImage}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-emerald-400/60">
                          <Calendar className="w-7 h-7" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-70 pointer-events-none" />
                    </div>

                    <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-zinc-400">
                        <span
                          className={`font-semibold ${
                            ev.eventStatus === 'Upcoming' ? 'text-emerald-400' : 'text-zinc-300'
                          }`}
                        >
                          {ev.eventStatus}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{ev.category}</span>
                        <span className="hidden sm:inline" aria-hidden="true">·</span>
                        <span className="hidden sm:inline">{ev.displayDate || ev.date}</span>
                      </div>

                      <h3 className="text-xs sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug text-balance">
                        {ev.title}
                      </h3>

                      <p className="text-[11px] sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {ev.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5 text-[10px] sm:text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1 truncate min-w-0">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{ev.role}</span>
                    </span>
                    <span className="text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                      Preview &rarr;
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} mt-10 flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800/80`}>
                <p className="text-xs font-mono text-zinc-400">
                  Showing{' '}
                  <span className="text-emerald-400 font-bold">
                    {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)}
                  </span>{' '}
                  of <span className="text-white font-bold">{filteredEvents.length}</span> events
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

      {/* Event Preview Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl lg:max-w-6xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)] overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col p-3.5 sm:p-6 lg:p-7"
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 z-40 p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer shadow-lg"
                aria-label="Close event preview"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
                {/* Left Column: Event Photo / Slideshow */}
                <div className="w-full lg:w-[50%] shrink-0 flex flex-col justify-start">
                  {modalPhotos.length > 0 && (
                    <JourneyImageSlideshow
                      images={modalPhotos}
                      title={selectedEvent.title}
                      className="w-full h-48 sm:h-72 md:h-[340px] lg:h-[440px]"
                    />
                  )}
                </div>

                {/* Right Column: Details & Actions */}
                <div className="w-full lg:w-[50%] flex-1 flex flex-col min-h-0 lg:overflow-hidden">
                  <div className="pr-10 shrink-0 pb-3 border-b border-zinc-800/80 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span
                        className={`font-semibold ${
                          selectedEvent.eventStatus === 'Upcoming'
                            ? 'text-emerald-400'
                            : 'text-zinc-300'
                        }`}
                      >
                        {selectedEvent.eventStatus} Event
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedEvent.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedEvent.displayDate || selectedEvent.date}</span>
                    </div>

                    <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight text-balance">
                      {selectedEvent.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{selectedEvent.role}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{selectedEvent.venue}</span>
                      </span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="lg:overflow-y-auto space-y-3.5 py-3 pr-1 flex-1 min-h-0">
                    {selectedEvent.stats && selectedEvent.stats.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-emerald-300">
                        {selectedEvent.stats.map((stat, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>{stat}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed">
                      <FormattedText text={selectedEvent.summary} />
                    </div>

                    {selectedEvent.detailedDescription &&
                      selectedEvent.detailedDescription !== selectedEvent.summary && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2">
                          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                            Highlights &amp; Experience
                          </span>
                          <FormattedText text={selectedEvent.detailedDescription} />
                        </div>
                      )}

                    {selectedEvent.highlights && selectedEvent.highlights.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                          Key Outcomes
                        </h4>
                        <ul className="space-y-2">
                          {selectedEvent.highlights.map((h, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200 leading-relaxed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-3 mt-auto border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedEvent.eventStatus === 'Upcoming' && (
                        <a
                          href={buildGoogleCalendarUrl(selectedEvent)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Add to Calendar</span>
                        </a>
                      )}

                      {selectedEvent.registrationUrl && (
                        <a
                          href={selectedEvent.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Event Link</span>
                        </a>
                      )}

                      {selectedEvent.videoUrl && (
                        <a
                          href={selectedEvent.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-700 transition-colors whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Watch Recap</span>
                        </a>
                      )}

                      {selectedEvent.certificateUrl && (
                        <a
                          href={selectedEvent.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors whitespace-nowrap"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Certificate</span>
                        </a>
                      )}

                      {linkedProject && (
                        <button
                          type="button"
                          onClick={() => {
                            const slug = getProjectSlug(linkedProject);
                            setSelectedEvent(null);
                            window.dispatchEvent(
                              new CustomEvent('portfolio:navigate', {
                                detail: { path: `/projects/${slug}` },
                              })
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{linkedProject.title}</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
