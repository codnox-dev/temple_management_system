import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Calendar, MapPin, Clock } from 'lucide-react';

const API_URL = 'http://localhost:8080/api/events';

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

// Fetch all events
const fetchEvents = async (): Promise<Event[]> => {
    const { data } = await axios.get(API_URL);
    return data;
};

const ManageEvents = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<Event | null>(null);
    const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', description: '', image: '' });

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
        } else {
            setFormData({ title: '', date: '', time: '', location: '', description: '', image: '' });
        }
    }, [isEditing]);

    const { data: events, isLoading } = useQuery<Event[]>({ queryKey: ['adminEvents'], queryFn: fetchEvents });

    const mutation = useMutation({
        mutationFn: (eventPayload: Omit<Event, '_id'>) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (isEditing) {
                return axios.put(`${API_URL}/${isEditing._id}`, eventPayload, config);
            }
            return axios.post(API_URL, eventPayload, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success(`Event ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
        },
        onError: () => toast.error('Failed to save event.'),
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            return axios.delete(`${API_URL}/${id}`, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Event deleted successfully!');
        },
        onError: () => toast.error('Failed to delete event.'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    // Calculate stats
    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter(event => new Date(event.date) >= new Date()).length || 0;
    const pastEvents = totalEvents - upcomingEvents;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Events</h1>
            
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
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Textarea 
                            placeholder="Description" 
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <Input 
                                type="date" 
                                value={formData.date} 
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                required 
                            />
                           <Input 
                                placeholder="Time (e.g., 6:00 PM)" 
                                value={formData.time} 
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                required 
                            />
                        </div>
                        <Input 
                            placeholder="Location" 
                            value={formData.location} 
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Input 
                            placeholder="Image URL" 
                            value={formData.image} 
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="flex gap-2">
                           <Button 
                                type="submit" 
                                disabled={mutation.isPending}
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
                        <Card key={event._id} className="p-4 bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                           <img src={event.image} alt={event.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                           <h3 className="font-semibold text-white">{event.title}</h3>
                           <p className="text-sm text-purple-300">{new Date(event.date).toLocaleDateString()}</p>
                           <div className="flex gap-2 mt-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditing(event)}
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                                >
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => deleteMutation.mutate(event._id)}
                                    className="bg-red-900/80 border-red-700/30 text-red-300 hover:bg-red-900"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageEvents;