import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { get } from '../../api/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, ImageIcon, Folder, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/utils';
import GalleryLayoutDesigner from '@/pages/admin/GalleryLayoutDesigner';
import { API_BASE_URL } from '@/api/api';


interface GalleryImage {
    _id: string;
    src: string;
    title: string;
    category: string;
}

const fetchGalleryImages = () => get<GalleryImage[]>('/gallery/');

const ManageGallery = () => {
    const queryClient = useQueryClient();
    const { user } = (useAuth() as any) || {};
    const roleId: number = user?.role_id ?? 99;
        const isReadOnly = roleId > 3;
    const [isEditing, setIsEditing] = useState<GalleryImage | null>(null);
    const [formData, setFormData] = useState({ src: '', title: '', category: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [designerMode, setDesignerMode] = useState<null | 'full' | 'preview'>(null);

    useEffect(() => {
        if (isEditing) {
            setFormData({ src: isEditing.src, title: isEditing.title, category: isEditing.category });
            setSelectedFile(null);
            setSelectedFileName('');
        } else {
            setFormData({ src: '', title: '', category: '' });
            setSelectedFile(null);
            setSelectedFileName('');
        }
    }, [isEditing]);

    const { data: images, isLoading } = useQuery<GalleryImage[]>({ queryKey: ['adminGallery'], queryFn: fetchGalleryImages });
    const [slideConfigOpen, setSlideConfigOpen] = useState(false);
    const [slides, setSlides] = useState<string[]>([]);
    const [intervalMs, setIntervalMs] = useState(4000);
    const [transitionMs, setTransitionMs] = useState(600);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '21:9'>('16:9');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/slideshow/`);
                if (res.ok) {
                    const data = await res.json();
                    setSlides(data.image_ids || []);
                    setIntervalMs(data.interval_ms || 4000);
                    setTransitionMs(data.transition_ms || 600);
                    setAspectRatio((data.aspect_ratio || '16:9'));
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const mutation = useMutation({
        mutationFn: (imagePayload: Omit<GalleryImage, '_id'>) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (roleId > 3) throw new Error('Not authorized');
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
            setFormData({ src: '', title: '', category: '' });
            setSelectedFile(null);
            setSelectedFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            if (roleId > 3) throw new Error('Not authorized');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) { toast.error('You are not authorized to modify gallery.'); return; }
        
        let imageUrl = formData.src;
        
        // If a new file is selected, upload it first
        if (selectedFile) {
            setUploading(true);
            setUploadError(null);
            try {
                const token = localStorage.getItem('token');
                const form = new FormData();
                form.append('file', selectedFile);
                const res = await fetch(`${API_BASE_URL}/api/gallery/upload`, {
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
            toast.error('Please select an image.');
            return;
        }
        
        mutation.mutate({ ...formData, src: imageUrl });
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
    const totalImages = images?.length || 0;
    const categories = [...new Set(images?.map(img => img.category) || [])];
    const totalCategories = categories.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Gallery</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setDesignerMode('preview')}
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                    >
                        Preview Home Gallery
                    </Button>
                    <Button
                        onClick={() => setDesignerMode('full')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        Preview Full Gallery
                    </Button>
                </div>
            </div>
            
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

            {/* Slideshow Config Button */}
            <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSlideConfigOpen(true)} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Configure Slideshow</Button>
            </div>

            <Card className="mb-8 bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader><CardTitle className="text-purple-400">{isEditing ? 'Edit Image' : 'Add New Image'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isReadOnly || uploading} className="bg-slate-800/50 border-purple-500/30 text-white" />
                                {selectedFileName && <span className="text-purple-300 text-sm">Selected: {selectedFileName}</span>}
                                {uploading && <span className="text-purple-300 text-sm">Uploading...</span>}
                                {uploadError && <span className="text-red-300 text-sm">{uploadError}</span>}
                            </div>
                            {(formData.src || selectedFile) && (
                                <img src={selectedFile ? URL.createObjectURL(selectedFile) : resolveImageUrl(formData.src)} alt="Preview" className="w-full h-40 object-cover rounded-md" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400'; }} />
                            )}
                        </div>
                        <Input 
                            placeholder="Title" 
                            value={formData.title} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={isReadOnly}
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <Input 
                            placeholder="Category" 
                            value={formData.category} 
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            disabled={isReadOnly}
                            className="bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/70"
                            required 
                        />
                        <div className="flex gap-2">
                            <Button 
                                type="submit" 
                                disabled={mutation.isPending || isReadOnly}
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
                            <img src={resolveImageUrl(image.src)} alt={image.title} className="w-full h-40 object-cover rounded-t-lg" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }}/>
                            <div className="p-2">
                               <p className="font-semibold truncate text-white">{image.title}</p>
                               <p className="text-sm text-purple-300">{image.category}</p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setIsEditing(image)}
                                    disabled={roleId > 3}
                                    className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => deleteMutation.mutate(image._id)}
                                    disabled={roleId > 3}
                                    className="bg-red-900/80 border-red-700/30 text-red-300 hover:bg-red-900"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {designerMode && (
                <GalleryLayoutDesigner
                    mode={designerMode}
                    images={images || []}
                    onClose={() => setDesignerMode(null)}
                />)
            }

            {/* Slideshow Config Modal */}
            {slideConfigOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setSlideConfigOpen(false)} />
                    <div className="relative bg-slate-900 border border-purple-500/30 rounded-lg shadow-xl w-[95vw] max-w-3xl max-h-[85vh] flex flex-col">
                        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Configure Slideshow</h3>
                            <Button variant="ghost" onClick={() => setSlideConfigOpen(false)} className="text-purple-200 hover:bg-purple-900/50">Close</Button>
                        </div>
                        <div className="p-4 overflow-auto space-y-4">
                            {/* Image picker grid */}
                            <div className="flex flex-wrap gap-2">
                                {(images || []).map((img) => {
                                    const selected = slides.includes(img._id);
                                    return (
                                        <button
                                            key={img._id}
                                            onClick={() => {
                                                if (isReadOnly) return;
                                                setSlides((prev) => selected ? prev.filter((x) => x !== img._id) : [...prev, img._id]);
                                            }}
                                            disabled={isReadOnly}
                                            className={`relative border rounded overflow-hidden ${selected ? 'border-primary' : 'border-slate-700'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <img src={resolveImageUrl(img.src)} alt={img.title} className="w-32 h-20 object-cover" />
                                            {selected && <span className="absolute top-1 right-1 bg-primary text-xs px-1 rounded">Selected</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Selected order list */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-purple-200">Selected Slides Order</h4>
                                    <div className="flex gap-2">
                                        <Button variant="outline" disabled={isReadOnly || slides.length === 0} onClick={() => !isReadOnly && setSlides([])} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Clear</Button>
                                    </div>
                                </div>
                                {slides.length === 0 ? (
                                    <div className="text-sm text-purple-300">No images selected yet. Click images above to add them.</div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {slides.map((id, idx) => {
                                            const img = (images || []).find(i => i._id === id);
                                            if (!img) return null;
                                            const move = (from: number, to: number) => {
                                                if (to < 0 || to >= slides.length) return;
                                                setSlides(prev => {
                                                    const arr = [...prev];
                                                    const [item] = arr.splice(from, 1);
                                                    arr.splice(to, 0, item);
                                                    return arr;
                                                });
                                            };
                                            return (
                                                <div key={id} className="relative border border-purple-500/30 rounded-md overflow-hidden">
                                                    <img src={resolveImageUrl(img.src)} alt={img.title} className="w-32 h-20 object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs flex items-center justify-between px-1 py-0.5">
                                                        <span className="opacity-80">#{idx + 1}</span>
                                                        <div className="flex gap-1">
                                                            <button type="button" disabled={isReadOnly || idx === 0} title="Move left" onClick={() => move(idx, idx - 1)} className={`px-1 rounded ${idx===0||isReadOnly?'opacity-40 cursor-not-allowed':'hover:bg-white/20'}`}>◀</button>
                                                            <button type="button" disabled={isReadOnly || idx === slides.length - 1} title="Move right" onClick={() => move(idx, idx + 1)} className={`px-1 rounded ${idx===slides.length-1||isReadOnly?'opacity-40 cursor-not-allowed':'hover:bg-white/20'}`}>▶</button>
                                                            <button type="button" disabled={isReadOnly} title="Remove" onClick={() => !isReadOnly && setSlides(prev => prev.filter(x => x !== id))} className={`px-1 rounded ${isReadOnly?'opacity-40 cursor-not-allowed':'hover:bg-white/20'}`}>✕</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="text-sm text-purple-200">Interval (ms)</label>
                                <Input type="number" value={intervalMs} onChange={(e) => setIntervalMs(Math.max(1000, Math.min(60000, parseInt(e.target.value || '0', 10) || 4000)))} disabled={isReadOnly} className="bg-slate-800/50 border-purple-500/30 text-white w-28" />
                                <label className="text-sm text-purple-200">Transition (ms)</label>
                                <Input type="number" value={transitionMs} onChange={(e) => setTransitionMs(Math.max(100, Math.min(5000, parseInt(e.target.value || '0', 10) || 600)))} disabled={isReadOnly} className="bg-slate-800/50 border-purple-500/30 text-white w-28" />
                                <label className="text-sm text-purple-200">Aspect Ratio</label>
                                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} disabled={isReadOnly} className="bg-slate-800/50 border-purple-500/30 text-white rounded px-2 py-2">
                                    <option value="16:9">16:9</option>
                                    <option value="4:3">4:3</option>
                                    <option value="1:1">1:1</option>
                                    <option value="21:9">21:9</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-purple-500/20 flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setSlideConfigOpen(false)} className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50">Cancel</Button>
                            <Button onClick={async () => {
                                if (isReadOnly) { toast.error('You are not authorized to modify slideshow.'); return; }
                                try {
                                    const res = await fetch(`${API_BASE_URL}/api/slideshow/`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                                        },
                                        body: JSON.stringify({ image_ids: slides, interval_ms: intervalMs, transition_ms: transitionMs, aspect_ratio: aspectRatio }),
                                    });
                                    if (!res.ok) throw new Error('Failed');
                                    toast.success('Slideshow updated');
                                    setSlideConfigOpen(false);
                                } catch (e) {
                                    console.error(e);
                                    toast.error('Failed to update slideshow');
                                }
                            }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageGallery;

