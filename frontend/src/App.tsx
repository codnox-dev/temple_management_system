import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import RitualBooking from "@/pages/RitualBooking";
import EventDetails from "@/pages/EventDetails";
import FullEvents from "@/pages/FullEvents";
import FullGallery from "@/pages/FullGallery";
import Login from "@/pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import ManageRituals from "@/pages/admin/ManageRituals";
import ManageEvents from "@/pages/admin/ManageEvents";
import ManageGallery from "@/pages/admin/ManageGallery";
import ManageBookings from "@/pages/admin/ManageBookings";
import Admin from "@/pages/admin/Admin";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/ritual-booking" element={<RitualBooking />} />
            <Route path="/events" element={<FullEvents />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/gallery" element={<FullGallery />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Admin />} />
              <Route path="rituals" element={<ManageRituals />} />
              <Route path="events" element={<ManageEvents />} />
              <Route path="gallery" element={<ManageGallery />} />
              <Route path="bookings" element={<ManageBookings />} />
            </Route>

            {/* Catch-all Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

