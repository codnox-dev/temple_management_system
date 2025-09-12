import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, Flame, Flower2, Heart, Star, ChevronDown, ChevronUp, LucideProps } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';


// --- Type Definitions ---
// Describes the shape of the ritual data coming from your API
interface ApiRitual {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
}
// Extends the API type to include a frontend-friendly 'id' field
interface Ritual extends ApiRitual {
  id: string; 
}

// --- Icon Mapping Utility ---
// This object maps the icon name (a string from the database) to the actual icon component
const iconMap: { [key: string]: React.FC<LucideProps> } = {
  Flame,
  Flower2,
  Heart,
  Star,
};
// This component dynamically renders the correct icon based on the name
const RitualIcon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = iconMap[name] || Star; // Default to Star if icon name is not found
    return <IconComponent {...props} />;
};

// --- API Fetching ---
// This function fetches the list of rituals from your backend API
const fetchRituals = async (): Promise<Ritual[]> => {
    const { data } = await axios.get<ApiRitual[]>('http://localhost:8000/api/rituals/');
    // We map `_id` from MongoDB to `id` for easier use in the React component's key prop
    return data.map(r => ({ ...r, id: r._id })); 
};

// Constant array for astrological signs (Naal)
const NAALS = ['അശ്വതി (Ashwathi)','ഭരണി (Bharani)','കാർത്തിക (Karthika)','രോഹിണി (Rohini)','മകയിരം (Makayiram)','തിരുവാതിര (Thiruvathira)','പുണർതം (Punartham)','പൂയം (Pooyam)','ആയില്യം (Aayilyam)','മകം (Makam)','പൂരം (Pooram)','ഉത്രം (Uthram)','അത്തം (Atham)','ചിത്തിര (Chithira)','ചോതി (Chothi)','വിശാഖം (Vishakham)','അനിഴം (Anizham)','തൃക്കേട്ട (Thrikketta)','മൂലം (Moolam)','പൂരാടം (Pooradam)','ഉത്രാടം (Uthradam)','തിരുവോണം (Thiruvonam)','അവിട്ടം (Avittam)','ചതയം (Chathayam)','പൂരുരുട്ടാതി (Pooruruttathi)','ഉത്തൃട്ടാതി (Uthruttathi)','രേവതി (Revathi)'];
type Subscription = 'one-time' | 'daily' | 'weekly' | 'monthly';

// Type for a single selected ritual instance
type RitualInstance = {
	id: string;
	ritualId: string; // Changed to string to match MongoDB _id
	devoteeName: string;
	naal: string;
	dob: string;
	subscription: Subscription;
	quantity: number;
};

// Maps subscription frequencies to their cost multipliers
const frequencyMultipliers: Record<Subscription, number> = { 'one-time': 1, daily: 30, weekly: 4, monthly: 1 };

const RitualBooking = () => {
    // Fetch rituals from the API using React Query
    const { data: rituals = [], isLoading } = useQuery({ 
        queryKey: ['rituals'], 
        queryFn: fetchRituals,
    });
	
	// State for the main contact's personal information
	const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
	// State for the ritual search query
	const [search, setSearch] = useState('');
	// State to hold all individual ritual booking entries
	const [instances, setInstances] = useState<RitualInstance[]>([]);
	// State for controlling the visibility of the full ritual list
	const [showAllRituals, setShowAllRituals] = useState(false);
	// State for dynamically setting the number of grid columns
	const [gridCols, setGridCols] = useState(1);

	// Effect to adjust the grid layout based on window size
	useEffect(() => {
		const updateCols = () => setGridCols(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
		updateCols();
		window.addEventListener('resize', updateCols);
		return () => window.removeEventListener('resize', updateCols);
	}, []);

	// Memoized function to filter rituals based on the search query
	const filteredRituals = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rituals;
		return rituals.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
	}, [search, rituals]);

	// Memoized function to determine which rituals are visible
	const visibleRituals = useMemo(() => {
		const max = showAllRituals ? filteredRituals.length : gridCols * 2;
		return filteredRituals.slice(0, max);
	}, [filteredRituals, showAllRituals, gridCols]);

	// Adds a new ritual instance to the state
	const addInstance = (ritualId: string) => {
		setInstances(prev => [...prev, { id: `${ritualId}-${Date.now()}`, ritualId, devoteeName: '', naal: '', dob: '', subscription: 'one-time', quantity: 1 }]);
	};

	// Updates a specific property of a ritual instance
	const updateInstance = <K extends keyof RitualInstance>(id: RitualInstance['id'], key: K, value: RitualInstance[K]) => {
		setInstances(prev => prev.map(i => (i.id === id ? { ...i, [key]: value } : i)));
	};

	// Removes a ritual instance from the state by its ID
	const removeInstance = (id: RitualInstance['id']) => {
		setInstances(prev => prev.filter(i => i.id !== id));
	};

	// Retrieves a ritual's details by its ID
	const ritualById = (id: string) => rituals.find(r => r.id === id)!;
    
    // Calculates the total cost for a single ritual instance
	const calcInstanceTotal = (i: RitualInstance) => {
        const ritual = ritualById(i.ritualId);
        if (!ritual) return 0;
        return ritual.price * i.quantity * frequencyMultipliers[i.subscription];
    }

	// Calculates the grand total cost for all selected instances
	const calculateTotal = () => instances.reduce((sum, i) => sum + calcInstanceTotal(i), 0);

	// Handles input changes for the main contact form
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	// Validation check to ensure all required fields are filled
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
												<div><Label htmlFor={`qty-${inst.id}`}>Qty</Label><Input id={`qty-${inst.id}`} type="number" min={1} value={inst.quantity} onChange={e => updateInstance(inst.id, 'quantity', Math.max(1, Number(e.target.value || 1)))} className="mt-1"/></div>
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
					<Button className="w-full btn-divine text-lg py-3" disabled={!canCheckout}>Proceed to Payment - ₹{calculateTotal()}</Button>
					<p className="text-sm text-muted-foreground mt-4 text-center">You will be redirected to our secure payment gateway to complete your booking.</p>
				</Card>
			</div>
		</div>
	);
};

export default RitualBooking;

