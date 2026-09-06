import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../../context/CMSContext';

// Unique corridor/lane coordinates for each word to guarantee ZERO overlapping
const IDENTITY_LANES = [
  // 1. Top-Left high
  { text: 'Full-Stack Developer', startX: -650, startY: -450, endX: -260, endY: -160, delay: 0 },
  // 2. Top center
  { text: 'React & Node.js', startX: 0, startY: -600, endX: 0, endY: -210, delay: 0.5 },
  // 3. Top-Right high
  { text: 'Creative Designer', startX: 650, startY: -450, endX: 260, endY: -160, delay: 1.0 },
  // 4. Right upper
  { text: 'Artificial Intelligence', startX: 750, startY: -120, endX: 280, endY: -50, delay: 1.5 },
  // 5. Right lower
  { text: 'Video Editor', startX: 750, startY: 140, endX: 280, endY: 60, delay: 2.0 },
  // 6. Bottom-Right low
  { text: 'Digital Co-Lead', startX: 650, startY: 480, endX: 250, endY: 180, delay: 2.5 },
  // 7. Bottom center
  { text: 'Web Development', startX: 0, startY: 600, endX: 0, endY: 220, delay: 3.0 },
  // 8. Bottom-Left low
  { text: 'Hackathon Lead', startX: -650, startY: 480, endX: -250, endY: 180, delay: 3.5 },
  // 9. Left lower
  { text: 'NSS Volunteer', startX: -750, startY: 140, endX: -280, endY: 60, delay: 4.0 },
  // 10. Left upper
  { text: 'Problem Solver', startX: -750, startY: -140, endX: -280, endY: -60, delay: 4.5 },
  // 11. IEEE Member
  { text: 'IEEE Coordinator', startX: 450, startY: -550, endX: 180, endY: -190, delay: 5.0 },
  // 12. Student Coordinator
  { text: 'Student Coordinator', startX: -450, startY: -550, endX: -180, endY: -190, delay: 5.5 },
];

const WELCOME_RAW = "Welcome to my portfolio.";
const WELCOME_CHARS = WELCOME_RAW.split('').map((char, index) => {
  const angle = (index / 24) * 2 * Math.PI + ((index * 7) % 5) * 0.18;
  const dist = 320 + ((index * 43) % 320);
  return {
    char: char === ' ' ? '\u00A0' : char,
    isSpace: char === ' ',
    scatterX: Math.cos(angle) * dist,
    scatterY: Math.sin(angle) * dist,
    scatterRot: ((index % 2 === 0 ? 1 : -1) * (45 + (index * 23) % 70)),
  };
});

const SCATTER_PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * 2 * Math.PI;
  const dist = 240 + (i % 6) * 70;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: (i % 3) + 2,
    color: i % 2 === 0 ? 'bg-emerald-400' : 'bg-white',
  };
});

type AnimationPhase =
  | 'phase1_sathwik'    // 1st: "Sathwik" in green
  | 'phase2_dubbaka'    // 2nd: Slowly converts to "Dubbaka Sathwik" (stacked)
  | 'phase3_words'      // 3rd: Words come from all directions
  | 'phase4_disappear'  // 4th: All disappears (clean empty screen)
  | 'phase5_welcome'    // 5th: "Welcome to my portfolio." message on single line elevated
  | 'phase6_scatter'    // 6th: Welcome letters scatter / disperse outward individually (slow-motion)
  | 'phase7_complete';  // Fade out to website

