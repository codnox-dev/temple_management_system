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

// Frequency multipliers for subscription types
const frequencyMultipliers: Record<string, number> = { 'one-time': 1, 'daily': 30, 'weekly': 4, 'monthly': 1 };

// Helper function to calculate cost for a ritual instance
const calculateRitualCost = (instance: RitualInstance, rituals: any[]) => {
    if (!rituals || rituals.length === 0) return 0;
    const ritual = rituals.find(r => r._id === instance.ritualId);
    if (!ritual) return 0;
    return ritual.price * instance.quantity * frequencyMultipliers[instance.subscription];
};

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

    // Fetch rituals data for price calculations
    const { data: rituals } = useQuery<any[]>({
        queryKey: ['rituals'],
        queryFn: () => get('/rituals/admin')
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

    // Function to download bookings as PDF (sectioned, readable, and wrapped)
    const downloadBookingsAsPDF = (bookings: UnifiedBooking[]) => {
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginX = 14;
            let cursorY = 18;

            // Flatten bookings into individual ritual entities
            // When ritual filter is active, only include matching rituals
            const flattenedEntities = bookings.flatMap(booking => {
                let ritualInstances = booking.instances;
                
                // If ritual search filter is active, only include matching rituals
                if (searchRitual.trim()) {
                    ritualInstances = ritualInstances.filter(instance => 
                        instance.ritualName.toLowerCase().includes(searchRitual.toLowerCase())
                    );
                }
                
                // Create separate entity for each ritual instance with proper cost calculation
                return ritualInstances.map(instance => ({
                    ...booking,
                    instances: [instance], // Only include this specific ritual
                    total_cost: calculateRitualCost(instance, rituals || []) // Calculate actual cost for this ritual
                }));
            });

            const totalEntities = flattenedEntities.length;
            const totalRevenuePDF = flattenedEntities.reduce((sum, entity) => sum + entity.total_cost, 0);
            const totalRitualsPDF = flattenedEntities.reduce((sum, entity) => sum + entity.instances[0].quantity, 0);

            // Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(0, 0, 0);
            doc.text('Temple Management System', marginX, cursorY);

            cursorY += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
            const reportTitle = searchRitual.trim() 
                ? `Filtered Bookings Report - Ritual: ${searchRitual}` 
                : (hasFiltersApplied ? 'Filtered Bookings Report' : 'All Bookings Report');
            doc.text(reportTitle, marginX, cursorY);

            cursorY += 8;
            // Summary line
            doc.setFontSize(10);
            doc.setTextColor(60);
            const generatedOn = `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`;
            doc.text(`Generated on: ${generatedOn}`, marginX, cursorY);

            cursorY += 6;
            doc.setTextColor(0);
            doc.text(`Total Bookings: ${totalEntities}`, marginX, cursorY);
            doc.text(`Total Rituals: ${totalRitualsPDF}`, marginX + 60, cursorY);
            // Use 'Rs.' instead of the rupee symbol to avoid font issues
            doc.text(`Total Revenue: Rs. ${totalRevenuePDF.toFixed(2)}`, marginX + 120, cursorY);

            cursorY += 8;

            // Footer renderer for each page
            const drawFooter = (pageNumber: number) => {
                doc.setFontSize(9);
                doc.setTextColor(120);
                const pageCount = (doc as any).internal.getNumberOfPages();
                doc.text(
                    `Page ${pageNumber} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 8,
                    { align: 'center' }
                );
            };

            // Shared autotable options with header/footer per page
            const withPageDecorations = {
                didDrawPage: (data: any) => {
                    // Re-draw header title on each page for context
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('Bookings Report', marginX, 10);

                    drawFooter(data.pageNumber);
                }
            } as const;

            // Render each ritual entity as a separate section
            flattenedEntities.forEach((entity, idx) => {
                // Add space or page break if needed
                const remaining = pageHeight - cursorY - 40; // keep footer space
                if (remaining < 40) {
                    doc.addPage();
                    cursorY = 18;
                }

                const instance = entity.instances[0]; // Only one ritual per entity now

                // Booking header panel
                doc.setFillColor(255,255,255); 
                const panelWidth = pageWidth - marginX * 2;
                const panelHeight = 14; // base height for header lines
                doc.rect(marginX, cursorY, panelWidth, panelHeight, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(40);
                const bookedBy = entity.booked_by === 'self' ? 'Self' : `Employee: ${entity.booked_by}`;
                doc.text(`${idx + 1}. ${entity.name}  (${bookedBy})`, marginX + 2, cursorY + 5.5);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(70);
                const contactLine = `Email: ${entity.email || 'N/A'}   Phone: ${entity.phone || 'N/A'}   Booked: ${formatTimestamp(entity.timestamp)}`;
                doc.text(contactLine, marginX + 2, cursorY + 10.5);

                // Total cost badge on the right
                const costText = `Total: Rs. ${entity.total_cost.toFixed(2)}`; // avoid rupee symbol
                const costTextWidth = doc.getTextWidth(costText) + 6;
                const costX = marginX + panelWidth - costTextWidth - 2;
                doc.setFillColor(229, 231, 235);
                doc.roundedRect(costX, cursorY + 3, costTextWidth, 8, 2, 2, 'F');
                doc.setTextColor(0);
                doc.text(costText, costX + 3, cursorY + 9);

                cursorY += panelHeight + 2;

                // Ritual instance table (single ritual per entity)
                const body = [[
                    instance.ritualName || '-',
                    String(instance.quantity ?? '-'),
                    instance.devoteeName || '-',
                    instance.naal || '-',
                    instance.dob || '-',
                    instance.subscription || '-'
                ]];

                autoTable(doc, {
                    ...withPageDecorations,
                    startY: cursorY,
                    head: [[
                        'Ritual', 'Qty', 'Devotee', 'Naal', 'DOB', 'Subscription'
                    ]],
                    body,
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: 9,
                        cellPadding: 2,
                        overflow: 'linebreak'
                    },
                    headStyles: {
                        fillColor: [0, 0, 0],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [30, 30, 30]
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252]
                    },
                    margin: { left: marginX, right: marginX },
                    columnStyles: {
                        0: { cellWidth: 54 }, // Ritual
                        1: { cellWidth: 12, halign: 'center' }, // Qty
                        2: { cellWidth: 36 }, // Devotee
                        3: { cellWidth: 22 }, // Naal
                        4: { cellWidth: 22 }, // DOB
                        5: { cellWidth: 'auto' } // Subscription
                    },
                });

                cursorY = (doc as any).lastAutoTable.finalY + 6;
            });

            // If no bookings, still ensure footer is drawn once
            if (flattenedEntities.length === 0) {
                autoTable(doc, {
                    ...withPageDecorations,
                    startY: cursorY,
                    head: [['No bookings found for selected filters']],
                    body: [],
                    theme: 'plain',
                    styles: { font: 'helvetica', fontSize: 10 },
                    headStyles: { textColor: [120, 120, 120] },
                    margin: { left: marginX, right: marginX }
                });
            }

            const fileName = searchRitual.trim() 
                ? `temple_bookings_${searchRitual.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
                : `temple_bookings_${new Date().toISOString().split('T')[0]}.pdf`;
            
            doc.save(fileName);
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
