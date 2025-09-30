import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import ImageWithBlur from '@/components/ImageWithBlur';

// Defines the structure for a committee member object.
interface CommitteeMember {
    _id: string;
    name: string;
    designation: string;
    profile_description: string;
    mobile_prefix: string;
    phone_number: string;
    image: string;
    preview_order?: number | null;
    view_order?: number | null;
}

/**
 * Fetches the list of committee members from the API.
 * @returns A promise that resolves to an array of CommitteeMember objects.
 */
const fetchCommitteeMembers = async (): Promise<CommitteeMember[]> => {
    const data = await get<CommitteeMember[]>('/committee/');
    return data;
};

/**
 * Renders a reusable card for a single committee member.
 * This component ensures consistent styling for each member's display.
 */
const MemberCard = ({ member }: { member: CommitteeMember }) => (
    <div className="text-center flex-shrink-0 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-sm ring-0 hover:ring-2 hover:ring-primary/40 transition">
            {member.image ? (
                <ImageWithBlur
                    src={resolveImageUrl(member.image)}
                    alt={member.name}
                    className="w-full h-full"
                />
            ) : (
                <div className="w-full h-full bg-muted" />
            )}
        </div>
        <div className="mt-3">
            <div className="text-lg font-semibold">{member.name}</div>
            <div className="text-sm text-muted-foreground">{member.designation}</div>
        </div>
    </div>
);


const CommitteeSection = () => {
    const navigate = useNavigate();
    const { data: members, isLoading } = useQuery<CommitteeMember[]>({
        queryKey: ['committeeMembers'],
        queryFn: fetchCommitteeMembers,
        staleTime: 5 * 60 * 1000, // Stale time set to 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
    const { ref: featuredRef, isVisible: featuredVisible } = useScrollAnimation();
    const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

    // Sort by preview_order (non-null ascending) and take top 7
    const orderedPreview = (members ?? [])
        .slice()
        .sort((a, b) => {
            const ao = a.preview_order ?? Number.POSITIVE_INFINITY;
            const bo = b.preview_order ?? Number.POSITIVE_INFINITY;
            if (ao !== bo) return ao - bo;
            return a.name.localeCompare(b.name);
        })
        .filter((m) => (m.preview_order ?? Infinity) !== Infinity)
        .slice(0, 7);

    const previewList = orderedPreview.length > 0 ? orderedPreview : (members ?? []).slice(0, 7);

    const idxFeatured = previewList.findIndex(m => (m.preview_order ?? 0) === 1);
    const mainMember = idxFeatured >= 0 ? previewList[idxFeatured] : previewList[0];
    const otherMembers = (mainMember
        ? previewList.filter(m => m._id !== mainMember._id)
        : previewList).sort((a, b) => (a.preview_order ?? Number.POSITIVE_INFINITY) - (b.preview_order ?? Number.POSITIVE_INFINITY));

    return (
        // 1. Main wrapper with reduced vertical space
        <section className="py-10 px-6">
            {/* 2. The visible outline container */}
            <div className="max-w-screen-2xl mx-auto bg-transparent border-2 border-red-500 rounded-xl p-6 sm:p-8 lg:p-12">
                {/* 3. The content container */}
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        // Polished skeleton loader wrapped in the same structure
                        <>
                            <div className="text-center mb-16">
                                <div className="h-8 w-80 mx-auto bg-muted animate-pulse rounded" />
                                <div className="h-4 w-[36rem] max-w-full mx-auto mt-4 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="flex justify-center mb-16">
                                <div className="text-center">
                                    <div className="w-40 h-40 mx-auto rounded-full bg-muted animate-pulse" />
                                    <div className="mt-4 h-6 w-48 mx-auto bg-muted animate-pulse rounded" />
                                    <div className="mt-2 h-4 w-40 mx-auto bg-muted animate-pulse rounded" />
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-10 md:gap-x-20">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="text-center">
                                        <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
                                        <div className="mt-3 h-5 w-24 mx-auto bg-muted animate-pulse rounded" />
                                        <div className="mt-2 h-4 w-20 mx-auto bg-muted animate-pulse rounded" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        // Main component content
                        <>
                            <div ref={headerRef} className={`text-center mb-16 ${headerVisible ? 'animate-fade-in-up' : ''}`}>
                                <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
                                    Our <span className="text-primary">Committee</span>
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                                    Meet the dedicated individuals who guide and support our temple community with wisdom and devotion.
                                </p>
                            </div>
                            {mainMember && (
                                <div ref={featuredRef} className={`flex justify-center mb-16 ${featuredVisible ? 'animate-scale-in' : ''}`}>
                                    <div className="text-center transition-transform duration-300 hover:-translate-y-1">
                                        <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-lg ring-0 hover:ring-2 hover:ring-primary/40 transition">
                                            <ImageWithBlur src={resolveImageUrl(mainMember.image)} alt={mainMember.name} className="w-full h-full" />
                                        </div>
                                        <div className="mt-4">
                                            <div className="text-2xl font-bold">{mainMember.name}</div>
                                            <div className="text-md text-primary font-semibold">{mainMember.designation}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {otherMembers && otherMembers.length > 0 && (
                                 <div ref={gridRef} className="flex flex-wrap justify-center gap-10 md:gap-x-20">
                                    {otherMembers.map((member, idx) => (
                                        <div key={member._id} className={`${gridVisible ? 'animate-scale-in' : ''}`} style={{animationDelay: `${idx * 0.12}s`}}>
                                            <MemberCard member={member} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-16 text-center">
                                <Button className="btn-divine" onClick={() => navigate('/committee')}>
                                    View All Committee Members
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CommitteeSection;