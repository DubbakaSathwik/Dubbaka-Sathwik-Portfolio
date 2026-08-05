import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Play,
  Sparkles,
  X,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  Layers,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { CreativeItem } from '../types';
import { FormattedText } from '../lib/text-formatter';
import { StackedCardDeck } from './ui/stacked-card-deck';

export function EditingSection() {
  const { data } = useCMS();
  const items = data.creativePortfolio || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<CreativeItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'stack' | 'grid'>('stack');

  const ITEMS_PER_PAGE = 6;

  const categories = ['All', 'College Event Designs', 'Posters & Images', 'Video Editing'];

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : selectedCategory === 'Posters & Images'
      ? items.filter((item) =>
          [
            'Posters & Images',
            'NSS Works',
            'Instagram Creatives',
            'Personal Creative Works',
            'Poster Design',
            'Photo Editing',
            'Advertisements',
            'Social Media Posts',
            'Project Branding',
            'Thumbnail Design',
          ].includes(item.category)
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

  const handleOpenItem = (item: CreativeItem) => {
    setActiveItem(item);
    setActiveImageIndex(0);
  };

  return (
    <section
      id="editing"
      className="pt-8 pb-16 sm:pt-8 sm:pb-20 bg-[#08080a] relative overflow-hidden border-t border-zinc-900 scroll-mt-16 sm:scroll-mt-20"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-12">
          {/* Category Filter Pills */}
          <div className="flex flex-nowrap items-center gap-1.5 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80 shrink-0 max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Section Heading & Text */}
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
              items={filteredItems}
              keyExtractor={(item: any) => item.id}
              onCardClick={(item: any) => handleOpenItem(item)}
              cardHeightClass="h-[420px]"
              renderCard={(item: any) => {
                const cover = item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800';
                const photoCount = item.images ? item.images.length : 1;

                return (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950 text-left cursor-pointer">
                    <div>
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-black mb-3">
                        <img
                          src={cover}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {item.videoUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-black/70 backdrop-blur-md text-emerald-400 border border-white/10 text-[10px] font-mono font-bold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {photoCount > 1 && <span>+{photoCount}</span>}
                          </div>
                        )}

                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-black/80 text-emerald-400 border border-emerald-500/30">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mt-1">
                        <FormattedText text={item.shortDescription} />
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2">
                        {(item.softwareUsed || []).slice(0, 3).map((sw: string) => (
                          <span key={sw} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[9px] font-mono">
                            {sw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 mt-2">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">{item.category}</span>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        View Work &rarr;
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Creative Cards Grid */}
        <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} flex-wrap justify-center gap-3 sm:gap-6`}>
          {currentItems.map((item, idx) => {
            const cover = item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800';
            const photoCount = item.images ? item.images.length : 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                onClick={() => handleOpenItem(item)}
                className="w-[calc(50%-0.375rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] group cursor-pointer rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div className="relative h-32 sm:h-56 w-full bg-black overflow-hidden">
                  <img
                    src={cover}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-black/20 to-transparent" />

                  {/* Video Play or Image Count Badge */}
                  {item.videoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.8)] group-hover:scale-110 transition-all duration-300">
                        <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-white ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 rounded-xl bg-black/70 backdrop-blur-md text-emerald-400 border border-white/10 text-[10px] font-mono font-bold flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {photoCount > 1 && <span>+{photoCount}</span>}
                    </div>
                  )}

                  {/* Top Category & Featured Badges */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {item.category}
                    </span>
                    {item.featured && (
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-600/90 text-white shadow-md">
                        ★ <span className="hidden sm:inline">Featured</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1 sm:space-y-1.5">
                    <h3 className="text-xs sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                      <FormattedText text={item.shortDescription} />
                    </div>
                  </div>

                  {/* Software Badges & Date */}
                  <div className="pt-2 flex flex-col gap-2 border-t border-zinc-800/80">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {(item.softwareUsed || []).map((sw) => (
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

                    {/* Posted Link Button */}
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
            );
          })}
        </div>

        {/* Bottom Pagination Bar */}
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
        {activeItem && (() => {
          const creativeImageList =
            activeItem.images && activeItem.images.length > 0
              ? activeItem.images
              : [activeItem.thumbnail].filter(Boolean);

          const currentPhoto = creativeImageList[activeImageIndex] || activeItem.thumbnail || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800';

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
              onClick={() => setActiveItem(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl sm:max-w-2xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col my-auto"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="absolute top-3.5 right-3.5 z-30 p-2 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-colors cursor-pointer shadow-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/90 shrink-0 pr-14">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 shrink-0">
                      {activeItem.videoUrl ? <Video className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">{activeItem.title}</h3>
                      <p className="text-[10px] sm:text-xs text-zinc-400 font-mono truncate">{activeItem.category}</p>
                    </div>
                  </div>
                </div>

                {/* Media Preview & Details Container */}
                <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
                  {/* Video Embed or Expandable Image Display */}
                  {activeItem.videoUrl ? (
                    <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 shrink-0 shadow-lg">
                      <iframe
                        src={activeItem.videoUrl}
                        title={activeItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        onClick={() => setExpandedImage(currentPhoto)}
                        className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black max-h-[360px] flex items-center justify-center shrink-0 cursor-pointer group shadow-xl"
                      >
                        <img
                          src={currentPhoto}
                          alt={activeItem.title}
                          className="w-full h-full object-contain max-h-[360px] group-hover:scale-102 transition-transform duration-300"
                        />
                        {/* Overlay Expand Badge */}
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Expand Image</span>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-zinc-300 text-[10px] font-mono">
                          🔍 Click photo to view full size
                        </div>
                      </div>

                      {/* Multiple Photos Switcher Strip */}
                      {creativeImageList.length > 1 && (
                        <div className="p-2 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-2 overflow-x-auto shrink-0">
                          {creativeImageList.map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveImageIndex(i)}
                              className={`relative aspect-[16/10] w-16 sm:w-20 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                                activeImageIndex === i
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/40 opacity-100 scale-105'
                                  : 'border-zinc-800 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Summary & Detailed Overview */}
                  <div className="space-y-3">
                    {/* Summary Box */}
                    {activeItem.shortDescription && (
                      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1">
                        <span className="text-emerald-400 font-mono font-bold block uppercase text-[10px] tracking-wider">
                          Card Summary:
                        </span>
                        <div className="text-xs text-zinc-200">
                          <FormattedText text={activeItem.shortDescription} />
                        </div>
                      </div>
                    )}

                    {/* Detailed Overview */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1">
                      <span className="text-emerald-400 font-mono font-bold block uppercase text-[10px] tracking-wider">
                        Detailed Description & Overview:
                      </span>
                      <div className="text-xs text-zinc-200 space-y-1">
                        <FormattedText
                          text={activeItem.detailedDescription || activeItem.shortDescription}
                        />
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-1 font-bold">
                          Tools / Software Used
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(activeItem.softwareUsed || []).map((sw) => (
                            <span
                              key={sw}
                              className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono"
                            >
                              {sw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-1 font-bold">
                          Category & Tags
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                            {activeItem.category}
                          </span>
                          {activeItem.featured && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold">
                              ★ Featured
                            </span>
                          )}
                          {(activeItem.tags || []).map((tg) => (
                            <span key={tg} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3.5 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                  {activeItem.platformUrl ? (
                    <a
                      href={activeItem.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Post on Platform</span>
                    </a>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Fullscreen Expanded Image Lightbox Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl"
            onClick={() => setExpandedImage(null)}
          >
            <div
              className="relative max-w-5xl max-h-[92vh] w-full h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2.5 rounded-full bg-zinc-900/90 hover:bg-red-600 text-zinc-300 hover:text-white border border-zinc-700 transition-colors shadow-2xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center p-2">
                <img
                  src={expandedImage}
                  alt="Expanded view"
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-emerald-500/30"
                />
              </div>

              {/* Bottom Bar in Lightbox */}
              <div className="mt-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 font-mono flex items-center gap-3">
                <span className="text-emerald-400 font-bold">{activeItem?.title}</span>
                <span className="text-zinc-500">•</span>
                <span>Click outside or X to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
