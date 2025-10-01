import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get, API_BASE_URL } from '../api/api';
import { resolveImageUrl } from '../lib/utils';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import ImageWithBlur from '@/components/ImageWithBlur';

// Defines the shape of an event object
interface Event {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
}

// Defines the shape of a featured event object
interface FeaturedEvent { 
  event_id: string | null 
}

interface EventsSectionSelection {
  event_ids: string[]
}

// Fetches events from the API
const fetchEvents = () => get<Event[]>('/events/');

const EventSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false); // State to manage the fade transition

  // Fetches events data
  const { data: events, isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetches featured event data
  const { data: featured } = useQuery<FeaturedEvent>({
    queryKey: ['featuredEvent'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/featured-event/`);
      if (!res.ok) return { event_id: null };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch which events to show in the homepage section
  const { data: sectionSelection } = useQuery<EventsSectionSelection>({
    queryKey: ['eventsSectionSelection'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/events-section/`);
      if (!res.ok) return { event_ids: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: eventsRef, isVisible: eventsVisible } = useScrollAnimation();

  // Build displayed events: selected list from backend; ensure featured is included and first; cap to any number (no fixed slice)
  const featuredId = featured?.event_id || null;
  const selectedIds = sectionSelection?.event_ids || [];
  // If no selection provided, show only featured (if any). Otherwise use selected list.
  let candidates: Event[] = [];
  if (selectedIds.length > 0) {
    const set = new Set(selectedIds);
    candidates = (events || []).filter(e => set.has(e._id));
  } else if (featuredId) {
    candidates = (events || []).filter(e => e._id === featuredId);
  }
  // Ensure featured is included and first
  if (featuredId) {
    const withFeatured = candidates.some(e => e._id === featuredId) ? candidates : [ ...(events||[]).filter(e=>e._id===featuredId), ...candidates ];
    // Deduplicate by _id preserving order
    const seen = new Set<string>();
    candidates = withFeatured.filter(e => (seen.has(e._id) ? false : (seen.add(e._id), true)));
  }
  const displayedEvents = candidates;
  const currentEvent = displayedEvents?.[currentIndex];

  /**
   * Used to handle the slide transition with a fade effect.
   * @param newIndex - The index of the slide to transition to.
   */
  const transitionToSlide = useCallback((newIndex: number) => {
    // Prevent transitions to the same slide or while a transition is already in progress
    if (newIndex === currentIndex || isFading) return;

    setIsFading(true); // Triggers the fade-out animation
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFading(false); // Triggers the fade-in animation with the new content
    }, 300); // This duration must match the CSS transition duration
  }, [currentIndex, isFading]);

  // Used to navigate to the next event in the slideshow
  const handleNext = useCallback(() => {
    if (displayedEvents.length > 0) {
      transitionToSlide((currentIndex + 1) % displayedEvents.length);
    }
  }, [displayedEvents.length, currentIndex, transitionToSlide]);

  // Used to navigate to the previous event in the slideshow
  const handlePrev = useCallback(() => {
    if (displayedEvents.length > 0) {
      transitionToSlide((currentIndex - 1 + displayedEvents.length) % displayedEvents.length);
    }
  }, [displayedEvents.length, currentIndex, transitionToSlide]);

  // Effect for auto-playing the slideshow.
  // Resets the timer whenever the user manually navigates.
  useEffect(() => {
    if (displayedEvents.length > 1) {
      const timer = setInterval(handleNext, 8000); // Slower switching: 8 seconds
      return () => clearInterval(timer); // Cleanup interval on component unmount or when dependencies change
    }
  }, [displayedEvents.length, handleNext]);

  return (
    <section className="py-10 px-6">
      <div className="max-w-screen-2xl mx-auto bg-transparent border-2 border-red-500 rounded-xl p-6 sm:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div ref={headerRef} className={`text-center mb-16 ${headerVisible ? 'animate-fade-in-up' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
              Upcoming <span className="text-primary">Events</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join our spiritual community in celebrating divine festivals, daily prayers, and special ceremonies.
            </p>
          </div>

          {isLoading && <div className="text-center">Loading events...</div>}
          {isError && <div className="text-center text-red-500">Error fetching events.</div>}

          {!isLoading && !isError && currentEvent && (
            <>
              <div ref={eventsRef} className={`relative max-w-4xl mx-auto ${eventsVisible ? 'animate-fade-in' : ''}`}>
                {/* The main event card now has transition properties for a smooth fade */}
                <div className={`relative group overflow-hidden flex flex-col md:flex-row h-full rounded-xl border-transparent card-divine bg-transparent shadow-lg transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="relative overflow-hidden md:w-1/2 h-64 md:h-auto">
                    <ImageWithBlur
                      src={resolveImageUrl(currentEvent.image)}
                      alt={currentEvent.title}
                      className="w-full h-full object-cover"
                    />
                    {featuredId && currentEvent._id === featuredId && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-semibold px-2 py-1 rounded shadow">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow md:w-1/2">
                    <div className="flex-grow">
                      <h3 className="text-3xl text-foreground font-playfair font-semibold group-hover:text-primary transition-colors mb-4">
                        {currentEvent.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-4">
                        {currentEvent.description}
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-3 text-primary" />
                          {new Date(currentEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-3 text-primary" />
                          {currentEvent.time}
                        </div>
                        <div className="text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-3 text-primary" />
                          {currentEvent.location}
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto pt-6">
                      <Link to={`/events/${currentEvent._id}`} className="w-full md:w-auto inline-flex items-center justify-center rounded-md px-6 py-3 btn-golden">
                        Event Details
                      </Link>
                    </div>
                  </div>
                </div>

                {displayedEvents.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute top-1/2 left-0 md:-left-12 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-opacity z-10"
                      aria-label="Previous Event"
                      disabled={isFading} // Disable button during transition
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute top-1/2 right-0 md:-right-12 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-2 rounded-full transition-opacity z-10"
                      aria-label="Next Event"
                      disabled={isFading} // Disable button during transition
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
              
              {/* Slideshow Indicators */}
              {displayedEvents.length > 1 && (
                  <div className="flex justify-center space-x-3 mt-8">
                      {displayedEvents.map((_, index) => (
                          <button
                              key={index}
                              onClick={() => transitionToSlide(index)}
                              className={`h-2 w-2 rounded-full transition-colors ${currentIndex === index ? 'bg-primary scale-125' : 'bg-muted-foreground/50'}`}
                              aria-label={`Go to slide ${index + 1}`}
                              disabled={isFading} // Disable indicators during transition
                          />
                      ))}
                  </div>
              )}


              <div className="text-center mt-12">
                <Link to="/events" className="btn-divine">
                  View All Events
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventSection;
