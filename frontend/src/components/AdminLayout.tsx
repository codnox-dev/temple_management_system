import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, LogOut, Image, Calendar, Sparkles } from 'lucide-react';

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
    }`;


  return (
    <div className="flex h-screen bg-muted/40">
      <aside className="w-64 flex-shrink-0 border-r bg-background p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 font-playfair">Admin Panel</h1>
        <nav className="flex flex-col space-y-2 flex-grow">
          <NavLink to="/admin/rituals" className={navLinkClass}><Sparkles className="mr-3 h-5 w-5" />Manage Rituals</NavLink>
          <NavLink to="/admin/events" className={navLinkClass}><Calendar className="mr-3 h-5 w-5" />Manage Events</NavLink>
          <NavLink to="/admin/gallery" className={navLinkClass}><Image className="mr-3 h-5 w-5" />Manage Gallery</NavLink>
        </nav>
        <div className="mt-auto">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
               <LogOut className="mr-3 h-5 w-5" /> Logout
            </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

