import { Outlet } from "react-router-dom";
import TempleSidebar from "./TempleSidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-muted/10">
      <TempleSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* You can add a mobile sidebar trigger here if needed in the future */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">🕉</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Temple Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout;

