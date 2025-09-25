import { ExternalLink, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/api';
import { resolveImageUrl } from '../lib/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { get as apiGet } from '@/api/api';

interface GalleryImage {
	_id: string;
	src: string;
	title: string;
	category: string;
}

const fetchGalleryImages = () => get<GalleryImage[]>('/gallery/');
type LayoutItem = { id: string; x: number; y: number; w: number; h: number; z?: number };
const DESIGN_WIDTH_FALLBACK = 1000;
const DESIGN_HEIGHT_FALLBACK = 500;


const GalleryPreview = () => {
	const { data: galleryImages, isLoading, isError } = useQuery<GalleryImage[]>({
        queryKey: ['galleryPreview'],
        queryFn: fetchGalleryImages,
        select: (data) => data.slice(0, 6), // Select first 6 images for preview
    });

	const [layout, setLayout] = useState<LayoutItem[] | null>(null);
	const [designW, setDesignW] = useState<number>(DESIGN_WIDTH_FALLBACK);
	const [designH, setDesignH] = useState<number>(DESIGN_HEIGHT_FALLBACK);
	useEffect(() => {
		(async () => {
			try {
				const data = await apiGet<{ items: LayoutItem[]; design_width: number; design_height: number }>(`/gallery-layout/preview`);
				setLayout(data.items || null);
				setDesignW(data.design_width || DESIGN_WIDTH_FALLBACK);
				setDesignH(data.design_height || DESIGN_HEIGHT_FALLBACK);
			} catch {
				setLayout(null);
				setDesignW(DESIGN_WIDTH_FALLBACK);
				setDesignH(DESIGN_HEIGHT_FALLBACK);
			}
		})();
	}, []);

	const imagesById = useMemo(() => Object.fromEntries((galleryImages || []).map(i => [i._id, i])), [galleryImages]);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [scale, setScale] = useState(1);
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const onResize = () => {
			const w = el.clientWidth;
			const s = Math.min(w / designW, 1);
			setScale(s);
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);
	// Only consider layout items whose images still exist
	const filteredLayout = useMemo(() => {
		if (!layout) return [] as LayoutItem[];
		return layout.filter((it) => !!imagesById[it.id]);
	}, [layout, imagesById]);

	const hasLayout = filteredLayout.length > 0 && galleryImages && galleryImages.length > 0;


	return (
		<section className="py-20 bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
						Sacred <span className="text-primary">Gallery</span>
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Witness the divine beauty and spiritual moments captured during our
						ceremonies, festivals, and daily temple activities.
					</p>
				</div>

				{/* Gallery Grid or Layout */}
					{isLoading && <p className="text-center">Loading gallery...</p>}
					{isError && <p className="text-center text-red-500">Error loading gallery.</p>}
					{hasLayout ? (
						<div ref={containerRef} className="w-full overflow-auto">
							<div className="relative" style={{ width: designW * scale, height: designH * scale }}>
								<div className="absolute left-0 top-0" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: designW, height: designH }}>
									{filteredLayout.map((it) => {
										const image = imagesById[it.id];
										if (!image) return null;
										return (
											<div key={it.id} className="absolute card-divine overflow-hidden rounded-lg group" style={{ left: it.x, top: it.y, width: it.w, height: it.h, zIndex: it.z ?? 1 }}>
												<div className="relative w-full h-full">
													<img src={resolveImageUrl(image.src)} alt={image.title} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }} className="w-full h-full object-cover" />
													<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
														<div className="p-3 text-white w-full flex items-center justify-between">
															<div>
																<h3 className="font-playfair font-semibold mb-1 text-sm">{image.title}</h3>
																<span className="text-xs opacity-80">{image.category}</span>
															</div>
															<ExternalLink className="h-4 w-4 opacity-80" />
														</div>
													</div>
													<div className="absolute top-2 left-2 bg-gradient-golden text-secondary-foreground px-2 py-1 rounded-full text-[10px] font-medium">
														{image.category}
													</div>
													<div className="absolute inset-0 border-2 border-primary/0 hover:border-primary/50 rounded-lg transition-colors duration-300" />
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{galleryImages?.map((image, index) => (
								<div key={image._id} className={`card-divine group overflow-hidden cursor-pointer ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
									<div className="relative overflow-hidden rounded-lg">
										<img src={resolveImageUrl(image.src)} alt={image.title} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400' }} className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${index === 0 ? 'h-64 md:h-[400px]' : 'h-48'}`} />
										<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
											<div className="p-4 text-white w-full">
												<div className="flex items-center justify-between">
													<div>
														<h3 className="font-playfair font-semibold mb-1">{image.title}</h3>
														<span className="text-sm opacity-80">{image.category}</span>
													</div>
													<ExternalLink className="h-5 w-5 opacity-80" />
												</div>
											</div>
										</div>
										<div className="absolute top-3 left-3 bg-gradient-golden text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">{image.category}</div>
										<div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-lg transition-colors duration-300" />
									</div>
								</div>
							))}
						</div>
					)}
				{/* CTA */}
				<div className="text-center mt-12">
					<Link
						to="/gallery"
						className="btn-divine inline-flex items-center gap-2"
					>
						<Camera className="h-5 w-5" />
						View Complete Gallery
					</Link>
				</div>
			</div>
		</section>
	);
};

export default GalleryPreview;

