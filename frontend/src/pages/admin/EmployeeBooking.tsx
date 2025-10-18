import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { get } from '../../api/api';
import { toast } from 'sonner';
import { Flame, Flower2, Heart, Star, ChevronDown, ChevronUp, LucideProps, Plus, XCircle, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Type Definitions ---
interface ApiRitual {
  _id: string; name: string; description: string; price: number; duration: string; icon_name: string;
}
interface Ritual extends ApiRitual { id: string; }

type Subscription = 'one-time' | 'daily' | 'weekly' | 'monthly';

type RitualInstance = {
	id: string; ritualId: string; devoteeName: string; naal: string;
	dob: string; subscription: Subscription; quantity: number;
};

// --- Helper Components & Functions ---
const iconMap: { [key: string]: React.FC<LucideProps> } = { Flame, Flower2, Heart, Star };
const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star;
    return <IconComponent {...props} />;
};

const fetchRituals = async (): Promise<Ritual[]> => {
	const data = await get<ApiRitual[]>('/rituals/');
	return data.map(r => ({ ...r, id: r._id, icon: r.icon_name }));
};

const NAALS = ['അശ്വതി (Ashwathi)','ഭരണി (Bharani)','കാർത്തിക (Karthika)','രോഹിണി (Rohini)','മകയിരം (Makayiram)','തിരുവാതിര (Thiruvathira)','പുണർതം (Punartham)','പൂയം (Pooyam)','ആയില്യം (Aayilyam)','മകം (Makam)','പൂരം (Pooram)','ഉത്രം (Uthram)','അത്തം (Atham)','ചിത്തിര (Chithira)','ചോതി (Chothi)','വിശാഖം (Vishakham)','അനിഴം (Anizham)','തൃക്കേട്ട (Thrikketta)','മൂലം (Moolam)','പൂരാടം (Pooradam)','ഉത്രാടം (Uthradam)','തിരുവോണം (Thiruvonam)','അവിട്ടം (Avittam)','ചതയം (Chathayam)','പൂരുരുട്ടാതി (Pooruruttathi)','ഉത്തൃട്ടാതി (Uthruttathi)','രേവതി (Revathi)'];
const frequencyMultipliers: Record<Subscription, number> = { 'one-time': 1, daily: 30, weekly: 4, monthly: 1 };

