import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface StackedCardDeckProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, isFront: boolean, index: number) => React.ReactNode;
  onCardClick?: (item: T) => void;
  className?: string;
  cardHeightClass?: string;
}

export function StackedCardDeck<T>({
  items,
  keyExtractor,
  renderCard,
  onCardClick,
  className = '',
  cardHeightClass = 'h-[380px] sm:h-[440px]',
}: StackedCardDeckProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  // Ensure activeIndex remains in bounds when filtered items change
  useEffect(() => {
    if (items && items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items, activeIndex]);

  if (!items || items.length === 0) {
    return null;
  }

  const total = items.length;

  const handleNext = () => {
    setDirection('left');
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setDirection('right');
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -30 || info.velocity.x < -200) {
      handleNext();
    } else if (info.offset.x > 30 || info.velocity.x > 200) {
      handlePrev();
    }
  };

  // Indexes for 3 stacked cards
  const idx1 = activeIndex % total; // Front Card-1
  const idx2 = (activeIndex + 1) % total; // Middle Card-2
  const idx3 = (activeIndex + 2) % total; // Back Card-3

  const item1 = items[idx1];
  const item2 = total > 1 ? items[idx2] : null;
  const item3 = total > 2 ? items[idx3] : null;

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* Cards Stack Container */}
      <div className={`relative w-full max-w-sm sm:max-w-md ${cardHeightClass} flex items-center justify-center my-2 px-2 overflow-visible`}>
        <AnimatePresence initial={false}>
          {/* Card-3 (Back card - Purple/Pink accent) */}
          {item3 && total > 2 && (
            <motion.div
              key={`card3-pos-${activeIndex}-${keyExtractor(item3)}`}
              initial={{ opacity: 0, x: 45, scale: 0.85 }}
              animate={{ opacity: 0.75, x: 28, scale: 0.9 }}
              exit={{ opacity: 0, x: 50, scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={() => {
                setDirection('left');
                setActiveIndex(idx3);
              }}
              className="absolute left-2 top-0 bottom-0 w-[84%] sm:w-[85%] cursor-pointer"
              style={{ zIndex: 10 }}
            >
              <div className="w-full h-full rounded-2xl bg-zinc-950 border-2 border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.25)] overflow-hidden transition-colors duration-200 hover:border-purple-400">
                <div className="pointer-events-none w-full h-full">
                  {renderCard(item3, false, idx3)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Card-2 (Middle card - Blue/Cyan accent) */}
          {item2 && total > 1 && (
            <motion.div
              key={`card2-pos-${activeIndex}-${keyExtractor(item2)}`}
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 0.9, x: 14, scale: 0.95 }}
              exit={{ opacity: 0, x: 35, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => {
                setDirection('left');
                setActiveIndex(idx2);
              }}
              className="absolute left-2 top-0 bottom-0 w-[84%] sm:w-[85%] cursor-pointer"
              style={{ zIndex: 20 }}
            >
              <div className="w-full h-full rounded-2xl bg-zinc-950 border-2 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden transition-colors duration-200 hover:border-cyan-400">
                <div className="pointer-events-none w-full h-full">
                  {renderCard(item2, false, idx2)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Card-1 (Front card - Emerald Focus) */}
          {item1 && (
            <motion.div
              key={`card1-pos-${activeIndex}-${keyExtractor(item1)}`}
              initial={{
                opacity: 0,
                x: direction === 'left' ? 70 : -70,
                scale: 0.92,
              }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: direction === 'left' ? -90 : 90,
                scale: 0.88,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragSnapToOrigin={true}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              onClick={() => onCardClick?.(item1)}
              className="absolute left-2 top-0 bottom-0 w-[84%] sm:w-[85%] cursor-grab active:cursor-grabbing touch-pan-y"
              style={{ zIndex: 30 }}
            >
              <div className="w-full h-full rounded-2xl bg-zinc-950 border-2 border-emerald-500/70 hover:border-emerald-400 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.25)] overflow-hidden transition-all duration-200 relative">
                <div className="w-full h-full">
                  {renderCard(item1, true, idx1)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls & Pagination */}
      <div className="flex items-center justify-between gap-4 mt-4 w-full max-w-xs sm:max-w-sm px-2">
        <button
          type="button"
          onClick={handlePrev}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1 font-mono text-xs cursor-pointer shadow-md active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400" />
          <span>Prev</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono text-zinc-300 font-bold">
            Card <span className="text-emerald-400">{activeIndex + 1}</span> of <span className="text-white">{total}</span>
          </span>
          <div className="flex items-center gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDirection(i > activeIndex ? 'left' : 'right');
                  setActiveIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1 font-mono text-xs cursor-pointer shadow-md active:scale-95"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
}

