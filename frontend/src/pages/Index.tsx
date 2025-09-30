import Navigation from '@/components/Navigation';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeroSection from '@/components/HeroSection';
import TempleOverview from '@/components/TempleOverview';
import RitualSection from '@/components/RitualSection';
import EventSection from '@/components/EventSection';
import GalleryPreview from '@/components/GalleryPreview';
import CommitteeSection from '@/components/CommitteeSection';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollProgress from '@/components/ScrollProgress';

const Index = () => {
  const location = useLocation() as any;
  const fromAdmin: string | undefined = location.state?.fromAdmin;
  useEffect(() => {
    const target = location.state?.scrollTo as string | undefined;
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        // small timeout to ensure layout is ready
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }
  }, [location.state]);
  return (
    <div className="min-h-screen overflow-x-hidden no-scrollbar">
      <ScrollProgress />
      <Navigation />
      {fromAdmin && (
        <div className="fixed top-24 left-4 z-40">
          <Link to={fromAdmin} state={undefined} className="inline-flex items-center text-primary hover:text-primary/80">
            {/* simple chevron */}
            <span className="mr-2">←</span>
            Back to Admin
          </Link>
        </div>
      )}
  <main className="overflow-x-hidden">
        {/* Each component is wrapped in a div with an ID that matches the Navigation component's links */}
        <div id="home" className="scroll-offset">
          <HeroSection />
        </div>
        <div className="section-divider" />
        <div id="about" className="scroll-offset">
          <TempleOverview />
        </div>
        <div className="section-divider" />
        <div id="rituals" className="scroll-offset">
          <RitualSection />
        </div>
        <div className="section-divider" />
        <div id="events" className="scroll-offset">
          <EventSection />
        </div>
        <div className="section-divider" />
        <div id="gallery" className="scroll-offset">
          <GalleryPreview />
        </div>
        <div className="section-divider" />
        <div id="committee" className="scroll-offset">
          <CommitteeSection />
        </div>
        <div className="section-divider" />
        
        {/* ContactSection already contains the id="contact", add wrapper to ensure scroll offset */}
        <div id="contact" className="scroll-offset">
          <ContactSection />
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;