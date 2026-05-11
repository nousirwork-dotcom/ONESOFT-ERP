import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Invoices from "./pages/Invoices";
import InventoryModule from "./pages/InventoryModule";
import PurchasesModule from "./pages/PurchasesModule";
import SalesModule from "./pages/SalesModule";
import Users from "./pages/Users";
import ManufacturingModule from "./pages/ManufacturingModule";
import AccountingModule from "./pages/AccountingModule";
import HRModule from "./pages/HRModule";
import AssetsModule from "./pages/AssetsModule";
import SettingsModule from "./pages/SettingsModule";
import LoginPage from "./pages/LoginPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import { useEffect } from "react";
import { trpc } from "./lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (meQuery.isLoading) return;
    if (!meQuery.data) {
      if (location !== '/login') navigate('/login');
    } else {
      if (location === '/login') {
        navigate(meQuery.data.role === 'superadmin' ? '/superadmin' : '/');
      }
    }
  }, [meQuery.data, meQuery.isLoading, location]);

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const user = meQuery.data;

  if (user?.role === 'superadmin') {
    return (
      <Switch>
        <Route path="/superadmin" component={SuperAdminPage} />
        <Route component={SuperAdminPage} />
      </Switch>
    );
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pos" component={POS} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/inventory-module" component={InventoryModule} />
        <Route path="/purchases-module" component={PurchasesModule} />
        <Route path="/sales-module" component={SalesModule} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={SettingsModule} />
        <Route path="/manufacturing-module" component={ManufacturingModule} />
        <Route path="/accounting-module" component={AccountingModule} />
        <Route path="/hr-module" component={HRModule} />
        <Route path="/assets-module" component={AssetsModule} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
    }),
  ],
});

function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster position="top-center" richColors />
              <Switch>
                <Route path="/login" component={LoginPage} />
                <Route>
                  <AuthGuard>
                    <AppRoutes />
                  </AuthGuard>
                </Route>
              </Switch>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;
