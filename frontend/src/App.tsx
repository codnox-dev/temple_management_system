import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RitualBooking from "./pages/RitualBooking";
import EventDetails from "./pages/EventDetails";
import FullEvents from "./pages/FullEvents";
import FullGallery from "./pages/FullGallery";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import AdminLayout from "./components/AdminLayout";
import ManageRituals from "./pages/admin/ManageRituals";
import ManageEvents from "./pages/admin/ManageEvents";
import ManageGallery from "./pages/admin/ManageGallery";
import ManageBookings from "./pages/admin/ManageBookings";
import AdminDashboard from "./pages/admin/Admin";
import AddStock from "./pages/admin/AddStock";
import StockAnalytics from "./pages/admin/StockAnalytics";
import CreateAdmin from "./pages/admin/AdminManagement";
import EditProfile from "./pages/admin/EditProfile";
import Activity from "./pages/admin/Activity";

const queryClient = new QueryClient();

const RoleGuard = ({ allow, children }: { allow: (roleId?: number) => boolean; children: React.ReactNode }) => {
  const { user } = (useAuth() as any) || {};
  const roleId: number | undefined = user?.role_id;
  if (!allow(roleId)) {
    return <NotFound />;
  }
  return <>{children}</>;
};

// Decides where to land when visiting /admin based on role
const AdminIndexRouter = () => {
  const { user } = (useAuth() as any) || {};
  const roleId: number = user?.role_id ?? 99;
  // Editors (3) -> events, Employees (4) -> bookings, others -> dashboard
  if (roleId === 3) return <Navigate to="/admin/events" replace />;
  if (roleId === 4) return <Navigate to="/admin/bookings" replace />;
  return <AdminDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
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
              {/* Dashboard hidden for editor (3) and employee (4); redirect to role landing */}
              <Route index element={<AdminIndexRouter />} />
              {/* Website Management: Editor(3) can access only these; Employee(4) only rituals; others allowed */}
              <Route path="rituals" element={
                <RoleGuard allow={(rid) => (rid ?? 99) <= 4}>
                  <ManageRituals />
                </RoleGuard>
              } />
              <Route path="events" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 4}>
                  <ManageEvents />
                </RoleGuard>
              } />
              <Route path="gallery" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 4}>
                  <ManageGallery />
                </RoleGuard>
              } />

              {/* Bookings hidden for editor; employees can access */}
              <Route path="bookings" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 3}>
                  <ManageBookings />
                </RoleGuard>
              } />

              {/* Stock visible to all except editor (3); viewers see read-only */}
              <Route path="stock/add" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 3}>
                  <AddStock />
                </RoleGuard>
              } />
              <Route path="stock/analytics" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 3}>
                  <StockAnalytics />
                </RoleGuard>
              } />

              {/* Admin Management visible only to role_id <= 2 (Super/Admin/Privileged) */}
              <Route path="management" element={
                <RoleGuard allow={(rid) => (rid ?? 99) <= 2}>
                  <CreateAdmin />
                </RoleGuard>
              } />

              {/* Activity Log visible only to role_id <= 2 (Super/Admin/Privileged) */}
              <Route path="activity" element={
                <RoleGuard allow={(rid) => (rid ?? 99) <= 2}>
                  <Activity />
                </RoleGuard>
              } />

              {/* Edit Profile accessible to all logged-in users */}
              <Route path="edit-profile" element={<EditProfile />} />

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

