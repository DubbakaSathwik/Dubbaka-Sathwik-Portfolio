import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Sparkles, Code2, ArrowUpRight, X, Image as ImageIcon, ChevronLeft, ChevronRight, Layers, LayoutGrid } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { Project } from '../types';
import { FormattedText } from '../lib/text-formatter';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';
import { StackedCardDeck } from './ui/stacked-card-deck';

// Mini card slideshow with 4-second auto shift & sliding motion effect
function ProjectCardSlideshow({ images, title }: { images: string[]; title: string }) {
  const validImages = images.filter((img) => img && img.trim() !== '');
  const [[page, direction], setPage] = useState([0, 1]);

  const currentIndex = ((page % validImages.length) + validImages.length) % validImages.length;

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(() => {
      setPage(([prevPage]) => [prevPage + 1, 1]);
    }, 4000);
    return () => clearInterval(timer);
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
        <ImageIcon className="w-8 h-8" />
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.08,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={page}
          src={validImages[currentIndex] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800'}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 280, damping: 28 },
            opacity: { duration: 0.35 },
            scale: { duration: 0.4 },
          }}
          alt={`${title} photo ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </AnimatePresence>
      {validImages.length > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currentIndex + 1}/{validImages.length}</span>
        </div>
      )}
    </div>
  );
}

export function ProjectsSection() {
  const { data } = useCMS();
  const projects = data.projects || [];

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'stack' | 'grid'>('stack');

  const ITEMS_PER_PAGE = 6;

  // Dynamic filter categories reflecting any new main tags created in CMS
  const defaultCategories = ['All', 'Full-Stack', 'Web Apps', 'Tools', 'Personal', 'College Projects'];
  const excludedCategories = new Set(['AI & ML', 'Backend', 'Frontend']);
  const projectCategories = projects
    .map((p) => p.category)
    .filter(Boolean)
    .filter((c) => !excludedCategories.has(c));
  const categories = Array.from(new Set([...defaultCategories, ...projectCategories]));

  const filteredProjects =
    selectedCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const section = document.getElementById('projects');
      if (section) {
        const navOffset = 85; // Account for fixed top navbar
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <section id="projects" className="pt-8 pb-16 sm:pt-8 sm:pb-20 bg-[#050505] relative overflow-hidden scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engineering Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Projects</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
              Production-ready web apps, spatial 3D tools, and full-stack software built by Dubbaka Sathwik.
            </p>
          </div>

          {/* Filter Pills strictly in a SINGLE LINE */}
          <div className="flex flex-nowrap items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Switcher (Stack Deck vs Grid) */}
        <div className="md:hidden flex items-center justify-between gap-1 mb-3 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-full overflow-hidden">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 pl-1 shrink-0 whitespace-nowrap">Mobile Layout:</span>
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

        {/* Mobile Stacked Cards Deck View */}
        {mobileViewMode === 'stack' && (
          <div className="md:hidden w-full my-2">
            <StackedCardDeck
              items={filteredProjects}
              keyExtractor={(item: any) => item.id}
              onCardClick={(project: any) => setSelectedProject(project)}
              cardHeightClass="h-[440px]"
              renderCard={(project: any) => {
                const projectImageList = project.images && project.images.length > 0
                  ? project.images
                  : [project.thumbnail || (project as any).image].filter(Boolean);

                return (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950 text-left">
                    <div>
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-zinc-900 mb-3">
                        <div className="pointer-events-none w-full h-full">
                          <ProjectCardSlideshow images={projectImageList} title={project.title} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-zinc-950/80 text-emerald-400 border border-emerald-500/30">
                          {project.category}
                        </span>
                        {project.featured && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors flex items-center justify-between gap-1">
                        <span className="line-clamp-1">{project.title}</span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      </h3>

                      <div className="text-zinc-400 text-xs line-clamp-3 mt-1.5 leading-relaxed">
                        <FormattedText text={project.description} />
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2">
                        {(project.tags || project.technologies || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[9px] font-mono border border-zinc-700/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 mt-2">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">{project.category}</span>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Projects Grid (Laptop & Mobile Grid View) */}
        <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} flex-wrap justify-center gap-3 sm:gap-6 lg:gap-8 min-h-[500px]`}>
          {currentProjects.map((project, idx) => {
            const projectImageList = project.images && project.images.length > 0
              ? project.images
              : [project.thumbnail || (project as any).image].filter(Boolean);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onClick={() => setSelectedProject(project)}
                className="w-[calc(50%-0.375rem)] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] group cursor-pointer rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Image & Overlay (Auto 4s Slideshow) */}
                  <div className="relative h-32 sm:h-52 w-full overflow-hidden bg-zinc-950">
                    <ProjectCardSlideshow images={projectImageList} title={project.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80 pointer-events-none" />

                    {/* Category Pill */}
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-zinc-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 z-10">
                      {project.category}
                    </span>

                    {project.featured && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-md z-10">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    <h3 className="text-sm sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between gap-1">
                      <span className="line-clamp-1">{project.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </h3>

                    <div className="text-zinc-400 text-[11px] sm:text-sm line-clamp-2 leading-relaxed">
                      <FormattedText text={project.description} />
                    </div>

                    {/* Tech Tags */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1 sm:pt-2">
                      {(project.tags || project.technologies || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-800/80 text-zinc-300 text-[9px] sm:text-[11px] font-mono border border-zinc-700/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px] text-emerald-400/90">{project.category}</span>
                  <span className="text-zinc-500 hover:text-white flex items-center gap-1 font-medium">
                    View Details &rarr;
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Pagination Bar (< 1 2 >) */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800/80">
            <p className="text-xs font-mono text-zinc-400">
              Showing <span className="text-emerald-400 font-bold">{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredProjects.length)}</span> of <span className="text-white font-bold">{filteredProjects.length}</span> technical projects
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                        ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-500'
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
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (() => {
          const popupImageList = selectedProject.images && selectedProject.images.length > 0
            ? selectedProject.images
            : [selectedProject.thumbnail || (selectedProject as any).image].filter(Boolean);

          const liveUrl = selectedProject.demoUrl || (selectedProject as any).liveUrl;
          const gitUrl = selectedProject.githubUrl;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
              onClick={() => setSelectedProject(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl sm:max-w-2xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col p-4 sm:p-6 space-y-4"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer shadow-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Header */}
                <div className="pr-10 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 whitespace-nowrap shrink-0">
                      {selectedProject.category}
                    </span>
                    {selectedProject.featured && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5 tracking-tight break-words">
                    {selectedProject.title}
                  </h3>
                </div>

                {/* Scrollable Content Body */}
                <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                  {/* Photo Slideshow */}
                  {popupImageList.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg">
                      <JourneyImageSlideshow images={popupImageList} title={selectedProject.title} />
                    </div>
                  )}

                  {/* Descriptions */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                      <span className="text-emerald-400 font-mono font-semibold block mb-1">Card Summary:</span>
                      <FormattedText text={selectedProject.description} />
                    </div>

                    {((selectedProject as any).longDescription || (selectedProject as any).detailedDescription) && (
                      <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/25 text-xs sm:text-sm text-zinc-100 leading-relaxed space-y-2 shadow-inner">
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          Detailed Project Breakdown:
                        </span>
                        <FormattedText text={(selectedProject as any).longDescription || (selectedProject as any).detailedDescription} />
                      </div>
                    )}
                  </div>

                  {/* Tech Stack */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Technologies & Frameworks
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedProject.tags || selectedProject.technologies || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* External Action Links */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {liveUrl && liveUrl.trim() !== '' && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/60 hover:scale-105"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Product Demo</span>
                      </a>
                    )}
                    {gitUrl && gitUrl.trim() !== '' && (
                      <a
                        href={gitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-700 transition-all hover:border-emerald-500/50 hover:scale-105"
                      >
                        <Github className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Git Repository</span>
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="text-xs font-mono text-zinc-400 hover:text-white cursor-pointer ml-auto"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
