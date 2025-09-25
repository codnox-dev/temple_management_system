import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { get, API_BASE_URL } from '@/api/api';
import api from '@/api/api';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/utils';

// Define the shape of an event object
interface Event {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    image: string;
}
interface FeaturedEvent { event_id: string | null }

// Fetch all events
const fetchEvents = async (): Promise<Event[]> => {
    const data = await get<Event[]>('/events/');
    return data;
};

const ManageEvents = () => {
    const queryClient = useQueryClient();
    const { user } = (useAuth() as any) || {};
    const roleId: number = user?.role_id ?? 99;
    const isReadOnly = roleId > 3;
    const [isEditing, setIsEditing] = useState<Event | null>(null);
    const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', description: '', image: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isEditing) {
            setFormData({
                title: isEditing.title,
                date: isEditing.date.substring(0, 10), // Format for date input
                time: isEditing.time,
                location: isEditing.location,
                description: isEditing.description,
                image: isEditing.image,
            });
            setSelectedFile(null);
            setSelectedFileName('');
        } else {
            setFormData({ title: '', date: '', time: '', location: '', description: '', image: '' });
            setSelectedFile(null);
            setSelectedFileName('');
        }
    }, [isEditing]);

    const { data: events, isLoading } = useQuery<Event[]>({
        queryKey: ['adminEvents'],
        queryFn: fetchEvents,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });
    const { data: featured, refetch: refetchFeatured } = useQuery<FeaturedEvent>({
        queryKey: ['featuredEvent'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/featured-event/`);
            if (!res.ok) return { event_id: null };
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    const mutation = useMutation({
        mutationFn: (eventPayload: Omit<Event, '_id'>) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (roleId > 3) throw new Error('Not authorized');
            if (isEditing) {
                return api.put(`/events/${isEditing._id}`, eventPayload, config);
            }
            return api.post('/events/', eventPayload, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success(`Event ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
            setFormData({ title: '', date: '', time: '', location: '', description: '', image: '' });
            setSelectedFile(null);
            setSelectedFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: () => toast.error('Failed to save event.'),
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (roleId > 3) throw new Error('Not authorized');
            return api.delete(`/events/${id}`, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Event deleted successfully!');
        },
        onError: () => toast.error('Failed to delete event.'),
    });

    const setFeaturedMutation = useMutation({
        mutationFn: async (event_id: string | null) => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/featured-event/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
                body: JSON.stringify({ event_id }),
            });
            if (!res.ok) throw new Error('Failed to set featured');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Featured event updated');
            queryClient.invalidateQueries({ queryKey: ['featuredEvent'] });
            refetchFeatured();
        },
        onError: () => toast.error('Failed to update featured event'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) { toast.error('You are not authorized to modify events.'); return; }
        
        let imageUrl = formData.image;
        
        // If a new file is selected, upload it first
        if (selectedFile) {
            setUploading(true);
            setUploadError(null);
            try {
                const token = localStorage.getItem('token');
                const form = new FormData();
                form.append('file', selectedFile);
                const res = await fetch(`${API_BASE_URL}/api/events/upload`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token ?? ''}`,
                    },
                    body: form,
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.detail || 'Upload failed');
                }
                const data = await res.json();
                imageUrl = data.url;
                toast.success('Image uploaded');
            } catch (err: any) {
                console.error(err);
                setUploadError(err?.message || 'Upload failed');
                toast.error('Image upload failed');
                setUploading(false);
                return;
            } finally {
                setUploading(false);
            }
        }
        
        if (!imageUrl) {
            toast.error('Please select an image for the event.');
            return;
        }
        
        mutation.mutate({ ...formData, image: imageUrl });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Invalid file type. Please select an image.');
                setSelectedFile(null);
                setSelectedFileName('');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setSelectedFile(file);
            setSelectedFileName(file.name);
            setUploadError(null);
        } else {
            setSelectedFile(null);
            setSelectedFileName('');
        }
    };

    // Calculate stats
    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter(event => new Date(event.date) >= new Date()).length || 0;
    const pastEvents = totalEvents - upcomingEvents;

    return (
        <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Events</h1>
                            <Link to={{ pathname: '/events' }} state={{ fromAdmin: '/admin/events' }} className="inline-flex">
                                <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">
                                    View Public Events <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Events</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-400/20">
                            <Calendar className="h-4 w-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalEvents}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Upcoming Events</CardTitle>
                        <div className="p-2 rounded-lg bg-pink-400/20">
                            <Clock className="h-4 w-4 text-pink-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{upcomingEvents}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Past Events</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-400/20">
                            <MapPin className="h-4 w-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{pastEvents}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader><CardTitle className="text-purple-400">{isEditing ? 'Edit Event' : 'Add New Event'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input 
                            placeholder="Title" 
                            value={formData.title} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={isReadOnly}
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Textarea 
                            placeholder="Description" 
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={isReadOnly}
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <Input 
                                type="date" 
                                value={formData.date} 
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                disabled={isReadOnly}
                                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                required 
                            />
                           <Input 
                                placeholder="Time (e.g., 6:00 PM)" 
                                value={formData.time} 
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                disabled={isReadOnly}
                                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                required 
                            />
                        </div>
                        <Input 
                            placeholder="Location" 
                            value={formData.location} 
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            disabled={isReadOnly}
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isReadOnly || uploading} className="bg-slate-800/50 border-purple-500/30 text-white" />
                                {selectedFileName && <span className="text-purple-300 text-sm">Selected: {selectedFileName}</span>}
                                {uploading && <span className="text-purple-300 text-sm">Uploading...</span>}
                                {uploadError && <span className="text-red-300 text-sm">{uploadError}</span>}
                            </div>
                            {(formData.image || selectedFile) && (
                                <img src={selectedFile ? URL.createObjectURL(selectedFile) : resolveImageUrl(formData.image)} alt="Preview" className="w-full h-32 object-cover rounded-md" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400'; }} />
                            )}
                        </div>
                        <div className="flex gap-2">
                           <Button 
                                type="submit" 
                                disabled={mutation.isPending || isReadOnly}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {isEditing ? 'Update' : 'Add'} Event
                            </Button>
                           {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Existing Events</h2>
            {isLoading ? <p className="text-purple-300">Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events?.map(event => (
                        <Card key={event._id} className={`p-4 backdrop-blur-sm shadow-lg ${featured?.event_id === event._id ? 'bg-amber-50 border-amber-300 shadow-amber-200' : 'bg-slate-900/80 border-purple-500/30 shadow-purple-500/10'} border`}>
                           <img src={resolveImageUrl(event.image)} alt={event.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                           <h3 className={`font-semibold ${featured?.event_id === event._id ? 'text-amber-900' : 'text-white'}`}>{event.title}</h3>
                           <p className={`${featured?.event_id === event._id ? 'text-amber-700' : 'text-purple-300'} text-sm`}>{new Date(event.date).toLocaleDateString()}</p>
                           <div className="flex flex-wrap gap-2 mt-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditing(event)}
                                    disabled={roleId > 3}
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                                >
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => deleteMutation.mutate(event._id)}
                                    disabled={roleId > 3}
                                    className="bg-red-900/80 border-red-700/30 text-red-300 hover:bg-red-900"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </Button>
                                <Button
                                    variant={featured?.event_id === event._id ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={isReadOnly}
                                    onClick={() => setFeaturedMutation.mutate(event._id)}
                                    className={`${featured?.event_id === event._id ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}`}
                                >
                                    {featured?.event_id === event._id ? 'Featured' : 'Set as Featured'}
                                </Button>
                                {featured?.event_id === event._id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isReadOnly}
                                    onClick={() => setFeaturedMutation.mutate(null)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                  >
                                    Clear
                                  </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageEvents;

