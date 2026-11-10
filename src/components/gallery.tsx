import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ExternalLink, X, Calendar, MapPin, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Image as ImageIcon, Layers, LayoutGrid, Maximize2 } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { GalleryItem } from '../types';
import { FormattedText } from '../lib/text-formatter';
import { StackedCardDeck } from './ui/stacked-card-deck';
import { DataLoadingState } from './ui/data-loading-state';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';

// Mini card slideshow with 4-second auto shift & sliding motion effect
function GalleryCardSlideshow({ images, title }: { images: string[]; title: string }) {
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
          src={validImages[currentIndex] || '/uploads/assets/static_gallery_0_image_4e182a45cd.jpg'}
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

export function GallerySection() {
  const { data } = useCMS();
  const items = data.gallery || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'stack' | 'grid'>('grid');
  const [expandedCertImage, setExpandedCertImage] = useState<string | null>(null);
  const [expandedCertTitle, setExpandedCertTitle] = useState<string>('');

  const ITEMS_PER_PAGE = 6;

  const defaultCategories = ['All', 'Certificates', 'Awards', 'Hackathons', 'NSS and IEEE', 'Academics'];
  const excludedCategories = new Set(['NSS', 'Workspace', 'Posters', 'Behind the Scenes', 'NSS & Volunteering']);

  const galleryItemCategories = items.map((item) => item.category).filter(Boolean);
  const rawCategories = Array.from(new Set([...defaultCategories, ...galleryItemCategories]));
  const categories = rawCategories.filter((cat) => !excludedCategories.has(cat));

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((item) => {
          if (selectedCategory === 'Awards') {
            return item.category === 'Awards' || item.category === 'Awards & Achievements';
          }
          if (selectedCategory === 'Certificates') {
            return item.category === 'Certificates' || item.category === 'Certification';
          }
          if (selectedCategory === 'NSS and IEEE' || selectedCategory === 'NSS & Volunteering') {
            return item.category.includes('NSS') || item.category.includes('IEEE') || item.category.includes('Volunteering');
          }
          return item.category === selectedCategory;
        });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      const section = document.getElementById('gallery');
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

  const handleOpenDetail = (item: GalleryItem) => {
    setActiveItem(item);
    setActiveImageIndex(0);
  };

  return (
    <section id="gallery" className="pt-8 pb-16 sm:pt-8 sm:pb-20 bg-[#08080a] relative overflow-hidden border-t border-zinc-900 scroll-mt-16 sm:scroll-mt-20">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header (Filter Navbar on Left, Title on Right) */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-12">
          {/* Category Filter Pills on the LEFT */}
          <div className="flex flex-nowrap items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Section Title & Subtitle on the RIGHT */}
          <div className="space-y-3 flex flex-col items-start lg:items-end lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certifications & Honors Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight whitespace-nowrap">
              Certificates & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Awards</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
              Official certifications, academic recognitions, hackathon achievements, and NSS leadership honors.
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

        {items.length === 0 ? (
          <DataLoadingState message="Certificates & Credentials Data is Loading....." />
        ) : (
          <>
            {/* Mobile Stacked Cards Deck View */}
            {mobileViewMode === 'stack' && (
              <div className="md:hidden w-full my-2">
                <StackedCardDeck
                  items={filteredItems}
              keyExtractor={(item: any) => item.id}
              onCardClick={(item: any) => handleOpenDetail(item)}
              cardHeightClass="h-[430px]"
              renderCard={(item: any) => {
                const itemImageList = item.images && item.images.length > 0
                  ? item.images
                  : [item.image].filter(Boolean);

                return (
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950 text-left">
                    <div>
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-zinc-900 mb-3">
                        <div className="pointer-events-none w-full h-full">
                          <GalleryCardSlideshow images={itemImageList} title={item.title} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 pointer-events-none" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-zinc-900/90 text-emerald-400 border border-emerald-500/30">
                          {item.category}
                        </span>
                        {item.featured && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mb-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{item.date}</span>
                      </div>

                      <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {item.issuer && (
                        <p className="text-xs text-emerald-400/90 font-mono mt-1 font-medium truncate">
                          Issued by {item.issuer}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 mt-2">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">{item.category}</span>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        View Certificate &rarr;
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Certificates Grid (Laptop & Mobile Grid View) */}
        <div className={`${mobileViewMode === 'stack' ? 'hidden md:flex' : 'flex'} flex-wrap justify-center gap-3 sm:gap-6 min-h-[500px]`}>
          {currentItems.map((item, idx) => {
            const itemImageList = item.images && item.images.length > 0
              ? item.images
              : [item.image].filter(Boolean);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] group rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-emerald-500/40 overflow-hidden shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Header Image with Slideshow support */}
                  <div
                    className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <GalleryCardSlideshow images={itemImageList} title={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 pointer-events-none" />

                    {/* Category Badge */}
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-zinc-900/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 z-10">
                      {item.category}
                    </span>

                    {/* Featured Badge */}
                    {item.featured && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-600/90 text-white border border-emerald-400/40 shadow-sm flex items-center gap-1 z-10">
                        ★ <span className="hidden sm:inline">Featured</span>
                      </span>
                    )}

                    {/* Hover Overlay Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 sm:p-4 z-20">
                      <button
                        type="button"
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 text-white font-mono font-bold text-[10px] sm:text-xs shadow-lg shadow-emerald-950/80 flex items-center gap-1 sm:gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                      >
                        <span>View Certificate</span>
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                        <span>{item.date}</span>
                      </span>
                      {item.location && (
                        <span className="hidden sm:flex items-center gap-1 text-zinc-500 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-emerald-400/70 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="text-xs sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 sm:line-clamp-2 cursor-pointer leading-snug"
                    >
                      {item.title}
                    </h3>

                    <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      <FormattedText text={item.description} />
                    </div>

                    {/* Tech Tags / Skills */}
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {item.technologies.slice(0, 4).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                          >
                            {tech}
                          </span>
                        ))}
                        {item.technologies.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-500">
                            +{item.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="px-5 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-600 text-zinc-300 hover:text-white font-mono font-bold text-xs border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                    <span>Certificate Details</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Pagination Bar (< Prev  1  2  Next >) */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800/80">
            <p className="text-xs font-mono text-zinc-400">
              Showing <span className="text-emerald-400 font-bold">{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="text-white font-bold">{filteredItems.length}</span> certificates & awards
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
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeItem && (
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
              className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)] overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6 lg:p-7"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-40 p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-colors cursor-pointer shadow-lg"
                aria-label="Close preview"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* 2-Column Responsive Layout: Certificate Image on Left, Details on Right */}
              <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 flex-1 min-h-0 overflow-hidden">
                {/* Left Column: Certificate Image Slideshow */}
                <div className="w-full lg:w-[56%] xl:w-[58%] shrink-0 flex flex-col justify-start">
                  <JourneyImageSlideshow
                    images={
                      activeItem.images && activeItem.images.length > 0
                        ? activeItem.images
                        : [activeItem.image].filter(Boolean) as string[]
                    }
                    title={activeItem.title}
                    className="w-full h-64 sm:h-80 md:h-[380px] lg:h-[460px] xl:h-[500px]"
                  />
                </div>

                {/* Right Column: Title, Metadata, Skills & Verification Action */}
                <div className="w-full lg:w-[44%] xl:w-[42%] flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Header */}
                  <div className="pr-10 shrink-0 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700/60 text-emerald-400 whitespace-nowrap shrink-0">
                        {activeItem.category}
                      </span>
                      {activeItem.featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-emerald-600 text-white shadow-sm whitespace-nowrap shrink-0">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mb-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{activeItem.date}</span>
                      </span>
                      {activeItem.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{activeItem.location}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight break-words">
                      {activeItem.title}
                    </h3>
                  </div>

                  {/* Scrollable Details Area */}
                  <div className="overflow-y-auto space-y-3.5 py-3 pr-1.5 flex-1 min-h-0">
                    {/* Description Text */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed shadow-sm space-y-1">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Certificate Details:
                      </span>
                      <FormattedText text={activeItem.detailedDescription || activeItem.description} />
                    </div>

                    {/* Tech / Skills Tags */}
                    {activeItem.technologies && activeItem.technologies.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                          Technologies & Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeItem.technologies.map((tech, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer / Action */}
                  <div className="pt-3.5 mt-auto border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
                    {activeItem.credentialUrl ? (
                      <a
                        href={activeItem.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Verify Credential Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveItem(null)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer ml-auto"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Certificate Image Lightbox Modal */}
      <AnimatePresence>
        {expandedCertImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedCertImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-4 sm:p-8 flex flex-col items-center justify-between"
          >
            {/* Lightbox Header Bar */}
            <div className="w-full max-w-6xl flex items-center justify-between text-white z-10 bg-zinc-950/90 p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-mono font-bold text-emerald-300 truncate">
                  {expandedCertTitle || 'Certificate Full View'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setExpandedCertImage(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                title="Close Full View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Main Image */}
            <div className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-4 overflow-hidden">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={expandedCertImage}
                alt="Expanded Certificate"
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-emerald-500/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Lightbox Footer */}
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 bg-zinc-900/90 px-4 py-2 rounded-full border border-zinc-800 shadow-lg">
              <span className="text-emerald-400 font-bold">★</span> Click anywhere outside or press Close to exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
