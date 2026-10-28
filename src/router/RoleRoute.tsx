import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/AuthProvider";

type RoleRouteProps = {
  role: "admin" | "organizer" | "authenticated";
  children: ReactNode;
};

export default function RoleRoute({ role, children }: RoleRouteProps) {
  const { user, loading, profileLoading, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return <div className="px-4 py-20 text-center text-sm text-foreground-600">Checking your access…</div>;
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }

  const allowed = role === "authenticated" || (role === "admin" ? isAdmin : isOrganizer);
  if (!allowed) return <Navigate to="/account" replace />;

  return children;
}
