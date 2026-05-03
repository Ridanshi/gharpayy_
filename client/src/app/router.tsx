import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/auth";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { LeadsPage } from "@/features/leads/LeadsPage";
import { LeadDetailPage } from "@/features/leads/LeadDetailPage";
import { PipelinePage } from "@/features/pipeline/PipelinePage";
import { VisitsPage } from "@/features/visits/VisitsPage";
import { PropertiesPage } from "@/features/properties/PropertiesPage";
import { PropertyDetailPage } from "@/features/properties/PropertyDetailPage";
import { ReservationsPage } from "@/features/reservations/ReservationsPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";

function Protected() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Navigate to="/login" replace /> },
  {
    element: <Protected />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "leads/:id", element: <LeadDetailPage /> },
      { path: "pipeline", element: <PipelinePage /> },
      { path: "visits", element: <VisitsPage /> },
      { path: "properties", element: <PropertiesPage /> },
      { path: "inventory", element: <PropertiesPage /> },
      { path: "properties/:id", element: <PropertyDetailPage /> },
      { path: "reservations", element: <ReservationsPage /> },
      { path: "analytics", element: <AnalyticsPage /> }
    ]
  }
]);
