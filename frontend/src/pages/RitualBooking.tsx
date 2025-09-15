import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Flame, Flower2, Heart, Star, ChevronDown, ChevronUp, LucideProps } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';


// --- Type Definitions ---
interface ApiRitual {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
}
interface Ritual extends ApiRitual {
  id: string; 
}

const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Flame,
  Flower2,
  Heart,
  Star,
};
const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star;
    return <IconComponent {...props} />;
};

const fetchRituals = async (): Promise<Ritual[]> => {
    const { data } = await axios.get<ApiRitual[]>('http://localhost:8080/api/rituals');
    return data.map(r => ({ ...r, id: r._id })); 
};

const NAALS = ['അശ്വതി (Ashwathi)','ഭരണി (Bharani)','കാർത്തിക (Karthika)','രോഹിണി (Rohini)','മകയിരം (Makayiram)','തിരുവാതിര (Thiruvathira)','പുണർതം (Punartham)','പൂയം (Pooyam)','ആയില്യം (Aayilyam)','മകം (Makam)','പൂരം (Pooram)','ഉത്രം (Uthram)','അത്തം (Atham)','ചിത്തിര (Chithira)','ചോതി (Chothi)','വിശാഖം (Vishakham)','അനിഴം (Anizham)','തൃക്കേട്ട (Thrikketta)','മൂലം (Moolam)','പൂരാടം (Pooradam)','ഉത്രാടം (Uthradam)','തിരുവോണം (Thiruvonam)','അവിട്ടം (Avittam)','ചതയം (Chathayam)','പൂരുരുട്ടാതി (Pooruruttathi)','ഉത്തൃട്ടാതി (Uthruttathi)','രേവതി (Revathi)'];
type Subscription = 'one-time' | 'daily' | 'weekly' | 'monthly';

type RitualInstance = {
	id: string;
	ritualId: string;
	devoteeName: string;
	naal: string;
	dob: string;
	subscription: Subscription;
	quantity: number;
};

const frequencyMultipliers: Record<Subscription, number> = { 'one-time': 1, daily: 30, weekly: 4, monthly: 1 };

