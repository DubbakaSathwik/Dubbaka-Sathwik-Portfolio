import { useEffect, useState, useCallback } from 'react';
import { CMSProvider } from '@/context/CMSContext';
import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero';
import { AboutSection } from '@/components/about';
import { ProjectsSection } from '@/components/projects';
import { EditingSection } from '@/components/editing';
import { JourneySection } from '@/components/journey';
import { EventsSection } from '@/components/events-section';
import { GallerySection } from '@/components/gallery';
import { BlogsSection } from '@/components/blogs-section';
import { PressMentionsSection } from '@/components/press-mentions-section';
import { ResumeSection } from '@/components/resume';
import { ContactSection } from '@/components/contact';
import { Footer } from '@/components/footer';
import { ResumeModal } from '@/components/resume-modal';
import { AdminPortalModal } from '@/components/admin/admin-modal';
import { CinematicLoadingScreen } from '@/components/loading/cinematic-loader';
import { ProjectDetailPage } from '@/components/project-detail-page';
import { InsightsDirectoryPage } from '@/components/insights-directory-page';
import { ArticleDetailPage } from '@/components/article-detail-page';
import { EventDetailPage } from '@/components/event-detail-page';
import { PressDetailPage } from '@/components/press-detail-page';
import { trackVisitorTelemetry } from '@/utils/telemetry';
import { SITE_CONFIG, applyDynamicDocumentMeta } from '@/config/seo';

function normalizePathname(p: string): string {
  const cleaned = (p || '/').replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '/'
  );

  const navigateTo = useCallback(
    (targetPath: string, options?: { scrollToId?: string; prefillSubject?: string }) => {
      const normalized = normalizePathname(targetPath);
      if (typeof window !== 'undefined') {
        if (normalizePathname(window.location.pathname) !== normalized) {
          window.history.pushState({}, '', normalized);
        }
        setPathname(normalized);

        if (normalized === '/') {
          applyDynamicDocumentMeta({
            title: SITE_CONFIG.defaultTitle,
            description: SITE_CONFIG.defaultDescription,
            pathname: '/',
            image: SITE_CONFIG.defaultImage,
            ogType: 'profile',
          });
        }

        if (options?.scrollToId) {
          setTimeout(() => {
            const el = document.getElementById(options.scrollToId!);
            if (el) {
              const header = document.getElementById('main-header');
              const headerHeight = header ? header.getBoundingClientRect().height : 80;
              const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
              window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
            if (options.prefillSubject) {
              window.dispatchEvent(
                new CustomEvent('portfolio:prefill-contact', {
                  detail: { subject: options.prefillSubject },
                })
              );
            }
          }, 80);
        } else {
          window.scrollTo(0, 0);
        }
      }
    },
    []
  );

  useEffect(() => {
    // Silently track visitor telemetry and send Telegram notification
    trackVisitorTelemetry();

    // Disable automatic browser scroll restoration on refresh/reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Force window to scroll to top on initial load
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    // Clear hash fragments on homepage load so refresh stays at top
    if (window.location.pathname === '/' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Sync canonical link and og:url with current domain
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      const fullCurrent = window.location.origin + normalizePathname(window.location.pathname);
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', fullCurrent);
      }
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', fullCurrent);
      }
    }

    const handlePopState = () => {
      const next = normalizePathname(window.location.pathname);
      setPathname(next);
      if (next === '/') {
        applyDynamicDocumentMeta({
          title: SITE_CONFIG.defaultTitle,
          description: SITE_CONFIG.defaultDescription,
          pathname: '/',
          image: SITE_CONFIG.defaultImage,
          ogType: 'profile',
        });
      }
    };

    const handleNavigateEvent = (e: Event) => {
      const custom = e as CustomEvent<{
        path?: string;
        scrollToId?: string;
        prefillSubject?: string;
      }>;
      if (custom?.detail?.path) {
        navigateTo(custom.detail.path, {
          scrollToId: custom.detail.scrollToId,
          prefillSubject: custom.detail.prefillSubject,
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('portfolio:navigate', handleNavigateEvent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('portfolio:navigate', handleNavigateEvent);
    };
  }, [navigateTo]);

  const projectSlugMatch = pathname.match(/^\/projects\/([^/]+)$/);
  const activeProjectSlug = projectSlugMatch ? decodeURIComponent(projectSlugMatch[1]) : null;

  const isInsightsDirectory = pathname === '/insights';
  const blogSlugMatch = pathname.match(/^\/(?:blog|articles)\/([^/]+)$/);
  const activeBlogSlug = blogSlugMatch ? decodeURIComponent(blogSlugMatch[1]) : null;

  const eventSlugMatch = pathname.match(/^\/events\/([^/]+)$/);
  const activeEventSlug = eventSlugMatch ? decodeURIComponent(eventSlugMatch[1]) : null;

  const pressSlugMatch = pathname.match(/^\/press\/([^/]+)$/);
  const activePressSlug = pressSlugMatch ? decodeURIComponent(pressSlugMatch[1]) : null;

  return (
    <CMSProvider>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white font-sans antialiased scroll-smooth">
        <Navbar />

        {activeProjectSlug ? (
          <main>
            <ProjectDetailPage slug={activeProjectSlug} onNavigate={navigateTo} />
          </main>
        ) : activeBlogSlug ? (
          <main>
            <ArticleDetailPage slug={activeBlogSlug} onNavigate={navigateTo} />
          </main>
        ) : activeEventSlug ? (
          <main>
            <EventDetailPage slug={activeEventSlug} onNavigate={navigateTo} />
          </main>
        ) : activePressSlug ? (
          <main>
            <PressDetailPage slug={activePressSlug} onNavigate={navigateTo} />
          </main>
        ) : isInsightsDirectory ? (
          <main>
            <InsightsDirectoryPage onNavigate={navigateTo} />
          </main>
        ) : (
          <main>
            <HeroSection />
            <AboutSection />
            <ProjectsSection />
            <EditingSection />
            <JourneySection />
            <EventsSection />
            <GallerySection />
            <BlogsSection />
            <PressMentionsSection />
            <ResumeSection />
            <ContactSection />
          </main>
        )}

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
