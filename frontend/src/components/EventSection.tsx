import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar, Clock, MapPin } from 'lucide-react';

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

// Fetch events from the API
const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await axios.get('http://localhost:8000/api/events/');
  return data;
};

const EventSection = () => {
  const { data: events, isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  if (isLoading) return <div>Loading events...</div>;
  if (isError) return <div>Error fetching events.</div>;

  // Show only the first 3 events
  const displayedEvents = events?.slice(0, 3);

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Upcoming <span className="text-primary">Events</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our spiritual community in celebrating divine festivals,
            daily prayers, and special ceremonies throughout the year.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {displayedEvents?.map((event) => (
            <div key={event._id} className="card-divine group overflow-hidden flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-2xl font-playfair font-semibold text-foreground group-hover:text-primary transition-colors mb-4">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {event.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      {event.time}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {event.location}
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  <Link to={`/events/${event._id}`} className="w-full btn-golden">
                    Event Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/events" className="btn-divine">
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventSection;
