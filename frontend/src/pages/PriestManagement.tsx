import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, UserCheck, UserX, IndianRupee, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getPriests,
  createPriest,
  updatePriest,
  deletePriest,
  formatCurrency,
  type Priest,
  type CreatePriestData,
  type UpdatePriestData
} from '@/api/priestAttendance';

const PriestManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPriest, setSelectedPriest] = useState<Priest | null>(null);
  const [formData, setFormData] = useState<CreatePriestData>({
    name: '',
    phone: '',
    email: '',
    daily_salary: 0,
    address: '',
    specialization: '',
    notes: ''
  });

  // Fetch priests
  const { data: priestsData, isLoading } = useQuery({
    queryKey: ['priests', activeFilter, searchQuery],
    queryFn: () => getPriests({
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      search: searchQuery || undefined,
      page_size: 100
    }),
  });

  // Create priest mutation
  const createMutation = useMutation({
    mutationFn: createPriest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priests'] });
      toast.success('Priest added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add priest');
    },
  });

  // Update priest mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriestData }) => updatePriest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priests'] });
      toast.success('Priest updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedPriest(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update priest');
    },
  });

  // Delete priest mutation
  const deleteMutation = useMutation({
    mutationFn: deletePriest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priests'] });
      toast.success('Priest deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to deactivate priest');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      daily_salary: 0,
      address: '',
      specialization: '',
      notes: ''
    });
  };

  const handleAdd = () => {
    if (!formData.name || !formData.daily_salary) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedPriest) return;
    
    const updateData: UpdatePriestData = {
      ...formData,
      is_active: selectedPriest.is_active
    };
    
    updateMutation.mutate({ id: selectedPriest.id, data: updateData });
  };

  const openEditDialog = (priest: Priest) => {
    setSelectedPriest(priest);
    setFormData({
      name: priest.name,
      phone: priest.phone || '',
      email: priest.email || '',
      daily_salary: priest.daily_salary,
      address: priest.address || '',
      specialization: priest.specialization || '',
      notes: priest.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (priest: Priest) => {
    updateMutation.mutate({
      id: priest.id,
      data: { is_active: !priest.is_active }
    });
  };

  const priests = priestsData?.priests || [];
  const totalPriests = priestsData?.total || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Priest Management</h1>
          <p className="text-gray-600 mt-1">Manage priest profiles and daily salary rates</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Priest
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, specialization, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Priests</CardDescription>
            <CardTitle className="text-3xl">{totalPriests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Priests</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {priests.filter(p => p.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inactive Priests</CardDescription>
            <CardTitle className="text-3xl text-gray-400">
              {priests.filter(p => !p.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Priest List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading priests...</p>
        </div>
      ) : priests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No priests found</p>
            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="mt-4">
              Add First Priest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priests.map((priest) => (
            <Card key={priest.id} className={`${!priest.is_active && 'opacity-60 border-gray-300'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {priest.name}
                      {priest.is_active ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    {priest.specialization && (
                      <CardDescription className="mt-1">{priest.specialization}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Daily Salary */}
                <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                  <IndianRupee className="w-5 h-5" />
                  <span>{formatCurrency(priest.daily_salary)}/day</span>
                </div>

                {/* Contact Info */}
                {priest.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{priest.phone}</span>
                  </div>
                )}
                {priest.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{priest.email}</span>
                  </div>
                )}
                {priest.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{priest.address}</span>
                  </div>
                )}

                {/* Current Month Stats */}
                {priest.current_month_days !== undefined && (
                  <div className="pt-3 border-t mt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">This Month</p>
                        <p className="font-semibold">{priest.current_month_days} days</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Earned</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(priest.current_month_salary || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(priest)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={priest.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(priest)}
                  className="flex-1"
                >
                  {priest.is_active ? (
                    <>
                      <UserX className="w-4 h-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Priest Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Priest</DialogTitle>
            <DialogDescription>Enter the priest's details and daily salary rate</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter priest's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_salary">
                  Daily Salary (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="daily_salary"
                  type="number"
                  value={formData.daily_salary || ''}
                  onChange={(e) => setFormData({ ...formData, daily_salary: parseFloat(e.target.value) || 0 })}
                  placeholder="500"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="priest@temple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Vedic Rituals, Marriage Ceremonies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Priest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Priest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Priest</DialogTitle>
            <DialogDescription>Update priest's details and salary rate</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter priest's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-daily_salary">
                  Daily Salary (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-daily_salary"
                  type="number"
                  value={formData.daily_salary || ''}
                  onChange={(e) => setFormData({ ...formData, daily_salary: parseFloat(e.target.value) || 0 })}
                  placeholder="500"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="priest@temple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization</Label>
              <Input
                id="edit-specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Vedic Rituals, Marriage Ceremonies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedPriest(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Priest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriestManagement;
