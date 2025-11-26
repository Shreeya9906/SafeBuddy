import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/app-layout";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import MapPage from "@/pages/map";
import SettingsPage from "@/pages/settings";
import MyBuddyPage from "@/pages/mybuddy";
import HealthPage from "@/pages/health";
import WomenSafetyPage from "@/pages/women-safety";
import ComplaintPage from "@/pages/complaint";
import WeatherPage from "@/pages/weather";
import FallDetectionPage from "@/pages/fall-detection";
import AdultMonitoringPage from "@/pages/adult-monitoring";
import DisasterAlertsPage from "@/pages/disaster-alerts";
import NotFound from "@/pages/not-found";

function InnerRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  function PublicRoute({ children }: { children: React.ReactNode }) {
    if (user) {
      return <Redirect to="/dashboard" />;
    }
    return <>{children}</>;
  }

  return (
    <Switch>
      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>
      
      <Route path="/register">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/map">
        <ProtectedRoute>
          <AppLayout>
            <MapPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mybuddy">
        <ProtectedRoute>
          <AppLayout>
            <MyBuddyPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/weather">
        <ProtectedRoute>
          <AppLayout>
            <WeatherPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/disasters">
        <ProtectedRoute>
          <AppLayout>
            <DisasterAlertsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/health">
        <ProtectedRoute>
          <AppLayout>
            <HealthPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/complaint">
        <ProtectedRoute>
          <AppLayout>
            <ComplaintPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/women-safety">
        <ProtectedRoute>
          <AppLayout>
            <WomenSafetyPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/fall-detection">
        <ProtectedRoute>
          <AppLayout>
            <FallDetectionPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/monitoring">
        <ProtectedRoute>
          <AppLayout>
            <AdultMonitoringPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <InnerRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
