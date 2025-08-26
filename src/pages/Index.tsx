import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import TempleOverview from '@/components/TempleOverview';
import RitualSection from '@/components/RitualSection';
import EventSection from '@/components/EventSection';
import GalleryPreview from '@/components/GalleryPreview';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
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
        
        {/* ContactSection already contains the id="contact", so it doesn't need a wrapper */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;