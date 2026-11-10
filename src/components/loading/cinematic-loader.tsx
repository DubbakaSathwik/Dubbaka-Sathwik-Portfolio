import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { initialIntroData } from '../../data';

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
  | 'phase1_sathwik'     // 1st: First Name in green
  | 'phase2_dubbaka'     // 2nd: Slowly converts to stacked Last Name + First Name
  | 'phase3_words'       // 3rd: Words come from all directions (mobile: top & bottom only)
  | 'phase3_words_ended' // 4th: Words disappear in middle; Name remains for configured delay
  | 'phase4_disappear'   // 5th: Name disappears (clean empty screen)
  | 'phase5_welcome'     // 6th: Welcome message on single line elevated
  | 'phase6_scatter'     // 7th: Welcome letters scatter / disperse outward individually (slow-motion)
  | 'phase7_complete';   // Fade out to website

// ============================================================================
// TIMING PRESETS & UNDO CONFIGURATION
// Active preset: 'mode_10s' (Strict 10-second duration without "welcome to my portfolio")
// To rollback, toggle ACTIVE_TIMING_MODE to 'compressed_7s' or 'original_cinematic'
// ============================================================================
export type TimingMode = 'mode_10s' | 'compressed_7s' | 'original_cinematic';

export const ACTIVE_TIMING_MODE: TimingMode = 'mode_10s';

export interface TimingConfig {
  hasWelcome: boolean;
  totalTargetSec: number;
  dubbakaDelayMs: number;
  wordsStartMs: number;
  wordStaggerDesktop: number;
  wordStaggerMobile: number;
  wordsSpeedDefault: number;
  wordsSpeedMobile: number;
  wordsEndBufferMs: number;
  nameHoldMs: number;
  welcomeAppearDelayMs?: number;
  scatterDelayMs?: number;
  scatterDurationSec?: number;
  completeDelayMs?: number;
  exitDurationSec: number;
  nameAnimDurationSec: number;
}

export const TIMING_CONFIGS: Record<TimingMode, TimingConfig> = {
  // 1. ACTIVE: 10-SECOND SEQUENCE WITHOUT WELCOME MESSAGE (PURE BRAND REVEAL)
  mode_10s: {
    hasWelcome: false,
    totalTargetSec: 10.0,
    dubbakaDelayMs: 1500,            // 1.5s: Dubbaka smoothly unfolds above Sathwik
    wordsStartMs: 2700,              // 2.7s: Floating words commence
    wordStaggerDesktop: 0.28,        // Elegant, smooth stagger
    wordStaggerMobile: 0.24,
    wordsSpeedDefault: 2.6,          // Flight duration to middle
    wordsSpeedMobile: 2.4,
    wordsEndBufferMs: 200,           // Buffer after last word completes
    nameHoldMs: 800,                 // Name remains centered in full glory before fade-out
    exitDurationSec: 0.8,            // 0.8s smooth overlay fade-out ending at strictly 10.0s
    nameAnimDurationSec: 0.8,
  },
  // 2. PREVIOUS 7-SECOND SEQUENCE (Preserved for undo)
  compressed_7s: {
    hasWelcome: true,
    totalTargetSec: 7.0,
    dubbakaDelayMs: 700,
    wordsStartMs: 1400,
    wordStaggerDesktop: 0.08,
    wordStaggerMobile: 0.07,
    wordsSpeedDefault: 1.4,
    wordsSpeedMobile: 1.3,
    wordsEndBufferMs: 150,
    nameHoldMs: 350,
    welcomeAppearDelayMs: 350,
    scatterDelayMs: 1150,
    scatterDurationSec: 1.2,
    completeDelayMs: 1400,
    exitDurationSec: 0.6,
    nameAnimDurationSec: 0.6,
  },
  // 3. ORIGINAL 21-SECOND SEQUENCE (Preserved for undo)
  original_cinematic: {
    hasWelcome: true,
    totalTargetSec: 21.0,
    dubbakaDelayMs: 1400,
    wordsStartMs: 2800,
    wordStaggerDesktop: 0.55,
    wordStaggerMobile: 0.45,
    wordsSpeedDefault: 4.8,
    wordsSpeedMobile: 4.2,
    wordsEndBufferMs: 600,
    nameHoldMs: 1200,
    welcomeAppearDelayMs: 900,
    scatterDelayMs: 2300,
    scatterDurationSec: 2.2,
    completeDelayMs: 2400,
    exitDurationSec: 1.2,
    nameAnimDurationSec: 1.2,
  },
};

