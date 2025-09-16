import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Inbox, Package, DollarSign, AlertTriangle, Filter } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

interface MonthlyYearlyData {
  month?: string;
  year: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  newItemsAdded: number;
}

interface CategoryData {
  category: string;
  totalItems: number;
  totalValue: number;
  percentage: number;
}

const StockAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState<MonthlyYearlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyYearlyData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/stock/analytics`, {
          params: { period: selectedPeriod, year: selectedYear },
        });
        setAnalyticsData(response.data);
      } catch (err) {
        setError(`Failed to fetch ${selectedPeriod} analytics data.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategoryData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axios.get(`${API_URL}/stock/analytics/category`, {
                params: { year: selectedYear },
            });
            setCategoryData(response.data);
        } catch (err) {
            setError(`Failed to fetch category analytics data.`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedPeriod === 'category') {
        fetchCategoryData();
    } else {
        fetchMonthlyYearlyData();
    }
  }, [selectedPeriod, selectedYear]);
  
  const totalItems = analyticsData.reduce((sum, item) => sum + item.totalItems, 0);
  const totalValue = analyticsData.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = analyticsData.reduce((sum, item) => sum + item.lowStockItems, 0);
  const newItems = analyticsData.reduce((sum, item) => sum + item.newItemsAdded, 0);

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
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {[...Array(5)].map((_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Stock Items", value: totalItems, change: `+${newItems} this period`, Icon: Package, color: "purple" },
          { title: "Total Stock Value", value: `₹${(totalValue / 1000).toFixed(1)}k`, change: "", Icon: DollarSign, color: "green" },
          { title: "Low Stock Alerts", value: lowStockItems, change: "Across period", Icon: AlertTriangle, color: "amber" },
          { title: "New Items Added", value: newItems, change: "Across period", Icon: TrendingUp, color: "pink" }
        ].map(card => (
          <div key={card.title} className={`bg-slate-900/80 backdrop-blur-sm border border-${card.color}-500/30 p-6 rounded-xl shadow-lg shadow-${card.color}-500/10`}>
            <div className="flex items-center justify-between"><div><p className={`text-${card.color}-300 text-sm`}>{card.title}</p><p className="text-3xl font-bold">{isLoading ? '...' : card.value}</p><p className={`text-${card.color}-400 text-xs mt-1`}>{card.change}</p></div><card.Icon className={`h-12 w-12 text-${card.color}-400`} /></div>
          </div>
        ))}
      </div>

      {selectedPeriod !== 'category' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-6">{selectedPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Analysis for {selectedYear}</h2>
          {isLoading ? <div className="text-center py-8">Loading analytics data...</div> : error ? <div className="text-center py-8 text-red-400">{error}</div> : analyticsData.length > 0 ? (
            <div className="space-y-4">{analyticsData.map((data, index) => (<div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20"><h3 className="text-lg font-semibold text-white mb-3">{data.month ? `${data.month} ${data.year}` : `Year ${data.year}`}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"><div><p className="text-sm text-purple-300">Total Items</p><p className="text-xl font-bold text-white">{data.totalItems}</p></div><div><p className="text-sm text-green-300">Total Value</p><p className="text-xl font-bold text-green-400">₹{(data.totalValue / 1000).toFixed(0)}K</p></div><div><p className="text-sm text-red-300">Low Stock</p><p className="text-xl font-bold text-red-400">{data.lowStockItems}</p></div><div><p className="text-sm text-blue-300">New Items</p><p className="text-xl font-bold text-blue-400">{data.newItemsAdded}</p></div></div></div>))}</div>) : (<div className="text-center py-12 text-purple-300"><Inbox className="mx-auto h-16 w-16 text-purple-400/50" /><h3 className="mt-4 text-lg font-semibold text-white">No Data Available</h3><p className="mt-1 text-sm">There is no stock data for the selected period ({selectedYear}).</p></div>)}
        </div>
      )}
      
      {selectedPeriod === 'category' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-400 mb-6">Stock by Category for {selectedYear}</h2>
            {isLoading ? <div className="text-center py-8">Loading category data...</div> : error ? <div className="text-center py-8 text-red-400">{error}</div> : categoryData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {categoryData.map((cat, index) => (
                        <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/20">
                            <div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-white">{cat.category}</h3><span className="text-sm font-medium text-purple-300">{cat.percentage}%</span></div>
                            <div className="flex justify-between text-sm text-purple-300 mb-2"><span>{cat.totalItems} items</span><span>₹{cat.totalValue.toLocaleString()}</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${cat.percentage}%` }}></div></div>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/20 self-start">
                    <h3 className="text-lg font-semibold text-white mb-4">Category Overview</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-purple-300">Most Stocked:</span><span className="font-semibold text-white">{categoryData[0]?.category || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-purple-300">Highest Value:</span><span className="font-semibold text-white">{categoryData[0]?.category || 'N/A'}</span></div>
                    </div>
                </div>
            </div>
            ) : (<div className="text-center py-12 text-purple-300"><Inbox className="mx-auto h-16 w-16 text-purple-400/50" /><h3 className="mt-4 text-lg font-semibold text-white">No Category Data</h3><p className="mt-1 text-sm">There is no stock data for the selected year ({selectedYear}).</p></div>)}
        </div>
      )}
    </div>
  );
};

export default StockAnalytics;

