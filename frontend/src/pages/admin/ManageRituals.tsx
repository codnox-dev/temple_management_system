import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

const fetchRituals = async () => {
  const { data } = await axios.get('http://localhost:8000/api/rituals/');
  return data;
};

const ManageRituals = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '', popular: false });

    const { data: rituals, isLoading } = useQuery({ queryKey: ['adminRituals'], queryFn: fetchRituals });

    const mutation = useMutation({
        mutationFn: (newRitual) => isEditing 
            ? axios.put(`http://localhost:8000/api/admin/rituals/${isEditing._id}`, newRitual)
            : axios.post('http://localhost:8000/api/admin/rituals/', newRitual),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminRituals'] });
            toast.success(`Ritual ${isEditing ? 'updated' : 'added'} successfully!`);
            setIsEditing(null);
            setFormData({ name: '', description: '', price: '', duration: '', popular: false });
        },
        onError: () => toast.error('Failed to save ritual.'),
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id) => axios.delete(`http://localhost:8000/api/admin/rituals/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminRituals'] });
            toast.success('Ritual deleted successfully!');
        },
        onError: () => toast.error('Failed to delete ritual.'),
    });

    const handleEdit = (ritual) => {
        setIsEditing(ritual);
        setFormData({ name: ritual.name, description: ritual.description, price: ritual.price, duration: ritual.duration, popular: ritual.popular });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ ...formData, price: parseFloat(formData.price) });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Rituals</h1>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>{isEditing ? 'Edit Ritual' : 'Add New Ritual'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div><Label>Price</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                        </div>
                        <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
                        <div><Label>Duration</Label><Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required /></div>
                        <div className="flex items-center space-x-2"><Checkbox checked={formData.popular} onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })} /><Label>Popular</Label></div>
                        <div className="flex gap-2">
                           <Button type="submit" disabled={mutation.isLoading}>{isEditing ? 'Update' : 'Add'} Ritual</Button>
                           {isEditing && <Button variant="outline" onClick={() => { setIsEditing(null); setFormData({ name: '', description: '', price: '', duration: '', popular: false }); }}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Existing Rituals</h2>
            {isLoading ? <p>Loading...</p> : (
                <div className="space-y-2">
                    {rituals.map(ritual => (
                        <Card key={ritual._id} className="flex items-center p-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{ritual.name} - ₹{ritual.price}</p>
                                <p className="text-sm text-muted-foreground">{ritual.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleEdit(ritual)}><Edit className="h-4 w-4" /></Button>
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
