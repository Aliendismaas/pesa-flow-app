import React, { useState } from "react";
import { ShieldOff, AlertTriangle } from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeMFAMutationFn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const RevokeMfa = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: revokeMFAMutationFn,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: ["authUser"],
      });
      queryClient.invalidateQueries({
        queryKey: ["mfa-setup"],
      });
      setOpen(false);
      toast({
        title: "2FA Disabled",
        description: response?.message || "Two-factor authentication has been turned off.",
      });
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRevoke = () => {
    mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold h-9 px-3.5 gap-2 transition-colors"
        >
          <ShieldOff className="w-4 h-4" />
          <span>Disable 2FA</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Disable Two-Factor Authentication?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Removing 2FA leaves your account protected only by your email and password. Any unauthorized access to your password could compromise your financial records.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <strong>Security Recommendation:</strong> We strongly advise keeping two-factor authentication enabled to protect your linked bank accounts and transaction history.
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="sm:w-1/2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            className="sm:w-1/2 gap-1.5"
          >
            {isPending ? (
              <>
                <MacSpinner size="sm" />
                <span>Disabling...</span>
              </>
            ) : (
              <>
                <ShieldOff className="w-4 h-4" />
                <span>Yes, Disable 2FA</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RevokeMfa;
