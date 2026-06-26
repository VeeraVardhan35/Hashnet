import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

/**
 * ProtectedRoute — guards routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 * Use as a wrapper route: <Route element={<ProtectedRoute />}>
 */
export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
