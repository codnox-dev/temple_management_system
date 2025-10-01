import React, { useEffect, useMemo, useState } from 'react';
import { get, post } from '@/api/api';
import { resolveImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface GalleryImage {
  _id: string;
  src: string;
  title: string;
  category: string;
}

type Props = {
  images: GalleryImage[];
};

// Simple repeating size pattern for containers
const SIZE_PATTERN: Array<'lg' | 'md' | 'sm'> = ['lg', 'sm', 'sm', 'md', 'sm', 'lg', 'sm', 'md'];

function sizeClass(size: 'lg' | 'md' | 'sm') {
  // Heights vary per breakpoint for visual rhythm
  if (size === 'lg') return 'h-64 md:h-72';
  if (size === 'md') return 'h-52 md:h-60';
  return 'h-40 md:h-48';
}

const GalleryStaticLayoutManager: React.FC<Props> = ({ images }) => {
  const [order, setOrder] = useState<(string | null)[]>([]);
  const [saving, setSaving] = useState(false);

  // Build maps
  const imagesById = useMemo(() => Object.fromEntries(images.map((i) => [i._id, i])), [images]);

  // Load existing order
  useEffect(() => {
    (async () => {
      try {
        const layout = await get<any>(`/gallery-layout/full`);
        const ord: string[] = Array.isArray(layout?.order) ? layout.order : [];
        const filtered = ord.filter((id) => !!imagesById[id]);
        // Fallback: auto-fill with all images (current fetched order)
        if (filtered.length === 0) {
          setOrder(images.map((i) => i._id));
        } else {
          setOrder(filtered);
        }
      } catch {
        setOrder(images.map((i) => i._id));
      }
    })();
  }, [images, imagesById]);

  // DnD helpers
  const onDragStartImage = (e: React.DragEvent, id: string, source: 'palette' | 'container', containerIndex?: number) => {
    try {
      e.dataTransfer.setData('text/gallery-image-id', id);
      e.dataTransfer.setData('text/source', source);
      if (source === 'container') {
        e.dataTransfer.setData('text/container-index', String(containerIndex ?? -1));
      }
    } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };
  const onContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDropToContainer = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    let id = '';
    let source = '';
    let sourceIndex = -1;
    try {
      id = e.dataTransfer.getData('text/gallery-image-id');
      source = e.dataTransfer.getData('text/source');
      sourceIndex = parseInt(e.dataTransfer.getData('text/container-index') || '-1', 10);
    } catch {}
    if (!id) return;
    setOrder((prev) => {
      const containerCount = images.length;
      const next = [...prev];
      // Ensure fixed length array of slots
      while (next.length < containerCount) next.push(null);
      if (next.length > containerCount) next.length = containerCount;

      const existingIdx = next.findIndex((x) => x === id);
      const displaced = next[targetIdx] ?? null;

      // Place dragged image into target
      next[targetIdx] = id;

      if (existingIdx >= 0 && existingIdx !== targetIdx) {
        // Came from another container: swap
        next[existingIdx] = displaced;
      } else if (existingIdx === -1) {
        // Came from palette: optionally move displaced to first empty slot
        if (displaced && displaced !== id) {
          const emptyIdx = next.findIndex((x, i) => (x == null) && i !== targetIdx);
          if (emptyIdx !== -1) next[emptyIdx] = displaced;
        }
      }

      // Hard dedupe: ensure 'id' appears only once (keep target)
      for (let i = 0; i < next.length; i++) {
        if (i !== targetIdx && next[i] === id) next[i] = null;
      }

      return next;
    });
  };

  const onClearContainer = (idx: number) => {
    setOrder((prev) => {
      const next = [...prev];
      if (idx >= 0 && idx < next.length) next[idx] = null;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
  await post(`/gallery-layout/full`, { mode: 'full', order: order.filter(Boolean) });
      toast.success('Gallery layout saved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save gallery layout');
    } finally {
      setSaving(false);
    }
  };

  // Render containers = one per available image count
  const containerCount = images.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="text-sm text-muted-foreground">Drag images into containers. Containers are fixed; only the image assignments change. Auto-fills with all images by default.</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOrder(images.map((i) => i._id))}>Auto-fill</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Layout'}</Button>
        </div>
      </div>

      {/* Containers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: containerCount }).map((_, idx) => {
          const size = SIZE_PATTERN[idx % SIZE_PATTERN.length];
          const id = order[idx];
          const img = id ? imagesById[id] : null;
          return (
            <div
              key={idx}
              className={`relative rounded-lg overflow-hidden bg-muted/40 border ${sizeClass(size)} flex items-center justify-center group`}
              onDragOver={onContainerDragOver}
              onDrop={onDropToContainer(idx)}
            >
              {img ? (
                <img
                  src={resolveImageUrl(img.src)}
                  alt={img.title}
                  className="w-full h-full object-cover"
                  draggable
                  onDragStart={(e) => onDragStartImage(e, img._id, 'container', idx)}
                />
              ) : (
                <div className="text-xs text-muted-foreground">Drop image here</div>
              )}
              {img && (
                <button
                  type="button"
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                  onClick={() => onClearContainer(idx)}
                >Clear</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Palette */}
      <div>
        <div className="text-sm font-medium mb-2">Images</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {images.map((img) => (
            <img
              key={img._id}
              src={resolveImageUrl(img.src)}
              alt={img.title}
              draggable
              onDragStart={(e) => onDragStartImage(e, img._id, 'palette')}
              className="w-full h-24 object-cover rounded border hover:opacity-80"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryStaticLayoutManager;
