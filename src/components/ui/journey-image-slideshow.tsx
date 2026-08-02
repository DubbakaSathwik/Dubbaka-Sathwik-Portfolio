import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JourneyImageSlideshowProps {
  images?: string[];
  title?: string;
}

export function JourneyImageSlideshow({ images = [], title = '' }: JourneyImageSlideshowProps) {
  // Filter out empty strings
  const validImages = images.filter((img) => img && img.trim() !== '');

  const [[page, direction], setPage] = useState([0, 1]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentIndex = ((page % validImages.length) + validImages.length) % validImages.length;

  // Auto slide every 4 seconds if more than 1 image
  useEffect(() => {
    if (validImages.length <= 1 || isPaused || isLightboxOpen) return;

    const timer = setInterval(() => {
      setPage(([prevPage]) => [prevPage + 1, 1]);
    }, 4000);

    return () => clearInterval(timer);
  }, [validImages.length, isPaused, isLightboxOpen]);

  if (validImages.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage(([prevPage]) => [prevPage - 1, -1]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage(([prevPage]) => [prevPage + 1, 1]);
  };

  const currentImage = validImages[currentIndex];

  const mainSlideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0,
      scale: 0.94,
    }),
    center: {
      zIndex: 10,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 150 : -150,
      opacity: 0,
      scale: 0.94,
    }),
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full h-72 sm:h-96 md:h-[420px] lg:h-[460px] rounded-2xl overflow-hidden bg-black/90 border border-emerald-500/40 group shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center"
      >
        {/* Background Blurred Image Fill for aesthetics */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-125 opacity-40 pointer-events-none"
            style={{ backgroundImage: `url(${currentImage})` }}
          />
        </AnimatePresence>

        {/* Foreground Main Image (fitted crisp & full with horizontal sliding motion effect) */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={`img-${page}`}
            src={currentImage}
            alt={`${title} - Photo ${currentIndex + 1}`}
            custom={direction}
            variants={mainSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 280, damping: 28 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.35 },
            }}
            className="relative z-10 max-w-full max-h-full object-contain mx-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
          />
        </AnimatePresence>

        {/* Subtle overlay gradient at top & bottom */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-20" />

        {/* Expand / Lightbox Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-black/70 hover:bg-emerald-600 text-zinc-300 hover:text-white border border-emerald-500/40 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-mono"
          title="Click for Fullscreen View"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Expand Photo</span>
        </button>

        {/* 1 Static Image Badge */}
        {validImages.length === 1 && (
          <div className="absolute bottom-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-lg">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Milestone Photograph</span>
          </div>
        )}

        {/* Multiple Images Navigation Controls */}
        {validImages.length > 1 && (
          <>
            {/* Left Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Photo"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-black/80 hover:bg-emerald-600 text-white border border-emerald-500/50 backdrop-blur-md transition-all shadow-xl hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-emerald-300" />
            </button>

            {/* Right Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Photo"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-black/80 hover:bg-emerald-600 text-white border border-emerald-500/50 backdrop-blur-md transition-all shadow-xl hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-emerald-300" />
            </button>

            {/* Slide Dots & Counter Indicator */}
            <div className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-between px-4 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40">
                {validImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dir = idx >= currentIndex ? 1 : -1;
                      setPage([idx, dir]);
                    }}
                    className={`h-2 rounded-full transition-all pointer-events-auto ${
                      idx === currentIndex
                        ? 'w-6 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]'
                        : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>

              <span className="text-xs font-mono font-bold text-emerald-300 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{currentIndex + 1} / {validImages.length}</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
          >
            <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center justify-center">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-2 right-2 sm:-top-12 sm:right-0 z-10 p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-red-600 text-white border border-zinc-700 transition-all cursor-pointer shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Photo Title / Counter */}
              <div className="absolute top-2 left-2 sm:-top-12 sm:left-0 z-10 text-xs sm:text-sm font-mono text-emerald-400 bg-black/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                {title} • Photo {currentIndex + 1} of {validImages.length}
              </div>

              {/* Fullscreen Image */}
              <img
                src={currentImage}
                alt={`${title} - Fullscreen View`}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-emerald-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Lightbox Navigation controls if multiple */}
              {validImages.length > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-3 rounded-2xl bg-zinc-900/90 hover:bg-emerald-600 text-white border border-emerald-500/40 cursor-pointer shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-mono text-zinc-300">
                    {currentIndex + 1} / {validImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-3 rounded-2xl bg-zinc-900/90 hover:bg-emerald-600 text-white border border-emerald-500/40 cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
