import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/mac-spinner";

const PublicRoute = () => {
  const { data, isLoading } = useAuth();
  const user = data?.data?.user;

  if (isLoading) {
    return <PageLoader text="Loading PesaFlow..." />;
  }

  return !user ? <Outlet /> : <Navigate to="/home" replace />;
};

export default PublicRoute;
