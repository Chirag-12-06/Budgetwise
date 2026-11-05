import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ user, loading }) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}