// --- Main Component ---
const EmployeeRitualBooking = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = (useAuth() as any) || {};
    // Define view-only roles: Viewer (id 5?), Volunteer (id 6?), Support (id 7?)
    // Assumption based on prior context: smaller numbers = more privileges.
    // We'll treat role_id > 4 as view-only (5+ cannot interact)
    const roleId: number = (user?.role_id ?? 99);
    const isViewOnly = roleId > 4;

	const { data: rituals = [], isLoading } = useQuery({ queryKey: ['rituals'], queryFn: fetchRituals });
	
	const [formData, setFormData] = useState({ name: '' });
	const [search, setSearch] = useState('');
	const [instances, setInstances] = useState<RitualInstance[]>([]);
	const [showAllRituals, setShowAllRituals] = useState(false);
	
    const filteredRituals = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rituals;
		return rituals.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
	}, [search, rituals]);

    const visibleRituals = useMemo(() => showAllRituals ? filteredRituals : filteredRituals.slice(0, 6), [filteredRituals, showAllRituals]);

	const addInstance = (ritualId: string) => {
		const uniqueId = `${ritualId}-${Date.now()}`;
		setInstances(prev => [ ...prev, { id: uniqueId, ritualId, devoteeName: '', naal: '', dob: '', subscription: 'one-time', quantity: 1 } ]);
	};

	const updateInstance = <K extends keyof RitualInstance>(id: string, key: K, value: RitualInstance[K]) => {
		setInstances(prev => prev.map(i => (i.id === id ? { ...i, [key]: value } : i)));
	};

	const removeInstance = (id: string) => { setInstances(prev => prev.filter(i => i.id !== id)); };

	const ritualById = (id: string) => rituals.find(r => r.id === id);
    
	const calcInstanceTotal = (i: RitualInstance) => {
        const ritual = ritualById(i.ritualId);
        return ritual ? ritual.price * i.quantity * frequencyMultipliers[i.subscription] : 0;
    }

	const calculateTotal = () => instances.reduce((sum, i) => sum + calcInstanceTotal(i), 0);

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

    // Function to auto-download booking receipt as PDF
    const downloadBookingReceiptAsPDF = async (bookingData: any) => {
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginX = 14;
            let cursorY = 18;

            // Load Malayalam font
            let malayalamFontAvailable = false;
            try {
                const response = await fetch('/fonts/NotoSansMalayalam-Regular.ttf');
                const fontArrayBuffer = await response.arrayBuffer();
                const fontBase64 = btoa(
                    new Uint8Array(fontArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                doc.addFileToVFS('NotoSansMalayalam-Regular.ttf', fontBase64);
                doc.addFont('NotoSansMalayalam-Regular.ttf', 'NotoSansMalayalam', 'normal');
                malayalamFontAvailable = true;
            } catch (error) {
                console.warn('Could not load Malayalam font:', error);
            }

            // Helper function to detect Malayalam characters
            const containsMalayalam = (text: string): boolean => {
                return /[\u0D00-\u0D7F]/.test(text);
            };

            // Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(0, 0, 0);
            doc.text('Temple Management System', marginX, cursorY);

            cursorY += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
            doc.text('Booking Receipt', marginX, cursorY);

            cursorY += 8;
            // Summary line
            doc.setFontSize(10);
            doc.setTextColor(60);
            const generatedOn = `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`;
            doc.text(`Generated on: ${generatedOn}`, marginX, cursorY);

            cursorY += 6;
            doc.setTextColor(0);
            doc.text(`Total Rituals: ${bookingData.instances.length}`, marginX, cursorY);
            doc.text(`Total Revenue: Rs. ${bookingData.total_cost.toFixed(2)}`, marginX + 60, cursorY);

            cursorY += 8;

            // Footer renderer
            const drawFooter = (pageNumber: number) => {
                doc.setFontSize(9);
                doc.setTextColor(120);
                doc.text('Booking Receipt', pageWidth / 2, pageHeight - 8, { align: 'center' });
            };

            const withPageDecorations = {
                didDrawPage: (data: any) => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('Booking Receipt', marginX, 10);
                    drawFooter(data.pageNumber);
                }
            } as const;

            // Check if booking has enough space
            const remaining = pageHeight - cursorY - 40;
            if (remaining < 40) {
                doc.addPage();
                cursorY = 18;
            }

            // Booking header panel
            doc.setFillColor(255, 255, 255);
            const panelWidth = pageWidth - marginX * 2;
            const panelHeight = 14;
            doc.rect(marginX, cursorY, panelWidth, panelHeight, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(40);
            doc.text(`${bookingData.name}  (Employee: ${bookingData.booked_by})`, marginX + 2, cursorY + 5.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(70);
            const contactLine = `Booked: ${formatTimestamp(new Date().toISOString())}`;
            doc.text(contactLine, marginX + 2, cursorY + 10.5);

            // Total cost badge on the right
            const costText = `Total: Rs. ${bookingData.total_cost.toFixed(2)}`;
            const costTextWidth = doc.getTextWidth(costText) + 6;
            const costX = marginX + panelWidth - costTextWidth - 2;
            doc.setFillColor(229, 231, 235);
            doc.roundedRect(costX, cursorY + 3, costTextWidth, 8, 2, 2, 'F');
            doc.setTextColor(0);
            doc.text(costText, costX + 3, cursorY + 9);

            cursorY += panelHeight + 2;

            // Ritual instances table
            const body = bookingData.instances.map((instance: any) => [
                instance.ritualName || '-',
                String(instance.quantity ?? '-'),
                instance.devoteeName || '-',
                instance.naal || '-',
                instance.dob || '-',
                instance.subscription || '-'
            ]);

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
                    overflow: 'linebreak',
                    fontStyle: 'normal'
                },
                headStyles: {
                    fillColor: [0, 0, 0],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    font: 'helvetica'
                },
                bodyStyles: {
                    textColor: [30, 30, 30],
                    font: 'helvetica'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: marginX, right: marginX },
                columnStyles: {
                    0: { cellWidth: 54 }, // Ritual
                    1: { cellWidth: 12, halign: 'center' }, // Qty
                    2: { cellWidth: 36 }, // Devotee
                    3: { cellWidth: 28 }, // Naal
                    4: { cellWidth: 22 }, // DOB
                    5: { cellWidth: 'auto' } // Subscription
                },
                didParseCell: function(data: any) {
                    // Apply Malayalam font to any cell containing Malayalam text
                    if (malayalamFontAvailable && data.section === 'body') {
                        const cellText = data.cell.text ? data.cell.text.join('') : '';
                        if (containsMalayalam(cellText)) {
                            data.cell.styles.font = 'NotoSansMalayalam';
                            data.cell.styles.fontStyle = 'normal';
                        }
                    }
                }
            });

            const fileName = `booking_receipt_${bookingData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            console.log('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

	const bookingMutation = useMutation({
		mutationFn: (newBooking: any) => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            return api.post('/employee-bookings/', newBooking, config)
        },
        onSuccess: (response, variables) => {
            toast.success("Booking created successfully!");
            
            // Generate and download PDF receipt with booking data
            const bookingData = {
                name: variables.name,
                instances: variables.instances,
                total_cost: variables.total_cost,
                booked_by: variables.booked_by,
                timestamp: new Date().toISOString()
            };
            downloadBookingReceiptAsPDF(bookingData);

            queryClient.invalidateQueries({ queryKey: ['stockItems'] }); // Refetch stock
            setFormData({ name: '' });
            setInstances([]);
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.detail || "Booking failed. Please try again.";
            toast.error(errorMsg);
        }
    });

    const handleCheckout = () => {
        if (!user) {
            toast.error("Authentication error. Please log in again.");
            return;
        }
        const bookingPayload = {
            ...formData,
            booked_by: user.username,
            total_cost: calculateTotal(),
            instances: instances.map(({id, ...rest}) => ({
                ...rest,
                ritualName: ritualById(rest.ritualId)?.name || 'Unknown'
            }))
        };
        bookingMutation.mutate(bookingPayload);
    };

	const allInstancesValid = instances.every(i => i.devoteeName.trim() && i.naal.trim() && i.dob.trim());
	const canCheckout = instances.length > 0 && allInstancesValid && formData.name;

	return (
		<div className="space-y-6 text-white">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Employee Ritual Booking</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Ritual Selection & Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30">
                        <CardHeader><CardTitle className="text-purple-400">Select Rituals</CardTitle></CardHeader>
                        <CardContent>
                            <Input placeholder="Search rituals..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800/50 border-purple-500/30 text-white mb-4" disabled={isViewOnly} aria-disabled={isViewOnly} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                {isLoading ? <p>Loading rituals...</p> : visibleRituals.map((ritual) => (
                                    <div key={ritual.id} className="bg-slate-800/50 p-3 rounded-lg border border-purple-500/20 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2"><RitualIcon name={ritual.icon_name} className="h-5 w-5 text-purple-400" /><span className="font-semibold">{ritual.name}</span></div>
                                            <p className="text-xs text-purple-300/80">{ritual.description}</p>
                                            <p className="text-sm font-bold mt-1">₹{ritual.price}</p>
                                        </div>
                                        <Button size="icon" className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => addInstance(ritual.id)} disabled={isViewOnly} aria-disabled={isViewOnly}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                             {filteredRituals.length > 6 && (
                                <div className="text-center mt-4">
                                    <Button variant="link" onClick={() => setShowAllRituals(!showAllRituals)} className="text-purple-400" disabled={isViewOnly} aria-disabled={isViewOnly}>
                                        {showAllRituals ? 'Show Less' : 'Show More'} <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAllRituals ? 'rotate-180' : ''}`} />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                     <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30">
                        <CardHeader><CardTitle className="text-purple-400">Ritual Details</CardTitle></CardHeader>
                        <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
                            {instances.length === 0 ? <p className="text-purple-300/70">No rituals added yet.</p> : instances.map((inst, idx) => {
                                const r = ritualById(inst.ritualId);
                                if (!r) return null;
                                return (
                                    <div key={inst.id} className="bg-slate-800/50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold">{r.name} #{idx + 1}</h3>
                                            <Button variant="ghost" size="icon" onClick={() => removeInstance(inst.id)} className="text-red-400 hover:bg-red-900/30 h-7 w-7 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isViewOnly} aria-disabled={isViewOnly}><XCircle className="h-4 w-4"/></Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><Label>Devotee Name *</Label><Input value={inst.devoteeName} onChange={e => updateInstance(inst.id, 'devoteeName', e.target.value)} className="bg-slate-900/70 border-purple-500/20" disabled={isViewOnly} aria-disabled={isViewOnly} /></div>
                                            <div><Label>Date of Birth *</Label><Input type="date" value={inst.dob} onChange={e => updateInstance(inst.id, 'dob', e.target.value)} className="bg-slate-900/70 border-purple-500/20" disabled={isViewOnly} aria-disabled={isViewOnly} /></div>
                                            <div><Label>Naal *</Label><select value={inst.naal} onChange={e => updateInstance(inst.id, 'naal', e.target.value)} className="w-full h-10 rounded-md border border-purple-500/20 bg-slate-900/70 px-3 text-sm" disabled={isViewOnly} aria-disabled={isViewOnly}><option value="">Select Naal</option>{NAALS.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                            <div><Label>Subscription</Label><select value={inst.subscription} onChange={e => updateInstance(inst.id, 'subscription', e.target.value as Subscription)} className="w-full h-10 rounded-md border border-purple-500/20 bg-slate-900/70 px-3 text-sm" disabled={isViewOnly} aria-disabled={isViewOnly}><option value="one-time">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                                            <div><Label>Quantity</Label><Input type="number" min="1" value={inst.quantity} onChange={e => updateInstance(inst.id, 'quantity', parseInt(e.target.value) || 1)} className="bg-slate-900/70 border-purple-500/20" disabled={isViewOnly} aria-disabled={isViewOnly} /></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Right side: Customer Info & Checkout */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30">
                        <CardHeader><CardTitle className="text-purple-400">Devotee Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><Label>Full Name *</Label><Input name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-800/50 border-purple-500/30" disabled={isViewOnly} aria-disabled={isViewOnly} /></div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/80 backdrop-blur-sm border-purple-500/30">
                        <CardHeader><CardTitle className="text-purple-400">Checkout</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                {instances.map(inst => {
                                    const r = ritualById(inst.ritualId);
                                    return <div key={inst.id} className="flex justify-between text-sm"><span className="text-purple-300/80">{r?.name} x{inst.quantity}</span><span>₹{calcInstanceTotal(inst).toFixed(2)}</span></div>
                                })}
                            </div>
                            <div className="border-t border-purple-500/20 pt-2 flex justify-between font-bold text-lg">
                                <span className="text-purple-300">Total</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                            </div>
                            <Button onClick={handleCheckout} disabled={isViewOnly || !canCheckout || bookingMutation.isPending} aria-disabled={isViewOnly || !canCheckout || bookingMutation.isPending} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {bookingMutation.isPending ? 'Processing...' : 'Create Booking'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
		</div>
	);
};

export default EmployeeRitualBooking;

