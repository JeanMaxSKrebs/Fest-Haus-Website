import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function AdminRoute({ children }: Props) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}