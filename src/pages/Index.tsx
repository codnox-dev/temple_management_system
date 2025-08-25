import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import TempleOverview from '@/components/TempleOverview';
import RitualSection from '@/components/RitualSection';
import EventSection from '@/components/EventSection';
import GalleryPreview from '@/components/GalleryPreview';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <TempleOverview />
      <RitualSection />
      <EventSection />
      <GalleryPreview />
      <Footer />
    </div>
  );
};

export default Index;
