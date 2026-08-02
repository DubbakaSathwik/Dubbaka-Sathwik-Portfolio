import { motion } from 'framer-motion';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { ArrowDown, Code2, FileText, ChevronRight, Mail } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export function HeroSection() {
  const { data, setIsResumeModalOpen } = useCMS();
  const hero = data.hero;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen pt-20 pb-16 sm:pt-28 flex flex-col justify-center overflow-hidden bg-[#050505] text-white scroll-mt-16 sm:scroll-mt-20">
      {/* Green Ambient Background Lighting */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="rgba(16, 185, 129, 0.25)" />
      
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">


        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 text-center lg:text-left space-y-6"
          >
            <h1 className="tracking-tight leading-[1.08] space-y-1">
              <span className="block text-lg sm:text-2xl font-mono text-white font-semibold tracking-wider">
                Hi, I'm
              </span>
              <span className="block text-4xl sm:text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                {hero.heading}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white font-mono font-medium tracking-tight">
              {hero.subtitle}
            </p>

            <p className="text-xl sm:text-2xl text-zinc-200 font-light max-w-2xl mx-auto lg:mx-0">
              "{hero.tagline}"
            </p>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {hero.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => scrollToSection('projects')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                <Code2 className="w-4 h-4" />
                <span>{hero.primaryBtnText || 'View My Work'}</span>
                <ChevronRight className="w-4 h-4 text-emerald-200" />
              </button>

              <button
                onClick={() => setIsResumeModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-semibold text-sm border border-emerald-500/30 hover:border-emerald-500/60 shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{hero.secondaryBtnText || 'Download Resume'}</span>
              </button>

              <button
                onClick={() => scrollToSection('contact')}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium text-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <Mail className="w-4 h-4 text-zinc-400" />
                <span>{hero.tertiaryBtnText || 'Contact Me'}</span>
              </button>
            </div>

            {/* Quick Metrics Bar - 2x2 Grid Layout */}
            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-2 gap-3.5 sm:gap-4 max-w-xl mx-auto lg:mx-0">
              {data.about.stats.map((st, idx) => {
                const isNumeric = /^\d+[\+\%]?$/.test(st.value.trim());
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-emerald-500/50 transition-all duration-300 shadow-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group cursor-pointer flex flex-col justify-center min-h-[96px]"
                  >
                    <p
                      className={`${
                        isNumeric
                          ? 'text-2xl sm:text-3xl font-black font-mono text-emerald-400 group-hover:text-emerald-300'
                          : 'text-sm sm:text-base font-bold font-sans text-white group-hover:text-emerald-300 leading-snug'
                      } transition-colors`}
                    >
                      {st.value}
                    </p>
                    <p className="text-[11px] sm:text-xs text-zinc-400 group-hover:text-zinc-200 font-mono uppercase tracking-wider mt-1.5 leading-snug">
                      {st.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column (3D Spline Canvas - Frameless, Fully Unclipped & Centered in Right Half) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="hidden md:flex lg:col-span-6 relative items-center justify-center w-full min-h-[420px] sm:min-h-[500px] overflow-visible"
          >
            <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[560px] flex items-center justify-center pointer-events-auto overflow-visible">
              <div className="absolute inset-0 -left-[25%] -right-[25%] -top-[15%] -bottom-[15%] flex items-center justify-center -translate-x-10 sm:-translate-x-16 lg:-translate-x-20">
                <SplineScene
                  scene="https://prod.spline.design/tzncNju5E3SjXbxy/scene.splinecode"
                  className="w-full h-full flex items-center justify-center scale-80 sm:scale-85 lg:scale-90 transform transition-transform"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex justify-center pt-12 cursor-pointer"
          onClick={() => scrollToSection('about')}
        >
          <div className="flex flex-col items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors">
            <span className="text-xs uppercase font-mono tracking-widest">Scroll to Discover</span>
            <ArrowDown className="w-4 h-4 text-emerald-500" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
