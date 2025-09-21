import React, { useState, useContext, createContext } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// --- Mock Components and Hooks to resolve errors ---

// This replaces all the missing page and component files.
const Placeholder = ({ name }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
    <div className="text-center p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-4xl font-bold text-orange-600 mb-2">{name}</h1>
      <p className="text-lg">This is a placeholder component.</p>
    </div>
  </div>
);

// Mock Pages
const Index = () => <Placeholder name="Index Page" />;
const NotFound = () => <Placeholder name="404 Not Found" />;
const RitualBooking = () => <Placeholder name="Ritual Booking Page" />;
const EventDetails = () => <Placeholder name="Event Details Page" />;
const FullEvents = () => <Placeholder name="Full Events Page" />;
const FullGallery = () => <Placeholder name="Full Gallery Page" />;
const Login = () => <Placeholder name="Login Page" />;

// Mock Admin Pages
const ManageRituals = () => <Placeholder name="Manage Rituals" />;
const ManageEvents = () => <Placeholder name="Manage Events" />;
const ManageGallery = () => <Placeholder name="Manage Gallery" />;
const ManageBookings = () => <Placeholder name="Manage Bookings" />;
const AdminDashboard = () => <Placeholder name="Admin Dashboard" />;
const AddStock = () => <Placeholder name="Add Stock" />;
const StockAnalytics = () => <Placeholder name="Stock Analytics" />;
const CreateAdmin = () => <Placeholder name="Admin Management" />;
const EditProfile = () => <Placeholder name="Edit Profile" />;

// Mock UI and Layout Components
const Toaster = () => <div className="fixed top-4 right-4 z-50"></div>; // Placeholder for notifications
const TooltipProvider = ({ children }) => <div>{children}</div>;
const AdminLayout = () => <div><Outlet /></div>; // Renders child routes
const ProtectedRoute = ({ children }) => children; // Simple pass-through for now

// Mock Auth Context
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  // Mock user with a role_id for testing RoleGuard
  const mockUser = { name: "Test User", role_id: 1 }; // 1 for Super Admin
  return (
    <AuthContext.Provider value={{ user: mockUser }}>
      {children}
    </AuthContext.Provider>
  );
};
const useAuth = () => useContext(AuthContext);

// --- Main App Component ---

const queryClient = new QueryClient();

const RoleGuard = ({ allow, children }) => {
  const { user } = useAuth() || {};
  const roleId = user?.role_id;
  if (!allow(roleId)) {
    return <NotFound />;
  }
  return <>{children}</>;
};

const AdminIndexRouter = () => {
  const { user } = useAuth() || {};
  const roleId = user?.role_id ?? 99;
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
              <Route index element={<AdminIndexRouter />} />
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
              <Route path="bookings" element={
                <RoleGuard allow={(rid) => (rid ?? 99) !== 3}>
                  <ManageBookings />
                </RoleGuard>
              } />
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
              <Route path="management" element={
                <RoleGuard allow={(rid) => (rid ?? 99) <= 2}>
                  <CreateAdmin />
                </RoleGuard>
              } />
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

