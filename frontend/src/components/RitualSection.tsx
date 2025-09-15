import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/api';
import { Flame, Flower2, Heart, Star, LucideProps } from 'lucide-react';

// --- Type Definitions ---
interface Ritual {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  popular?: boolean;
}

// --- Icon Mapping Utility ---
const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Flame,
  Flower2,
  Heart,
  Star,
};

const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star; // Default to Star if not found
    return <IconComponent {...props} />;
};

// --- API Fetching ---
<<<<<<< HEAD
const fetchRituals = async (): Promise<Ritual[]> => {
  const { data } = await axios.get('http://localhost:8080/api/rituals/');
  return data;
};
=======
const fetchRituals = () => get<Ritual[]>('/rituals/');
>>>>>>> niranj


const RitualSection = () => {
  const { data: rituals, isLoading, isError } = useQuery<Ritual[]>({ 
      queryKey: ['rituals'], 
      queryFn: fetchRituals 
  });

  return (
    <section className="py-20 bg-gradient-sacred">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Sacred <span className="text-primary">Rituals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with the divine through our authentic spiritual ceremonies, 
            each designed to bring peace, prosperity, and divine blessings into your life.
          </p>
        </div>

        {/* Rituals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-ritual group relative animate-pulse">
               <div className="h-24 bg-slate-200 rounded-full w-24 mx-auto mb-4"></div>
               <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
               <div className="h-4 bg-slate-200 rounded w-full mx-auto mb-4"></div>
               <div className="h-4 bg-slate-200 rounded w-full mx-auto mb-4"></div>
               <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
               </div>
            </div>
          ))}

          {isError && <p className="text-red-500 col-span-full text-center">Failed to load rituals. Please try again later.</p>}

          {rituals?.map((ritual) => (
            <div key={ritual._id} className="card-ritual group relative flex flex-col">
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
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
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
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a href="/ritual-booking" className="btn-divine">
            Book Ritual
          </a>
        </div>
      </div>
    </section>
  );
};

export default RitualSection;
