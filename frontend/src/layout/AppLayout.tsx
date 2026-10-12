import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Asidebar from "@/components/Asidebar";
import Header from "@/components/Header";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { AuthProvider } from "@/context/auth-provider";
import { PrivacyProvider } from "@/context/privacy-provider";

const AppLayout = () => {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <ImpersonationBanner />
        <SidebarProvider className="max-w-full">
          <Asidebar />
          <SidebarInset className="min-w-0 max-w-full flex flex-col h-svh max-h-svh overflow-hidden">
            <Header />
            <main className="flex-1 w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden scrollbar-thin">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </PrivacyProvider>
    </AuthProvider>
  );
};

export default AppLayout;
