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

export function CinematicLoadingScreen() {
  const { data } = useCMS();
  const intro = data?.intro || initialIntroData;

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
        delay: (idx * 0.55),
      };
    });
  }, [intro.floatingWords]);

  // Mobile lanes: strictly floating from ABOVE and BELOW only, stopping above and below the name
  const mobileLanes = useMemo(() => {
    const words = intro.floatingWords && intro.floatingWords.length > 0 ? intro.floatingWords : initialIntroData.floatingWords;
    return words.map((text, idx) => {
      const isTop = idx % 2 === 0;
      const offset = ((idx * 7) % 5) * 35;
      return {
        text,
        startX: 0,
        startY: isTop ? -(520 + offset) : (520 + offset),
        endX: 0,
        endY: isTop ? -180 : 180,
        delay: (idx * 0.45),
      };
    });
  }, [intro.floatingWords]);

  const activeLanes = useMemo(() => {
    if (isMobile) {
      return mobileLanes;
    }
    return desktopLanes;
  }, [isMobile, mobileLanes, desktopLanes]);

  // Welcome characters
  const welcomeChars = useMemo(() => {
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
  }, [intro.welcomeText]);

  const wordsSpeed = Number(intro.wordsSpeedSeconds) > 0 ? Number(intro.wordsSpeedSeconds) : (isMobile ? 4.2 : 4.8);
  const nameDelayMs = (intro.nameDelaySeconds !== undefined && intro.nameDelaySeconds !== null && !isNaN(Number(intro.nameDelaySeconds)))
    ? Number(intro.nameDelaySeconds) * 1000
    : 1200;

  // Calculate dynamic flight duration: guarantees EVERY single word completes its full flight to the middle
  const totalWordsDurationMs = useMemo(() => {
    const totalWords = activeLanes.length;
    if (totalWords === 0) return 3000;
    const staggerDelay = isMobile ? 0.45 : 0.55;
    const lastWordStartDelay = (totalWords - 1) * staggerDelay;
    const totalDurationSec = lastWordStartDelay + wordsSpeed + 0.6; // extra buffer to let last word fully fade
    return totalDurationSec * 1000;
  }, [activeLanes.length, isMobile, wordsSpeed]);

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

    // 1st STEP: First Name appears (0ms to 1400ms)

    // 2nd STEP: Slowly converts to stacked Last Name + First Name (at 1400ms)
    const t1 = setTimeout(() => {
      setShowDubbaka(true);
      setPhase('phase2_dubbaka');
    }, 1400);

    // 3rd STEP: Words come smoothly (at 2800ms)
    const t2 = setTimeout(() => {
      setPhase('phase3_words');
    }, 2800);

    // 4th STEP: Words finish dynamically when EVERY word reaches the middle and fades out
    const wordsEndTime = 2800 + totalWordsDurationMs;
    const t3 = setTimeout(() => {
      setPhase('phase3_words_ended');
    }, wordsEndTime);

    // 5th STEP: After all words finish, name remains for configured delay, then disappears
    const disappearTime = wordsEndTime + nameDelayMs;
    const t4 = setTimeout(() => {
      setPhase('phase4_disappear');
    }, disappearTime);

    // 6th STEP: Welcome message appears boldly in single line
    const welcomeTime = disappearTime + 900;
    const t5 = setTimeout(() => {
      setPhase('phase5_welcome');
    }, welcomeTime);

    // 7th STEP: Welcome message INDIVIDUAL LETTERS SCATTER OUTWARD SLOWLY
    const scatterTime = welcomeTime + 2300;
    const t6 = setTimeout(() => {
      setPhase('phase6_scatter');
    }, scatterTime);

    // 8th STEP: Fade out overlay & reveal website
    const completeTime = scatterTime + 2400;
    const t7 = setTimeout(() => {
      setIsVisible(false);
      setPhase('phase7_complete');
    }, completeTime);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, [prefersReducedMotion, intro.enabled, totalWordsDurationMs, nameDelayMs]);

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
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
                    opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                    scale: {
                      duration: phase === 'phase3_words' ? 4.5 : 1.2,
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
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
                      layout: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                      duration: 1.2,
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
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.9)] mt-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6TH & 7TH STEP: WELCOME MESSAGE IN STRICT SINGLE LINE & SLOW-MOTION LETTER SCATTERING */}
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
                                  duration: 2.2,
                                  delay: (idx * 0.025) % 0.22,
                                  ease: [0.16, 1, 0.3, 1],
                                }
                              : {
                                  duration: 0.9,
                                  delay: idx * 0.035,
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
                              ? { duration: 1.8, ease: 'easeOut' }
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
                      duration: phase === 'phase6_scatter' ? 1.4 : 0.9,
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

          {/* BOTTOM RIGHT: SKIP INTRO BUTTON */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 pointer-events-auto"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-400 text-zinc-300 hover:text-white font-mono text-[11px] sm:text-xs font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] backdrop-blur-md transition-all duration-200 cursor-pointer group"
            >
              <span>Skip Intro</span>
              <FastForward className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
