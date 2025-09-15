import React, { useState } from 'react';
import { Plus, Package, Calendar, DollarSign, AlertTriangle, Save, Edit, Trash2 } from 'lucide-react';

interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  supplier: string;
  expiryDate?: string;
  minimumStock: number;
  description: string;
  addedOn: string;
}

const AddStock = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: 1,
      name: 'Incense Sticks',
      category: 'Puja Items',
      quantity: 500,
      unit: 'pieces',
      price: 2,
      supplier: 'Divine Fragrances Pvt Ltd',
      minimumStock: 50,
      description: 'Premium quality sandalwood incense sticks for daily puja',
      addedOn: '2025-01-10'
    },
    {
      id: 2,
      name: 'Coconut Oil',
      category: 'Abhishek Items',
      quantity: 20,
      unit: 'liters',
      price: 150,
      supplier: 'Sacred Oils Co.',
      expiryDate: '2025-12-31',
      minimumStock: 5,
      description: 'Pure coconut oil for lighting lamps and abhishek',
      addedOn: '2025-01-08'
    }
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    price: '',
    supplier: '',
    expiryDate: '',
    minimumStock: '',
    description: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    'Puja Items',
    'Abhishek Items',
    'Flowers & Garlands',
    'Food Items',
    'Cleaning Supplies',
    'Decorative Items',
    'Ceremonial Items',
    'Maintenance Supplies'
  ];

  const units = ['pieces', 'kg', 'liters', 'packets', 'boxes', 'bundles', 'meters', 'grams'];

  const handleAddItem = () => {
    if (newItem.name && newItem.category && newItem.quantity && newItem.price) {
      const item: StockItem = {
        id: stockItems.length + 1,
        ...newItem,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price),
        minimumStock: parseInt(newItem.minimumStock) || 10,
        addedOn: new Date().toISOString().split('T')[0]
      };
      setStockItems([...stockItems, item]);
      setNewItem({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        price: '',
        supplier: '',
        expiryDate: '',
        minimumStock: '',
        description: ''
      });
      setShowAddForm(false);
    }
  };

  const isLowStock = (item: StockItem) => item.quantity <= item.minimumStock;
  const isExpiringSoon = (item: StockItem) => {
    if (!item.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff <= 30;
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Stock Management</h1>
          <p className="text-purple-300 mt-2">Add and manage temple inventory items</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 p-6 rounded-xl shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-purple-300">Total Items</p>
                    <p className="text-3xl font-bold">{stockItems.length}</p>
                </div>
                <Package className="h-12 w-12 text-purple-400" />
            </div>
        </div>
        {/* Low Stock Items */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-red-500/30 p-6 rounded-xl shadow-lg shadow-red-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-red-300">Low Stock Items</p>
                    <p className="text-3xl font-bold">{stockItems.filter(isLowStock).length}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
        </div>
        {/* Expiring Soon */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 p-6 rounded-xl shadow-lg shadow-amber-500/10">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-amber-300">Expiring Soon</p>
                    <p className="text-3xl font-bold">{stockItems.filter(isExpiringSoon).length}</p>
                </div>
                <Calendar className="h-12 w-12 text-amber-400" />
            </div>
        </div>
        {/* Total Value */}
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

      {/* Add New Item Form */}
      {showAddForm && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-6">Add New Stock Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Form fields */}
            {[
                { label: 'Item Name *', value: newItem.name, key: 'name', type: 'text', placeholder: 'Enter item name' },
                { label: 'Category *', value: newItem.category, key: 'category', type: 'select', options: categories },
                { label: 'Quantity *', value: newItem.quantity, key: 'quantity', type: 'number', placeholder: 'Enter quantity' },
                { label: 'Unit *', value: newItem.unit, key: 'unit', type: 'select', options: units },
                { label: 'Price per Unit (₹) *', value: newItem.price, key: 'price', type: 'number', step: '0.01', placeholder: 'Enter price' },
                { label: 'Supplier', value: newItem.supplier, key: 'supplier', type: 'text', placeholder: 'Supplier name' },
                { label: 'Expiry Date', value: newItem.expiryDate, key: 'expiryDate', type: 'date' },
                { label: 'Minimum Stock Level', value: newItem.minimumStock, key: 'minimumStock', type: 'number', placeholder: 'Minimum quantity' },
            ].map(field => (
                <div key={field.key}>
                    <label className="block text-sm font-medium text-purple-300 mb-2">{field.label}</label>
                    {field.type === 'select' ? (
                         <select
                            value={field.value}
                            onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white"
                        >
                            <option value="">Select {field.key}</option>
                            {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    ) : (
                        <input
                            type={field.type}
                            value={field.value}
                            onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
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
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                rows={3}
                placeholder="Item description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      )}

      {/* Stock Items Grid */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-purple-400 mb-6">Current Stock Items</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stockItems.map((item) => (
            <div key={item.id} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20 hover:shadow-md hover:shadow-purple-500/10 transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <div className="flex space-x-1">
                  {isLowStock(item) && (
                    <span className="bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded-full border border-red-500/30">
                      Low Stock
                    </span>
                  )}
                  {isExpiringSoon(item) && (
                    <span className="bg-amber-900/50 text-amber-300 text-xs px-2 py-1 rounded-full border border-amber-500/30">
                      Expiring
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-purple-200">
                <p><span className="font-medium text-purple-300">Category:</span> {item.category}</p>
                <p><span className="font-medium text-purple-300">Quantity:</span> {item.quantity} {item.unit}</p>
                <p><span className="font-medium text-purple-300">Price:</span> ₹{item.price} per {item.unit}</p>
                <p><span className="font-medium text-purple-300">Supplier:</span> {item.supplier}</p>
                {item.expiryDate && (
                  <p><span className="font-medium text-purple-300">Expiry:</span> {new Date(item.expiryDate).toLocaleDateString('en-IN')}</p>
                )}
                <p><span className="font-medium text-purple-300">Total Value:</span> ₹{(item.quantity * item.price).toLocaleString()}</p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                  <button className="p-2 text-blue-400 hover:bg-blue-900/50 rounded-md"><Edit size={16}/></button>
                  <button className="p-2 text-red-400 hover:bg-red-900/50 rounded-md"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddStock;
