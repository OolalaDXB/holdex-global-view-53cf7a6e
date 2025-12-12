import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Assets from "./pages/Assets";
import Collections from "./pages/Collections";
import Entities from "./pages/Entities";
import Receivables from "./pages/Receivables";
import Documents from "./pages/Documents";
import AddAsset from "./pages/AddAsset";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import DemoAssets from "./pages/demo/DemoAssets";
import DemoCollections from "./pages/demo/DemoCollections";
import DemoAddAsset from "./pages/demo/DemoAddAsset";
import DemoEntities from "./pages/demo/DemoEntities";
import DemoReceivables from "./pages/demo/DemoReceivables";
import DemoDocuments from "./pages/demo/DemoDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <DemoProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/demo/assets" element={<DemoAssets />} />
                <Route path="/demo/collections" element={<DemoCollections />} />
                <Route path="/demo/add" element={<DemoAddAsset />} />
                <Route path="/demo/entities" element={<DemoEntities />} />
                <Route path="/demo/receivables" element={<DemoReceivables />} />
                <Route path="/demo/documents" element={<DemoDocuments />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
                <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
                <Route path="/entities" element={<ProtectedRoute><Entities /></ProtectedRoute>} />
                <Route path="/receivables" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><AddAsset /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DemoProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
