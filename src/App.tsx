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

export default function App() {
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
      </div>
    </CMSProvider>
  );
}
