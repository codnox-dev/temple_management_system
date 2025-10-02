import { Sparkles, Calendar, Bell, Clock } from 'lucide-react';
import templeHero from '@/assets/temple-hero.jpg';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 md:py-0">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 parallax-bg">
        <img
          src={templeHero}
          alt="Sacred Temple"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-background/30" />
      </div>


      {/* Main Content */}
  <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-fade-in-up flex flex-col items-center justify-center space-y-8">
        {/* Sacred Symbol */}
        

        {/* Welcome Message */}
  <h1 className="text-5xl md:text-7xl font-playfair font-bold text-foreground drop-shadow-lg">
          Welcome to
          <span className="block text-primary drop-shadow-[0_0_15px_rgba(255,153,51,0.5)]">
            Vamanakulangara Vishnu Temple
          </span>
        </h1>
        
  <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed drop-shadow-md animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Experience divine peace and spiritual awakening in our sacred sanctuary. 
          Book your rituals, join our events, and connect with the divine.
        </p>

        {/* CTA + Timings */}
        <div className="w-full flex flex-col-reverse md:flex-row items-stretch md:items-center justify-center gap-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          {/* Left: CTAs */}
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/ritual-booking" className="btn-divine group">
              <Calendar className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Book Sacred Ritual
            </Link>
            <Link to="/events" className="btn-golden group">
              <Bell className="h-5 w-5 mr-2 group-hover:animate-pulse transition-transform" />
              View Events
            </Link>
          </div>

          {/* Right: Timings Card */}
          <aside className="w-full md:w-auto flex-shrink-0">
              {/* Changed bg-white/20 to bg-white/30 for more opacity */}
              <div className="p-4 rounded-xl bg-white/55 backdrop-blur-md border border-white/30 shadow-lg max-w-xs mx-auto">
              <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-full shadow-sm">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-playfair font-semibold text-foreground">Temple Timings</h4>
              </div>
              <div className="text-sm text-foreground/90 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Morning</span>
                  <span className="font-medium">5:00 AM - 12:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Evening</span>
                  <span className="font-medium">4:00 PM - 9:00 PM</span>
                </div>
                <div className="mt-2 text-xs text-foreground/70">Special seva timings change on festival days — check Events for details.</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;