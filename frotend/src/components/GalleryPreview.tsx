import { ExternalLink, Camera } from 'lucide-react';

const galleryImages = [
  {
    id: 1,
    src: '',
    title: 'Evening Aarti Ceremony',
    category: 'Rituals',
  },
  {
    id: 2,
    src: '',
    title: 'Diwali Celebration',
    category: 'Festivals',
  },
  {
    id: 3,
    src: '',
    title: 'Temple Architecture',
    category: 'Temple',
  },
  {
    id: 4,
    src: '',
    title: 'Community Gathering',
    category: 'Events',
  },
  {
    id: 5,
    src: '',
    title: 'Sacred Decorations',
    category: 'Temple',
  },
  {
    id: 6,
    src: '',
    title: 'Wedding Ceremony',
    category: 'Rituals',
  },
];

const GalleryPreview = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Sacred <span className="text-primary">Gallery</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Witness the divine beauty and spiritual moments captured during our 
            ceremonies, festivals, and daily temple activities.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id} 
              className={`card-divine group overflow-hidden cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={image.src}
                  alt={image.title}
                  className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                    index === 0 ? 'h-64 md:h-[400px]' : 'h-48'
                  }`}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-4 text-white w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-playfair font-semibold mb-1">{image.title}</h3>
                        <span className="text-sm opacity-80">{image.category}</span>
                      </div>
                      <ExternalLink className="h-5 w-5 opacity-80" />
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-gradient-golden text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {image.category}
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-lg transition-colors duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="btn-divine">
            <Camera className="h-5 w-5 mr-2" />
            View Complete Gallery
          </button>
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;