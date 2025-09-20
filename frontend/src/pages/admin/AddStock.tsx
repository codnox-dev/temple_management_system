import React, { useState, useEffect } from 'react';
import { Plus, Package, Calendar, DollarSign, AlertTriangle, Save, Edit, Trash2, X } from 'lucide-react';
import api from '@/api/api';

interface StockItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  expiryDate?: string;
  minimumStock: number;
  description?: string;
  addedOn: string;
}

// Define the type for the form state, allowing for number fields to be strings during input
type StockItemForm = Omit<StockItem, '_id' | 'addedOn' | 'quantity' | 'price' | 'minimumStock'> & {
  quantity: string | number;
  price: string | number;
  minimumStock: string | number;
};

const AddStock = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const initialFormState: StockItemForm = {
    name: '', category: '', quantity: '', unit: '', price: '',
    supplier: '', expiryDate: '', minimumStock: '', description: ''
  };
  const [formState, setFormState] = useState<StockItemForm>(initialFormState);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockItems = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<StockItem[]>('/stock/');
      setStockItems(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch stock items.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, []);

  const categories = [
    'Puja Items', 'Abhishek Items', 'Flowers & Garlands', 'Food Items',
    'Cleaning Supplies', 'Decorative Items', 'Ceremonial Items', 'Maintenance Supplies'
  ];
  const units = ['pieces', 'kg', 'liters', 'packets', 'boxes', 'bundles', 'meters', 'grams'];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.name || !formState.category || !formState.quantity || !formState.price) {
      setError("Please fill all required fields.");
      return;
    }

    try {
        const itemToSend = {
            ...formState,
            quantity: Number(formState.quantity),
            price: Number(formState.price),
            minimumStock: Number(formState.minimumStock) || 10,
            expiryDate: formState.expiryDate || undefined,
        };

        if (editingItem) {
            // Update logic
            const response = await api.put<StockItem>(`/stock/${editingItem._id}`, itemToSend);
            setStockItems(stockItems.map(item => item._id === editingItem._id ? response.data : item));
            setEditingItem(null);
        } else {
            // Add new logic
            const response = await api.post<StockItem>('/stock/', { ...itemToSend, addedOn: new Date().toISOString().split('T')[0] });
            setStockItems([response.data, ...stockItems]);
        }
        setFormState(initialFormState);
        setShowAddForm(false);
        setError(null);
    } catch (err) {
        setError(`Failed to ${editingItem ? 'update' : 'add'} stock item.`);
        console.error(err);
    }
  };
  
  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormState({
        ...item,
        quantity: String(item.quantity),
        price: String(item.price),
        minimumStock: String(item.minimumStock),
        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    });
    setShowAddForm(true);
  };
  
  const handleDelete = async (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
        try {
            await api.delete(`/stock/${itemId}`);
            setStockItems(stockItems.filter(item => item._id !== itemId));
            setError(null);
        } catch (err) {
            setError("Failed to delete stock item.");
            console.error(err);
        }
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormState(initialFormState);
  };

  const isLowStock = (item: StockItem) => item.quantity <= item.minimumStock;
  const isExpiringSoon = (item: StockItem) => {
    if (!item.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Stock Management</h1>
          <p className="text-purple-300 mt-2">Add and manage temple inventory items</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setFormState(initialFormState); setShowAddForm(true); }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Stock Overview Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 p-6 rounded-xl shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-purple-300">Total Items</p>
                    <p className="text-3xl font-bold">{stockItems.length}</p>
                </div>
                <Package className="h-12 w-12 text-purple-400" />
            </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-red-500/30 p-6 rounded-xl shadow-lg shadow-red-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-red-300">Low Stock Items</p>
                    <p className="text-3xl font-bold">{stockItems.filter(isLowStock).length}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 p-6 rounded-xl shadow-lg shadow-amber-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-amber-300">Expiring Soon</p>
                    <p className="text-3xl font-bold">{stockItems.filter(isExpiringSoon).length}</p>
                </div>
                <Calendar className="h-12 w-12 text-amber-400" />
            </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-green-500/30 p-6 rounded-xl shadow-lg shadow-green-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-green-300">Total Value</p>
                    <p className="text-3xl font-bold">
                        ₹{stockItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
                    </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-400" />
            </div>
        </div>
      </div>

      {/* Add/Edit Item Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-purple-400">{editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}</h2>
                    <button onClick={closeForm} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { label: 'Item Name *', name: 'name', type: 'text', placeholder: 'Enter item name' },
                        { label: 'Category *', name: 'category', type: 'select', options: categories },
                        { label: 'Quantity *', name: 'quantity', type: 'number', placeholder: 'Enter quantity' },
                        { label: 'Unit *', name: 'unit', type: 'select', options: units },
                        { label: 'Price per Unit (₹) *', name: 'price', type: 'number', step: '0.01', placeholder: 'Enter price' },
                        { label: 'Supplier', name: 'supplier', type: 'text', placeholder: 'Supplier name' },
                        { label: 'Expiry Date', name: 'expiryDate', type: 'date' },
                        { label: 'Minimum Stock Level', name: 'minimumStock', type: 'number', placeholder: 'Minimum quantity' },
                    ].map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-purple-300 mb-2">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    value={formState[field.name as keyof StockItemForm] as string}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white"
                                >
                                    <option value="">Select {field.label}</option>
                                    {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formState[field.name as keyof StockItemForm] as string}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                                    placeholder={field.placeholder}
                                    step={field.step}
                                />
                            )}
                        </div>
                    ))}
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formState.description}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                            rows={3}
                            placeholder="Item description"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={closeForm} className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2">
                        <Save className="h-5 w-5" />
                        <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Stock Items Grid */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-purple-400 mb-6">Current Stock Items</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {stockItems.map((item) => (
                <div key={item._id} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20 flex flex-col justify-between hover:shadow-md hover:shadow-purple-500/10 transition-shadow">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                            <div className="flex space-x-1 flex-shrink-0">
                            {isLowStock(item) && (
                                <span className="bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded-full border border-red-500/30">Low Stock</span>
                            )}
                            {isExpiringSoon(item) && (
                                <span className="bg-amber-900/50 text-amber-300 text-xs px-2 py-1 rounded-full border border-amber-500/30">Expiring</span>
                            )}
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-purple-200">
                            <p><span className="font-medium text-purple-300">Category:</span> {item.category}</p>
                            <p><span className="font-medium text-purple-300">Quantity:</span> {item.quantity} {item.unit}</p>
                            <p><span className="font-medium text-purple-300">Price:</span> ₹{item.price.toLocaleString()} per {item.unit}</p>
                            <p><span className="font-medium text-purple-300">Supplier:</span> {item.supplier || 'N/A'}</p>
                            {item.expiryDate && (
                            <p><span className="font-medium text-purple-300">Expiry:</span> {new Date(item.expiryDate).toLocaleDateString('en-IN')}</p>
                            )}
                            <p><span className="font-medium text-purple-300">Total Value:</span> ₹{(item.quantity * item.price).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-900/50 rounded-md"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 text-red-400 hover:bg-red-900/50 rounded-md"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default AddStock;

