import { Calendar, Clock, Users, MapPin } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Diwali Celebration',
    date: 'Nov 12, 2024',
    time: '6:00 PM',
    attendees: 500,
    location: 'Main Temple Hall',
    description: 'Grand celebration of the festival of lights with traditional ceremonies',
    image: 'https://images.unsplash.com/photo-1605538883669-242d80da4c85?w=400&h=200&fit=crop',
    featured: true,
  },
  {
    id: 2,
    title: 'Weekly Satsang',
    date: 'Every Sunday',
    time: '7:00 PM',
    attendees: 100,
    location: 'Prayer Hall',
    description: 'Spiritual discourse and community gathering for devotional songs',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
  },
  {
    id: 3,
    title: 'Maha Aarti',
    date: 'Daily',
    time: '7:00 AM & 7:00 PM',
    attendees: 200,
    location: 'Sanctum Sanctorum',
    description: 'Sacred fire ceremony performed twice daily with devotional hymns',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=200&fit=crop',
  },
];

const EventSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Upcoming <span className="text-primary">Events</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our spiritual community in celebrating divine festivals, 
            daily prayers, and special ceremonies throughout the year.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div 
              key={event.id} 
              className={`card-divine group overflow-hidden ${
                event.featured ? 'lg:col-span-2 lg:row-span-1' : ''
              }`}
            >
              {event.featured && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-golden text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Featured Event
                </div>
              )}
              
              <div className="relative h-48 overflow-hidden rounded-lg mb-4">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-playfair font-semibold text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {event.date}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    {event.time}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    {event.attendees}+ attending
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    {event.location}
                  </div>
                </div>

                <a href={`/events/${event.id}`} className="w-full btn-golden mt-4">
                  Event Details
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="btn-divine">
            View All Events
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventSection;