import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Calendar, Image } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome to the Temple Management System admin panel. From here, you can manage the website's content.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NavLink to="/admin/rituals" className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Rituals</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rituals</div>
              <p className="text-xs text-muted-foreground">
                Add, edit, or delete temple rituals.
              </p>
            </CardContent>
          </Card>
        </NavLink>
        
        <NavLink to="/admin/events" className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Events</div>
              <p className="text-xs text-muted-foreground">
                Create and update temple events.
              </p>
            </CardContent>
          </Card>
        </NavLink>

        <NavLink to="/admin/gallery" className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Gallery</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gallery</div>
              <p className="text-xs text-muted-foreground">
                Upload and manage gallery images.
              </p>
            </CardContent>
          </Card>
        </NavLink>
      </div>
    </div>
  );
};

export default AdminDashboard;
