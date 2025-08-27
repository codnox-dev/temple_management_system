import React from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const events = [
  {
    id: 1,
    title: 'Maha Aarti Ceremony',
    date: '2024-01-15',
    time: '6:00 PM',
    attendees: 150,
    location: 'Main Temple Hall',
    description: 'Join us for the grand evening Aarti ceremony with traditional chants and sacred rituals.',
    image: '/placeholder.svg',
    featured: true,
    fullDescription: 'Experience the divine energy of our Maha Aarti Ceremony, a soul-stirring ritual that connects devotees with the divine. This sacred ceremony features traditional chants, the gentle glow of oil lamps, and the mesmerizing sound of temple bells. Our experienced priests will guide you through this spiritual journey, creating an atmosphere of peace and devotion. The ceremony includes special prayers for prosperity, health, and spiritual awakening. All devotees are welcome to participate in this transformative experience.',
    schedule: [
      { time: '5:30 PM', activity: 'Temple doors open, devotees gather' },
      { time: '6:00 PM', activity: 'Opening prayers and mantras' },
      { time: '6:15 PM', activity: 'Maha Aarti ceremony begins' },
      { time: '6:45 PM', activity: 'Prasadam distribution' },
      { time: '7:00 PM', activity: 'Closing prayers and blessings' },
    ],
    requirements: ['Please arrive 15 minutes early', 'Maintain silence during the ceremony', 'Mobile phones on silent mode'],
  },
  {
    id: 2,
    title: 'Spiritual Discourse',
    date: '2024-01-20',
    time: '4:00 PM',
    attendees: 75,
    location: 'Meditation Hall',
    description: 'Enlightening discourse on ancient scriptures and their relevance in modern life.',
    image: '/placeholder.svg',
    fullDescription: 'Join us for an enlightening spiritual discourse that bridges ancient wisdom with modern living. Our learned speaker will share insights from sacred scriptures, helping you understand how timeless teachings can guide us through contemporary challenges. This interactive session encourages questions and discussions, creating a community of seekers on the spiritual path.',
    schedule: [
      { time: '3:45 PM', activity: 'Registration and seating' },
      { time: '4:00 PM', activity: 'Opening meditation' },
      { time: '4:15 PM', activity: 'Spiritual discourse begins' },
      { time: '5:30 PM', activity: 'Q&A session' },
      { time: '6:00 PM', activity: 'Closing prayers' },
    ],
    requirements: ['Bring a notebook for insights', 'Comfortable seating available', 'Light refreshments provided'],
  },
  {
    id: 3,
    title: 'Festival Celebration',
    date: '2024-01-25',
    time: '10:00 AM',
    attendees: 300,
    location: 'Temple Grounds',
    description: 'Grand festival celebration with cultural programs, traditional music, and community feast.',
    image: '/placeholder.svg',
    featured: true,
    fullDescription: 'Celebrate the joy of our grand festival with the entire temple community. This vibrant celebration features traditional music, dance performances, cultural programs, and a community feast. Experience the rich heritage of our traditions through colorful decorations, spiritual ceremonies, and joyful celebrations that bring devotees together in unity and devotion.',
    schedule: [
      { time: '10:00 AM', activity: 'Festival inauguration ceremony' },
      { time: '11:00 AM', activity: 'Cultural programs and performances' },
      { time: '12:30 PM', activity: 'Special puja and rituals' },
      { time: '1:30 PM', activity: 'Community feast (prasadam)' },
      { time: '3:00 PM', activity: 'Games and activities for children' },
      { time: '5:00 PM', activity: 'Closing ceremony and aarti' },
    ],
    requirements: ['Family-friendly event', 'Traditional attire encouraged', 'Free participation for all'],
  },
];

const EventDetails = () => {
  const { id } = useParams();
  const event = events.find(e => e.id === parseInt(id || '1'));

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-sacred py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-playfair font-bold mb-4">Event Not Found</h1>
          <Link to="/" className="btn-divine">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  {event.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  {event.attendees} Expected Attendees
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
              {event.featured && (
                <div className="absolute top-4 right-4 bg-gradient-golden text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Featured Event
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="card-divine p-6">
              <h2 className="text-2xl font-playfair font-semibold mb-4 text-foreground">
                About This Event
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {event.fullDescription}
              </p>
            </Card>

            {/* Schedule */}
            <Card className="card-divine p-6">
              <h2 className="text-2xl font-playfair font-semibold mb-4 text-foreground">
                Event Schedule
              </h2>
              <div className="space-y-4">
                {event.schedule.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-primary/10 last:border-b-0">
                    <div className="bg-gradient-divine text-white px-3 py-1 rounded-full text-sm font-medium min-w-fit">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Requirements */}
            <Card className="card-divine p-6">
              <h2 className="text-2xl font-playfair font-semibold mb-4 text-foreground">
                Important Information
              </h2>
              <ul className="space-y-2">
                {event.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-muted-foreground">{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="card-divine p-6">
              <h3 className="text-xl font-playfair font-semibold mb-4 text-foreground">
                Quick Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground font-medium">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="text-foreground font-medium">{event.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground font-medium">{event.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected:</span>
                  <span className="text-foreground font-medium">{event.attendees} people</span>
                </div>
              </div>
            </Card>

            {/* Contact */}
            <Card className="card-divine p-6">
              <h3 className="text-xl font-playfair font-semibold mb-4 text-foreground">
                Need More Information?
              </h3>
              <p className="text-muted-foreground mb-4">
                Have questions about this event? Feel free to contact us.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground ml-2">+91 98765 43210</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground ml-2">events@divinetemple.com</span>
                </div>
              </div>
            </Card>

            {/* Other Events */}
            <Card className="card-divine p-6">
              <h3 className="text-xl font-playfair font-semibold mb-4 text-foreground">
                Other Upcoming Events
              </h3>
              <div className="space-y-3">
                {events.filter(e => e.id !== event.id).slice(0, 2).map(otherEvent => (
                  <Link 
                    key={otherEvent.id}
                    to={`/events/${otherEvent.id}`}
                    className="block p-3 border border-primary/20 rounded-lg hover:bg-card/50 transition-colors"
                  >
                    <h4 className="font-medium text-foreground text-sm mb-1">{otherEvent.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(otherEvent.date).toLocaleDateString()} • {otherEvent.time}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
