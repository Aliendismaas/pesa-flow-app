"use client";
import React, { useCallback, useState } from "react";
import { z } from "zod";
import {
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { useForm } from "react-hook-form";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/auth-provider";
import { mfaSetupQueryFn, verifyMFAMutationFn } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import RevokeMfa from "./RevokeMfa";

type MfaResponse = {
  message: string;
  secret: string;
  qrImageUrl: string;
};

const EnableMfa = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const is2FAEnabled = Boolean(user?.userPreferences?.enable2FA);

  const [showKey, setShowKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<MfaResponse>({
    queryKey: ["mfa-setup"],
    queryFn: mfaSetupQueryFn,
    enabled: isOpen && !is2FAEnabled,
    staleTime: Infinity,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: verifyMFAMutationFn,
  });

  const mfaData = data || ({} as MfaResponse);

  const FormSchema = z.object({
    pin: z.string().min(6, {
      message: "Please enter all 6 digits of the verification code.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!mfaData.secret) {
      toast({
        title: "Setup Error",
        description: "Missing setup secret. Please close and reopen the dialog.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      code: values.pin,
      secretKey: mfaData.secret,
    };

    mutate(payload, {
      onSuccess: (response) => {
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        });
        queryClient.invalidateQueries({
          queryKey: ["mfa-setup"],
        });
        form.reset();
        setIsOpen(false);
        toast({
          title: "2FA Activated!",
          description: response?.data?.message || "Two-Factor Authentication is now actively securing your account.",
        });
      },
      onError: (error) => {
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid code. Please ensure your device clock is synchronized.",
          variant: "destructive",
        });
      },
    });
  };

  const onCopy = useCallback((value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({
      title: "Copied to Clipboard",
      description: "Secret key copied. Paste it into your authenticator app.",
    });
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="rounded-2xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-7 relative overflow-hidden">
      {/* Background Accent */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20 ${
          is2FAEnabled ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              is2FAEnabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {is2FAEnabled ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication (2FA)
              </h3>
              {is2FAEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  Action Recommended
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {is2FAEnabled
                ? "Your PesaFlow account is fortified with an authenticator app. A 6-digit TOTP code is required whenever you sign in."
                : "Add a critical second layer of protection. When enabled, signing into PesaFlow requires both your password and an authenticator code."}
            </p>

            {/* Security Highlights */}
            <div className="pt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Industry-standard TOTP (RFC 6238)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Google Authenticator, 1Password, Authy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Protects bank statements & imports
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center shrink-0 self-start md:self-center">
          {is2FAEnabled ? (
            <RevokeMfa />
          ) : (
            <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-5 rounded-xl shadow-sm gap-2 transition-all">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set Up 2FA</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md sm:max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-2">
                  <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Set Up Two-Factor Authentication
                  </DialogTitle>
                  </div>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Pair your phone with PesaFlow using any standard authenticator app (Google Authenticator, 1Password, Authy, Microsoft Authenticator).
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                  {/* Step 1: Scan QR */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Scan this QR code with your app
                      </h4>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                        {isLoading || !mfaData?.qrImageUrl ? (
                          <Skeleton className="w-[140px] h-[140px] rounded-lg" />
                        ) : (
                          <img
                            alt="MFA QR Code"
                            src={mfaData?.qrImageUrl}
                            decoding="async"
                            width="140"
                            height="140"
                            className="rounded-lg block"
                          />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Open your authenticator app, tap <strong className="text-slate-800 dark:text-slate-200">+ (Add account)</strong>, and scan the QR code.
                        </p>

                        {!showKey ? (
                          <button
                            type="button"
                            onClick={() => setShowKey(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Can't scan QR? View Secret Key
                          </button>
                        ) : (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                              Manual Setup Key
                            </span>
                            <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate flex-1">
                                {mfaData?.secret}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 shrink-0"
                                onClick={() => onCopy(mfaData?.secret)}
                                title="Copy Secret Key"
                              >
                                {copied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Verification Code */}
                  <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Enter the 6-digit confirmation code
                      </h4>
                    </div>

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="pin"
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-center sm:items-start">
                              <FormLabel className="text-xs text-muted-foreground font-normal">
                                Enter the dynamic code currently displayed in your app:
                              </FormLabel>
                              <FormControl>
                                <InputOTP
                                  maxLength={6}
                                  pattern={REGEXP_ONLY_DIGITS}
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    if (val.length === 6) {
                                      form.handleSubmit(onSubmit)();
                                    }
                                  }}
                                >
                                  <InputOTPGroup className="gap-1.5 sm:gap-2">
                                    <InputOTPSlot
                                      index={0}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                    <InputOTPSlot
                                      index={1}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                    <InputOTPSlot
                                      index={2}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                  </InputOTPGroup>

                                  <div className="text-muted-foreground font-light px-1 select-none">
                                    -
                                  </div>

                                  <InputOTPGroup className="gap-1.5 sm:gap-2">
                                    <InputOTPSlot
                                      index={3}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                    <InputOTPSlot
                                      index={4}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                    <InputOTPSlot
                                      index={5}
                                      className="!w-10 !h-12 sm:!w-12 sm:!h-13 !text-lg font-bold font-mono border-slate-200 dark:border-slate-700 rounded-lg shadow-xs"
                                    />
                                  </InputOTPGroup>
                                </InputOTP>
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isPending || isLoading || form.watch("pin").length < 6}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm px-5 gap-2"
                          >
                            {isPending ? (
                              <>
                                <MacSpinner size="sm" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Verify & Activate</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnableMfa;
