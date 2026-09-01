import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Non-home routes are code-split so the landing page does not pay for the
// chart/animation libraries used by the dashboard and demo.
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const TechnologyStack = lazy(() => import("./pages/TechStack"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const UseCases = lazy(() => import("./pages/UseCases"));
const DetectionCapabilities = lazy(() => import("./pages/DetectionCapabilities"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DemoPage = lazy(() => import("./pages/DemoPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/use-cases" element={<UseCases />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/detection-capabilities" element={<DetectionCapabilities />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tech-stack" element={<TechnologyStack />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* Catch-all must stay last — React Router ranks static segments above splats */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
