import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { get } from '../../api/api';
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

/**
 * Defines the data structure for a single ritual instance within a booking.
 * Aligns with the backend `RitualInstance` Pydantic schema.
 */
interface RitualInstance {
    ritualId: string;
    ritualName: string;
    devoteeName: string;
    naal: string;
    dob: string;
    subscription: string;
    quantity: number;
}

/**
 * Defines the data structure for a booking object.
 * Aligns with the backend `Booking` Pydantic schema.
 */
interface Booking {
    _id: string; // MongoDB's default identifier
    name: string;
    email: string;
    phone: string;
    address: string;
    total_cost: number;
    instances: RitualInstance[];
}

/**
* Asynchronously fetches the list of all bookings from the API endpoint.
* Utilized by React Query for data fetching and caching.
* @returns A promise that resolves to an array of Booking objects.
*/
const fetchBookings = (): Promise<Booking[]> => get<Booking[]>('/bookings/');


/**
 * A component for administrators to view and manage all customer bookings.
 * It displays key statistics and a detailed table of all bookings.
 */
const ManageBookings = () => {
    // Fetches and manages booking data, including loading and error states.
    const { data: bookings, isLoading, isError } = useQuery<Booking[]>({
        queryKey: ['adminBookings'],
        queryFn: fetchBookings,
        onError: (err) => {
            // Provides user feedback on data fetching failure.
            console.error("Error fetching bookings:", err);
            toast.error("Failed to fetch bookings. Please check your connection or try logging in again.");
        }
    });

    // Renders a loading state while data is being fetched.
    if (isLoading) return <p className="text-purple-300">Loading bookings...</p>;
    // Renders an error state if the data fetch fails.
    if (isError) return <p className="text-red-500">Error fetching bookings. Please try refreshing the page.</p>;

    // Calculate derived statistics for the dashboard cards.
    const totalBookings = bookings?.length || 0;
    const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_cost, 0) || 0;
    const totalRituals = bookings?.reduce((sum, booking) => sum + booking.instances.reduce((iSum, i) => iSum + i.quantity, 0), 0) || 0;


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Bookings</h1>
            
            {/* Section for displaying key statistics about all bookings. */}
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
                        <CardTitle className="text-sm font-medium text-purple-300">Total Rituals Booked</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-400/20">
                            <Users className="h-4 w-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalRituals}</div>
                    </CardContent>
                </Card>
            </div>

            {/* A detailed table listing all bookings and their associated rituals. */}
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
                                            <AccordionItem value={booking._id} className="border-purple-500/30">
                                                <AccordionTrigger className="text-purple-300 hover:text-purple-400 hover:no-underline">
                                                    View {booking.instances.length} Ritual(s)
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2 text-left p-2 bg-purple-900/30 rounded-md">
                                                        {booking.instances.map((instance, index) => (
                                                            <div key={index} className="border-b border-purple-500/30 last:border-b-0 py-1">
                                                                <div className="font-semibold text-white">{instance.ritualName} (Qty: {instance.quantity})</div>
                                                                <p className="text-sm text-purple-300">For: {instance.devoteeName}</p>
                                                                {/* FIX: Replaced <p> with <div> to prevent DOM nesting errors from the <Badge> component. */}
                                                                <div className="text-xs text-purple-400">
                                                                    Naal: {instance.naal} | DOB: {instance.dob} | Sub: <Badge variant="outline" className="ml-1 border-purple-500/30 text-purple-300">{instance.subscription}</Badge>
                                                                </div>
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
