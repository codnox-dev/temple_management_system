import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/api';
import { Flame, Flower2, Heart, Star, LucideProps } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import lampVideo from '../assets/lamp.mp4';

// --- Type Definitions ---
// Used to define the structure for a single ritual object.
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
// Used to map icon names from the API to actual Lucide icon components.
const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Flame,
  Flower2,
  Heart,
  Star,
};

// --- RitualIcon Component ---
// Used to render the correct icon based on its name.
const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star; // Defaults to Star icon if not found.
    return <IconComponent {...props} />;
};

// --- API Fetching ---
// Used to fetch the list of rituals from the API.
const fetchRituals = () => get<Ritual[]>('/rituals/');

const RitualSection = () => {
  const { data: rituals, isLoading, isError } = useQuery<Ritual[]>({
      queryKey: ['rituals'],
      queryFn: fetchRituals
  });

  // Hooks to trigger animations on scroll.
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation();

  return (
  <section className="py-20 px-4 md:px-6">
    <div className="max-w-screen-xl mx-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Main layout grid for desktop view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
            
            {/* --- Left Column: Video --- */}
            {/* This column contains the lamp video and is sticky on large screens. */}
            <div className="lg:col-span-1 lg:sticky lg:top-24">
                <div className={`flex items-center justify-center ${headerVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
                    <video
                        src={lampVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="rounded-xl w-full max-w-md mx-auto object-cover shadow-2xl border-4 border-primary/20"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>

            {/* --- Right Column: Content --- */}
            {/* This column stacks the text description, ritual list, and button vertically. */}
            <div className="lg:col-span-2 flex flex-col gap-10">
                {/* Text section */}
                <div ref={headerRef} className={`text-center lg:text-left ${headerVisible ? 'animate-fade-in-up' : ''}`}>
                    <h2 className="text-5xl md:text-6xl font-playfair font-bold mb-6 text-foreground">
                        Sacred <span className="text-primary">Rituals</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Connect with the divine through our authentic spiritual ceremonies,
                        each designed to bring peace and blessings.
                    </p>
                </div>

                {/* Rituals List */}
                <div ref={cardsRef} className="flex flex-col gap-4">
                  {/* Skeleton loaders shown while data is being fetched */}
                  {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-full animate-pulse">
                      <div className="rounded-xl border border-border/20 bg-card/10 p-4 flex items-center gap-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-muted rounded-lg"></div>
                          <div className="flex-grow space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-full"></div>
                          </div>
                          <div className="flex-shrink-0 space-y-2 text-right">
                            <div className="h-4 bg-muted rounded w-12 ml-auto"></div>
                            <div className="h-3 bg-muted rounded w-16 ml-auto"></div>
                          </div>
                      </div>
                    </div>
                  ))}
                  {/* Error message if rituals fail to load */}
                  {isError && <p className="text-red-500 col-span-full text-center">Failed to load rituals. Please try again later.</p>}
                  
                  {/* Renders the list of rituals */}
                  {rituals?.map((ritual, index) => (
                    <div key={ritual._id} className={`w-full ${cardsVisible ? 'animate-fade-in-up' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="rounded-xl border border-border/20 bg-card/10 backdrop-blur-sm p-4 group transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 flex items-center gap-4 relative overflow-hidden">
                        {ritual.popular && (
                            <div className="absolute top-0 right-0 bg-gradient-golden text-secondary-foreground px-3 py-1 text-xs font-medium z-10"
                                 style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 15% 50%)' }}>
                              Popular
                            </div>
                          )}
                        <div className="flex-shrink-0 p-3 bg-gradient-divine rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <RitualIcon name={ritual.icon} className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-grow">
                            <h3 className="text-md font-playfair font-semibold text-foreground">
                                {ritual.name}
                            </h3>
                            <p className="text-muted-foreground text-xs line-clamp-1">
                                {ritual.description}
                            </p>
                        </div>

                        <div className="flex-shrink-0 text-right ml-4">
                            <p className="text-md font-playfair font-bold text-primary">
                                ₹{ritual.price}
                            </p>
                            <p className="text-xs text-muted-foreground">{ritual.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Call to action button */}
                <div className="text-center lg:text-left mt-6">
                  <a href="/ritual-booking" className="btn-divine text-lg px-8 py-3">
                    Book a Ritual
                  </a>
                </div>
            </div>
        </div>
      </div>
    </div>
  </section>
  );
};

export default RitualSection;
