import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { exitImpersonationMutationFn } from "@/lib/api";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { ShieldAlert, LogOut, UserCheck } from "lucide-react";

export const ImpersonationBanner: React.FC = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const exitMutation = useMutation({
    mutationFn: exitImpersonationMutationFn,
    onSuccess: () => {
      toast({
        title: "Exited Impersonation Mode",
        description: "Your Super Admin session has been safely restored.",
      });
      // Invalidate and refetch auth user and finance queries
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      navigate("/admin/users");
    },
    onError: (error: any) => {
      toast({
        title: "Error Exiting Impersonation",
        description:
          error?.response?.data?.message || "Failed to exit impersonation mode",
        variant: "destructive",
      });
    },
  });

  if (!user?.isImpersonated) {
    return null;
  }

  return (
    <aside
      aria-label="Impersonation Active"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-b border-amber-500/30 backdrop-blur-md px-4 py-2 text-xs sm:text-sm text-amber-950 dark:text-amber-200 transition-all shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>

          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />

          <p className="truncate">
            <span className="font-bold tracking-tight text-amber-900 dark:text-amber-100">
              Impersonation Active:
            </span>{" "}
            Viewing workspace as{" "}
            <span className="font-semibold underline decoration-amber-400/50 underline-offset-2">
              {user.name} ({user.email})
            </span>
            {user.impersonatedBy?.name && (
              <span className="hidden md:inline text-amber-800/80 dark:text-amber-300/80 ml-1.5 text-xs">
                (Logged in by {user.impersonatedBy.name})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => exitMutation.mutate()}
            disabled={exitMutation.isPending}
            className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all"
          >
            {exitMutation.isPending ? (
              <>
                <MacSpinner size="xs" className="mr-1.5" />
                Restoring Admin...
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Exit Impersonation
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};
export default ImpersonationBanner;
