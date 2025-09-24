import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveImageUrl } from '@/lib/utils';
import { get, post } from '@/api/api';

type Mode = 'full' | 'preview';

export interface GalleryImage {
  _id: string;
  src: string;
  title: string;
  category: string;
}

type LayoutItem = {
  id: string; // image _id
  x: number; // px relative to canvas
  y: number; // px relative to canvas
  w: number; // width px
  h: number; // height px
  z?: number; // z-index for stacking when dragging
};

const STORAGE_KEY = (mode: Mode) => `gallery-layout-${mode}`;

const DEFAULT_CANVAS = {
  full: { width: 1200, height: 1200, className: 'bg-slate-800' },
  preview: { width: 1000, height: 800, className: 'bg-slate-800' },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const ResizeHandle: React.FC<{ position: 'br' | 'tr' | 'bl' | 'tl' } & React.HTMLAttributes<HTMLDivElement>> = ({ position, ...props }) => (
  <div
    {...props}
    className={`absolute w-3 h-3 bg-white rounded shadow -translate-x-1/2 -translate-y-1/2 ${
      position === 'br' ? 'right-0 bottom-0 translate-x-1/2 translate-y-1/2' :
      position === 'tr' ? 'right-0 top-0 translate-x-1/2 -translate-y-1/2' :
      position === 'bl' ? 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2' :
      'left-0 top-0 -translate-x-1/2 -translate-y-1/2'
    }`}
    style={{ cursor: position === 'br' ? 'nwse-resize' : position === 'tr' ? 'nesw-resize' : position === 'bl' ? 'nesw-resize' : 'nwse-resize' }}
  />
);

const DraggableResizableTile: React.FC<{
  item: LayoutItem;
  onChange: (next: LayoutItem) => void;
  canvasWidth: number;
  canvasHeight: number;
  children: React.ReactNode;
}> = ({ item, onChange, canvasWidth, canvasHeight, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<null | 'br' | 'tr' | 'bl' | 'tl'>(null);
  const pointerStart = useRef<{ x: number; y: number; startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!pointerStart.current) return;
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      if (dragging) {
        const nx = clamp(pointerStart.current.startX + dx, 0, canvasWidth - item.w);
        const ny = clamp(pointerStart.current.startY + dy, 0, canvasHeight - item.h);
        onChange({ ...item, x: nx, y: ny });
      } else if (resizing) {
        let { startW, startH, startX, startY } = pointerStart.current;
        let nw = startW;
        let nh = startH;
        let nx = item.x;
        let ny = item.y;
        const minSize = 60;
        if (resizing === 'br') {
          nw = clamp(startW + dx, minSize, canvasWidth - item.x);
          nh = clamp(startH + dy, minSize, canvasHeight - item.y);
        } else if (resizing === 'tr') {
          nw = clamp(startW + dx, minSize, canvasWidth - item.x);
          nh = clamp(startH - dy, minSize, item.y + startH);
          ny = clamp(startY + dy, 0, item.y + startH - minSize);
        } else if (resizing === 'bl') {
          nw = clamp(startW - dx, minSize, item.x + startW);
          nh = clamp(startH + dy, minSize, canvasHeight - item.y);
          nx = clamp(startX + dx, 0, item.x + startW - minSize);
        } else if (resizing === 'tl') {
          nw = clamp(startW - dx, minSize, item.x + startW);
          nh = clamp(startH - dy, minSize, item.y + startH);
          nx = clamp(startX + dx, 0, item.x + startW - minSize);
          ny = clamp(startY + dy, 0, item.y + startH - minSize);
        }
        // contain within canvas
        nw = clamp(nw, minSize, canvasWidth - nx);
        nh = clamp(nh, minSize, canvasHeight - ny);
        onChange({ ...item, x: nx, y: ny, w: nw, h: nh });
      }
    };
    const onUp = () => {
      setDragging(false);
      setResizing(null);
      pointerStart.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, resizing, canvasWidth, canvasHeight, item, onChange]);

  const onMouseDownDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    pointerStart.current = { x: e.clientX, y: e.clientY, startX: item.x, startY: item.y, startW: item.w, startH: item.h };
    document.body.style.userSelect = 'none';
  };

  const onMouseDownResize = (which: 'br' | 'tr' | 'bl' | 'tl') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(which);
    pointerStart.current = { x: e.clientX, y: e.clientY, startX: item.x, startY: item.y, startW: item.w, startH: item.h };
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={ref}
      className="absolute border border-purple-500/50 rounded overflow-hidden shadow-lg"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: item.z ?? 1,
        background: '#0f172a',
      }}
    >
      <div className="relative w-full h-full">
        {/* Drag handle: only the content area will start drag */}
        <div
          className="absolute inset-0"
          onMouseDown={onMouseDownDrag}
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        >
          {children}
        </div>
        {/* resize handles */}
        <ResizeHandle position="br" onMouseDown={onMouseDownResize('br')} />
        <ResizeHandle position="tr" onMouseDown={onMouseDownResize('tr')} />
        <ResizeHandle position="bl" onMouseDown={onMouseDownResize('bl')} />
        <ResizeHandle position="tl" onMouseDown={onMouseDownResize('tl')} />
      </div>
    </div>
  );
};

