import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';

// Defines the shape of a ritual object, using _id to match the backend response
interface Ritual {
    _id: string; // Changed from 'id' to '_id'
    name: string;
    description: string;
    price: number;
    duration: string;
    popular: boolean;
    icon_name: string;
}

// Base URL for the rituals API endpoint
const API_URL = 'http://localhost:8000/api/rituals'; 

// Fetches all rituals
const fetchRituals = async () => {
  const { data } = await axios.get<Ritual[]>(`${API_URL}/`);
  return data;
};

const ManageRituals = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<Ritual | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '', popular: false, icon_name: 'Star' });

    // When isEditing changes, update the form data
    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: isEditing.name,
                description: isEditing.description,
                price: String(isEditing.price),
                duration: isEditing.duration,
                popular: isEditing.popular,
                icon_name: isEditing.icon_name || 'Star',
            });
        } else {
            // Reset form when not editing
            setFormData({ name: '', description: '', price: '', duration: '', popular: false, icon_name: 'Star' });
        }
    }, [isEditing]);

    const { data: rituals, isLoading } = useQuery<Ritual[]>({ queryKey: ['adminRituals'], queryFn: fetchRituals });

    // Centralized mutation error handler
    const handleMutationError = (error: unknown) => {
        if (error instanceof AxiosError && error.response) {
            if (error.response.status === 401) {
                toast.error('Unauthorized. Please log in again.');
            } else if (error.response.status === 422) {
                const validationErrors = error.response.data.detail.map((err: any) => `${err.loc[1]}: ${err.msg}`).join('\n');
                toast.error('Validation Error', { description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white">{validationErrors}</code></pre>});
            } else {
                toast.error(`An error occurred: ${error.response.data.detail || 'Please try again.'}`);
            }
        } else {
            toast.error('Failed to save ritual.');
        }
    };

    // Mutation for creating and updating rituals
    const mutation = useMutation({
        mutationFn: (ritualPayload: Omit<Ritual, '_id'>) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            if (isEditing) {
                // Correctly use isEditing._id for the update URL
                return axios.put(`${API_URL}/${isEditing._id}`, ritualPayload, config);
            }
            return axios.post(`${API_URL}/`, ritualPayload, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminRituals'] });
            queryClient.invalidateQueries({ queryKey: ['rituals'] });
            toast.success(`Ritual ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
        },
        onError: handleMutationError,
    });
    
    // Mutation for deleting a ritual
    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            return axios.delete(`${API_URL}/${id}`, config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminRituals'] });
            queryClient.invalidateQueries({ queryKey: ['rituals'] });
            toast.success('Ritual deleted successfully!');
        },
        onError: handleMutationError,
    });

    // Handles form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            toast.error("Please enter a valid price greater than zero.");
            return;
        }
        mutation.mutate({ ...formData, price });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Rituals</h1>
            <Card className="mb-8">
                <CardHeader><CardTitle>{isEditing ? 'Edit Ritual' : 'Add New Ritual'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="name">Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div><Label htmlFor="price">Price</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                        </div>
                        <div><Label htmlFor="description">Description</Label><Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="duration">Duration</Label><Input id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required /></div>
                             <div>
                                <Label htmlFor="icon_name">Icon</Label>
                                <select id="icon_name" value={formData.icon_name} onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
                                    <option value="Flame">Flame</option>
                                    <option value="Flower2">Flower</option>
                                    <option value="Heart">Heart</option>
                                    <option value="Star">Star</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2"><Checkbox id="popular" checked={formData.popular} onCheckedChange={(checked) => setFormData({ ...formData, popular: !!checked })} /><Label htmlFor="popular">Popular</Label></div>
                        <div className="flex gap-2">
                           <Button type="submit" disabled={mutation.isPending}>{isEditing ? 'Update' : 'Add'} Ritual</Button>
                           {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Existing Rituals</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="space-y-2">
                    {rituals?.map((ritual) => (
                        // Use ritual._id for the key prop to fix the warning
                        <Card key={ritual._id} className="flex items-center p-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{ritual.name} - ₹{ritual.price}</p>
                                <p className="text-sm text-muted-foreground">{ritual.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => setIsEditing(ritual)}><Edit className="h-4 w-4" /></Button>
                                {/* Use ritual._id for the delete mutation */}
                                <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(ritual._id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageRituals;

