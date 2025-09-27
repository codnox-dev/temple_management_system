import { Clock, Users, Award, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Clock,
    title: 'Daily Worship',
    description: 'Experience divine peace with our daily morning and evening aarti ceremonies',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join a vibrant community of devotees seeking spiritual growth and enlightenment',
  },
  {
    icon: Award,
    title: 'Authentic Rituals',
    description: 'Traditional ceremonies performed by experienced priests following ancient scriptures',
  },
  {
    icon: Sparkles,
    title: 'Sacred Atmosphere',
    description: 'A peaceful sanctuary designed to elevate your spiritual consciousness',
  },
];

const TempleOverview = () => {
  const navigate = useNavigate();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation();
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div ref={contentRef} className={`space-y-8 ${contentVisible ? 'animate-slide-in-left' : ''}`}>
            <div>
              <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
                About Our <span className="text-primary">Sacred Temple</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                For over a century, our temple has been a beacon of spiritual light, 
                guiding devotees on their journey of faith, devotion, and inner peace. 
                We honor ancient traditions while embracing modern conveniences to serve our community.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className={`flex items-start space-x-4 group p-4 rounded-lg bg-card/50 border border-primary/10 hover:border-primary/30 transition-all duration-300 ${contentVisible ? 'animate-fade-in-up' : ''}`} style={{animationDelay: `${0.2 + index * 0.1}s`}}>
                    <div className="p-3 bg-gradient-divine rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-playfair font-semibold mb-2 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn-divine" onClick={() => navigate('/about')}>
              Learn More About Our Temple
            </button>
          </div>

          {/* Image Section */}
          <div ref={imageRef} className={`relative ${imageVisible ? 'animate-slide-in-right' : ''}`}>
            <div className="relative rounded-2xl overflow-hidden card-divine">
              <img
                src=""
                alt="Temple Interior"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-8 -left-8 bg-card p-6 rounded-xl shadow-lg glow-sacred">
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-primary mb-1">100+</div>
                <div className="text-sm text-muted-foreground">Years of Service</div>
              </div>
            </div>
            
            <div className="absolute -top-8 -right-8 bg-card p-6 rounded-xl shadow-lg glow-sacred">
              <div className="text-center">
                <div className="text-3xl font-playfair font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Divine Blessings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TempleOverview;