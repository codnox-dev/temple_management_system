import { Sparkles, Calendar, Bell } from 'lucide-react';
import templeHero from '@/assets/temple-hero.jpg';
import { Link } from 'react-router-dom';
import AnimatedCounter from '@/components/AnimatedCounter';

const HeroSection = () => {
  return (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0">
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-fade-in-up">
        {/* Sacred Symbol */}
        

        {/* Welcome Message */}
        <h1 className="text-5xl md:text-7xl font-playfair font-bold mb-6 text-foreground drop-shadow-lg">
          Welcome to
          <span className="block text-primary drop-shadow-[0_0_15px_rgba(255,153,51,0.5)]">
            Vamanan Temple
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Experience divine peace and spiritual awakening in our sacred sanctuary. 
          Book your rituals, join our events, and connect with the divine.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <Link to="/ritual-booking" className="btn-divine group">
            <Calendar className="h-5 w-5 mr-2 group-hover:animate-pulse" />
            Book Sacred Ritual
          </Link>
          <Link to="/events" className="btn-golden group">
            <Bell className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            View Events
          </Link>
        </div>

        {/* Sacred Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-scale-in" style={{animationDelay: '0.6s'}}>
          <div className="card-divine text-center">
            <AnimatedCounter to={1000} suffix="+" className="text-4xl md:text-3xl font-playfair font-bold text-primary mb-2" />
            <div className="text-muted-foreground">Sacred Rituals</div>
          </div>
          <div className="card-divine text-center">
            <AnimatedCounter to={50} suffix="+" className="text-4xl md:text-3xl font-playfair font-bold text-primary mb-2" />
            <div className="text-muted-foreground">Monthly Events</div>
          </div>
          <div className="card-divine text-center">
            <AnimatedCounter to={500} suffix="+" className="text-4xl md:text-3xl font-playfair font-bold text-primary mb-2" />
            <div className="text-muted-foreground">Devotees Served</div>
          </div>
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