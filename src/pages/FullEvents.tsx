import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';

// Re-using the events data from EventDetails.tsx
const events = [
  {
    id: 1,
    title: 'Maha Aarti Ceremony',
    date: '2024-01-15',
    time: '6:00 PM',
    attendees: 150,
    location: 'Main Temple Hall',
    description: 'Join us for the grand evening Aarti ceremony with traditional chants and sacred rituals.',
    image: 'https://placehold.co/600x400/FFF8E1/B8860B?text=Maha+Aarti',
    featured: true,
  },
  {
    id: 2,
    title: 'Spiritual Discourse',
    date: '2024-01-20',
    time: '4:00 PM',
    attendees: 75,
    location: 'Meditation Hall',
    description: 'Enlightening discourse on ancient scriptures and their relevance in modern life.',
    image: 'https://placehold.co/600x400/FFF8E1/B8860B?text=Discourse',
  },
  {
    id: 3,
    title: 'Festival Celebration',
    date: '2024-01-25',
    time: '10:00 AM',
    attendees: 300,
    location: 'Temple Grounds',
    description: 'Grand festival celebration with cultural programs, traditional music, and community feast.',
    image: 'https://placehold.co/600x400/FFF8E1/B8860B?text=Festival',
    featured: true,
  },
];

const FullEvents = () => {
  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
            <Link
                to="/"
                className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
            >
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

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Link to={`/events/${event.id}`} key={event.id} className="block group">
              <Card className="card-divine h-full flex flex-col overflow-hidden transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="relative h-56">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400/FFF8E1/B8860B?text=Event';
                    }}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   {event.featured && (
                    <div className="absolute top-3 right-3 bg-gradient-golden text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
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
