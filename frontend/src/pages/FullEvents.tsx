import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';

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

// Fetch all events
const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await axios.get('http://localhost:8000/api/events/');
  return data;
};

const FullEvents = () => {
  const { data: events, isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  if (isLoading) return <div className="text-center py-20">Loading events...</div>;
  if (isError) return <div className="text-center py-20">Error fetching events.</div>;

  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
            <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center text-foreground">
                All Upcoming <span className="text-primary">Events</span>
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mt-4">
                Explore our diverse range of spiritual and community events. Click on any event to learn more.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events?.map((event) => (
            <Link to={`/events/${event._id}`} key={event._id} className="block group">
              <Card className="card-divine h-full flex flex-col overflow-hidden transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="relative h-56">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-2xl font-playfair font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 flex-grow">{event.description}</p>
                  <div className="border-t border-primary/20 pt-4 mt-auto space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span>{event.time}</span>
                    </div>
                     <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FullEvents;
