import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import OfflineNotice from "./components/OfflineNotice";
import ScrollToTop from "./components/ScrollToTop";
import RouteLoading from "./components/RouteLoading";
import RuntimeTranslator from "./components/RuntimeTranslator";

const Index = lazy(() => import("./pages/Index"));
const Options = lazy(() => import("./pages/Options"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Triage = lazy(() => import("./pages/Triage"));
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
        <OfflineNotice />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <RuntimeTranslator />
          <ScrollToTop />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/get-started" element={<Onboarding />} />
              <Route path="/home" element={<Index />} />
              <Route path="/triage" element={<Triage />} />
              <Route path="/options" element={<Options />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
