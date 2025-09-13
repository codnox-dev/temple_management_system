import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/gallery';

interface GalleryImage {
    _id: string;
    src: string;
    title: string;
    category: string;
}

const fetchGalleryImages = async (): Promise<GalleryImage[]> => {
    const { data } = await axios.get(`${API_URL}/`);
    return data;
};

const ManageGallery = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<GalleryImage | null>(null);
    const [formData, setFormData] = useState({ src: '', title: '', category: '' });

    useEffect(() => {
        if (isEditing) {
            setFormData({ src: isEditing.src, title: isEditing.title, category: isEditing.category });
        } else {
            setFormData({ src: '', title: '', category: '' });
        }
    }, [isEditing]);

    const { data: images, isLoading } = useQuery<GalleryImage[]>({ queryKey: ['adminGallery'], queryFn: fetchGalleryImages });

    const mutation = useMutation({
        mutationFn: (imagePayload: Omit<GalleryImage, '_id'>) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (isEditing) {
                return axios.put(`${API_URL}/${isEditing._id}`, imagePayload, config);
            }
            return axios.post(`${API_URL}/`, imagePayload, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            queryClient.invalidateQueries({ queryKey: ['galleryPreview'] });
            toast.success(`Image ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
        },
        onError: () => toast.error('Failed to save image.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            return axios.delete(`${API_URL}/${id}`, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            queryClient.invalidateQueries({ queryKey: ['galleryPreview'] });
            toast.success('Image deleted successfully!');
        },
        onError: () => toast.error('Failed to delete image.'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Gallery</h1>
            <Card className="mb-8">
                <CardHeader><CardTitle>{isEditing ? 'Edit Image' : 'Add New Image'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Image URL" value={formData.src} onChange={(e) => setFormData({ ...formData, src: e.target.value })} required />
                        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                        <div className="flex gap-2">
                            <Button type="submit" disabled={mutation.isPending}>{isEditing ? 'Update' : 'Add'} Image</Button>
                            {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Gallery Images</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images?.map(image => (
                        <Card key={image._id} className="relative group">
                            <img src={image.src} alt={image.title} className="w-full h-40 object-cover rounded-t-lg" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }}/>
                            <div className="p-2">
                               <p className="font-semibold truncate">{image.title}</p>
                               <p className="text-sm text-muted-foreground">{image.category}</p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="icon" onClick={() => setIsEditing(image)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(image._id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageGallery;

