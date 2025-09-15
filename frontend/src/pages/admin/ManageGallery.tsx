import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { get } from '../../api/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, ImageIcon, Folder, Hash } from 'lucide-react';

<<<<<<< HEAD
const API_URL = 'http://localhost:8080/api/gallery';
=======
>>>>>>> niranj

interface GalleryImage {
    _id: string;
    src: string;
    title: string;
    category: string;
}

const fetchGalleryImages = () => get<GalleryImage[]>('/gallery');

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
                return api.put(`/gallery/${isEditing._id}`, imagePayload, config);
            }
            return api.post('/gallery', imagePayload, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            queryClient.invalidateQueries({ queryKey: ['galleryPreview'] });
            toast.success(`Image ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
        },
        onError: (error) => {
            console.error("Error saving image:", error);
            toast.error('Failed to save image. See console for details.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            return api.delete(`/gallery/${id}`, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            queryClient.invalidateQueries({ queryKey: ['galleryPreview'] });
            toast.success('Image deleted successfully!');
        },
        onError: (error) => {
            console.error("Error deleting image:", error);
            toast.error('Failed to delete image. See console for details.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    // Calculate stats
    const totalImages = images?.length || 0;
    const categories = [...new Set(images?.map(img => img.category) || [])];
    const totalCategories = categories.length;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Gallery</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Images</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-400/20">
                            <ImageIcon className="h-4 w-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalImages}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Categories</CardTitle>
                        <div className="p-2 rounded-lg bg-pink-400/20">
                            <Folder className="h-4 w-4 text-pink-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalCategories}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Popular Category</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-400/20">
                            <Hash className="h-4 w-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {categories.length > 0 ? categories[0] : 'None'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8 bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader><CardTitle className="text-purple-400">{isEditing ? 'Edit Image' : 'Add New Image'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input 
                            placeholder="Image URL" 
                            value={formData.src} 
                            onChange={(e) => setFormData({ ...formData, src: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Input 
                            placeholder="Title" 
                            value={formData.title} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Input 
                            placeholder="Category" 
                            value={formData.category} 
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="flex gap-2">
                            <Button 
                                type="submit" 
                                disabled={mutation.isPending}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {isEditing ? 'Update' : 'Add'} Image
                            </Button>
                            {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Gallery Images</h2>
            {isLoading ? <p className="text-purple-300">Loading...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images?.map(image => (
                        <Card key={image._id} className="relative group bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                            <img src={image.src} alt={image.title} className="w-full h-40 object-cover rounded-t-lg" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }}/>
                            <div className="p-2">
                               <p className="font-semibold truncate text-white">{image.title}</p>
                               <p className="text-sm text-purple-300">{image.category}</p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setIsEditing(image)}
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => deleteMutation.mutate(image._id)}
                                    className="bg-red-900/80 border-red-700/30 text-red-300 hover:bg-red-900"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageGallery;