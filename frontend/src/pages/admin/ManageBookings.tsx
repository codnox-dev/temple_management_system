import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { get, fetchPublicBookings, fetchEmployeeBookings, EmployeeBooking, PublicBooking } from '../../api/api';
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
import { Calendar, Users, DollarSign, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend booking interfaces to include booked_by and support employee bookings
interface RitualInstance {
    ritualId: string;
    ritualName: string;
    devoteeName: string;
    naal: string;
    dob: string;
    subscription: string;
    quantity: number;
}

type UnifiedBooking = {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    total_cost: number;
    instances: RitualInstance[];
    booked_by: string; // 'self' or employee username
    source: 'self' | 'employee';
    timestamp: string;
};

/**
* Asynchronously fetches the list of all bookings from the API endpoint.
* Utilized by React Query for data fetching and caching.
* @returns A promise that resolves to an array of Booking objects.
/**
 * A component for administrators to view and manage all customer bookings.
 * It displays key statistics and a detailed table of all bookings.
 */
const ManageBookings = () => {
    // Fetch both public and employee bookings
    const { data: publicBookings, isLoading: loadingPublic, isError: errorPublic } = useQuery<PublicBooking[]>({
        queryKey: ['adminBookingsPublic'],
        queryFn: fetchPublicBookings
    });

    const { data: employeeBookings, isLoading: loadingEmployee, isError: errorEmployee } = useQuery<EmployeeBooking[]>({
        queryKey: ['adminBookingsEmployee'],
        queryFn: fetchEmployeeBookings
    });

    // Filter states - must be called before any conditional returns
    const [filterType, setFilterType] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [dateRange, setDateRange] = useState({start: '', end: ''});
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [searchRitual, setSearchRitual] = useState<string>('');

    const isLoading = loadingPublic || loadingEmployee;
    const isError = errorPublic || errorEmployee;

    // Normalize combined list - use empty arrays when data isn't loaded yet
    const combined: UnifiedBooking[] = [
        ...(publicBookings || []).map(b => ({
            _id: b._id,
            name: b.name,
            email: b.email,
            phone: b.phone,
            address: b.address,
            total_cost: b.total_cost,
            instances: b.instances,
            booked_by: b.booked_by || 'self',
            source: 'self' as const,
            timestamp: b.timestamp
        })),
        ...(employeeBookings || []).map(b => ({
            _id: b._id,
            name: b.name,
            total_cost: b.total_cost,
            instances: b.instances,
            booked_by: b.booked_by,
            source: 'employee' as const,
            timestamp: b.timestamp
        })),
    ];

    // Filtered bookings - must be called before any conditional returns
    const filteredBookings = useMemo(() => {
        let filtered = combined;
        // Date filter
        if (filterType === 'today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(b => new Date(b.timestamp).toDateString() === today);
        } else if (filterType === 'last3days') {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            filtered = filtered.filter(b => new Date(b.timestamp) >= threeDaysAgo);
        } else if (filterType === 'lastweek') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filtered = filtered.filter(b => new Date(b.timestamp) >= oneWeekAgo);
        } else if (filterType === 'specific' && selectedDate) {
            filtered = filtered.filter(b => new Date(b.timestamp).toDateString() === new Date(selectedDate).toDateString());
        } else if (filterType === 'range' && dateRange.start && dateRange.end) {
            filtered = filtered.filter(b => {
                const ts = new Date(b.timestamp);
                return ts >= new Date(dateRange.start) && ts <= new Date(dateRange.end);
            });
        } else if (filterType === 'month' && selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            filtered = filtered.filter(b => {
                const ts = new Date(b.timestamp);
                return ts.getFullYear() === parseInt(year) && ts.getMonth() === parseInt(month) - 1;
            });
        }
        // Ritual search
        if (searchRitual.trim()) {
            filtered = filtered.filter(b =>
                b.instances.some(i => i.ritualName.toLowerCase().includes(searchRitual.toLowerCase()))
            );
        }
        return filtered;
    }, [combined, filterType, selectedDate, dateRange, selectedMonth, searchRitual]);

    // Helper function to check if any filters are applied
    const hasFiltersApplied = filterType || selectedDate || dateRange.start || dateRange.end || selectedMonth || searchRitual.trim();

    // Helper function to format timestamp as dd/mm/yyyy hh:mm
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    // Renders a loading state while data is being fetched.
    if (isLoading) return <p className="text-purple-300">Loading bookings...</p>;
    // Renders an error state if the data fetch fails.
    if (isError) return <p className="text-red-500">Error fetching bookings. Please try refreshing the page.</p>;

    // Calculate derived statistics for the dashboard cards.
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.total_cost, 0);
    const totalRituals = filteredBookings.reduce((sum, booking) => sum + booking.instances.reduce((iSum, i) => iSum + i.quantity, 0), 0) || 0;

    // Function to download bookings as PDF
    const downloadBookingsAsPDF = (bookings: UnifiedBooking[]) => {
        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.setTextColor(139, 92, 246); // Purple color
            doc.text('Temple Management System', 14, 20);
            
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text('Filtered Bookings Report', 14, 30);
            
            // Add summary statistics
            doc.setFontSize(11);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 14, 40);
            doc.text(`Total Bookings: ${totalBookings}`, 14, 47);
            doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 14, 54);
            doc.text(`Total Rituals: ${totalRituals}`, 14, 61);
            
            // Prepare table data
            const tableData: any[] = [];
            
            bookings.forEach((booking) => {
                // Add main booking row
                const mainRow = [
                    booking.name,
                    booking.booked_by === 'self' ? 'Self' : `Emp: ${booking.booked_by}`,
                    booking.email || 'N/A',
                    booking.phone || 'N/A',
                    formatTimestamp(booking.timestamp),
                    `₹${booking.total_cost.toFixed(2)}`,
                    booking.instances.length.toString()
                ];
                tableData.push(mainRow);
                
                // Add ritual instances as sub-rows
                booking.instances.forEach((instance, idx) => {
                    const ritualRow = [
                        `  └ ${instance.ritualName}`,
                        `Qty: ${instance.quantity}`,
                        `For: ${instance.devoteeName}`,
                        `Naal: ${instance.naal}`,
                        '',
                        `DOB: ${instance.dob}`,
                        instance.subscription
                    ];
                    tableData.push(ritualRow);
                });
                
                // Add empty row for spacing
                tableData.push(['', '', '', '', '', '', '']);
            });
            
            // Add table with autoTable
            autoTable(doc, {
                startY: 70,
                head: [['Customer', 'Booked By', 'Email', 'Phone', 'Booked At', 'Cost', 'Rituals']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 92, 246], // Purple
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 255]
                },
                margin: { top: 70, left: 14, right: 14 },
                didDrawPage: (data) => {
                    // Add page numbers
                    const pageCount = doc.internal.pages.length - 1;
                    doc.setFontSize(10);
                    doc.setTextColor(128);
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        doc.internal.pageSize.getWidth() / 2,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'center' }
                    );
                }
            });
            
            // Save the PDF
            doc.save(`temple_bookings_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Bookings PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Manage Bookings</h1>
                <button
                    onClick={() => downloadBookingsAsPDF(hasFiltersApplied ? filteredBookings : combined)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center space-x-2"
                >
                    <Download className="h-5 w-5" />
                    <span>{hasFiltersApplied ? 'Download Filtered as PDF' : 'Download All Bookings as PDF'}</span>
                </button>
            </div>
            
            {/* Filters */}
            <div className="bg-slate-800 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-purple-400 mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Search Ritual</label>
                        <input
                            type="text"
                            value={searchRitual}
                            onChange={(e) => setSearchRitual(e.target.value)}
                            placeholder="Search by ritual name"
                            className="w-full p-2 bg-slate-700 text-white rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Quick Filters</label>
                        <div className="flex gap-2">
                            <button onClick={() => setFilterType('today')} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">Today</button>
                            <button onClick={() => setFilterType('last3days')} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">Last 3 Days</button>
                            <button onClick={() => setFilterType('lastweek')} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">Last Week</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Specific Day</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setFilterType('specific');
                            }}
                            className="w-full p-2 bg-slate-700 text-white rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                                className="flex-1 p-2 bg-slate-700 text-white rounded"
                            />
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                                className="flex-1 p-2 bg-slate-700 text-white rounded"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Specific Month</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setFilterType('month');
                            }}
                            className="w-full p-2 bg-slate-700 text-white rounded"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFilterType('');
                                setSelectedDate('');
                                setDateRange({start: '', end: ''});
                                setSelectedMonth('');
                                setSearchRitual('');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

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
                    <CardTitle className="text-purple-400">{hasFiltersApplied ? 'Filtered Bookings' : 'All Bookings'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-purple-500/30 hover:bg-purple-900/20">
                                <TableHead className="w-[250px] text-purple-300">Customer</TableHead>
                                <TableHead className="text-purple-300">Contact</TableHead>
                                <TableHead className="text-purple-300">Booked At</TableHead>
                                <TableHead className="text-right text-purple-300">Total Cost</TableHead>
                                <TableHead className="text-center text-purple-300">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.map((booking) => (
                                <TableRow key={booking._id} className="border-purple-500/30 hover:bg-purple-900/20">
                                    <TableCell>
                                        <div className="font-medium text-white flex items-center gap-2">
                                            {booking.name}
                                            <Badge variant={booking.source === 'employee' ? 'default' : 'outline'} className={booking.source === 'employee' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'border-purple-500/30 text-purple-300'}>
                                                {booking.source === 'employee' ? `Employee: ${booking.booked_by}` : 'Self'}
                                            </Badge>
                                        </div>
                                        {booking.address && <div className="text-sm text-purple-300">{booking.address}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-white">{booking.email || <span className="text-purple-400/70">N/A</span>}</div>
                                        <div className="text-purple-300">{booking.phone || <span className="text-purple-400/70">N/A</span>}</div>
                                    </TableCell>
                                    <TableCell className="text-purple-300 font-mono">
                                        {formatTimestamp(booking.timestamp)}
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
