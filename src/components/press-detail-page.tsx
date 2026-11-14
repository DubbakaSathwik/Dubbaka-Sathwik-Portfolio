import { useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  Newspaper,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import {
  SITE_CONFIG,
  applyDynamicDocumentMeta,
  buildPressStructuredData,
  getPressSlug,
  getProjectSlug,
  isItemPublished,
  stripFormattingMarkers,
} from '../config/seo';

interface PressDetailPageProps {
  slug: string;
  onNavigate: (path: string, options?: { scrollToId?: string }) => void;
}

export function PressDetailPage({ slug, onNavigate }: PressDetailPageProps) {
  const { data } = useCMS();
  const publishedMentions = (data.pressMentions || []).filter(isItemPublished);
  const publishedProjects = (data.projects || []).filter(isItemPublished);

  const item =
    publishedMentions.find((m) => getPressSlug(m) === slug || m.id === slug) || null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!item) {
      applyDynamicDocumentMeta({
        title: `Features & Press | ${SITE_CONFIG.siteName}`,
        description: 'External articles, competition profiles, and spotlight mentions of Dubbaka Sathwik.',
        pathname: `/press/${slug}`,
        ogType: 'website',
      });
      return;
    }

    const title =
      item.seo?.seoTitle || `${item.title} — ${item.sourceName} | ${SITE_CONFIG.author.name}`;
    const description =
      item.seo?.metaDescription ||
      stripFormattingMarkers(item.summary || item.detailedNotes || '').slice(0, 158);
    const keywords =
      item.seo?.keywords && item.seo.keywords.length > 0
        ? item.seo.keywords
        : [item.title, item.sourceName, item.category, SITE_CONFIG.author.name];

    applyDynamicDocumentMeta({
      title,
      description,
      keywords,
      pathname: `/press/${getPressSlug(item)}`,
      image: item.coverImage || SITE_CONFIG.defaultImage,
      ogType: 'article',
      structuredData: buildPressStructuredData(item),
    });
  }, [item, slug]);

  if (!item) {
    return (
      <section className="min-h-screen pt-28 pb-20 bg-[#050505] text-white px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 py-16">
          <p className="text-xs font-mono text-emerald-400">Features &amp; Press</p>
          <h1 className="text-3xl sm:text-4xl font-black">Feature Spotlight Not Found</h1>
          <p className="text-zinc-400 text-sm sm:text-base">
            This feature or external mention may have moved back to the main portfolio.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/', { scrollToId: 'features' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Features &amp; Press</span>
          </button>
        </div>
      </section>
    );
  }

  const relatedProject = item.relatedProjectId
    ? publishedProjects.find((p) => p.id === item.relatedProjectId)
    : null;

  return (
    <section className="min-h-screen pt-24 pb-20 bg-[#050505] text-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          type="button"
          onClick={() => onNavigate('/', { scrollToId: 'features' })}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Features &amp; Press</span>
        </button>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="text-emerald-400 font-semibold">{item.sourceName}</span>
            <span aria-hidden="true">·</span>
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.date}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
            {item.title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">{item.summary}</p>
        </header>

        {item.coverImage && (
          <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <img
              src={item.coverImage}
              alt={`${item.title} — ${item.sourceName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {item.detailedNotes && item.detailedNotes !== item.summary && (
          <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-2">
            <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <span>About This Feature</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">{item.detailedNotes}</p>
          </div>
        )}

        {item.highlights && item.highlights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Key Highlights
            </h2>
            <ul className="space-y-2.5">
              {item.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-3">
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Original Source ({item.sourceName})</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {relatedProject && (
            <button
              type="button"
              onClick={() => onNavigate(`/projects/${getProjectSlug(relatedProject)}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-semibold text-emerald-300 transition-colors cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>View {relatedProject.title}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
