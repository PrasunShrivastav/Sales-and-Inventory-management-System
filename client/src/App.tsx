import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import POSPage from "@/pages/pos-page";
import InventoryPage from "@/pages/inventory-page";
import AnalyticsPage from "@/pages/analytics-page";
import SettingsPage from "@/pages/settings-page";
import UsersPage from "@/pages/users-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Suspense, lazy } from "react";

// Lazy load pages for better performance
const LazyAuthPage = lazy(() => import("@/pages/auth-page"));
const LazyHomePage = lazy(() => import("@/pages/home-page"));
const LazyPOSPage = lazy(() => import("@/pages/pos-page"));
const LazyInventoryPage = lazy(() => import("@/pages/inventory-page"));
const LazyAnalyticsPage = lazy(() => import("@/pages/analytics-page"));
const LazySettingsPage = lazy(() => import("@/pages/settings-page"));
const LazyUsersPage = lazy(() => import("@/pages/users-page"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/auth" component={() => <LazyAuthPage />} />
        <ProtectedRoute path="/" component={() => <LazyHomePage />} />
        <ProtectedRoute path="/pos" component={() => <LazyPOSPage />} />
        <ProtectedRoute
          path="/inventory"
          component={() => <LazyInventoryPage />}
        />
        <ProtectedRoute
          path="/analytics"
          component={() => <LazyAnalyticsPage />}
        />
        <ProtectedRoute
          path="/settings"
          component={() => <LazySettingsPage />}
        />
        <ProtectedRoute path="/users" component={() => <LazyUsersPage />} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
