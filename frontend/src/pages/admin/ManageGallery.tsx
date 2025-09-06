import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

const fetchGalleryImages = async () => {
  const { data } = await axios.get('http://localhost:8000/api/gallery/');
  return data;
};

const ManageGallery = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ src: '', title: '', category: '' });

    const { data: images, isLoading } = useQuery({ queryKey: ['adminGallery'], queryFn: fetchGalleryImages });

    const addMutation = useMutation({
        mutationFn: (newImage) => axios.post('http://localhost:8000/api/admin/gallery/', newImage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            toast.success('Image added to gallery!');
            setFormData({ src: '', title: '', category: '' });
        },
        onError: () => toast.error('Failed to add image.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`http://localhost:8000/api/admin/gallery/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            toast.success('Image deleted successfully!');
        },
        onError: () => toast.error('Failed to delete image.'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(formData);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Gallery</h1>
            <Card className="mb-8">
                <CardHeader><CardTitle>Add New Image</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Image URL" value={formData.src} onChange={(e) => setFormData({ ...formData, src: e.target.value })} required />
                        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                        <Button type="submit" disabled={addMutation.isLoading}>Add Image</Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Gallery Images</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map(image => (
                        <Card key={image._id} className="relative group">
                            <img src={image.src} alt={image.title} className="w-full h-40 object-cover rounded-t-lg" />
                            <div className="p-2">
                               <p className="font-semibold truncate">{image.title}</p>
                               <p className="text-sm text-muted-foreground">{image.category}</p>
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteMutation.mutate(image._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageGallery;
