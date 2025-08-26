import React, { useMemo, useState } from 'react';
import { ArrowLeft, Flame, Flower2, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const rituals = [
	{
		id: 1,
		name: 'Aarti & Prayers',
		description: 'Traditional evening prayers with sacred flames and devotional songs',
		price: 101,
		duration: '30 mins',
		icon: Flame,
	},
	{
		id: 2,
		name: 'Puja & Offering',
		description: 'Personal worship ceremony with flowers, fruits, and sacred offerings',
		price: 251,
		duration: '45 mins',
		icon: Flower2,
	},
	{
		id: 3,
		name: 'Special Blessing',
		description: 'Personalized blessing ceremony for health, prosperity, and peace',
		price: 501,
		duration: '1 hour',
		icon: Heart,
	},
	{
		id: 4,
		name: 'Festival Ceremony',
		description: 'Grand celebration rituals for special occasions and festivals',
		price: 1001,
		duration: '2 hours',
		icon: Star,
	},
];

type Subscription = 'one-time' | 'daily' | 'weekly' | 'monthly';

type RitualInstance = {
	id: string;
	ritualId: number;
	devoteeName: string;
	naal: string;
	subscription: Subscription;
	quantity: number;
};

const frequencyMultipliers: Record<Subscription, number> = {
	'one-time': 1,
	daily: 30,
	weekly: 4,
	monthly: 1,
};

const RitualBooking = () => {
	const [selectedRituals, setSelectedRituals] = useState<number[]>([]);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
	});

	// NEW: searchable ritual matrix + instances of rituals
	const [search, setSearch] = useState('');
	const [instances, setInstances] = useState<RitualInstance[]>([]);

	const filteredRituals = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return rituals;
		return rituals.filter(
			(r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
		);
	}, [search]);

	const addInstance = (ritualId: number) => {
		setInstances((prev) => [
			...prev,
			{
				id: `${ritualId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				ritualId,
				devoteeName: '',
				naal: '',
				subscription: 'one-time',
				quantity: 1,
			},
		]);
	};

	const updateInstance = <K extends keyof RitualInstance>(
		id: RitualInstance['id'],
		key: K,
		value: RitualInstance[K]
	) => {
		setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
	};

	const removeInstance = (id: RitualInstance['id']) => {
		setInstances((prev) => prev.filter((i) => i.id !== id));
	};

	const ritualById = (id: number) => rituals.find((r) => r.id === id)!;

	const calcInstanceTotal = (i: RitualInstance) => {
		const r = ritualById(i.ritualId);
		return r.price * i.quantity * frequencyMultipliers[i.subscription];
	};

	const calculateTotal = () => {
		return instances.reduce((sum, i) => sum + calcInstanceTotal(i), 0);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const allInstancesValid = instances.every((i) => i.devoteeName.trim() && i.naal.trim());
	const canCheckout =
		instances.length > 0 &&
		allInstancesValid &&
		formData.name &&
		formData.email &&
		formData.phone &&
		formData.address;

	return (
		<div className="min-h-screen bg-gradient-sacred py-20">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<Link
						to="/"
						className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
					>
						<ArrowLeft className="h-5 w-5 mr-2" />
						Back to Home
					</Link>
					<h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
						Book Your <span className="text-primary">Sacred Ritual</span>
					</h1>
					<p className="text-muted-foreground">
						Fill in your details and select the rituals you wish to book
					</p>
				</div>

				{/* 1) Personal Information */}
				<Card className="card-divine p-6 mb-8">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">
						Personal Information
					</h2>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Full Name *</Label>
							<Input
								id="name"
								name="name"
								type="text"
								value={formData.name}
								onChange={handleInputChange}
								className="mt-1"
								required
							/>
						</div>
						<div>
							<Label htmlFor="email">Email Address *</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleInputChange}
								className="mt-1"
								required
							/>
						</div>
						<div>
							<Label htmlFor="phone">Phone Number *</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								value={formData.phone}
								onChange={handleInputChange}
								className="mt-1"
								required
							/>
						</div>
						<div>
							<Label htmlFor="address">Address *</Label>
							<Input
								id="address"
								name="address"
								type="text"
								value={formData.address}
								onChange={handleInputChange}
								className="mt-1"
								required
							/>
						</div>
					</div>
				</Card>

				{/* 2) Ritual Selection Matrix */}
				<Card className="p-6 mb-8 border-primary/30 ring-1 ring-primary/10 card-matrix">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">
						Select Rituals
					</h2>

					{/* Search */}
					<div className="mb-6">
						<Label htmlFor="search">Search Ritual</Label>
						<Input
							id="search"
							placeholder="Search by name or description..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="mt-1"
						/>
					</div>

					{/* Rituals grid (matrix) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{filteredRituals.map((ritual) => {
							const IconComponent = ritual.icon;
							const ritualInstances = instances.filter((i) => i.ritualId === ritual.id);

							return (
								<div
									key={ritual.id}
									className="rounded-lg border border-primary/20 p-4 hover:bg-card/50 transition-colors"
								>
									<div className="flex items-center gap-2 mb-2">
										<IconComponent className="h-5 w-5 text-primary" />
										<div className="text-lg font-medium text-foreground">{ritual.name}</div>
									</div>
									<p className="text-sm text-muted-foreground mb-3">
										{ritual.description}
									</p>
									<div className="flex items-center justify-between text-sm mb-3">
										<span className="text-muted-foreground">
											Duration: {ritual.duration}
										</span>
										<span className="font-semibold text-primary">₹{ritual.price}</span>
									</div>

									<Button
										variant="secondary"
										className="w-full mb-3"
										onClick={() => addInstance(ritual.id)}
									>
										Add Ritual
									</Button>

									{ritualInstances.length > 0 && (
										<div className="space-y-3">
											{ritualInstances.map((inst, idx) => (
												<div
													key={inst.id}
													className="rounded-md border border-primary/10 bg-background/50 p-3"
												>
													<div className="text-sm font-medium text-foreground mb-2">
														{ritual.name} #{idx + 1}
													</div>

													<div className="space-y-2">
														<div>
															<Label htmlFor={`devotee-${inst.id}`}>Devotee Name *</Label>
															<Input
																id={`devotee-${inst.id}`}
																value={inst.devoteeName}
																onChange={(e) =>
																	updateInstance(inst.id, 'devoteeName', e.target.value)
																}
																className="mt-1"
																placeholder="Enter devotee name"
																required
															/>
														</div>

														<div>
															<Label htmlFor={`naal-${inst.id}`}>Naal *</Label>
															<Input
																id={`naal-${inst.id}`}
																value={inst.naal}
																onChange={(e) => updateInstance(inst.id, 'naal', e.target.value)}
																className="mt-1"
																placeholder="Enter naal"
																required
															/>
														</div>

														<div className="grid grid-cols-3 gap-3">
															<div className="col-span-2">
																<Label htmlFor={`sub-${inst.id}`}>Subscription</Label>
																{/* native select for simplicity */}
																<select
																	id={`sub-${inst.id}`}
																	value={inst.subscription}
																	onChange={(e) =>
																		updateInstance(inst.id, 'subscription', e.target.value as Subscription)
																	}
																	className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																>
																	<option value="one-time">One-time</option>
																	<option value="daily">Daily</option>
																	<option value="weekly">Weekly</option>
																	<option value="monthly">Monthly</option>
																</select>
															</div>

															<div>
																<Label htmlFor={`qty-${inst.id}`}>Qty</Label>
																<Input
																	id={`qty-${inst.id}`}
																	type="number"
																	min={1}
																	value={inst.quantity}
																	onChange={(e) =>
																		updateInstance(inst.id, 'quantity', Math.max(1, Number(e.target.value || 1)))
																	}
																	className="mt-1"
																/>
															</div>
														</div>

														<div className="flex items-center justify-between pt-2">
															<div className="text-sm text-muted-foreground">
																Total:{' '}
																<span className="font-semibold text-primary">
																	₹{calcInstanceTotal(inst)}
																</span>
															</div>
															<Button
																variant="ghost"
																className="text-destructive hover:text-destructive"
																onClick={() => removeInstance(inst.id)}
															>
																Remove
															</Button>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</Card>

				{/* 3) Checkout Summary */}
				<Card className="card-divine p-6">
					<h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">
						Checkout Summary
					</h2>

					{instances.length === 0 ? (
						<p className="text-muted-foreground mb-6">
							Please add at least one ritual to proceed.
						</p>
					) : (
						<div className="space-y-4 mb-6">
							<h3 className="text-lg font-medium text-foreground mb-3">
								Selected Rituals:
							</h3>
							{instances.map((inst) => {
								const r = ritualById(inst.ritualId);
								return (
									<div
										key={inst.id}
										className="flex justify-between items-center py-2 border-b border-primary/10"
									>
										<div className="text-foreground text-sm">
											{r.name} • {inst.devoteeName || 'Name'} • {inst.naal || 'Naal'} •{' '}
											{inst.subscription} • Qty {inst.quantity}
										</div>
										<div className="font-semibold text-primary">
											₹{calcInstanceTotal(inst)}
										</div>
									</div>
								);
							})}
							<div className="flex justify-between items-center py-3 text-xl font-playfair font-bold border-t-2 border-primary/20">
								<span className="text-foreground">Total Amount:</span>
								<span className="text-primary">₹{calculateTotal()}</span>
							</div>
						</div>
					)}

					<Button className="w-full btn-divine text-lg py-3" disabled={!canCheckout}>
						Proceed to Payment - ₹{calculateTotal()}
					</Button>

					<p className="text-sm text-muted-foreground mt-4 text-center">
						You will be redirected to our secure payment gateway to complete your booking.
					</p>
				</Card>
			</div>
		</div>
	);
};

export default RitualBooking;