import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const CommitteeSection = () => {
    const { data: members, isLoading } = useQuery<CommitteeMember[]>({
        queryKey: ['committeeMembers'],
        queryFn: fetchCommitteeMembers,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    if (isLoading) return <div>Loading committee members...</div>;

    return (
        <section className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
                        Our <span className="text-primary">Committee</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Meet the dedicated individuals who guide and support our temple community with wisdom and devotion.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {members?.map((member) => (
                        <Card key={member._id} className="overflow-hidden card-divine text-center">
                            {member.image && (
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={resolveImageUrl(member.image)}
                                        alt={member.name}
                                        className="w-32 h-32 object-cover rounded-full border-4 border-primary/20"
                                    />
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl">{member.name}</CardTitle>
                                <p className="text-sm text-muted-foreground font-medium">{member.designation}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm mb-4">{member.profile_description}</p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Phone:</strong> {member.phone_number}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CommitteeSection;