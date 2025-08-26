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
    image: 'https://placehold.co/600x400/FFF8E1/BFA260?text=Diwali',
  },
  {
    id: 2,
    title: 'Weekly Satsang',
    date: 'Every Sunday',
    time: '7:00 PM',
    attendees: 100,
    location: 'Prayer Hall',
    description: 'Spiritual discourse and community gathering for devotional songs',
    image: 'https://placehold.co/600x400/FFF8E1/BFA260?text=Satsang',
  },
  {
    id: 3,
    title: 'Maha Aarti',
    date: 'Daily',
    time: '7:00 AM & 7:00 PM',
    attendees: 200,
    location: 'Sanctum Sanctorum',
    description: 'Sacred fire ceremony performed twice daily with devotional hymns',
    image: 'https://placehold.co/600x400/FFF8E1/BFA260?text=Aarti',
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
          {events.map((event) => (
            <div
              key={event.id}
              // The card is now a flex container with a vertical direction
              className={`card-divine group overflow-hidden flex flex-col`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  // Added a fallback for the image
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/600x400/FFF8E1/BFA260?text=${event.title.replace(' ', '+')}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* This new wrapper allows content to grow and push the button to the bottom */}
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
                </div>

                {/* This wrapper pushes the button to the bottom of the card */}
                <div className="mt-auto pt-6">
                  <a href={`/events/${event.id}`} className="w-full btn-golden">
                    Event Details
                  </a>
                </div>
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
