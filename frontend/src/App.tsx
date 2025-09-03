import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RitualBooking from "./pages/RitualBooking";
import EventDetails from "./pages/EventDetails";
import FullEvents from "./pages/FullEvents";
import FullGallery from "./pages/FullGallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* This route renders your main page (`Index`). 
              All sections from the navbar (#home, #about, #contact, etc.) 
              should be placed inside the Index component to enable smooth scrolling. */}
          <Route path="/" element={<Index />} />

          {/* These are separate, distinct pages */}
          <Route path="/ritual-booking" element={<RitualBooking />} />
          <Route path="/events" element={<FullEvents />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/gallery" element={<FullGallery />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;