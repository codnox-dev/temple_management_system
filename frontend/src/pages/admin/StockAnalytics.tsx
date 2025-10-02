import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign, AlertTriangle, Filter } from 'lucide-react';
import api from '@/api/api';

// Interface for monthly/yearly data
interface PeriodData {
  month?: string;
  year: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  newItemsAdded: number;
}

// Interface for category data
interface CategoryData {
  category: string;
  totalItems: number;
  totalValue: number;
  percentage: number;
}

const StockAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly' | 'category'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState<PeriodData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (selectedPeriod === 'category') {
            const response = await api.get<CategoryData[]>(`/stock/analytics`, {
                params: { period: 'category', year: selectedYear },
            });
            setCategoryData(response.data);
        } else {
            const response = await api.get<PeriodData[]>(`/stock/analytics`, {
                params: { period: selectedPeriod, year: selectedYear },
            });
            setAnalyticsData(response.data);
        }
      } catch (err) {
        setError(`Failed to fetch ${selectedPeriod} analytics data.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod, selectedYear]);
  
  const currentMonthData = analyticsData.length > 0 ? analyticsData[analyticsData.length - 1] : null;
  const totalStockItems = analyticsData.reduce((sum, data) => sum + data.totalItems, 0) || categoryData.reduce((sum, data) => sum + data.totalItems, 0);
  const totalStockValue = analyticsData.reduce((sum, data) => sum + data.totalValue, 0) || categoryData.reduce((sum, data) => sum + data.totalValue, 0);
  const totalLowStock = analyticsData.reduce((sum, data) => sum + data.lowStockItems, 0);

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
              onChange={(e) => setSelectedPeriod(e.target.value as 'monthly' | 'yearly' | 'category')}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Stock Items", value: totalStockItems, change: `in ${selectedYear}`, Icon: Package, color: "purple" },
          { title: "Total Stock Value", value: `₹${(totalStockValue / 1000)?.toFixed(1) || '0'}k`, change: `in ${selectedYear}`, Icon: DollarSign, color: "green" },
          { title: "Low Stock Alerts", value: totalLowStock || 'N/A', change: "Across all months", Icon: AlertTriangle, color: "amber" },
          { title: "New Items Added", value: currentMonthData?.newItemsAdded || 'N/A', change: "in the latest period", Icon: TrendingUp, color: "pink" }
        ].map(card => (
          <div
            key={card.title}
            className={`bg-slate-900/80 backdrop-blur-sm border border-${card.color}-500/50 p-6 rounded-xl shadow-lg shadow-${card.color}-500/30`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${card.color}-500 text-sm font-semibold`}>
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className={`text-${card.color}-400 text-xs mt-1`}>
                  {card.change}
                </p>
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
            {selectedPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Analysis for {selectedYear}
          </h2>
          {isLoading ? (<p>Loading data...</p>) : error ? (<p className="text-red-400">{error}</p>) : analyticsData.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.map((data, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    { data.month ? `${data.month} ${data.year}` : `Year ${data.year}` }
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
          ): (<p>No data available for the selected period.</p>)}
        </div>
      )}

      {selectedPeriod === 'category' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-400 mb-6">Stock by Category for {selectedYear}</h2>
            {isLoading ? (<p>Loading data...</p>) : error ? (<p className="text-red-400">{error}</p>) : categoryData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {categoryData.map((cat, index) => (
                            <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/20">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-white">{cat.category}</h3>
                                    <span className="text-sm font-medium text-purple-300">{cat.percentage}%</span>
                                </div>
                                <div className="flex justify-between text-sm text-purple-300 mb-2">
                                    <span>{cat.totalItems} items</span>
                                    <span>₹{cat.totalValue.toLocaleString()}</span>
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
                            <div className="flex justify-between"><span className="text-purple-300">Most Stocked:</span><span className="font-semibold text-white">{categoryData[0]?.category || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-purple-300">Highest Value:</span><span className="font-semibold text-white">{categoryData[0]?.category || 'N/A'}</span></div>
                        </div>
                    </div>
                </div>
            ) : (<p>No category data available for the selected year.</p>)}
        </div>
      )}

      {/* Stock Trends & Insights */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-purple-400 mb-6">Trends & Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Stock Growth */}
          <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-300 mr-2" />
              <h3 className="font-semibold text-green-100">Stock Growth</h3>
            </div>
            <p className="text-sm text-green-100">
              Inventory value and item count can be tracked here over time.
            </p>
          </div>
          
          {/* Low Stock Alert */}
          <div className="bg-amber-900/50 border border-amber-500/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-300 mr-2" />
              <h3 className="font-semibold text-amber-100">Low Stock Alert</h3>
            </div>
            <p className="text-sm text-amber-100">
              Items falling below their minimum stock levels are flagged for immediate attention.
            </p>
          </div>
          
          {/* Peak Usage */}
          <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 text-blue-300 mr-2" />
              <h3 className="font-semibold text-blue-100">Peak Usage</h3>
            </div>
            <p className="text-sm text-blue-100">
              Observe consumption trends to anticipate needs for festivals and special events.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StockAnalytics;