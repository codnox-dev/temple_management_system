import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Package, DollarSign, AlertTriangle, Filter } from 'lucide-react';

interface StockData {
  month: string;
  year: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  newItemsAdded: number;
}

const StockAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(2025);

  const monthlyData: StockData[] = [
    { month: 'January', year: 2025, totalItems: 45, totalValue: 125000, lowStockItems: 3, newItemsAdded: 8 },
    { month: 'December', year: 2024, totalItems: 42, totalValue: 118000, lowStockItems: 5, newItemsAdded: 6 },
    { month: 'November', year: 2024, totalItems: 38, totalValue: 110000, lowStockItems: 2, newItemsAdded: 4 },
  ];

  const yearlyData = [
    { year: 2024, totalItems: 156, totalValue: 425000, lowStockItems: 12, newItemsAdded: 45 },
    { year: 2023, totalItems: 142, totalValue: 380000, lowStockItems: 18, newItemsAdded: 38 },
  ];
  
  const categoryData = [
    { category: 'Puja Items', items: 15, value: 35000, percentage: 28 },
    { category: 'Abhishek Items', items: 8, value: 25000, percentage: 20 },
    { category: 'Flowers & Garlands', items: 12, value: 18000, percentage: 14 },
    { category: 'Food Items', items: 6, value: 22000, percentage: 18 },
    { category: 'Cleaning Supplies', items: 4, value: 15000, percentage: 12 },
  ];

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Stock Analytics</h1>
          <p className="text-purple-300 mt-2">Comprehensive stock analysis and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-purple-300" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="category">By Category</option>
            </select>
          </div>
          {selectedPeriod !== 'category' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Current Stock Items", value: "45", change: "+8 this month", Icon: Package, color: "purple" },
          { title: "Total Stock Value", value: "₹1.25L", change: "+6% from last month", Icon: DollarSign, color: "green" },
          { title: "Low Stock Alerts", value: "3", change: "Immediate attention", Icon: AlertTriangle, color: "amber" },
          { title: "Avg Monthly Growth", value: "12%", change: "Inventory expansion", Icon: TrendingUp, color: "pink" }
        ].map(card => (
          <div key={card.title} className={`bg-slate-900/80 backdrop-blur-sm border border-${card.color}-500/30 p-6 rounded-xl shadow-lg shadow-${card.color}-500/10`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${card.color}-300 text-sm`}>{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className={`text-${card.color}-400 text-xs mt-1`}>{card.change}</p>
              </div>
              <card.Icon className={`h-12 w-12 text-${card.color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Content based on filter */}
      {selectedPeriod !== 'category' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-6">
            {selectedPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Analysis
          </h2>
          <div className="space-y-4">
            {(selectedPeriod === 'monthly' ? monthlyData : yearlyData).map((data, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                  { (data as StockData).month ? `${(data as StockData).month} ${data.year}` : `Year ${data.year}` }
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><p className="text-sm text-purple-300">Total Items</p><p className="text-xl font-bold text-white">{data.totalItems}</p></div>
                    <div><p className="text-sm text-green-300">Total Value</p><p className="text-xl font-bold text-green-400">₹{(data.totalValue / 1000).toFixed(0)}K</p></div>
                    <div><p className="text-sm text-red-300">Low Stock</p><p className="text-xl font-bold text-red-400">{data.lowStockItems}</p></div>
                    <div><p className="text-sm text-blue-300">New Items</p><p className="text-xl font-bold text-blue-400">{data.newItemsAdded}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPeriod === 'category' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-400 mb-6">Stock by Category</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {categoryData.map((cat, index) => (
                        <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/20">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-white">{cat.category}</h3>
                                <span className="text-sm font-medium text-purple-300">{cat.percentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-purple-300 mb-2">
                                <span>{cat.items} items</span>
                                <span>₹{cat.value.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-white mb-4">Category Overview</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-purple-300">Most Stocked:</span><span className="font-semibold text-white">Puja Items</span></div>
                        <div className="flex justify-between"><span className="text-purple-300">Highest Value:</span><span className="font-semibold text-white">Puja Items</span></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Stock Trends & Insights */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-purple-400 mb-6">Trends & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2"><TrendingUp className="h-5 w-5 text-green-400 mr-2" /><h3 className="font-semibold text-green-300">Stock Growth</h3></div>
            <p className="text-sm text-green-400">Inventory has grown by 12% this month with strategic additions in Puja Items.</p>
          </div>
          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2"><AlertTriangle className="h-5 w-5 text-amber-400 mr-2" /><h3 className="font-semibold text-amber-300">Low Stock Alert</h3></div>
            <p className="text-sm text-amber-400">3 items are running low. Consider restocking Incense Sticks, Coconut Oil, and Sacred Threads.</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2"><BarChart3 className="h-5 w-5 text-blue-400 mr-2" /><h3 className="font-semibold text-blue-300">Peak Usage</h3></div>
            <p className="text-sm text-blue-400">Highest consumption observed during festival seasons. Plan inventory accordingly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalytics;
