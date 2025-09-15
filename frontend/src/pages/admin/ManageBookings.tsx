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
import { Calendar, Users, DollarSign } from 'lucide-react';

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

    // Calculate stats
    const totalBookings = bookings?.length || 0;
    const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_cost, 0) || 0;
    const totalRituals = bookings?.reduce((sum, booking) => sum + booking.instances.length, 0) || 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Bookings</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Bookings</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-400/20">
                            <Calendar className="h-4 w-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalBookings}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Revenue</CardTitle>
                        <div className="p-2 rounded-lg bg-pink-400/20">
                            <DollarSign className="h-4 w-4 text-pink-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">₹{totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-300">Total Rituals</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-400/20">
                            <Users className="h-4 w-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalRituals}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-lg shadow-purple-500/10">
                <CardHeader>
                    <CardTitle className="text-purple-400">All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-purple-500/30 hover:bg-purple-900/20">
                                <TableHead className="w-[250px] text-purple-300">Customer</TableHead>
                                <TableHead className="text-purple-300">Contact</TableHead>
                                <TableHead className="text-right text-purple-300">Total Cost</TableHead>
                                <TableHead className="text-center text-purple-300">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings?.map((booking) => (
                                <TableRow key={booking._id} className="border-purple-500/30 hover:bg-purple-900/20">
                                    <TableCell>
                                        <div className="font-medium text-white">{booking.name}</div>
                                        <div className="text-sm text-purple-300">{booking.address}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-white">{booking.email}</div>
                                        <div className="text-purple-300">{booking.phone}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-white">₹{booking.total_cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                       <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="item-1" className="border-purple-500/30">
                                                <AccordionTrigger className="text-purple-300 hover:text-purple-400 hover:no-underline">
                                                    View {booking.instances.length} Ritual(s)
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2 text-left p-2 bg-purple-900/30 rounded-md">
                                                        {booking.instances.map((instance, index) => (
                                                            <div key={index} className="border-b border-purple-500/30 last:border-b-0 py-1">
                                                                <p className="font-semibold text-white">{instance.ritualName} (Qty: {instance.quantity})</p>
                                                                <p className="text-sm text-purple-300">For: {instance.devoteeName}</p>
                                                                <p className="text-xs text-purple-400">
                                                                    Naal: {instance.naal} | DOB: {instance.dob} | Sub: <Badge variant="outline" className="border-purple-500/30 text-purple-300">{instance.subscription}</Badge>
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