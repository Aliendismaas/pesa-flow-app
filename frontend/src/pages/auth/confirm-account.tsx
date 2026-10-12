import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { toast } from "@/hooks/use-toast";
import { verifyEmailMutationFn } from "@/lib/api";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function ConfirmAccount() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get("code");

  const { mutate, isPending } = useMutation({
    mutationFn: verifyEmailMutationFn,
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!code) {
      toast({
        title: "Missing Token",
        description: "Account confirmation token was not found in the link.",
        variant: "destructive",
      });
      return;
    }
    mutate(
      { code },
      {
        onSuccess: () => {
          toast({
            title: "Account Activated!",
            description: "Your PesaFlow account has been verified successfully.",
          });
          navigate(`/home`);
        },
        onError: (error) => {
          toast({
            title: "Verification Failed",
            description: error.message || "Failed to confirm account. Link may have expired.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border/70 shadow-xl p-5 sm:p-6 backdrop-blur-sm">
        {/* Top Branding & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <Logo size="46px" fontSize="24px" url="/" />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Confirm your account
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Click below to verify your email address and unlock your PesaFlow dashboard.
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <MacSpinner size="sm" />
                <span>Confirming Account...</span>
              </>
            ) : (
              <>
                <span>Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need help? Contact our support team at{" "}
            <a
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              href="mailto:support@pesaflow.com"
            >
              support@pesaflow.com
            </a>
          </p>
        </div>
      </div>
  );
}
