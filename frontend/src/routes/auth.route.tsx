import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/mac-spinner";

const AuthRoute = () => {
  const { data, isLoading } = useAuth();
  const user = data?.data?.user;

  if (isLoading) {
    return <PageLoader text="Verifying session..." />;
  }

  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default AuthRoute;
