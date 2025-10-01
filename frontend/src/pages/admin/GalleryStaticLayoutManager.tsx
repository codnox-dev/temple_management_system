import React, { useEffect, useMemo, useState } from 'react';
import { get, post } from '@/api/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface GalleryImage {
  _id: string;
  src: string;
  title: string;
  category: string;
}

type Props = {
  images: GalleryImage[];
  isReadOnly?: boolean;
};

const GalleryStaticLayoutManager: React.FC<Props> = ({ images, isReadOnly = false }) => {
  const [order, setOrder] = useState<(string | null)[]>([]);
  const [saving, setSaving] = useState(false);

  const imagesById = useMemo(() => Object.fromEntries(images.map((i) => [i._id, i])), [images]);

  useEffect(() => {
    (async () => {
      try {
        const layout = await get<any>(`/gallery-layout/full`);
        const ord: string[] = Array.isArray(layout?.order) ? layout.order : [];
        const filtered = ord.filter((id) => !!imagesById[id]);
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

  const onContainerDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropToContainer = (targetIdx: number) => (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    let id = '';
    try {
      id = e.dataTransfer.getData('text/gallery-image-id');
    } catch {}
    if (!id) return;
    setOrder((prev) => {
      const containerCount = images.length;
      const next = [...prev];
      while (next.length < containerCount) next.push(null);
      if (next.length > containerCount) next.length = containerCount;

      const existingIdx = next.findIndex((x) => x === id);
      const displaced = next[targetIdx] ?? null;

      next[targetIdx] = id;

      if (existingIdx >= 0 && existingIdx !== targetIdx) {
        next[existingIdx] = displaced;
      } else if (existingIdx === -1) {
        if (displaced && displaced !== id) {
          const firstEmpty = next.findIndex((x) => !x);
          if (firstEmpty !== -1) next[firstEmpty] = displaced;
        }
      }

      for (let i = 0; i < next.length; i++) {
        if (i !== targetIdx && next[i] === id) next[i] = null;
      }

      return next;
    });
  };

  const save = async () => {
    if (isReadOnly) return;
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

  const clearAll = () => {
    if (isReadOnly) return;
    setOrder([]);
  };

  const containerCount = images.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Drag images into containers. Containers are fixed; only the image assignments change.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isReadOnly} onClick={clearAll} className="border-purple-500/40 text-purple-900 bg-white hover:bg-purple-50 disabled:opacity-50">Clear</Button>
          <Button disabled={isReadOnly || saving} onClick={save} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: containerCount }).map((_, idx) => {
          const id = order[idx] || null;
          const img = id ? imagesById[id] : null;
          return (
            <div
              key={idx}
              className={`relative rounded-lg overflow-hidden border-2 ${img ? 'border-purple-400/40' : 'border-dashed border-purple-400/40'} bg-slate-900/20 h-40 md:h-48`}
              onDragOver={onContainerDragOver}
              onDrop={onDropToContainer(idx)}
            >
              {img ? (
                <img src={resolveImageUrl(img.src)} alt={img.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-purple-700/80">Drop image here</div>
              )}
              {img && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setOrder((prev) => prev.map((v,i) => (i===idx? null : v)))}
                  className="absolute top-1 right-1 text-xs bg-black/50 text-white rounded px-1 py-0.5"
                >Clear</button>
              )}
              <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">#{idx+1}</div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Images</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {images.map((img) => (
            <div
              key={img._id}
              className={`relative rounded-md overflow-hidden border ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-move'} border-purple-500/40`}
              draggable={!isReadOnly}
              onDragStart={(e) => { if (isReadOnly) return; try { e.dataTransfer.setData('text/gallery-image-id', img._id); e.dataTransfer.effectAllowed = 'move'; } catch {} }}
            >
              <img src={resolveImageUrl(img.src)} alt={img.title} className="w-full h-24 object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryStaticLayoutManager;