export function CinematicLoadingScreen() {
  const { isLoading } = useCMS();
  const [phase, setPhase] = useState<AnimationPhase>('phase1_sathwik');
  const [showDubbaka, setShowDubbaka] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check mobile & accessibility
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', checkViewport);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Filter words for mobile
  const activeLanes = useMemo(() => {
    if (isMobile) {
      return IDENTITY_LANES.filter((_, idx) => idx % 2 === 0);
    }
    return IDENTITY_LANES;
  }, [isMobile]);

  // Guaranteed Sequence Controller with Extended Slow-Motion Scatter
  useEffect(() => {
    if (prefersReducedMotion) {
      const rm1 = setTimeout(() => {
        setShowDubbaka(true);
        setPhase('phase2_dubbaka');
      }, 1000);
      const rm2 = setTimeout(() => setPhase('phase4_disappear'), 2200);
      const rm3 = setTimeout(() => setPhase('phase5_welcome'), 2800);
      const rm4 = setTimeout(() => {
        setIsVisible(false);
        setPhase('phase7_complete');
      }, 5000);
      return () => {
        clearTimeout(rm1);
        clearTimeout(rm2);
        clearTimeout(rm3);
        clearTimeout(rm4);
      };
    }

    // 1st STEP: "Sathwik" appears (0ms to 1400ms)

    // 2nd STEP: Slowly converts to "Dubbaka Sathwik" (at 1400ms)
    const t1 = setTimeout(() => {
      setShowDubbaka(true);
      setPhase('phase2_dubbaka');
    }, 1400);

    // 3rd STEP: Words come from all directions (at 2800ms)
    const t2 = setTimeout(() => {
      setPhase('phase3_words');
    }, 2800);

    // 4th STEP: ALL DISAPPEARS (name & words clear) (at 5800ms)
    const t3 = setTimeout(() => {
      setPhase('phase4_disappear');
    }, 5800);

    // 5th STEP: "Welcome to my portfolio." message appears boldly in single line (at 6600ms)
    const t4 = setTimeout(() => {
      setPhase('phase5_welcome');
    }, 6600);

    // 6th STEP: Welcome message INDIVIDUAL LETTERS SCATTER OUTWARD SLOWLY (at 8800ms)
    const t5 = setTimeout(() => {
      setPhase('phase6_scatter');
    }, 8800);

    // 7th STEP: Fade out overlay & reveal website (at 11200ms - full 2.4s of slow cinematic dispersal!)
    const t6 = setTimeout(() => {
      setIsVisible(false);
      setPhase('phase7_complete');
    }, 11200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [prefersReducedMotion]);

  const isNameVisible =
    phase === 'phase1_sathwik' ||
    phase === 'phase2_dubbaka' ||
    phase === 'phase3_words';

  const isWelcomeVisible =
    phase === 'phase5_welcome' ||
    phase === 'phase6_scatter';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cinematic-loader-main"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-[#050505] text-white select-none overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle Ambient Emerald-Infused Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,rgba(0,0,0,0)_75%)] pointer-events-none" />

          {/* 3RD STEP: NON-OVERLAPPING WORDS FLOATING FROM ALL DIRECTIONS */}
          {phase === 'phase3_words' && !prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
              {activeLanes.map((lane, index) => {
                const mult = isMobile ? 0.65 : 1.0;
                const startX = lane.startX * mult;
                const startY = lane.startY * mult;
                const endX = lane.endX * mult;
                const endY = lane.endY * mult;

                return (
                  <motion.div
                    key={`lane-${index}-${lane.text}`}
                    initial={{
                      x: startX,
                      y: startY,
                      opacity: 0,
                      scale: 0.85,
                      filter: 'blur(4px)',
                    }}
                    animate={{
                      x: [startX, (startX + endX) * 0.5, endX],
                      y: [startY, (startY + endY) * 0.5, endY],
                      opacity: [0, 0.45, 0],
                      scale: [0.85, 1, 0.9],
                      filter: ['blur(4px)', 'blur(0px)', 'blur(4px)'],
                    }}
                    transition={{
                      duration: isMobile ? 3.0 : 3.4,
                      delay: (lane.delay % 3.0),
                      repeat: Infinity,
                      repeatDelay: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute font-mono text-xs sm:text-sm text-zinc-400 tracking-widest whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.08)]"
                    style={{
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    {lane.text}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* BALANCED ELEVATED STAGE (Shifted up to top-[40%] / top-[42%] to eliminate excess top space) */}
          <div className="absolute top-[40%] sm:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center text-center w-full max-w-6xl px-4 pointer-events-none select-none">
            {/* 1ST, 2ND, 3RD: SATHWIK -> DUBBAKA SATHWIK (STACKED) */}
            <AnimatePresence>
              {isNameVisible && (
                <motion.div
                  key="stacked-name-container"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: 1,
                    scale: phase === 'phase3_words' ? [1, 1.03, 1.01] : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.92, filter: 'blur(14px)' }}
                  transition={{
                    opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                    scale: {
                      duration: phase === 'phase3_words' ? 3.4 : 1.2,
                      ease: [0.16, 1, 0.3, 1],
                      repeat: phase === 'phase3_words' ? Infinity : 0,
                      repeatType: 'reverse',
                    },
                  }}
                  className="flex flex-col items-center justify-center space-y-1 sm:space-y-2 select-none"
                >
                  {/* Top Word: DUBBAKA */}
                  <AnimatePresence>
                    {showDubbaka && (
                      <motion.h1
                        key="name-dubbaka"
                        initial={{ opacity: 0, y: -30, height: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, height: 'auto', filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 drop-shadow-[0_0_35px_rgba(16,185,129,0.65)] tracking-[0.22em] sm:tracking-[0.28em] uppercase font-sans leading-tight overflow-visible"
                      >
                        Dubbaka
                      </motion.h1>
                    )}
                  </AnimatePresence>

                  {/* Bottom Word: SATHWIK */}
                  <motion.h1
                    layout
                    key="name-sathwik"
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{
                      layout: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                      duration: 1.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 drop-shadow-[0_0_35px_rgba(16,185,129,0.65)] tracking-[0.22em] sm:tracking-[0.28em] uppercase font-sans leading-tight"
                  >
                    Sathwik
                  </motion.h1>

                  {/* Glowing Emerald Accent Line */}
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: showDubbaka ? (isMobile ? '120px' : '200px') : (isMobile ? '60px' : '90px'),
                      opacity: 0.8,
                    }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.9)] mt-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 5TH & 6TH STEP: WELCOME MESSAGE IN STRICT SINGLE LINE & SLOW-MOTION LETTER SCATTERING */}
            <AnimatePresence>
              {isWelcomeVisible && (
                <motion.div
                  key="welcome-stage"
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center space-y-5 w-full overflow-visible"
                >
                  {/* Strict SINGLE LINE Letter-by-Letter Text with Slow-Motion Dispersal */}
                  <div className="flex items-center justify-center flex-nowrap whitespace-nowrap overflow-visible leading-tight max-w-full">
                    {WELCOME_CHARS.map((item, idx) => {
                      const isScatter = phase === 'phase6_scatter';

                      return (
                        <motion.span
                          key={`welcome-char-${idx}`}
                          animate={
                            isScatter
                              ? {
                                  x: item.scatterX * (isMobile ? 0.75 : 1),
                                  y: item.scatterY * (isMobile ? 0.75 : 1),
                                  rotate: item.scatterRot,
                                  scale: 1.6,
                                  opacity: 0,
                                  filter: 'blur(16px)',
                                }
                              : {
                                  x: 0,
                                  y: 0,
                                  rotate: 0,
                                  scale: 1,
                                  opacity: 1,
                                  filter: 'blur(0px)',
                                }
                          }
                          transition={
                            isScatter
                              ? {
                                  duration: 2.2,
                                  delay: (idx * 0.025) % 0.22,
                                  ease: [0.16, 1, 0.3, 1],
                                }
                              : {
                                  duration: 0.7,
                                  delay: idx * 0.018,
                                  ease: [0.16, 1, 0.3, 1],
                                }
                          }
                          className="inline-block text-xl sm:text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.03em] sm:tracking-[0.08em] md:tracking-[0.1em] text-white font-sans drop-shadow-[0_0_30px_rgba(255,255,255,0.35)] select-none whitespace-pre shrink-0"
                          style={{ willChange: 'transform, opacity, filter' }}
                        >
                          {item.char}
                        </motion.span>
                      );
                    })}
                  </div>

                  {/* Subtitle Badge with Slow-Motion Dispersal */}
                  <motion.div
                    animate={
                      phase === 'phase6_scatter'
                        ? { opacity: 0, y: 160, scale: 0.75, filter: 'blur(14px)' }
                        : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
                    }
                    transition={
                      phase === 'phase6_scatter'
                        ? { duration: 2.0, ease: [0.16, 1, 0.3, 1] }
                        : { duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }
                    }
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] select-none"
                    style={{ willChange: 'transform, opacity, filter' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs sm:text-sm font-mono tracking-[0.25em] text-emerald-300 uppercase font-semibold">
                      Dubbaka Sathwik
                    </span>
                  </motion.div>

                  {/* 360-Degree Radial Scattering Particles (Slow Drift) */}
                  {phase === 'phase6_scatter' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {SCATTER_PARTICLES.map((p, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: p.x * (isMobile ? 0.7 : 1),
                            y: p.y * (isMobile ? 0.7 : 1),
                            opacity: 0,
                            scale: 0.2,
                          }}
                          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute rounded-full ${p.color} shadow-[0_0_8px_rgba(16,185,129,0.8)]`}
                          style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            willChange: 'transform, opacity',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Minimalist Loading Status Indicator */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-mono tracking-[0.22em] text-zinc-300 uppercase">
                {isLoading ? 'Loading Portfolio' : 'Ready'}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