export function CinematicLoadingScreen() {
  const { data } = useCMS();
  const intro = data?.intro || initialIntroData;

  // Active timing preset: 'mode_10s' by default
  const timing = TIMING_CONFIGS[ACTIVE_TIMING_MODE];

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

  // Desktop lanes: distributed 360 degrees around perimeter converging towards outside of name boundary
  const desktopLanes = useMemo(() => {
    const words = intro.floatingWords && intro.floatingWords.length > 0 ? intro.floatingWords : initialIntroData.floatingWords;
    const total = words.length;
    const stagger = timing.wordStaggerDesktop;
    return words.map((text, idx) => {
      const angle = (idx / Math.max(1, total)) * 2 * Math.PI;
      const startX = Math.round(Math.cos(angle) * 780);
      const startY = Math.round(Math.sin(angle) * 520);
      const endX = Math.round(Math.cos(angle) * 470);
      const endY = Math.round(Math.sin(angle) * 235);
      return {
        text,
        startX,
        startY,
        endX,
        endY,
        delay: idx * stagger,
      };
    });
  }, [intro.floatingWords, timing.wordStaggerDesktop]);

  // Mobile lanes: strictly floating from ABOVE and BELOW only, stopping above and below the name
  const mobileLanes = useMemo(() => {
    const words = intro.floatingWords && intro.floatingWords.length > 0 ? intro.floatingWords : initialIntroData.floatingWords;
    const stagger = timing.wordStaggerMobile;
    return words.map((text, idx) => {
      const isTop = idx % 2 === 0;
      const offset = ((idx * 7) % 5) * 35;
      return {
        text,
        startX: 0,
        startY: isTop ? -(520 + offset) : (520 + offset),
        endX: 0,
        endY: isTop ? -180 : 180,
        delay: idx * stagger,
      };
    });
  }, [intro.floatingWords, timing.wordStaggerMobile]);

  const activeLanes = useMemo(() => {
    if (isMobile) {
      return mobileLanes;
    }
    return desktopLanes;
  }, [isMobile, mobileLanes, desktopLanes]);

  // Welcome characters (only used if welcome preset is active)
  const welcomeChars = useMemo(() => {
    if (!timing.hasWelcome) return [];
    const raw = intro.welcomeText || 'Welcome to my portfolio.';
    return raw.split('').map((char, index) => {
      const angle = (index / Math.max(1, raw.length)) * 2 * Math.PI + ((index * 7) % 5) * 0.18;
      const dist = 320 + ((index * 43) % 320);
      return {
        char: char === ' ' ? '\u00A0' : char,
        isSpace: char === ' ',
        scatterX: Math.cos(angle) * dist,
        scatterY: Math.sin(angle) * dist,
        scatterRot: (index % 2 === 0 ? 1 : -1) * (45 + ((index * 23) % 70)),
      };
    });
  }, [intro.welcomeText, timing.hasWelcome]);

  // Dynamic speed resolution based on active preset
  const wordsSpeed = useMemo(() => {
    if (timing.totalTargetSec === 10.0) {
      return isMobile ? timing.wordsSpeedMobile : timing.wordsSpeedDefault;
    }
    if (timing.totalTargetSec === 7.0) {
      return isMobile ? timing.wordsSpeedMobile : timing.wordsSpeedDefault;
    }
    return Number(intro.wordsSpeedSeconds) > 0 ? Number(intro.wordsSpeedSeconds) : (isMobile ? timing.wordsSpeedMobile : timing.wordsSpeedDefault);
  }, [timing, intro.wordsSpeedSeconds, isMobile]);

  // Calculate dynamic flight duration: guarantees EVERY single word completes its full flight to the middle
  const totalWordsDurationMs = useMemo(() => {
    const totalWords = activeLanes.length;
    if (totalWords === 0) return 2000;
    const staggerDelay = isMobile ? timing.wordStaggerMobile : timing.wordStaggerDesktop;
    const lastWordStartDelay = (totalWords - 1) * staggerDelay;
    const totalDurationSec = lastWordStartDelay + wordsSpeed + (timing.wordsEndBufferMs / 1000);
    return Math.round(totalDurationSec * 1000);
  }, [activeLanes.length, isMobile, wordsSpeed, timing]);

  // Guaranteed Sequence Controller
  useEffect(() => {
    if (intro.enabled === false) {
      setIsVisible(false);
      return;
    }

    if (prefersReducedMotion) {
      const rm1 = setTimeout(() => {
        setShowDubbaka(true);
        setPhase('phase2_dubbaka');
      }, 800);
      const rm2 = setTimeout(() => {
        setIsVisible(false);
        setPhase('phase7_complete');
      }, Math.round((timing.totalTargetSec - timing.exitDurationSec) * 1000));
      return () => {
        clearTimeout(rm1);
        clearTimeout(rm2);
      };
    }

    // 1st STEP: First Name appears (0ms to dubbakaDelayMs)

    // 2nd STEP: Slowly converts to stacked Last Name + First Name
    const t1 = setTimeout(() => {
      setShowDubbaka(true);
      setPhase('phase2_dubbaka');
    }, timing.dubbakaDelayMs);

    // 3rd STEP: Words come smoothly
    const t2 = setTimeout(() => {
      setPhase('phase3_words');
    }, timing.wordsStartMs);

    // 4th STEP: Words finish dynamically when EVERY word reaches the middle and fades out
    const wordsEndTime = timing.wordsStartMs + totalWordsDurationMs;
    const t3 = setTimeout(() => {
      setPhase('phase3_words_ended');
    }, wordsEndTime);

    let t4: NodeJS.Timeout | null = null;
    let t5: NodeJS.Timeout | null = null;
    let t6: NodeJS.Timeout | null = null;
    let t7: NodeJS.Timeout | null = null;

    if (!timing.hasWelcome) {
      // 10-SECOND SEQUENCE: Name remains centered in full glory, then smooth exit to website at strictly 10.0s
      const exitStartTime = Math.max(wordsEndTime + timing.nameHoldMs, Math.round((timing.totalTargetSec - timing.exitDurationSec) * 1000));
      t7 = setTimeout(() => {
        setIsVisible(false);
        setPhase('phase7_complete');
      }, exitStartTime);
    } else {
      // Welcome preset fallback
      const disappearTime = wordsEndTime + (timing.nameHoldMs || 1000);
      t4 = setTimeout(() => {
        setPhase('phase4_disappear');
      }, disappearTime);

      const welcomeTime = disappearTime + (timing.welcomeAppearDelayMs || 500);
      t5 = setTimeout(() => {
        setPhase('phase5_welcome');
      }, welcomeTime);

      const scatterTime = welcomeTime + (timing.scatterDelayMs || 1200);
      t6 = setTimeout(() => {
        setPhase('phase6_scatter');
      }, scatterTime);

      const completeTime = scatterTime + (timing.completeDelayMs || 1500);
      t7 = setTimeout(() => {
        setIsVisible(false);
        setPhase('phase7_complete');
      }, completeTime);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (t4) clearTimeout(t4);
      if (t5) clearTimeout(t5);
      if (t6) clearTimeout(t6);
      if (t7) clearTimeout(t7);
    };
  }, [prefersReducedMotion, intro.enabled, totalWordsDurationMs, timing]);

  if (intro.enabled === false) {
    return null;
  }

  const handleSkip = () => {
    setIsVisible(false);
    setPhase('phase7_complete');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isNameVisible =
    phase === 'phase1_sathwik' ||
    phase === 'phase2_dubbaka' ||
    phase === 'phase3_words' ||
    phase === 'phase3_words_ended';

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
          transition={{ duration: timing.exitDurationSec, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-[99999] bg-[#050505] text-white select-none overflow-hidden cursor-pointer"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle Ambient Emerald-Infused Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,rgba(0,0,0,0)_75%)] pointer-events-none" />

          {/* 3RD STEP: FLOATING WORDS (DYNAMIC TIMING TILL EVERY WORD COMPLETES) */}
          {phase === 'phase3_words' && !prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
              {activeLanes.map((lane, index) => {
                const mult = isMobile ? 0.75 : 1.0;
                const startX = lane.startX * mult;
                const startY = lane.startY * mult;
                const endX = lane.endX * mult;
                const endY = lane.endY * mult;
                const midX = (startX + endX) * 0.5;
                const midY = (startY + endY) * 0.5;

                return (
                  <motion.div
                    key={`lane-${index}-${lane.text}`}
                    initial={{
                      x: startX,
                      y: startY,
                      opacity: 0,
                      scale: 0.85,
                      filter: 'blur(3px)',
                    }}
                    animate={{
                      x: [startX, midX, endX],
                      y: [startY, midY, endY],
                      opacity: [0, 0.85, 0],
                      scale: [0.85, 1.05, 0.85],
                      filter: ['blur(3px)', 'blur(0px)', 'blur(6px)'],
                    }}
                    transition={{
                      duration: wordsSpeed,
                      delay: lane.delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute font-mono text-xs sm:text-sm text-zinc-200 font-semibold tracking-widest whitespace-nowrap drop-shadow-[0_0_15px_rgba(16,185,129,0.45)] pointer-events-none"
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

          {/* BALANCED ELEVATED STAGE (top-[40%] / top-[42%]) */}
          <div className="absolute top-[40%] sm:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center text-center w-full max-w-6xl px-4 pointer-events-none select-none">
            {/* 1ST, 2ND, 3RD, 4TH: SATHWIK -> DUBBAKA SATHWIK */}
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
                    opacity: { duration: timing.totalTargetSec <= 7 ? 0.45 : 0.8, ease: [0.16, 1, 0.3, 1] },
                    scale: {
                      duration: phase === 'phase3_words' ? (timing.totalTargetSec <= 7 ? 2.5 : 4.0) : timing.nameAnimDurationSec,
                      ease: [0.16, 1, 0.3, 1],
                      repeat: phase === 'phase3_words' ? Infinity : 0,
                      repeatType: 'reverse',
                    },
                  }}
                  className="flex flex-col items-center justify-center space-y-1 sm:space-y-2 select-none"
                >
                  {/* Top Word: DUBBAKA / Last Name */}
                  <AnimatePresence>
                    {showDubbaka && (
                      <motion.h1
                        key="name-dubbaka"
                        initial={{ opacity: 0, y: -30, height: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, height: 'auto', filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                        transition={{ duration: timing.nameAnimDurationSec, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 drop-shadow-[0_0_35px_rgba(16,185,129,0.65)] tracking-[0.22em] sm:tracking-[0.28em] uppercase font-sans leading-tight overflow-visible"
                      >
                        {intro.lastName || 'Dubbaka'}
                      </motion.h1>
                    )}
                  </AnimatePresence>

                  {/* Bottom Word: SATHWIK / First Name */}
                  <motion.h1
                    layout
                    key="name-sathwik"
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{
                      layout: { duration: timing.nameAnimDurationSec, ease: [0.16, 1, 0.3, 1] },
                      duration: timing.nameAnimDurationSec,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 drop-shadow-[0_0_35px_rgba(16,185,129,0.65)] tracking-[0.22em] sm:tracking-[0.28em] uppercase font-sans leading-tight"
                  >
                    {intro.firstName || 'Sathwik'}
                  </motion.h1>

                  {/* Glowing Emerald Accent Line */}
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: showDubbaka ? (isMobile ? '120px' : '200px') : (isMobile ? '60px' : '90px'),
                      opacity: 0.8,
                    }}
                    transition={{ duration: timing.nameAnimDurationSec, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.9)] mt-4"
                  />

                  {/* Ambient Emerald & Starlight Particle Aura behind Dubbaka Sathwik */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
                    {SCATTER_PARTICLES.map((p, i) => (
                      <motion.div
                        key={`name-particle-${i}`}
                        animate={{
                          x: [p.x * 0.85, p.x, p.x * 0.85],
                          y: [p.y * 0.85, p.y, p.y * 0.85],
                          opacity: [0.12, 0.5, 0.12],
                          scale: [0.9, 1.25, 0.9],
                        }}
                        transition={{
                          duration: 3.5 + (i % 3),
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className={`absolute rounded-full ${p.color}`}
                        style={{
                          width: `${p.size}px`,
                          height: `${p.size}px`,
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.65)',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6TH & 7TH STEP: WELCOME MESSAGE (ONLY IN LEGACY/UNDO PRESETS, REMOVED FROM 10S MODE) */}
            <AnimatePresence>
              {timing.hasWelcome && isWelcomeVisible && (
                <motion.div
                  key="welcome-stage"
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center space-y-5 w-full overflow-visible"
                >
                  {/* Strict SINGLE LINE Letter-by-Letter Text with Slow-Motion Dispersal */}
                  <div className="flex items-center justify-center flex-nowrap whitespace-nowrap overflow-visible leading-tight max-w-full">
                    {welcomeChars.map((item, idx) => {
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
                                  duration: timing.scatterDurationSec || 1.8,
                                  delay: (idx * 0.02) % (timing.totalTargetSec <= 7 ? 0.15 : 0.22),
                                  ease: [0.16, 1, 0.3, 1],
                                }
                              : {
                                  duration: timing.totalTargetSec <= 7 ? 0.45 : 0.9,
                                  delay: idx * (timing.totalTargetSec <= 7 ? 0.016 : 0.035),
                                  ease: [0.16, 1, 0.3, 1],
                                }
                          }
                          className={`inline-block font-sans font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)] ${
                            isMobile
                              ? 'text-[17px] tracking-[0.08em]'
                              : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.14em]'
                          }`}
                          style={{
                            willChange: 'transform, opacity, filter',
                          }}
                        >
                          {item.char}
                        </motion.span>
                      );
                    })}
                  </div>

                  {/* Emerald Particle Ring in Background during Welcome */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {SCATTER_PARTICLES.map((p, i) => {
                      const isScatter = phase === 'phase6_scatter';
                      return (
                        <motion.div
                          key={`scatter-particle-${i}`}
                          animate={
                            isScatter
                              ? {
                                  x: p.x * 1.8,
                                  y: p.y * 1.8,
                                  opacity: 0,
                                  scale: 0,
                                }
                              : {
                                  x: [p.x * 0.85, p.x, p.x * 0.85],
                                  y: [p.y * 0.85, p.y, p.y * 0.85],
                                  opacity: [0.2, 0.7, 0.2],
                                  scale: [1, 1.4, 1],
                                }
                          }
                          transition={
                            isScatter
                              ? { duration: timing.scatterDurationSec || 1.8, ease: 'easeOut' }
                              : {
                                  duration: 2.5 + (i % 3),
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }
                          }
                          className={`absolute rounded-full ${p.color}`}
                          style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Elegant Subtitle Pill */}
                  <motion.div
                    animate={
                      phase === 'phase6_scatter'
                        ? { opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.85 }
                        : { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }
                    }
                    transition={{
                      duration: phase === 'phase6_scatter' ? (timing.totalTargetSec <= 7 ? 0.7 : 1.4) : (timing.totalTargetSec <= 7 ? 0.45 : 0.9),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-mono font-medium tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{intro.subtitleText || 'ENTERING DEVELOPER PORTFOLIO'}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TOP RIGHT: START / SKIP INTRO BUTTON (Placed top-right so Netlify badge does not obscure it) */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute top-5 right-5 sm:top-8 sm:right-8 z-50 pointer-events-auto"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 text-zinc-200 hover:text-white font-mono text-xs sm:text-sm font-medium shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-md transition-all duration-200 cursor-pointer group"
            >
              <span>Start / Skip Intro</span>
              <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
