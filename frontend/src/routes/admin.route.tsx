import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/mac-spinner";

const AdminRoute: React.FC = () => {
  const { data, isLoading } = useAuth();
  const user = data?.data?.user;

  if (isLoading) {
    return <PageLoader text="Verifying administrative access..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "SUPER_ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
