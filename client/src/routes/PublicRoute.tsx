import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

/**
 * PublicRoute — guards routes that should NOT be accessible when
 * the user is already logged in (e.g., /login, /register).
 * Redirects authenticated users to /home.
 */
export default function PublicRoute() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
