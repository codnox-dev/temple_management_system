import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

const fetchEvents = async () => {
  const { data } = await axios.get('http://localhost:8000/api/events/');
  return data;
};

const ManageEvents = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ title: '', date: '', time: '', attendees: '', location: '', description: '', image: '', featured: false });

    const { data: events, isLoading } = useQuery({ queryKey: ['adminEvents'], queryFn: fetchEvents });

    const mutation = useMutation({
        mutationFn: (newEvent) => isEditing 
            ? axios.put(`http://localhost:8000/api/admin/events/${isEditing._id}`, newEvent)
            : axios.post('http://localhost:8000/api/admin/events/', newEvent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            toast.success(`Event ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
            setFormData({ title: '', date: '', time: '', attendees: '', location: '', description: '', image: '', featured: false });
        },
        onError: () => toast.error('Failed to save event.'),
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`http://localhost:8000/api/admin/events/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
            toast.success('Event deleted successfully!');
        },
        onError: () => toast.error('Failed to delete event.'),
    });

    const handleEdit = (event) => {
        setIsEditing(event);
        setFormData({ ...event, date: new Date(event.date).toISOString().substring(0, 16), attendees: String(event.attendees) });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ ...formData, attendees: parseInt(formData.attendees), date: new Date(formData.date).toISOString() });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Events</h1>
            <Card className="mb-8">
                <CardHeader><CardTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                           <Input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                           <Input placeholder="Time (e.g., 6:00 PM)" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <Input type="number" placeholder="Attendees" value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: e.target.value })} required />
                           <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                        </div>
                        <Input placeholder="Image URL" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required />
                        <div className="flex items-center space-x-2"><Checkbox checked={formData.featured} onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })} /><Label>Featured Event</Label></div>
                        <div className="flex gap-2">
                           <Button type="submit" disabled={mutation.isLoading}>{isEditing ? 'Update' : 'Add'} Event</Button>
                           {isEditing && <Button variant="outline" onClick={() => { setIsEditing(null); setFormData({ title: '', date: '', time: '', attendees: '', location: '', description: '', image: '', featured: false }); }}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Existing Events</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(event => (
                        <Card key={event._id} className="p-4">
                           <img src={event.image} alt={event.title} className="w-full h-32 object-cover rounded-md mb-4"/>
                           <h3 className="font-semibold">{event.title}</h3>
                           <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                           <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(event)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
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
