import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Code2, Film, Sparkles } from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Creative', href: '#editing' },
  { name: 'Journey', href: '#journey' },
  { name: 'Certificates', href: '#gallery' },
  { name: 'Resume', href: '#resume' },
  { name: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Active link detection based on section top position relative to navbar offset
      const sections = navLinks.map((link) => link.href.substring(1));
      const navOffset = 140;
      let current = 'home';

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= navOffset) {
            current = sectionId;
          }
        }
      }

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(targetId);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'bg-[rgba(8,8,8,0.85)] backdrop-blur-[16px] border-b border-emerald-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-[rgba(8,8,8,0.5)] backdrop-blur-[10px] border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Name */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, '#home')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
              Dubbaka Sathwik
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400 inline" /> Portfolio
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/60 p-1.5 rounded-full border border-zinc-800/80 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            const isContact = link.name.toLowerCase() === 'contact';

            if (isContact) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="ml-1 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Get In Touch</span>
                </a>
              );
            }

            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-emerald-900/40 border border-emerald-500/50 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex lg:hidden items-center gap-3">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold text-white rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.03]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Get In Touch</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-300 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-[#0a0a0d]/95 backdrop-blur-2xl border-b border-emerald-500/20 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-5 grid grid-cols-2 gap-2.5 max-w-lg mx-auto">
              {navLinks.map((link) => {
                const isContact = link.name.toLowerCase() === 'contact';
                if (isContact) return null;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-center border ${
                      activeSection === link.href.substring(1)
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="col-span-2 pt-2">
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-950/80 border border-emerald-500/40 hover:scale-[1.02] transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Get In Touch</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
