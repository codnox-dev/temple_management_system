import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  Calendar,
  Image,
  Flame,
  BookOpen,
  Package,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Plus
} from 'lucide-react';

const TempleSidebar = () => {
  const [isWebsiteExpanded, setIsWebsiteExpanded] = useState(true);
  const [isStockExpanded, setIsStockExpanded] = useState(false);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-amber-600 text-white shadow-lg'
        : 'text-orange-100 hover:bg-orange-700 hover:text-white'
    }`;
    
  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-amber-600 text-white shadow-lg'
        : 'text-orange-200 hover:bg-orange-700 hover:text-white'
    }`;


  return (
    <aside className="bg-gradient-to-b from-orange-900 via-orange-800 to-amber-900 text-white w-72 min-h-screen p-6 shadow-2xl hidden lg:block">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Flame className="h-8 w-8 text-amber-300" />
          <h1 className="text-2xl font-bold text-amber-100">Temple Admin</h1>
        </div>
        <p className="text-orange-200 text-sm">Sacred Management System</p>
      </div>

      <nav className="space-y-2">
        <NavLink to="/admin" end className={navLinkClass}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/bookings" className={navLinkClass}>
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">All Bookings</span>
        </NavLink>
        
        {/* Website Management Section */}
        <div>
          <button
            onClick={() => setIsWebsiteExpanded(!isWebsiteExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-orange-100 hover:bg-orange-700 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5" />
              <span className="font-medium">Website Management</span>
            </div>
            {isWebsiteExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isWebsiteExpanded && (
            <div className="ml-6 mt-2 space-y-1">
                <NavLink to="/admin/events" className={subNavLinkClass}>
                    <Calendar className="h-4 w-4" />
                    <span>Event Management</span>
                </NavLink>
                <NavLink to="/admin/gallery" className={subNavLinkClass}>
                    <Image className="h-4 w-4" />
                    <span>Gallery Management</span>
                </NavLink>
                <NavLink to="/admin/rituals" className={subNavLinkClass}>
                    <Flame className="h-4 w-4" />
                    <span>Ritual Management</span>
                </NavLink>
            </div>
          )}
        </div>

        {/* Stock Management Section (Future) */}
        <div>
          <button
            onClick={() => setIsStockExpanded(!isStockExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-orange-100 hover:bg-orange-700 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5" />
              <span className="font-medium">Stock Management</span>
            </div>
            {isStockExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isStockExpanded && (
             <div className="ml-6 mt-2 space-y-1">
                {/* Add NavLinks for stock management here later */}
             </div>
          )}
        </div>

        {/* Admin Management Section (Future) */}
        <div>
          <button
            onClick={() => setIsAdminExpanded(!isAdminExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-orange-100 hover:bg-orange-700 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin Management</span>
            </div>
            {isAdminExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isAdminExpanded && (
            <div className="ml-6 mt-2 space-y-1">
                {/* Add NavLinks for admin management here later */}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default TempleSidebar;
