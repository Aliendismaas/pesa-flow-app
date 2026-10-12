import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import SessionItem from "./SessionItem";
import { sessionDelMutationFn, sessionsQueryFn } from "@/lib/api";
import {
  Laptop,
  ShieldCheck,
  LogOut,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const Sessions = () => {
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false);
  const [activeDeletingId, setActiveDeletingId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsQueryFn,
    staleTime: 60 * 1000,
  });

  const { mutate: deleteSessionMutate } = useMutation({
    mutationFn: sessionDelMutationFn,
  });

  const sessions = data?.sessions || [];
  const currentSession = sessions.find((session) => session.isCurrent);
  const othersSessions = sessions.filter((session) => !session.isCurrent);

  const handleDeleteSingle = useCallback(
    (id: string) => {
      setActiveDeletingId(id);
      deleteSessionMutate(id, {
        onSuccess: () => {
          setActiveDeletingId(null);
          refetch();
          toast({
            title: "Session Terminated",
            description: "The selected device session has been signed out successfully.",
          });
        },
        onError: (error) => {
          setActiveDeletingId(null);
          toast({
            title: "Action Failed",
            description: error.message || "Failed to terminate session.",
            variant: "destructive",
          });
        },
      });
    },
    [deleteSessionMutate, refetch]
  );

  const handleRevokeAllOthers = async () => {
    if (othersSessions.length === 0) return;
    setRevokingAll(true);
    try {
      await Promise.all(
        othersSessions.map((s) => sessionDelMutationFn(s._id))
      );
      toast({
        title: "All Other Sessions Revoked",
        description: `Successfully logged out of ${othersSessions.length} other ${
          othersSessions.length === 1 ? "device" : "devices"
        }.`,
      });
      setConfirmRevokeAllOpen(false);
      refetch();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to revoke some sessions.",
        variant: "destructive",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Laptop className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Active Devices & Sessions
              </h3>
              {!isLoading && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Devices and browsers currently logged into your PesaFlow account. If you spot an unrecognized device, sign out immediately to protect your data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh Sessions"
          >
            {isFetching ? (
              <MacSpinner size="xs" className="mr-1.5 text-emerald-600" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Refresh</span>
          </Button>

          {othersSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRevokeAllOpen(true)}
              disabled={revokingAll}
              className="h-9 text-xs font-semibold border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out All Others</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Current Session */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Current Active Session
              </h4>
            </div>

            {currentSession ? (
              <SessionItem
                userAgent={currentSession.userAgent}
                date={currentSession.createdAt}
                expiresAt={currentSession.expiresAt}
                isCurrent={true}
              />
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-muted-foreground">
                Current session details are loading or unavailable.
              </div>
            )}
          </div>

          {/* Section 2: Other Sessions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Other Signed-in Devices ({othersSessions.length})
              </h4>
            </div>

            {othersSessions.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Other Active Devices
                </h5>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Your PesaFlow account is only currently logged in on this browser. You have no lingering sessions on other phones or computers.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {othersSessions.map((session) => (
                  <SessionItem
                    key={session._id}
                    userAgent={session.userAgent}
                    date={session.createdAt}
                    expiresAt={session.expiresAt}
                    loading={activeDeletingId === session._id}
                    onRemove={() => handleDeleteSingle(session._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke All Others Confirmation Modal */}
      <Dialog
        open={confirmRevokeAllOpen}
        onOpenChange={setConfirmRevokeAllOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
              <LogOut className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Log Out All Other Devices?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will immediately sign out of all other {othersSessions.length} active{" "}
              {othersSessions.length === 1 ? "device" : "devices"}. You will remain logged in on this current browser.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRevokeAllOpen(false)}
              disabled={revokingAll}
              className="sm:w-1/2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevokeAllOthers}
              disabled={revokingAll}
              className="sm:w-1/2 gap-1.5"
            >
              {revokingAll ? (
                <>
                  <MacSpinner size="sm" />
                  <span>Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Yes, Sign Out All</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
