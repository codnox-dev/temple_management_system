import { Link } from 'react-router-dom';
import { Sparkles, Landmark, Users, BookOpen, ArrowLeft } from 'lucide-react';

const AboutTemple = () => {
  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-2 text-foreground">About Our Temple</h1>
            <p className="text-muted-foreground text-lg">
              Discover our history, mission, and the values that guide our community.
            </p>
          </div>
        </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="card-divine p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Landmark className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Our Heritage</h2>
                </div>
                <p className="text-muted-foreground">
                  For over a century, our temple has served as a sacred space for worship, reflection, and community.
                  We honor timeless traditions while embracing the needs of modern devotees.
                </p>
              </div>

              <div className="card-divine p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Community & Service</h2>
                </div>
                <p className="text-muted-foreground">
                  Our programs foster spiritual growth, cultural awareness, and social harmony through seva and participation.
                </p>
              </div>

              <div className="card-divine p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Rituals & Teachings</h2>
                </div>
                <p className="text-muted-foreground">
                  Daily worship, special ceremonies, and discourse sessions help devotees deepen their understanding and devotion.
                </p>
              </div>

              <div className="card-divine p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">A Sacred Atmosphere</h2>
                </div>
                <p className="text-muted-foreground">
                  Step into a tranquil sanctuary designed to elevate your spiritual consciousness and bring inner peace.
                </p>
              </div>
            </div>
      </div>
    </div>
  );
};

export default AboutTemple;
