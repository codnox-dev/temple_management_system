import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { get, API_BASE_URL } from '../api/api';
import { resolveImageUrl } from '../lib/utils';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import ImageWithBlur from '@/components/ImageWithBlur';

// Define the shape of an event object
interface Event {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
}
interface FeaturedEvent { event_id: string | null }

// Fetch events from the API
const fetchEvents = () => get<Event[]>('/events/');

const EventSection = () => {
  const { data: events, isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const { data: featured } = useQuery<FeaturedEvent>({
    queryKey: ['featuredEvent'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/featured-event/`);
      if (!res.ok) return { event_id: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: eventsRef, isVisible: eventsVisible } = useScrollAnimation();

  // --- Loading and error states are moved inside the main return to be wrapped by the border ---

  // Show only the first 3 events
  // Featured first if present
  const featuredId = featured?.event_id || null;
  const sorted = (events || []).slice().sort((a, b) => (a._id === featuredId ? -1 : b._id === featuredId ? 1 : 0));
  const displayedEvents = sorted.slice(0, 3);

  return (
  // 1. Main wrapper with reduced vertical space
  <section className="py-10 px-6">
    {/* 2. The visible outline container */}
    <div className="max-w-screen-2xl mx-auto bg-transparent border-2 border-red-500 rounded-xl p-6 sm:p-8 lg:p-12">
      {/* 3. The content container */}
      <div className="max-w-7xl mx-auto">
      
        {/* --- START OF ORIGINAL COMPONENT CONTENT --- */}
      
        <div ref={headerRef} className={`text-center mb-16 ${headerVisible ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Upcoming <span className="text-primary">Events</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our spiritual community in celebrating divine festivals,
            daily prayers, and special ceremonies throughout the year.
          </p>
        </div>

        {isLoading && <div className="text-center">Loading events...</div>}
        {isError && <div className="text-center text-red-500">Error fetching events.</div>}

        {!isLoading && !isError && (
          <>
            <div ref={eventsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {displayedEvents?.map((event, index) => {
                const isFeatured = event._id === featuredId;
                return (
                  <div key={event._id} className={`${isFeatured ? 'lg:col-span-2' : ''} ${eventsVisible ? 'animate-scale-in' : ''}`} style={{animationDelay: `${index * 0.2}s`}}>
                      <div className={`relative group overflow-hidden flex flex-col h-full rounded-xl border ${isFeatured ? 'border-orange-500 ring-2 ring-orange-400/70 shadow-xl shadow-orange-200' : 'border-transparent card-divine'} bg-transparent`}>
                      <div className={`relative overflow-hidden ${isFeatured ? 'h-64' : 'h-48'}`}>
                        <ImageWithBlur
                          src={resolveImageUrl(event.image)}
                          alt={event.title}
                          className="w-full h-full"
                        />
                        {isFeatured && (
                          <span className="absolute top-3 left-3 bg-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className={`${isFeatured ? 'text-3xl text-orange-700' : 'text-2xl text-foreground'} font-playfair font-semibold group-hover:text-primary transition-colors mb-4`}>
                            {event.title}
                          </h3>
                          <p className={`${isFeatured ? 'text-orange-800' : 'text-muted-foreground'} leading-relaxed mb-4 line-clamp-3`}>
                            {event.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className={`${isFeatured ? 'text-gray-700' : 'text-muted-foreground'} flex items-center`}>
                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className={`${isFeatured ? 'text-gray-700' : 'text-muted-foreground'} flex items-center`}>
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              {event.time}
                            </div>
                            <div className={`${isFeatured ? 'text-gray-700' : 'text-muted-foreground'} flex items-center`}>
                              <MapPin className="h-4 w-4 mr-2 text-primary" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-6">
                          <Link to={`/events/${event._id}`} className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 ${isFeatured ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'btn-golden'}`}>
                            Event Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link to="/events" className="btn-divine">
                View All Events
              </Link>
            </div>
          </>
        )}
        
        {/* --- END OF ORIGINAL COMPONENT CONTENT --- */}
        
      </div>
    </div>
  </section>
  );
};

export default EventSection;