import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { get } from '../../api/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, ImageIcon, Folder, Hash, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/utils';
import GalleryStaticLayoutManager from '@/pages/admin/GalleryStaticLayoutManager';
import { API_BASE_URL } from '@/api/api';
import { jwtAuth } from '@/lib/jwtAuth';


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

    const [staticLayoutOpen, setStaticLayoutOpen] = useState(false);
    const [homePreviewOpen, setHomePreviewOpen] = useState(false);
    const [homeSlots, setHomeSlots] = useState<(string | null)[]>([null, null, null, null, null, null]);

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
    const imagesById = useMemo(() => Object.fromEntries((images || []).map(i => [i._id, i])), [images]);

    // Load existing Home Preview config on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/gallery-home-preview/`);
                if (res.ok) {
                    const data = await res.json();
                    const slots = (data.slots || [null, null, null, null, null, null]) as (string | null)[];
                    setHomeSlots(slots);
                }
            } catch {
                // ignore
            }
        })();
    }, []);

    // DnD helpers for Home Preview config
    const onDragStartImage = (e: React.DragEvent, id: string, source: 'palette' | 'slot', slotIndex?: number) => {
        if (isReadOnly) return;
        try {
            e.dataTransfer.setData('text/gallery-image-id', id);
            e.dataTransfer.setData('text/source', source);
            if (source === 'slot') e.dataTransfer.setData('text/slot-index', String(slotIndex ?? -1));
        } catch {}
        e.dataTransfer.effectAllowed = 'move';
    };
    const onSlotDragOver = (e: React.DragEvent) => {
        if (isReadOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const onDropToSlot = (targetIdx: number) => (e: React.DragEvent) => {
        if (isReadOnly) return;
        e.preventDefault();
        let id = '';
        try {
            id = e.dataTransfer.getData('text/gallery-image-id');
        } catch {}
        if (!id) return;
        setHomeSlots(prev => {
            const next = [...prev];
            const existingIdx = next.findIndex(x => x === id);
            if (existingIdx >= 0 && existingIdx !== targetIdx) {
                const tmp = next[targetIdx];
                next[targetIdx] = id;
                next[existingIdx] = tmp;
                return next;
            }
            next[targetIdx] = id;
            return next;
        });
    };

    const Slot: React.FC<{ idx: number; size: 'lg' | 'md' | 'sm' }> = ({ idx, size }) => {
        const id = homeSlots[idx];
        const img = id ? imagesById[id] : null;
        const base = size === 'lg' ? 'h-72 md:h-[420px]' : size === 'md' ? 'h-48 md:h-52' : 'h-40';
        return (
            <div
                className={`relative rounded-lg overflow-hidden border-2 ${img ? 'border-purple-400/40' : 'border-dashed border-purple-400/40'} bg-slate-900/20 ${base}`}
                onDragOver={onSlotDragOver}
                onDrop={onDropToSlot(idx)}
            >
                {img ? (
                    <img
                        src={resolveImageUrl(img.src)}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        draggable={!isReadOnly}
                        onDragStart={(e) => onDragStartImage(e, img._id, 'slot', idx)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-purple-700/80">
                        Drag an image here
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                    {size === 'lg' ? 'Featured' : size === 'md' ? 'Highlighted' : 'Gallery'}
                </div>
            </div>
        );
    };
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
                    setSlides((data.image_ids || []).filter((id: string) => (images || []).some(i => i._id === id)));
                    setIntervalMs(data.interval_ms || 4000);
                    setTransitionMs(data.transition_ms || 600);
                    setAspectRatio((data.aspect_ratio || '16:9'));
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [images]);

    const mutation = useMutation({
        mutationFn: (imagePayload: Omit<GalleryImage, '_id'>) => {
            if (roleId > 3) throw new Error('Not authorized');
            if (isEditing) {
                return api.put(`/gallery/${isEditing._id}`, imagePayload);
            }
            return api.post('/gallery', imagePayload);
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
            if (roleId > 3) throw new Error('Not authorized');
            return api.delete(`/gallery/${id}`);
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
                const token = await jwtAuth.getAccessToken();
                if (!token) {
                    throw new Error('Not authenticated. Please sign in again.');
                }
                const form = new FormData();
                form.append('file', selectedFile);
                const res = await fetch(`${API_BASE_URL}/api/gallery/upload`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                });
                if (!res.ok) {
                    let message = 'Upload failed';
                    try {
                        const err = await res.json();
                        message = err?.detail || message;
                    } catch {}
                    if (res.status === 401) {
                        message = 'Unauthorized. Your session may have expired. Please sign in again.';
                    }
                    throw new Error(message);
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">Manage Gallery</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => setHomePreviewOpen(true)}
                        className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50"
                    >
                        Configure Home Preview
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setStaticLayoutOpen((v) => !v)}
                        className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50"
                    >
                        {staticLayoutOpen ? 'Hide Configure Full Gallery' : 'Configure Full Gallery'}
                    </Button>
                    <Link to={{ pathname: '/gallery' }} state={{ fromAdmin: '/admin/gallery' }} className="inline-flex">
                        <Button variant="outline" className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50">
                            View Public Gallery <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to={{ pathname: '/' }} state={{ fromAdmin: '/admin/gallery', scrollTo: 'gallery' }} className="inline-flex">
                        <Button variant="outline" className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50">
                            View Home Section <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Static container-based layout configuration */}
            {staticLayoutOpen && (
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/40 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold text-purple-100">Configure Full Gallery Layout</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setStaticLayoutOpen(false)} className="border-purple-500/40 text-purple-100 hover:bg-purple-900/60">Close</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <GalleryStaticLayoutManager images={(images || []).map(i => ({...i, src: resolveImageUrl(i.src)}))} />
                    </CardContent>
                </Card>
            )}
            
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
                <Button variant="outline" onClick={() => setSlideConfigOpen(true)} className="border-purple-500/40 text-purple-100 hover:bg-purple-900/60">Configure Slideshow</Button>
            </div>

            {/* Inline Home Preview Config Section */}
            {homePreviewOpen && (
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/40 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold text-purple-100">Configure Home Gallery Preview (6 Slots)</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setHomePreviewOpen(false)} className="border-purple-500/40 text-purple-100 hover:bg-purple-900/60">Close</Button>
                            <Button onClick={async () => {
                                if (isReadOnly) { toast.error('You are not authorized to modify home preview.'); return; }
                                try {
                                    const token = await jwtAuth.getAccessToken();
                                    if (!token) throw new Error('Not authenticated. Please sign in again.');
                                    const res = await fetch(`${API_BASE_URL}/api/gallery-home-preview/`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ slots: homeSlots }),
                                    });
                                    if (!res.ok) {
                                        let message = 'Failed';
                                        try { const err = await res.json(); message = err?.detail || message; } catch {}
                                        throw new Error(message);
                                    }
                                    toast.success('Home preview updated');
                                    queryClient.invalidateQueries({ queryKey: ['galleryHomePreview'] });
                                    setHomePreviewOpen(false);
                                } catch (e) {
                                    console.error(e);
                                    toast.error('Failed to update home preview');
                                }
                            }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">Save</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-purple-100/90">Drag images from the palette into the fixed slots below. Reorder by dragging between slots.</p>

                        {/* Slots layout */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 order-1">
                                    <Slot idx={0} size="lg" />
                                </div>
                                <div className="space-y-4 order-2">
                                    <Slot idx={1} size="md" />
                                    <Slot idx={2} size="md" />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap items-stretch justify-center gap-4">
                                <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm"><Slot idx={3} size="sm" /></div>
                                <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm"><Slot idx={4} size="sm" /></div>
                                <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm"><Slot idx={5} size="sm" /></div>
                            </div>
                        </div>

                        {/* Draggable palette */}
                        <div>
                            <div className="text-sm text-purple-100/90 mb-2">Available Images</div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {(images || []).map(img => (
                                    <div key={img._id} className={`w-28 h-20 rounded-md overflow-hidden border ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-move'} border-purple-500/40 flex-shrink-0`}
                                        draggable={!isReadOnly}
                                        onDragStart={(e) => onDragStartImage(e, img._id, 'palette')}
                                    >
                                        <img src={resolveImageUrl(img.src)} alt={img.title} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inline Slideshow Config Section */}
            {slideConfigOpen && (
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/40 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold text-purple-100">Configure Slideshow</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setSlideConfigOpen(false)} className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50">Close</Button>
                            <Button onClick={async () => {
                                if (isReadOnly) { toast.error('You are not authorized to modify slideshow.'); return; }
                                try {
                                    const token = await jwtAuth.getAccessToken();
                                    if (!token) throw new Error('Not authenticated. Please sign in again.');
                                    const res = await fetch(`${API_BASE_URL}/api/slideshow/`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ image_ids: slides, interval_ms: intervalMs, transition_ms: transitionMs, aspect_ratio: aspectRatio }),
                                    });
                                    if (!res.ok) {
                                        let message = 'Failed';
                                        try { const err = await res.json(); message = err?.detail || message; } catch {}
                                        if (res.status === 401) message = 'Unauthorized. Your session may have expired.';
                                        throw new Error(message);
                                    }
                                    toast.success('Slideshow updated');
                                    setSlideConfigOpen(false);
                                } catch (e) {
                                    console.error(e);
                                    toast.error('Failed to update slideshow');
                                }
                            }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">Save</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Image picker grid */}
                        <div className="flex flex-wrap gap-2">
                            {(images || []).map((img) => {
                                const selected = slides.includes(img._id);
                                return (
                                    <div
                                        key={img._id}
                                        className={`relative border rounded overflow-hidden ${selected ? 'border-purple-500' : 'border-purple-500/30'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
                                        draggable={!isReadOnly}
                                        onDragStart={(e) => {
                                            if (isReadOnly) return;
                                            e.dataTransfer.setData('text/slide-id', img._id);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onClick={() => {
                                            if (isReadOnly) return;
                                            setSlides((prev) => selected ? prev.filter((x) => x !== img._id) : [...prev, img._id]);
                                        }}
                                    >
                                        <img src={resolveImageUrl(img.src)} alt={img.title} className="w-32 h-20 object-cover" />
                                        {selected && <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1 rounded">Selected</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Selected order list */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-800">Selected Slides Order</h4>
                                <div className="flex gap-2">
                                            <Button variant="outline" disabled={isReadOnly || slides.length === 0} onClick={() => !isReadOnly && setSlides([])} className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50 disabled:opacity-50">Clear</Button>
                                </div>
                            </div>
                            {slides.length === 0 ? (
                                <div className="text-sm text-slate-800">No images selected yet. Click images above to add them or drag to the list.</div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {slides.filter(id => (images || []).some(i => i._id === id)).map((id, idx) => {
                                        const img = (images || []).find(i => i._id === id)!;
                                        return (
                                            <div
                                                key={id}
                                                className="relative border border-purple-500/30 rounded-md overflow-hidden"
                                                draggable={!isReadOnly}
                                                onDragStart={(e) => {
                                                    if (isReadOnly) return;
                                                    e.dataTransfer.setData('text/slide-id', id);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                onDragOver={(e) => { if (isReadOnly) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                                onDrop={(e) => {
                                                    if (isReadOnly) return;
                                                    e.preventDefault();
                                                    const draggedId = e.dataTransfer.getData('text/slide-id');
                                                    if (!draggedId) return;
                                                    setSlides(prev => {
                                                        const current = [...prev];
                                                        // if dragging from palette and not in list yet, insert at idx
                                                        const fromIndex = current.indexOf(draggedId);
                                                        if (fromIndex === -1) {
                                                            current.splice(idx, 0, draggedId);
                                                            return current;
                                                        }
                                                        // reordering within list
                                                        if (fromIndex === idx) return current;
                                                        const [item] = current.splice(fromIndex, 1);
                                                        current.splice(idx, 0, item);
                                                        return current;
                                                    });
                                                }}
                                            >
                                                <img src={resolveImageUrl(img.src)} alt={img.title} className="w-32 h-20 object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs flex items-center justify-between px-1 py-0.5">
                                                    <span className="opacity-80">#{idx + 1}</span>
                                                    <div className="flex gap-1">
                                                        <button type="button" disabled={isReadOnly} title="Remove" onClick={() => !isReadOnly && setSlides(prev => prev.filter(x => x !== id))} className={`px-1 rounded ${isReadOnly?'opacity-40 cursor-not-allowed':'hover:bg-white/20'}`}>✕</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 items-center">
                            <label className="text-sm text-slate-800 col-span-1">Interval (ms)</label>
                            <Input type="number" value={intervalMs} onChange={(e) => setIntervalMs(Math.max(1000, Math.min(60000, parseInt(e.target.value || '0', 10) || 4000)))} disabled={isReadOnly} className="bg-white border-purple-500/30 text-slate-800 w-full" />
                            <label className="text-sm text-slate-800 col-span-1">Transition (ms)</label>
                            <Input type="number" value={transitionMs} onChange={(e) => setTransitionMs(Math.max(100, Math.min(5000, parseInt(e.target.value || '0', 10) || 600)))} disabled={isReadOnly} className="bg-white border-purple-500/30 text-slate-800 w-full" />
                            <label className="text-sm text-slate-800 col-span-1">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} disabled={isReadOnly} className="bg-white border-purple-500/30 text-slate-800 rounded px-2 py-2 w-full">
                                <option value="16:9">16:9</option>
                                <option value="4:3">4:3</option>
                                <option value="1:1">1:1</option>
                                <option value="21:9">21:9</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
            )}



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

            {/* Removed modal popup for designer in favor of inline section above */}
            
        </div>
    );
};

export default ManageGallery;

