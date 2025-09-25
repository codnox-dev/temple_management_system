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
    <div className="min-h-screen">
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
      <main>
        {/* Each component is wrapped in a div with an ID that matches the Navigation component's links */}
        <div id="home">
          <HeroSection />
        </div>
        <div id="about">
          <TempleOverview />
        </div>
        <div id="rituals">
          <RitualSection />
        </div>
        <div id="events">
          <EventSection />
        </div>
        <div id="gallery">
          <GalleryPreview />
        </div>
        <div id="committee">
          <CommitteeSection />
        </div>
        
        {/* ContactSection already contains the id="contact", so it doesn't need a wrapper */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;