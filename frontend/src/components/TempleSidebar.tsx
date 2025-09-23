import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

type SidebarProps = { isOpen?: boolean };

const TempleSidebar: React.FC<SidebarProps> = ({ isOpen = false }) => {
  const { user } = useAuth() as any;
  const roleId = user?.role_id ?? 99;

  const [isWebsiteExpanded, setIsWebsiteExpanded] = useState(true);
  const [isStockExpanded, setIsStockExpanded] = useState(true);
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
        : 'text-purple-300 hover:bg-purple-800/50 hover:text-white'
    }`;
    
  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
        : 'text-purple-300 hover:bg-purple-800/50 hover:text-white'
    }`;

  // Visibility classes: hide by default; show when isOpen.
  // On small screens, it's an absolute overlay. On large screens, it's relative when open, absolute when closed.
  const baseClasses = "bg-gradient-to-b from-gray-900 via-purple-900 to-slate-900 text-white w-72 min-h-screen p-6 shadow-2xl border-r border-purple-500/30 z-30 transition-transform duration-300 ease-in-out";
  const responsiveClasses = `fixed ${isOpen ? 'lg:relative' : 'lg:absolute lg:top-0 lg:left-0'}`;
  const visibilityClasses = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <aside className={`${baseClasses} ${responsiveClasses} ${visibilityClasses}`}>
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Temple Admin</h1>
        </div>
        <p className="text-purple-400 text-sm">Sacred Management System</p>
      </div>

      <nav className="space-y-2">
    {/* Dashboard visible to all except Editors (3) and Employees (4) */}
    {roleId !== 3 && roleId !== 4 && (
        <NavLink to="/admin" end className={navLinkClass}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
        </NavLink>
        )}
        {/* Bookings hidden for Editors */}
        {roleId !== 3 && (
        <NavLink to="/admin/bookings" className={navLinkClass}>
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">All Bookings</span>
        </NavLink>
        )}
        
        {/* Website Management Section */}
        <div>
          <button
            onClick={() => setIsWebsiteExpanded(!isWebsiteExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-purple-300 hover:bg-purple-800/50 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5" />
              <span className="font-medium">Website Management</span>
            </div>
            {isWebsiteExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isWebsiteExpanded && (
            <div className="ml-6 mt-2 space-y-1">
        {/* Editors (3) can access Events & Gallery; Employees (4) only Rituals */}
        {(roleId !== 4) && (
                <NavLink to="/admin/events" className={subNavLinkClass}>
                    <Calendar className="h-4 w-4" />
                    <span>Event Management</span>
                </NavLink>
                )}
        {(roleId !== 4) && (
                <NavLink to="/admin/gallery" className={subNavLinkClass}>
                    <Image className="h-4 w-4" />
                    <span>Gallery Management</span>
                </NavLink>
                )}
                {(
                  roleId === 3 || roleId === 4 || roleId < 3 || roleId >= 5
                ) && (
                <NavLink to="/admin/rituals" className={subNavLinkClass}>
                    <Flame className="h-4 w-4" />
                    <span>Ritual Management</span>
                </NavLink>
                )}
            </div>
          )}
        </div>

  {/* Stock Management Section: visible for all except Editor (3) */}
  {roleId !== 3 && (
        <div>
          <button
            onClick={() => setIsStockExpanded(!isStockExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-purple-300 hover:bg-purple-800/50 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5" />
              <span className="font-medium">Stock Management</span>
            </div>
            {isStockExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isStockExpanded && (
             <div className="ml-6 mt-2 space-y-1">
                <NavLink to="/admin/stock/add" className={subNavLinkClass}>
                    <Plus className="h-4 w-4" />
                    <span>Add Stock</span>
                </NavLink>
                <NavLink to="/admin/stock/analytics" className={subNavLinkClass}>
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                </NavLink>
             </div>
          )}
        </div>
        )}

        {/* Admin Management Section */}
        {/* Admin Management visible only to role_id <= 2 (Super/Admin/Privileged), but page will also gate */}
        {roleId <= 2 && (
        <div>
          <button
            onClick={() => setIsAdminExpanded(!isAdminExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-purple-300 hover:bg-purple-800/50 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin Management</span>
            </div>
            {isAdminExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isAdminExpanded && (
            <div className="ml-6 mt-2 space-y-1">
                <NavLink to="/admin/management" className={subNavLinkClass}>
                    <Users className="h-4 w-4" />
                    <span>Manage Admins</span>
                </NavLink>
            </div>
          )}
        </div>
        )}
      </nav>
    </aside>
  );
};

export default TempleSidebar;

