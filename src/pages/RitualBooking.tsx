import React, { useState } from 'react';
import { ArrowLeft, Flame, Flower2, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

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

const RitualBooking = () => {
  const [selectedRituals, setSelectedRituals] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleRitualSelect = (ritualId: number, checked: boolean) => {
    if (checked) {
      setSelectedRituals([...selectedRituals, ritualId]);
    } else {
      setSelectedRituals(selectedRituals.filter(id => id !== ritualId));
    }
  };

  const calculateTotal = () => {
    return rituals
      .filter(ritual => selectedRituals.includes(ritual.id))
      .reduce((total, ritual) => total + ritual.price, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-sacred py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information Form */}
          <Card className="card-divine p-6">
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

          {/* Ritual Selection */}
          <Card className="card-divine p-6">
            <h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">
              Select Rituals
            </h2>
            <div className="space-y-4">
              {rituals.map((ritual) => {
                const IconComponent = ritual.icon;
                return (
                  <div key={ritual.id} className="flex items-start space-x-3 p-3 border border-primary/20 rounded-lg hover:bg-card/50 transition-colors">
                    <Checkbox
                      id={`ritual-${ritual.id}`}
                      checked={selectedRituals.includes(ritual.id)}
                      onCheckedChange={(checked) => handleRitualSelect(ritual.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <Label htmlFor={`ritual-${ritual.id}`} className="text-lg font-medium cursor-pointer">
                          {ritual.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {ritual.description}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration: {ritual.duration}</span>
                        <span className="font-semibold text-primary">₹{ritual.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Checkout Section */}
          <Card className="card-divine p-6 lg:col-span-2">
            <h2 className="text-2xl font-playfair font-semibold mb-6 text-foreground">
              Checkout Summary
            </h2>
            
            {selectedRituals.length === 0 ? (
              <p className="text-muted-foreground mb-6">Please select at least one ritual to proceed.</p>
            ) : (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3">Selected Rituals:</h3>
                {rituals
                  .filter(ritual => selectedRituals.includes(ritual.id))
                  .map(ritual => (
                    <div key={ritual.id} className="flex justify-between items-center py-2 border-b border-primary/10">
                      <span className="text-foreground">{ritual.name}</span>
                      <span className="font-semibold text-primary">₹{ritual.price}</span>
                    </div>
                  ))
                }
                <div className="flex justify-between items-center py-3 text-xl font-playfair font-bold border-t-2 border-primary/20">
                  <span className="text-foreground">Total Amount:</span>
                  <span className="text-primary">₹{calculateTotal()}</span>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full btn-divine text-lg py-3"
              disabled={selectedRituals.length === 0 || !formData.name || !formData.email || !formData.phone || !formData.address}
            >
              Proceed to Payment - ₹{calculateTotal()}
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4 text-center">
              You will be redirected to our secure payment gateway to complete your booking.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RitualBooking;