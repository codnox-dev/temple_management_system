import { Flame, Flower2, Heart, Star } from 'lucide-react';

const rituals = [
  {
    id: 1,
    name: 'Aarti & Prayers',
    description: 'Traditional evening prayers with sacred flames and devotional songs',
    price: '₹101',
    duration: '30 mins',
    icon: Flame,
    popular: true,
  },
  {
    id: 2,
    name: 'Puja & Offering',
    description: 'Personal worship ceremony with flowers, fruits, and sacred offerings',
    price: '₹251',
    duration: '45 mins',
    icon: Flower2,
  },
  {
    id: 3,
    name: 'Special Blessing',
    description: 'Personalized blessing ceremony for health, prosperity, and peace',
    price: '₹501',
    duration: '1 hour',
    icon: Heart,
  },
  {
    id: 4,
    name: 'Festival Ceremony',
    description: 'Grand celebration rituals for special occasions and festivals',
    price: '₹1001',
    duration: '2 hours',
    icon: Star,
  },
];

const RitualSection = () => {
  return (
    <section className="py-20 bg-gradient-sacred">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Sacred <span className="text-primary">Rituals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with the divine through our authentic spiritual ceremonies, 
            each designed to bring peace, prosperity, and divine blessings into your life.
          </p>
        </div>

        {/* Rituals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rituals.map((ritual) => {
            const IconComponent = ritual.icon;
            return (
              <div key={ritual.id} className="card-ritual group relative">
                {ritual.popular && (
                  <div className="absolute -top-3 -right-3 bg-gradient-golden text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="inline-flex p-4 bg-gradient-divine rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold mb-2 text-foreground">
                    {ritual.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {ritual.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <span>Duration: {ritual.duration}</span>
                  <span className="text-xl font-playfair font-bold text-primary">
                    {ritual.price}
                  </span>
                </div>

                
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a href="/ritual-booking" className="btn-divine">
            Book Ritual
          </a>
        </div>
      </div>
    </section>
  );
};

export default RitualSection;