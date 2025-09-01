
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CounterProvider } from "@/contexts/CounterContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Results from "./pages/Results";
import DetailedResults from "./pages/DetailedResults";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Ensure the title is always set correctly, overriding any dynamic changes
    document.title = "PrivacyGuard - PII Risk Assessment & Digital Privacy Protection";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CounterProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/results" element={<Results />} />
                <Route path="/detailed-results" element={<DetailedResults />} />
                <Route path="/auth" element={<Auth />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CounterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
