import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Sparkles } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { JourneyItem } from '../types';
import { FormattedText } from '../lib/text-formatter';
import { NeonIcon } from './ui/neon-icon';
import { JourneyImageSlideshow } from './ui/journey-image-slideshow';

export function JourneySection() {
  const { data } = useCMS();
  const items = data.journey || [];
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedJourneyItem, setSelectedJourneyItem] = useState<JourneyItem | null>(null);

  const filteredItems =
    activeCategory === 'All'
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <section id="journey" className="py-24 bg-[#050505] relative overflow-hidden border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>Milestones & Growth</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Journey & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Roadmap</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            From 8th class Minecraft curiosity to 3rd Year CSE at MVSR Engineering College & NSS active volunteer.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {['All', 'Education', 'Engineering', 'Creative', 'NSS & Community', 'Milestone'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative border-l-2 border-emerald-500/30 md:border-l-0 ml-4 md:ml-0">
          {/* Middle Line on Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/30 -translate-x-1/2" />

          <div className="space-y-12">
            {filteredItems.map((item, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[-9px] md:left-1/2 top-4 w-4 h-4 rounded-full bg-[#050505] border-2 border-emerald-500 md:-translate-x-1/2 z-20 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />

                  {/* Empty Spacer Column for Alternating Layout */}
                  <div className="hidden md:block w-1/2" />

                  {/* Card Column */}
                  <div
                    className={`w-full md:w-1/2 pl-8 ${
                      isEven ? 'md:pl-0 md:pr-8' : 'md:pl-8 md:pr-0'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedJourneyItem(item)}
                      className="p-6 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/95 border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 shadow-xl space-y-3 cursor-pointer group hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                          <span>{item.year}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-zinc-950 text-zinc-300 border border-zinc-800">
                          <NeonIcon name={item.category} className="w-3.5 h-3.5" />
                          <span>{item.category}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>{item.title}</span>
                        </h3>
                        <p className="text-xs font-mono text-emerald-400/90 mt-1 flex items-center gap-1.5">
                          <NeonIcon name={item.organization || item.title} className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.organization}</span>
                          {item.role && <span className="text-zinc-300">• {item.role}</span>}
                        </p>
                      </div>

                      <div className="text-zinc-300 text-xs leading-relaxed line-clamp-3">
                        <FormattedText text={item.description} />
                      </div>

                      {/* Clean Skill Tags (Without emojis) */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px] font-mono border border-zinc-700/50"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Journey Detail Popup */}
      <AnimatePresence>
        {selectedJourneyItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJourneyItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl lg:max-w-4xl bg-[#09090d]/95 border border-emerald-500/50 rounded-3xl p-5 sm:p-8 md:p-9 space-y-6 shadow-[0_0_80px_rgba(16,185,129,0.22)] overflow-hidden"
            >
              {/* Decorative subtle ambient glow in background */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedJourneyItem(null)}
                className="absolute top-5 right-5 z-20 p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start sm:items-center gap-4 border-b border-zinc-800/90 pb-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <NeonIcon name={selectedJourneyItem.category} className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="pr-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded-xl border border-emerald-500/40 shadow-sm">
                      {selectedJourneyItem.year}
                    </span>
                    <span className="text-xs font-mono text-zinc-300 bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 flex items-center gap-1.5">
                      <NeonIcon name={selectedJourneyItem.category} className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedJourneyItem.category}</span>
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">{selectedJourneyItem.title}</h3>
                </div>
              </div>

              {/* Modal Content Scrollable Container */}
              <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1.5 custom-scrollbar relative z-10">
                <div className="flex items-center gap-2 text-sm font-mono text-emerald-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <NeonIcon name={selectedJourneyItem.organization} className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">{selectedJourneyItem.organization}</span>
                  {selectedJourneyItem.role && <span className="text-zinc-300 font-normal">• {selectedJourneyItem.role}</span>}
                </div>

                {/* Milestone Photos Large Slideshow */}
                {((selectedJourneyItem.images && selectedJourneyItem.images.length > 0) || selectedJourneyItem.image) && (
                  <div className="pt-1 pb-1">
                    <JourneyImageSlideshow
                      images={
                        selectedJourneyItem.images && selectedJourneyItem.images.length > 0
                          ? selectedJourneyItem.images
                          : selectedJourneyItem.image
                          ? [selectedJourneyItem.image]
                          : []
                      }
                      title={selectedJourneyItem.title}
                    />
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-zinc-950/95 border border-emerald-500/25 text-sm sm:text-base text-zinc-100 leading-relaxed space-y-3 shadow-inner">
                  <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 border-b border-zinc-800/80 pb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Detailed Milestone Overview:</span>
                  </div>
                  <FormattedText text={selectedJourneyItem.detailedDescription || selectedJourneyItem.description} />
                </div>
              </div>

              {/* Modal Footer Tags */}
              {selectedJourneyItem.tags && selectedJourneyItem.tags.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/80 relative z-10">
                  <p className="text-xs font-mono text-zinc-400 mb-2.5 font-semibold">Associated Skills & Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJourneyItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
