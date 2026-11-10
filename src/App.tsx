import { useEffect } from 'react';
import { CMSProvider } from '@/context/CMSContext';
import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero';
import { AboutSection } from '@/components/about';
import { ProjectsSection } from '@/components/projects';
import { EditingSection } from '@/components/editing';
import { JourneySection } from '@/components/journey';
import { GallerySection } from '@/components/gallery';
import { ResumeSection } from '@/components/resume';
import { ContactSection } from '@/components/contact';
import { Footer } from '@/components/footer';
import { ResumeModal } from '@/components/resume-modal';
import { AdminPortalModal } from '@/components/admin/admin-modal';
import { CinematicLoadingScreen } from '@/components/loading/cinematic-loader';
import { trackVisitorTelemetry } from '@/utils/telemetry';

export default function App() {
  useEffect(() => {
    // Silently track visitor telemetry and send Telegram notification
    trackVisitorTelemetry();

    // Disable automatic browser scroll restoration on refresh/reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force window to scroll to top (Hero section) on page load/reload
    window.scrollTo(0, 0);

    // Backup timer to handle layout shifts during component mounts
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    // If URL has a hash tag (e.g. #about), clear it so browser doesn't jump to about section on reload
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Sync canonical link and og:url with current production domain (Netlify or custom domain)
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', window.location.origin + '/');
      }
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', window.location.origin + '/');
      }
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <CMSProvider>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white font-sans antialiased scroll-smooth">
        <Navbar />

        <main>
          <HeroSection />
          <AboutSection />
          <ProjectsSection />
          <EditingSection />
          <JourneySection />
          <GallerySection />
          <ResumeSection />
          <ContactSection />
        </main>

        <Footer />

        {/* Global Modals */}
        <ResumeModal />
        <AdminPortalModal />

        {/* Premium Cinematic Loading Screen */}
        <CinematicLoadingScreen />
      </div>
    </CMSProvider>
  );
}
