import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Flame, DollarSign, Clock } from 'lucide-react';

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

    // Calculate stats
    const totalRituals = rituals?.length || 0;
    const popularRituals = rituals?.filter(ritual => ritual.popular).length || 0;
    const averagePrice = rituals?.reduce((sum, ritual) => sum + ritual.price, 0) / totalRituals || 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Rituals</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Rituals</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-400/20">
                            <Flame className="h-4 w-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalRituals}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Popular Rituals</CardTitle>
                        <div className="p-2 rounded-lg bg-pink-400/20">
                            <Flame className="h-4 w-4 text-pink-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{popularRituals}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Avg. Price</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-400/20">
                            <DollarSign className="h-4 w-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">₹{averagePrice.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8 bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader><CardTitle className="text-purple-400">{isEditing ? 'Edit Ritual' : 'Add New Ritual'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name" className="text-purple-300">Name</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                    className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                    required 
                                />
                            </div>
                            <div>
                                <Label htmlFor="price" className="text-purple-300">Price</Label>
                                <Input 
                                    id="price" 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.price} 
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                                    className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                    required 
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="description" className="text-purple-300">Description</Label>
                            <Input 
                                id="description" 
                                value={formData.description} 
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="duration" className="text-purple-300">Duration</Label>
                                <Input 
                                    id="duration" 
                                    value={formData.duration} 
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                                    className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                                    required 
                                />
                            </div>
                             <div>
                                <Label htmlFor="icon_name" className="text-purple-300">Icon</Label>
                                <select 
                                    id="icon_name" 
                                    value={formData.icon_name} 
                                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })} 
                                    className="mt-1 w-full h-10 rounded-md border border-purple-500/30 bg-slate-800/50 px-3 text-sm text-white"
                                    required
                                >
                                    <option value="Flame">Flame</option>
                                    <option value="Flower2">Flower</option>
                                    <option value="Heart">Heart</option>
                                    <option value="Star">Star</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="popular" 
                                checked={formData.popular} 
                                onCheckedChange={(checked) => setFormData({ ...formData, popular: !!checked })} 
                                className="border-purple-500/30 data-[state=checked]:bg-purple-600"
                            />
                            <Label htmlFor="popular" className="text-purple-300">Popular</Label>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                                type="submit" 
                                disabled={mutation.isPending}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {isEditing ? 'Update' : 'Add'} Ritual
                            </Button>
                           {isEditing && <Button variant="outline" type="button" onClick={() => setIsEditing(null)} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Existing Rituals</h2>
            {isLoading ? <p className="text-purple-300">Loading...</p> : (
                <div className="space-y-2">
                    {rituals?.map((ritual) => (
                        // Use ritual._id for the key prop to fix the warning
                        <Card key={ritual._id} className="flex items-center p-4 bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                            <div className="flex-grow">
                                <p className="font-semibold text-white">{ritual.name} - ₹{ritual.price}</p>
                                <p className="text-sm text-purple-300">{ritual.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setIsEditing(ritual)}
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                {/* Use ritual._id for the delete mutation */}
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => deleteMutation.mutate(ritual._id)}
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

export default ManageRituals;