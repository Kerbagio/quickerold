import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import OfflineNotice from "./components/OfflineNotice";
import ScrollToTop from "./components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const Options = lazy(() => import("./pages/Options"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HealthAssistant = lazy(() => import("./pages/HealthAssistant"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineNotice />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                Loading QuickER…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/get-started" element={<Onboarding />} />
              <Route path="/home" element={<Index />} />
              <Route path="/options" element={<Options />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/health-assistant" element={<HealthAssistant />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
