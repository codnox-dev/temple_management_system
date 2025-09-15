import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/api';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';


interface GalleryImage {
    _id: string;
    src: string;
    title: string;
    category: string;
}

const fetchGalleryImages = () => get<GalleryImage[]>('/gallery');

const FullGallery = () => {
  const { data: galleryImages, isLoading, isError } = useQuery<GalleryImage[]>({
      queryKey: ['gallery'],
      queryFn: fetchGalleryImages,
  });

  if (isLoading) return <div className="text-center py-20">Loading gallery...</div>;
  if (isError) return <div className="text-center py-20">Error fetching gallery.</div>;

  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-center text-foreground">
            Our <span className="text-primary">Gallery</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {galleryImages?.map((image) => (
            <Card key={image._id} className="card-divine group overflow-hidden cursor-pointer">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-4 text-white w-full">
                    <h3 className="font-playfair font-semibold mb-1">{image.title}</h3>
                    <span className="text-sm opacity-80">{image.category}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FullGallery;