const RitualBooking = () => {
    const navigate = useNavigate();
    const { data: rituals = [], isLoading } = useQuery({ 
        queryKey: ['rituals'], 
        queryFn: fetchRituals,
    });
	
	const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
	const [search, setSearch] = useState('');
	const [instances, setInstances] = useState<RitualInstance[]>([]);
	const [showAllRituals, setShowAllRituals] = useState(false);
	const [gridCols, setGridCols] = useState(1);

	useEffect(() => {
		const updateCols = () => setGridCols(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
		updateCols();
		window.addEventListener('resize', updateCols);
		return () => window.removeEventListener('resize', updateCols);
	}, []);

	const filteredRituals = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rituals;
		return rituals.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
	}, [search, rituals]);

	const visibleRituals = useMemo(() => {
		const max = showAllRituals ? filteredRituals.length : gridCols * 2;
		return filteredRituals.slice(0, max);
	}, [filteredRituals, showAllRituals, gridCols]);

	const addInstance = (ritualId: string) => {
		setInstances(prev => [...prev, { id: `${ritualId}-${Date.now()}`, ritualId, devoteeName: '', naal: '', dob: '', subscription: 'one-time', quantity: 1 }]);
	};

	const updateInstance = <K extends keyof RitualInstance>(id: RitualInstance['id'], key: K, value: RitualInstance[K]) => {
		setInstances(prev => prev.map(i => (i.id === id ? { ...i, [key]: value } : i)));
	};

	const removeInstance = (id: RitualInstance['id']) => {
		setInstances(prev => prev.filter(i => i.id !== id));
	};

	const ritualById = (id: string) => rituals.find(r => r.id === id)!;
    
	const calcInstanceTotal = (i: RitualInstance) => {
        const ritual = ritualById(i.ritualId);
        if (!ritual) return 0;
        return ritual.price * i.quantity * frequencyMultipliers[i.subscription];
    }

	const calculateTotal = () => instances.reduce((sum, i) => sum + calcInstanceTotal(i), 0);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

    const bookingMutation = useMutation({
        mutationFn: (newBooking: any) => {
            return axios.post('http://localhost:8080/api/bookings', newBooking);
        },
        onSuccess: () => {
            toast.success("Booking successful! Thank you for your devotion.");
            setFormData({ name: '', email: '', phone: '', address: '' });
            setInstances([]);
            // Optional: Redirect to a success page after a delay
            setTimeout(() => navigate('/'), 2000);
        },
        onError: () => {
            toast.error("Booking failed. Please check your details and try again.");
        }
    });

    const handleCheckout = () => {
        const total_cost = calculateTotal();
        const bookingPayload = {
            ...formData,
            total_cost,
            instances: instances.map(({id, ...rest}) => ({ // remove client-side id before sending
                ...rest,
                ritualName: ritualById(rest.ritualId)?.name || 'Unknown Ritual'
            }))
        };
        bookingMutation.mutate(bookingPayload);
    };

	const allInstancesValid = instances.every(i => i.devoteeName.trim() && i.naal.trim() && i.dob.trim());
	const canCheckout = instances.length > 0 && allInstancesValid && formData.name && formData.email && formData.phone && formData.address;

	return (
		<div className="min-h-screen bg-gradient-sacred py-20">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4"><ArrowLeft className="h-5 w-5 mr-2" />Back to Home</Link>
					<h1 className="text-4xl font-playfair font-bold text-foreground mb-2">Book Your <span className="text-primary">Sacred Ritual</span></h1>
					<p className="text-muted-foreground">Fill in your details and select the rituals you wish to book</p>
				</div>

				<Card className="card-divine p-6 mb-8">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">Personal Information</h2>
					<div className="space-y-4">
						<div><Label htmlFor="name">Full Name *</Label><Input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} className="mt-1" required /></div>
						<div><Label htmlFor="email">Email Address *</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="mt-1" required /></div>
						<div><Label htmlFor="phone">Phone Number *</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="mt-1" required /></div>
						<div><Label htmlFor="address">Address *</Label><Input id="address" name="address" type="text" value={formData.address} onChange={handleInputChange} className="mt-1" required /></div>
					</div>
				</Card>

				<Card className="p-6 mb-8 border-primary/30 ring-1 ring-primary/10 card-matrix">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">Select Rituals</h2>
					<div className="mb-6"><Label htmlFor="search">Search Ritual</Label><Input id="search" placeholder="Search by name or description..." value={search} onChange={e => setSearch(e.target.value)} className="mt-1" /></div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-lg border border-primary/20 p-4 h-40 bg-slate-200 animate-pulse"></div>)
                        : visibleRituals.map((ritual) => (
								<div key={ritual.id} role="button" tabIndex={0} onClick={() => addInstance(ritual.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') addInstance(ritual.id);}} className="rounded-lg border border-primary/20 p-4 hover:bg-card/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40">
									<div className="flex items-center gap-2 mb-2">
										<RitualIcon name={ritual.icon} className="h-5 w-5 text-primary" />
										<div className="text-lg font-medium text-foreground">{ritual.name}</div>
									</div>
									<p className="text-sm text-muted-foreground mb-3">{ritual.description}</p>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Duration: {ritual.duration}</span>
										<span className="font-semibold text-primary">₹{ritual.price}</span>
									</div>
								</div>
						))}
					</div>
					{filteredRituals.length > visibleRituals.length ? (<div className="flex justify-center mt-4"><Button variant="ghost" size="icon" onClick={() => setShowAllRituals(true)} aria-label="Show more rituals"><ChevronDown className="h-5 w-5" /></Button></div>)
                     : filteredRituals.length > gridCols * 2 && showAllRituals ? (<div className="flex justify-center mt-4"><Button variant="ghost" size="icon" onClick={() => setShowAllRituals(false)} aria-label="Show fewer rituals"><ChevronUp className="h-5 w-5" /></Button></div>) : null}
				</Card>

				<Card className="card-divine p-6 mb-8">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">Selected Entries</h2>
					{instances.length === 0 ? <p className="text-muted-foreground">Click a ritual above to add an entry.</p> : (
						<div className="space-y-4">
							{instances.map((inst, idx) => {
								const r = ritualById(inst.ritualId);
								if (!r) return null;
								return (
									<div key={inst.id} className="rounded-md border border-primary/10 bg-background/50 p-4">
										<div className="text-sm font-medium text-foreground mb-3">{r.name} #{idx + 1}</div>
										<div className="space-y-3">
											<div><Label htmlFor={`devotee-${inst.id}`}>Devotee Name *</Label><Input id={`devotee-${inst.id}`} value={inst.devoteeName} onChange={e => updateInstance(inst.id, 'devoteeName', e.target.value)} className="mt-1" placeholder="Enter devotee name" required/></div>
											<div><Label htmlFor={`naal-${inst.id}`}>Naal *</Label><select id={`naal-${inst.id}`} value={inst.naal} onChange={e => updateInstance(inst.id, 'naal', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required><option value="" disabled>Select Naal</option>{NAALS.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
											<div><Label htmlFor={`dob-${inst.id}`}>Date of Birth *</Label><Input id={`dob-${inst.id}`} type="date" value={inst.dob} onChange={e => updateInstance(inst.id, 'dob', e.target.value)} className="mt-1" required/></div>
											<div className="grid grid-cols-3 gap-3">
												<div className="col-span-2"><Label htmlFor={`sub-${inst.id}`}>Subscription</Label><select id={`sub-${inst.id}`} value={inst.subscription} onChange={e => updateInstance(inst.id, 'subscription', e.target.value as Subscription)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><option value="one-time">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
												<div>
                                                    <Label htmlFor={`qty-${inst.id}`}>Qty</Label>
                                                    <Input
                                                        id={`qty-${inst.id}`}
                                                        type="number"
                                                        min={1}
                                                        value={inst.quantity === 0 ? '' : inst.quantity}
                                                        onChange={e => {
                                                            const qty = parseInt(e.target.value, 10);
                                                            updateInstance(inst.id, 'quantity', isNaN(qty) ? 0 : qty);
                                                        }}
                                                        onBlur={() => {
                                                            if (inst.quantity < 1) {
                                                                updateInstance(inst.id, 'quantity', 1);
                                                            }
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </div>
											</div>
											<div className="flex items-center justify-between pt-2"><div className="text-sm text-muted-foreground">Total: <span className="font-semibold text-primary">₹{calcInstanceTotal(inst)}</span></div><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeInstance(inst.id)}>Remove</Button></div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</Card>

				<Card className="card-divine p-6">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">Checkout Summary</h2>
					{instances.length === 0 ? <p className="text-muted-foreground mb-6">Please add at least one ritual to proceed.</p> : (
						<div className="space-y-4 mb-6">
							<h3 className="text-lg font-medium text-foreground mb-3">Selected Rituals:</h3>
							{instances.map((inst) => {
								const r = ritualById(inst.ritualId);
                                if (!r) return null;
								return (
									<div key={inst.id} className="flex justify-between items-center py-2 border-b border-primary/10">
										<div className="text-foreground text-sm">{r.name} • {inst.devoteeName || 'Name'} • {inst.naal || 'Naal'} • {inst.dob || 'DOB'} • {inst.subscription} • Qty {inst.quantity}</div>
										<div className="font-semibold text-primary">₹{calcInstanceTotal(inst)}</div>
									</div>
								);
							})}
							<div className="flex justify-between items-center py-3 text-xl font-playfair font-bold border-t-2 border-primary/20"><span className="text-foreground">Total Amount:</span><span className="text-primary">₹{calculateTotal()}</span></div>
						</div>
					)}
					<Button 
                        onClick={handleCheckout}
                        className="w-full btn-divine text-lg py-3" 
                        disabled={!canCheckout || bookingMutation.isPending}
                    >
                        {bookingMutation.isPending ? 'Processing...' : `Proceed to Payment - ₹${calculateTotal()}`}
                    </Button>
					<p className="text-sm text-muted-foreground mt-4 text-center">You will be redirected to our secure payment gateway to complete your booking.</p>
				</Card>
			</div>
		</div>
	);
};

export default RitualBooking;

