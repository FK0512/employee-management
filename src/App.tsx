import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSessionStore } from "./context/sessionStore";
import { supabase } from "./lib/supabase";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import DecisionsPage from "./pages/DecisionsPage";
import MeetingsPage from "./pages/MeetingsPage";
import SearchPage from "./pages/SearchPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, bootstrapped } = useSessionStore();
  if (!bootstrapped) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function RequireOrg({ children }: { children: ReactNode }) {
  const { activeOrganizationId, bootstrapped } = useSessionStore();
  if (!bootstrapped) return null;
  if (!activeOrganizationId) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  const bootstrap = useSessionStore((s) => s.bootstrap);
  const setSession = useSessionStore((s) => s.setSession);

  useEffect(() => {
    bootstrap();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, [bootstrap, setSession]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/"
          element={
            <RequireOrg>
              <DashboardPage />
            </RequireOrg>
          }
        />
        <Route
          path="/decisions"
          element={
            <RequireOrg>
              <DecisionsPage />
            </RequireOrg>
          }
        />
        <Route
          path="/meetings"
          element={
            <RequireOrg>
              <MeetingsPage />
            </RequireOrg>
          }
        />
        <Route
          path="/search"
          element={
            <RequireOrg>
              <SearchPage />
            </RequireOrg>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
