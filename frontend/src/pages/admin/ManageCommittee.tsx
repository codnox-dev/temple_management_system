import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/api/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils';

interface CommitteeMember {
    _id: string;
    name: string;
    designation: string;
    profile_description: string;
    phone_number: string;
    image: string;
}

const fetchCommitteeMembers = async (): Promise<CommitteeMember[]> => {
    const data = await get<CommitteeMember[]>('/committee/');
    return data;
};

const ManageCommittee = () => {
    const queryClient = useQueryClient();
    const { user } = (useAuth() as any) || {};
    const roleId: number = user?.role_id ?? 99;
    const isReadOnly = roleId > 1;
    const [isEditing, setIsEditing] = useState<CommitteeMember | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        profile_description: '',
        phone_number: '',
        image: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: members, isLoading } = useQuery<CommitteeMember[]>({
        queryKey: ['committeeMembers'],
        queryFn: fetchCommitteeMembers,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    const mutation = useMutation({
        mutationFn: async (memberPayload: Omit<CommitteeMember, '_id'>) => {
            if (isEditing) {
                return put(`/committee/${isEditing._id}`, memberPayload);
            } else {
                return post('/committee/', memberPayload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['committeeMembers'] });
            toast.success(`Committee member ${isEditing ? 'updated' : 'added'} successfully!`);
            resetForm();
            setIsDialogOpen(false);
        },
        onError: () => toast.error('Failed to save committee member.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => del(`/committee/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['committeeMembers'] });
            toast.success('Committee member deleted successfully!');
        },
        onError: () => toast.error('Failed to delete committee member.'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.designation || !formData.profile_description || !formData.phone_number) {
            toast.error('Please fill in all required fields.');
            return;
        }

        let imageUrl = formData.image;

        // If a new file is selected, upload it first
        if (selectedFile) {
            setUploading(true);
            setUploadError(null);
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', selectedFile);

                const response = await post('/committee/upload', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                imageUrl = response.path;
                toast.success('Image uploaded successfully!');
            } catch (error) {
                setUploadError('Failed to upload image.');
                toast.error('Failed to upload image.');
                setUploading(false);
                return;
            } finally {
                setUploading(false);
            }
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

    const resetForm = () => {
        setFormData({ name: '', designation: '', profile_description: '', phone_number: '', image: '' });
        setSelectedFile(null);
        setSelectedFileName('');
        setIsEditing(null);
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (member: CommitteeMember) => {
        setIsEditing(member);
        setFormData({
            name: member.name,
            designation: member.designation,
            profile_description: member.profile_description,
            phone_number: member.phone_number,
            image: member.image
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this committee member?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Committee Members</h1>
                {!isReadOnly && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit' : 'Add'} Committee Member</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    placeholder="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                                <Input
                                    placeholder="Designation"
                                    value={formData.designation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                    required
                                />
                                <Textarea
                                    placeholder="Profile Description"
                                    value={formData.profile_description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, profile_description: e.target.value }))}
                                    required
                                />
                                <Input
                                    placeholder="Phone Number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                    required
                                />
                                <div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        disabled={false}
                                    />
                                    {uploading && <p>Uploading...</p>}
                                    {uploadError && <p className="text-red-500">{uploadError}</p>}
                                    {(formData.image || selectedFile) && (
                                        <div className="mt-2">
                                            <img
                                                src={selectedFile ? URL.createObjectURL(selectedFile) : resolveImageUrl(formData.image)}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-md"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400'; }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" disabled={mutation.isPending || uploading}>
                                    {mutation.isPending || uploading ? 'Saving...' : 'Save'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members?.map((member) => (
                    <Card key={member._id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg">{member.name}</h3>
                                    <p className="text-sm text-gray-600">{member.designation}</p>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDelete(member._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {member.image && (
                                <div className="flex justify-center mb-4">
                                    <img src={resolveImageUrl(member.image)} alt={member.name} className="w-24 h-24 object-cover rounded-full border-2 border-primary/20" />
                                </div>
                            )}
                            <p className="text-sm mb-2">{member.profile_description}</p>
                            <p className="text-sm text-gray-600">{member.phone_number}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ManageCommittee;