const GalleryLayoutDesigner: React.FC<{
  mode: Mode;
  images: GalleryImage[];
  onClose: () => void;
}> = ({ mode, images, onClose }) => {
  const canvas = DEFAULT_CANVAS[mode];
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [designW, setDesignW] = useState<number>(canvas.width);
  const [designH, setDesignH] = useState<number>(canvas.height);
  const [loading, setLoading] = useState<boolean>(true);
  const [designWInput, setDesignWInput] = useState<string>(String(canvas.width));
  const [designHInput, setDesignHInput] = useState<string>(String(canvas.height));
  const [lastSaved, setLastSaved] = useState<{ items: LayoutItem[]; designW: number; designH: number } | null>(null);

  // load saved layout
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await get<{ _id: string; mode: Mode; design_width: number; design_height: number; items: LayoutItem[] }>(`/gallery-layout/${mode}`);
        if (!cancelled && data) {
          setLayout(data.items || []);
          setDesignW(data.design_width || canvas.width);
          setDesignH(data.design_height || canvas.height);
          setDesignWInput(String(data.design_width || canvas.width));
          setDesignHInput(String(data.design_height || canvas.height));
          setLastSaved({ items: data.items || [], designW: data.design_width || canvas.width, designH: data.design_height || canvas.height });
        }
      } catch {
        // No saved layout: build an initial grid accommodating all images with scrolling
        const col = mode === 'preview' ? 3 : 4;
        const padding = 12;
        const tileW = Math.floor((canvas.width - padding * (col + 1)) / col);
        const tileH = mode === 'preview' ? 140 : 160;
        const initial = images.map((img, i) => {
          const c = i % col;
          const r = Math.floor(i / col);
          return {
            id: img._id,
            x: padding + c * (tileW + padding),
            y: padding + r * (tileH + padding),
            w: tileW,
            h: tileH,
            z: 1,
          } as LayoutItem;
        });
        if (!cancelled) {
          setLayout(initial);
          const rows = Math.ceil(initial.length / col) || 1;
          const initW = canvas.width;
          const initH = padding + rows * (tileH + padding);
          setDesignW(initW);
          setDesignH(initH);
          setDesignWInput(String(initW));
          setDesignHInput(String(initH));
          setLastSaved({ items: initial, designW: initW, designH: initH });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  return () => { cancelled = true; };
  }, [mode, images, canvas.width, canvas.height]);

  // ensure layout includes only current images
  const merged = useMemo(() => {
    const ids = new Set(images.map((i) => i._id));
    return layout.filter((l) => ids.has(l.id));
  }, [layout, images]);

  const byId = useMemo(() => Object.fromEntries(images.map((i) => [i._id, i])), [images]);

  const updateItem = (id: string, next: Partial<LayoutItem>) => {
    setLayout((prev) => prev.map((it) => (it.id === id ? { ...it, ...next, z: (it.z ?? 1) + 1 } : it)));
  };

  const handleSave = async () => {
    await post(`/gallery-layout/${mode}`, { mode, design_width: designW, design_height: designH, items: merged });
    setLastSaved({ items: merged, designW, designH });
    onClose();
  };

  const handleReset = () => {
    if (lastSaved) {
      setLayout(lastSaved.items);
      setDesignW(lastSaved.designW);
      setDesignH(lastSaved.designH);
      setDesignWInput(String(lastSaved.designW));
      setDesignHInput(String(lastSaved.designH));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* modal */}
      <div className="relative bg-white border border-orange-200 rounded-lg shadow-2xl w-[95vw] max-w-[1280px] max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
        <div className="flex items-center justify-between p-4 border-b border-orange-200">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Layout Designer - {mode === 'full' ? 'Full Gallery' : 'Home Preview'}</h3>
            <p className="text-xs text-gray-600">Drag to move, use corner handles to resize. Your layout is saved to your browser.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} className="border-orange-300 text-orange-700 hover:bg-orange-50">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-gray-700 hover:bg-orange-50">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* canvas wrapper with scroll */}
        <div className="p-4 overflow-auto">
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-800">Canvas Width</label>
            <input
              type="number"
              className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 w-28"
              value={designWInput}
              inputMode="numeric"
              min={400}
              onChange={(e) => setDesignWInput(e.target.value)}
              onBlur={() => {
                const val = clamp(parseInt(designWInput || '0', 10) || 0, 400, 4000);
                setDesignW(val);
                setDesignWInput(String(val));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = clamp(parseInt(designWInput || '0', 10) || 0, 400, 4000);
                  setDesignW(val);
                  setDesignWInput(String(val));
                }
              }}
            />
            <label className="text-sm text-gray-800">Canvas Height</label>
            <input
              type="number"
              className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 w-28"
              value={designHInput}
              inputMode="numeric"
              min={300}
              onChange={(e) => setDesignHInput(e.target.value)}
              onBlur={() => {
                const val = clamp(parseInt(designHInput || '0', 10) || 0, 300, 6000);
                setDesignH(val);
                setDesignHInput(String(val));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = clamp(parseInt(designHInput || '0', 10) || 0, 300, 6000);
                  setDesignH(val);
                  setDesignHInput(String(val));
                }
              }}
            />
            <span className="text-xs text-gray-600">(Make the canvas taller to accommodate more rows; scroll to view)</span>
          </div>
          <div
            className={`relative rounded-md inline-block ${canvas.className}`}
            style={{ width: designW, height: designH, backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
          >
            {merged.map((it) => {
              const img = byId[it.id];
              if (!img) return null;
              return (
                <DraggableResizableTile
                  key={it.id}
                  item={it}
                  onChange={(n) => updateItem(it.id, n)}
                  canvasWidth={designW}
                  canvasHeight={designH}
                >
                  <img
                    src={resolveImageUrl(img.src)}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400'; }}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-1 truncate">
                    {img.title} • {img.category}
                  </div>
                </DraggableResizableTile>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryLayoutDesigner;
