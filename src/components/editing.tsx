import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Play, Eye, Sparkles, X, Video, Image as ImageIcon, ExternalLink, Calendar, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { CreativeItem } from '../types';

export function EditingSection() {
  const { data } = useCMS();
  const items = data.creativePortfolio || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<CreativeItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 6;

  const categories = ['All', 'College Event Designs', 'Posters & Images', 'Video Editing'];

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : selectedCategory === 'Posters & Images'
      ? items.filter((item) =>
          ['Posters & Images', 'NSS Works', 'Instagram Creatives', 'Personal Creative Works', 'Poster Design', 'Photo Editing', 'Advertisements', 'Social Media Posts', 'Project Branding', 'Thumbnail Design'].includes(item.category)
        )
      : items.filter((item) => item.category === selectedCategory);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const section = document.getElementById('editing');
      if (section) {
        const navOffset = 85;
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
    <section id="editing" className="py-24 bg-[#08080a] relative overflow-hidden border-t border-zinc-900">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Swapped Position (Nav-bar on left, Text on right) */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-end justify-between gap-6 mb-12">
          {/* Compressed Category Filter Pills (Left side) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800/80">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Section Heading & Text (Right side) */}
          <div className="space-y-2.5 lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Design • Posters • Videos • NSS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Creative <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Portfolio</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl lg:ml-auto">
              Posters, video edits, social media creatives, NSS awareness banners, and photo designs crafted by Dubbaka Sathwik.
            </p>
          </div>
        </div>

        {/* Creative Cards Grid */}
        <div className="flex flex-wrap justify-center gap-6">
          {currentItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onClick={() => setActiveItem(item)}
              className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] group cursor-pointer rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative h-56 w-full bg-black overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-black/20 to-transparent" />

                {/* Video Play or View Badge */}
                {item.videoUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.8)] group-hover:scale-110 transition-all duration-300">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}

                {/* Top Category & Featured Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    {item.category}
                  </span>
                  {item.featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600/90 text-white shadow-md">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Info Block */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                    {item.shortDescription}
                  </p>
                </div>

                {/* Software Badges & Posted Link */}
                <div className="pt-2 flex flex-col gap-2 border-t border-zinc-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {item.softwareUsed.map((sw) => (
                        <span
                          key={sw}
                          className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px] font-mono"
                        >
                          {sw}
                        </span>
                      ))}
                    </div>
                    {item.completionDate && (
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" /> {item.completionDate}
                      </span>
                    )}
                  </div>

                  {/* Posted on Platform Link Button (appears ONLY if platformUrl is provided) */}
                  {item.platformUrl && (
                    <a
                      href={item.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-mono text-[11px] font-semibold transition-all duration-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Posted Work</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Pagination Bar (< 1 2 >) */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800/80">
            <p className="text-xs font-mono text-zinc-400">
              Showing <span className="text-emerald-400 font-bold">{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="text-white font-bold">{filteredItems.length}</span> creative works
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

      {/* Creative Detail Preview Modal */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-zinc-950 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                    {activeItem.videoUrl ? <Video className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{activeItem.title}</h3>
                    <p className="text-xs text-zinc-400 font-mono">{activeItem.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Preview Container */}
              <div className="overflow-y-auto p-6 space-y-6">
                {activeItem.videoUrl ? (
                  <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-zinc-800">
                    <iframe
                      src={activeItem.videoUrl}
                      title={activeItem.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-[400px]">
                    <img
                      src={activeItem.thumbnail}
                      alt={activeItem.title}
                      className="w-full h-full object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Description & Metadata */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">About This Creative Work</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {activeItem.detailedDescription || activeItem.shortDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                        Tools / Software
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {activeItem.softwareUsed.map((sw) => (
                          <span key={sw} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono">
                            {sw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                        Tags & Category
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {activeItem.tags.map((tg) => (
                          <span key={tg} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-mono">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between gap-3">
                {activeItem.platformUrl ? (
                  <a
                    href={activeItem.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Post on Platform</span>
                  </a>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setActiveItem(null)}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
