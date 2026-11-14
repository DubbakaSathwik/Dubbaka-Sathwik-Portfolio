import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarPlus,
  Check,
  ExternalLink,
  MapPin,
  MessageSquare,
  Play,
  Share2,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { EventItem, Project } from '../types';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';
import { FormattedText } from '../lib/text-formatter';
import {
  SITE_CONFIG,
  applyDynamicDocumentMeta,
  buildEventStructuredData,
  getEventSlug,
  getProjectSlug,
  isItemPublished,
  stripFormattingMarkers,
} from '../config/seo';

interface EventDetailPageProps {
  slug: string;
  onNavigate: (path: string, options?: { scrollToId?: string; prefillSubject?: string }) => void;
}

function buildGoogleCalendarUrl(ev: EventItem): string {
  const cleanDate = (ev.date || '2026-08-15').replace(/-/g, '').slice(0, 8);
  const start = /^\d{8}$/.test(cleanDate) ? cleanDate : '20260815';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${start}`,
    details: `${ev.summary}\n\nRole: ${ev.role}\nPortfolio: ${SITE_CONFIG.baseUrl}/events/${getEventSlug(ev)}`,
    location: ev.venue || 'Hyderabad, India',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventDetailPage({ slug, onNavigate }: EventDetailPageProps) {
  const { data } = useCMS();
  const [copiedLink, setCopiedLink] = useState(false);

  const publishedEvents = useMemo(() => (data.events || []).filter(isItemPublished), [data.events]);
  const evIndex = publishedEvents.findIndex((e) => getEventSlug(e) === slug);
  const ev: EventItem | undefined = evIndex >= 0 ? publishedEvents[evIndex] : undefined;

  const relatedProject: Project | undefined = useMemo(() => {
    if (!ev?.relatedProjectId) return undefined;
    return (data.projects || []).find((p) => p.id === ev.relatedProjectId && isItemPublished(p));
  }, [data.projects, ev]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (ev) {
      const seoTitle = ev.seo?.seoTitle || `${ev.title} — ${SITE_CONFIG.author.name}`;
      const metaDesc =
        ev.seo?.metaDescription ||
        stripFormattingMarkers(ev.summary || ev.detailedDescription || '').slice(0, 158);
      const keywords =
        ev.seo?.keywords && ev.seo.keywords.length > 0
          ? ev.seo.keywords
          : [ev.title, ev.category, ev.venue, 'Dubbaka Sathwik'];

      applyDynamicDocumentMeta({
        title: seoTitle,
        description: metaDesc,
        keywords,
        pathname: `/events/${getEventSlug(ev)}`,
        image: ev.coverImage || ev.images?.[0] || SITE_CONFIG.defaultImage,
        ogType: 'article',
        structuredData: buildEventStructuredData(ev),
      });
    } else {
      applyDynamicDocumentMeta({
        title: `Event Not Found | ${SITE_CONFIG.siteName}`,
        description: SITE_CONFIG.defaultDescription,
        pathname: `/events/${slug}`,
      });
    }
  }, [ev, slug]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/events/${slug}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!ev) {
    return (
      <section className="min-h-[75vh] pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-[#050505] flex items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800 text-center space-y-5">
          <Award className="w-10 h-10 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">Event Not Found</h1>
          <p className="text-sm text-zinc-400">
            This event entry may have moved or is currently saved as a draft.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/insights')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Insights &amp; Events</span>
          </button>
        </div>
      </section>
    );
  }

  const photos =
    ev.images && ev.images.length > 0
      ? ev.images
      : [ev.coverImage].filter((x): x is string => Boolean(x));

  return (
    <article className="min-h-screen pt-24 sm:pt-28 pb-20 bg-[#050505] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Breadcrumbs */}
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
              Insights &amp; Events
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {ev.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => onNavigate('/insights')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Events &amp; Insights</span>
          </button>
        </div>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="text-emerald-400 font-semibold">{ev.eventStatus} Event</span>
            <span aria-hidden="true">·</span>
            <span>{ev.category}</span>
            <span aria-hidden="true">·</span>
            <span>{ev.displayDate || ev.date}</span>
            <span aria-hidden="true">·</span>
            <span>Role: {ev.role}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-balance">
            {ev.title}
          </h1>

          <p className="text-sm text-zinc-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{ev.venue}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {ev.registrationUrl && (
              <a
                href={ev.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{ev.eventStatus === 'Upcoming' ? 'Register / Join Event' : 'Official Event Page'}</span>
              </a>
            )}

            <a
              href={buildGoogleCalendarUrl(ev)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-800 transition-colors whitespace-nowrap"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-400" />
              <span>Add to Google Calendar</span>
            </a>

            {ev.videoUrl && (
              <a
                href={ev.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-800 transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Watch Recap Video</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono border border-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Event'}</span>
            </button>
          </div>
        </header>

        {/* Stats Row */}
        {ev.stats && ev.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ev.stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800 text-sm font-semibold text-white tabular-nums"
              >
                {stat}
              </div>
            ))}
          </div>
        )}

        {/* Slideshow / Gallery */}
        {photos.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
            <JourneyImageSlideshow
              images={photos}
              title={ev.title}
              className="w-full h-64 sm:h-96 md:h-[440px]"
            />
          </div>
        )}

        {/* Details & Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <section className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-3">
              <h2 className="text-lg font-bold text-white">Event Overview</h2>
              <div className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                <FormattedText text={ev.detailedDescription || ev.summary} />
              </div>
            </section>

            {ev.highlights && ev.highlights.length > 0 && (
              <section className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4">
                <h2 className="text-lg font-bold text-white">Key Contributions &amp; Takeaways</h2>
                <ul className="space-y-2.5 list-disc pl-5 text-sm sm:text-base text-zinc-300">
                  {ev.highlights.map((item, idx) => (
                    <li key={idx} className="marker:text-emerald-400">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            {ev.certificateUrl && (
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-3">
                <p className="text-xs font-mono text-emerald-400 font-semibold">Credential</p>
                <a
                  href={ev.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-400 transition-colors"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>View Official Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {relatedProject && (
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-3">
                <p className="text-xs font-mono text-emerald-400 font-semibold">Project Built at Event</p>
                <h3 className="text-base font-bold text-white">{relatedProject.title}</h3>
                <button
                  type="button"
                  onClick={() => onNavigate(`/projects/${getProjectSlug(relatedProject)}`)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Project Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-emerald-500/30 space-y-3">
              <h3 className="text-base font-bold text-white">Invite or Collaborate</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Looking for a student speaker, hackathon team lead, or NSS/IEEE technical collaborator?
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate('/', {
                    scrollToId: 'contact',
                    prefillSubject: `Inquiry regarding event: ${ev.title}`,
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Sathwik</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
