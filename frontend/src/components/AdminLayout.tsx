import { Outlet } from "react-router-dom";
import TempleSidebar from "./TempleSidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-purple-900 to-slate-900">
      <TempleSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-purple-500/30 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar trigger can be added here in the future */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Temple Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-purple-300 hover:bg-purple-800/50 hover:text-white">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-purple-300 hover:bg-purple-800/50 hover:text-white">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-900 via-purple-900 to-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout;