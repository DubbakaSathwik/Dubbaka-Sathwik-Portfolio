import { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Github,
  Sparkles,
  Calendar,
  Layers,
  MessageSquare,
  Share2,
  Check,
  Code2,
} from 'lucide-react';
import { useState } from 'react';
import { useCMS } from '../context/CMSContext';
import { Project } from '../types';
import { FormattedText } from '../lib/text-formatter';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';
import {
  SITE_CONFIG,
  applyDynamicDocumentMeta,
  buildProjectStructuredData,
  getProjectSlug,
  isItemPublished,
  stripFormattingMarkers,
} from '../config/seo';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string, options?: { scrollToId?: string; prefillSubject?: string }) => void;
}

export function ProjectDetailPage({ slug, onNavigate }: ProjectDetailPageProps) {
  const { data } = useCMS();
  const [copiedLink, setCopiedLink] = useState(false);

  const publishedProjects = (data.projects || []).filter(isItemPublished);
  const projectIndex = publishedProjects.findIndex((p) => getProjectSlug(p) === slug);
  const project: Project | undefined = projectIndex >= 0 ? publishedProjects[projectIndex] : undefined;

  const prevProject = projectIndex > 0 ? publishedProjects[projectIndex - 1] : null;
  const nextProject =
    projectIndex >= 0 && projectIndex < publishedProjects.length - 1
      ? publishedProjects[projectIndex + 1]
      : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (project) {
      const seoTitle = project.seo?.seoTitle || `${project.title} — Built by Dubbaka Sathwik`;
      const metaDesc =
        project.seo?.metaDescription ||
        stripFormattingMarkers(project.description || project.summary || project.longDescription || '').slice(0, 158);
      const keywords =
        project.seo?.keywords && project.seo.keywords.length > 0
          ? project.seo.keywords
          : [
              project.title,
              `${project.title} Dubbaka Sathwik`,
              'Dubbaka Sathwik',
              project.category,
              ...(project.technologies || project.tags || []),
            ];

      applyDynamicDocumentMeta({
        title: seoTitle,
        description: metaDesc,
        keywords,
        pathname: `/projects/${getProjectSlug(project)}`,
        image: project.thumbnail || project.images?.[0] || SITE_CONFIG.defaultImage,
        ogType: 'article',
        structuredData: buildProjectStructuredData(project),
      });
    } else {
      applyDynamicDocumentMeta({
        title: `Project Not Found | ${SITE_CONFIG.siteName}`,
        description: SITE_CONFIG.defaultDescription,
        pathname: `/projects/${slug}`,
      });
    }
  }, [project, slug]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/projects/${slug}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!project) {
    return (
      <section className="min-h-[75vh] pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-[#050505] flex items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center space-y-5">
          <Code2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">Project Case Study Not Found</h1>
          <p className="text-sm text-zinc-400">
            The project you are looking for may have moved or is currently saved as a draft.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/', { scrollToId: 'projects' })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Projects</span>
          </button>
        </div>
      </section>
    );
  }

  const imageList =
    project.images && project.images.length > 0
      ? project.images
      : [project.thumbnail || project.image].filter((x): x is string => Boolean(x));

  const liveUrl = project.demoUrl || (project as any).liveUrl;
  const gitUrl = project.githubUrl;
  const techList = Array.from(new Set([...(project.technologies || []), ...(project.tags || [])])).filter(Boolean);

  return (
    <article className="min-h-screen pt-24 sm:pt-28 pb-20 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-950/20 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Breadcrumb & Back */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigate('/', { scrollToId: 'projects' })}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Projects
            </button>
            <span>/</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {project.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => onNavigate('/', { scrollToId: 'projects' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Portfolio</span>
          </button>
        </div>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              {project.category}
            </span>
            {project.year && (
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-emerald-400" />
                {project.year}
              </span>
            )}
            {project.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-600 text-white inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured Project
              </span>
            )}
            {project.cardIdNo && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400">
                {project.cardIdNo}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {project.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400">
            Engineered by <span className="text-white font-semibold">Dubbaka Sathwik</span> • Full-Stack &amp; AI Portfolio Case Study
          </p>

          {/* Action Links Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {liveUrl && liveUrl.trim() !== '' && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/60"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Live Product Demo</span>
              </a>
            )}
            {gitUrl && gitUrl.trim() !== '' && (
              <a
                href={gitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm border border-zinc-700 hover:border-emerald-500/50 transition-all"
              >
                <Github className="w-4 h-4 text-emerald-400" />
                <span>GitHub Repository</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs border border-zinc-800 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Project'}</span>
            </button>
          </div>
        </header>

        {/* Visual Showcase */}
        {imageList.length > 0 && (
          <div className="rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2 sm:p-3 shadow-2xl">
            <JourneyImageSlideshow
              images={imageList}
              title={project.title}
              className="w-full h-64 sm:h-96 md:h-[460px]"
            />
          </div>
        )}

        {/* AI / Key Takeaway Box */}
        {project.seo?.tldr && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900/90 to-zinc-900/80 border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Key Takeaway &amp; Overview</span>
            </div>
            <p className="text-sm sm:text-base text-zinc-100 leading-relaxed">{project.seo.tldr}</p>
          </div>
        )}

        {/* Content Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Project Summary</span>
              </h2>
              <div className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                <FormattedText text={project.description || project.summary} />
              </div>
            </section>

            {project.longDescription && (
              <section className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-emerald-500/20 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Architecture &amp; Engineering Breakdown</span>
                </h2>
                <div className="text-sm sm:text-base text-zinc-200 leading-relaxed space-y-3">
                  <FormattedText text={project.longDescription} />
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Technologies &amp; Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {techList.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg bg-zinc-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30 space-y-4">
              <h3 className="text-base font-bold text-white">Interested in this build?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Want a walkthrough, collaboration, or custom full-stack/AI system built with similar architecture?
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate('/', {
                    scrollToId: 'contact',
                    prefillSubject: `Inquiry regarding project: ${project.title}`,
                  })
                }
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Sathwik About This Project</span>
              </button>
            </div>
          </aside>
        </div>

        {/* Previous / Next Project Navigation */}
        {(prevProject || nextProject) && (
          <div className="pt-8 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevProject ? (
              <button
                type="button"
                onClick={() => onNavigate(`/projects/${getProjectSlug(prevProject)}`)}
                className="p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
              >
                <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Previous Project
                </span>
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 mt-1 line-clamp-1">
                  {prevProject.title}
                </p>
              </button>
            ) : (
              <div />
            )}
            {nextProject && (
              <button
                type="button"
                onClick={() => onNavigate(`/projects/${getProjectSlug(nextProject)}`)}
                className="p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-right transition-all cursor-pointer group"
              >
                <span className="text-[11px] font-mono text-zinc-500 inline-flex items-center gap-1 justify-end">
                  Next Project <ArrowRight className="w-3 h-3" />
                </span>
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 mt-1 line-clamp-1">
                  {nextProject.title}
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
