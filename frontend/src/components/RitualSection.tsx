import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/api';
import { Flame, Flower2, Heart, Star, LucideProps } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// --- Type Definitions ---
interface Ritual {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  popular?: boolean;
  booking_start_time?: string;
  booking_end_time?: string;
  employee_only?: boolean;
}

// --- Icon Mapping Utility ---
const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Flame,
  Flower2,
  Heart,
  Star,
};

const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star;
    return <IconComponent {...props} />;
};

// --- API Fetching ---
const fetchRituals = () => get<Ritual[]>('/rituals/');

const RitualSection = () => {
  const { data: rituals, isLoading, isError } = useQuery<Ritual[]>({
      queryKey: ['rituals'],
      queryFn: fetchRituals
  });
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation();

  return (
  // Changed py-20 to py-10 to reduce vertical space
  <section className="py-10 px-6">
    <div className="max-w-screen-2xl mx-auto bg-transparent border-2 border-red-500 rounded-xl p-6 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className={`text-center mb-16 ${headerVisible ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Sacred <span className="text-primary">Rituals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed py-6">
            Connect with the divine through our authentic spiritual ceremonies,
            each designed to bring peace, prosperity, and divine blessings into your life.
          </p>
        </div>
        <div ref={cardsRef} className="flex flex-wrap justify-center gap-6">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full md:w-1/2 lg:w-1/4 max-w-sm">
              <div className="rounded-xl border border-red-500 overflow-hidden">
                <div className="card-ritual group relative animate-pulse">
                   <div className="h-24 bg-muted rounded-full w-24 mx-auto mb-4"></div>
                   <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                   <div className="h-4 bg-muted rounded w-full mx-auto mb-4"></div>
                   <div className="h-4 bg-muted rounded w-full mx-auto mb-4"></div>
                   <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {isError && <p className="text-red-500 col-span-full text-center">Failed to load rituals. Please try again later.</p>}
          {rituals?.map((ritual, index) => (
            <div key={ritual._id} className={`w-full md:w-1/2 lg:w-1/4 max-w-sm ${cardsVisible ? 'animate-scale-in' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
              <div className="rounded-xl border border-red-500 overflow-hidden">
                <div className="card-ritual group relative flex flex-col">
                  {ritual.popular && (
                    <div className="absolute -top-3 -right-3 bg-gradient-golden text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium z-10">
                      Popular
                    </div>
                  )}
                  <div className="text-center mb-4 flex-grow">
                    <div className="inline-flex p-4 bg-gradient-divine rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                      <RitualIcon name={ritual.icon} className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-playfair font-semibold mb-2 text-foreground">
                      {ritual.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed overflow-hidden line-clamp-3">
                      {ritual.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
                    <span>Duration: {ritual.duration}</span>
                    <span className="text-xl font-playfair font-bold text-primary">
                      ₹{ritual.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="/ritual-booking" className="btn-divine">
            Book Ritual
          </a>
        </div>
      </div>
    </div>
  </section>
  );
};

export default RitualSection;