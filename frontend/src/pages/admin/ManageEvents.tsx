import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/events';

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

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Events</h1>
            <Card className="mb-8">
                <CardHeader><CardTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                           <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                           <Input placeholder="Time (e.g., 6:00 PM)" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
                        </div>
                        <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                        <Input placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required />
                        <div className="flex gap-2">
                           <Button type="submit" disabled={mutation.isPending}>{isEditing ? 'Update' : 'Add'} Event</Button>
                           {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Existing Events</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events?.map(event => (
                        <Card key={event._id} className="p-4">
                           <img src={event.image} alt={event.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                           <h3 className="font-semibold">{event.title}</h3>
                           <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                           <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(event)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(event._id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageEvents;
