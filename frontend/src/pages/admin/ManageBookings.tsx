import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

// --- Type Definitions ---
// Based on your schemas.py
interface RitualInstance {
    ritualId: string;
    ritualName: string;
    devoteeName: string;
    naal: string;
    dob: string;
    subscription: string;
    quantity: number;
}

interface Booking {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    total_cost: number;
    instances: RitualInstance[];
}

// --- API Fetching ---
const fetchBookings = async (): Promise<Booking[]> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error("No admin token found.");
    }
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { data } = await axios.get('http://localhost:8000/api/bookings', config);
    return data;
};


const ManageBookings = () => {
    const { data: bookings, isLoading, isError } = useQuery<Booking[]>({
        queryKey: ['adminBookings'],
        queryFn: fetchBookings,
        onError: () => {
            toast.error("Failed to fetch bookings. You might need to log in again.");
        }
    });

    if (isLoading) return <p>Loading bookings...</p>;
    if (isError) return <p className="text-red-500">Error fetching bookings. Please try refreshing the page.</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Bookings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-center">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings?.map((booking) => (
                                <TableRow key={booking._id}>
                                    <TableCell>
                                        <div className="font-medium">{booking.name}</div>
                                        <div className="text-sm text-muted-foreground">{booking.address}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{booking.email}</div>
                                        <div>{booking.phone}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">₹{booking.total_cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                       <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="item-1">
                                                <AccordionTrigger>
                                                    View {booking.instances.length} Ritual(s)
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2 text-left p-2 bg-muted/50 rounded-md">
                                                        {booking.instances.map((instance, index) => (
                                                            <div key={index} className="border-b last:border-b-0 py-1">
                                                                <p className="font-semibold">{instance.ritualName} (Qty: {instance.quantity})</p>
                                                                <p className="text-sm">For: {instance.devoteeName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Naal: {instance.naal} | DOB: {instance.dob} | Sub: <Badge variant="outline">{instance.subscription}</Badge>
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageBookings;
