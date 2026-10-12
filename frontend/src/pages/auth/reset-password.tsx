"use client";
import { useState } from "react";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { resetPasswordMutationFn } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [params] = useSearchParams();
  const code = params.get("code");
  const exp = Number(params.get("exp"));
  const now = Date.now();

  const isValid = Boolean(code && exp && exp > now);

  const { mutate, isPending } = useMutation({
    mutationFn: resetPasswordMutationFn,
  });

  const formSchema = z
    .object({
      password: z.string().trim().min(6, {
        message: "Password must be at least 6 characters",
      }),
      confirmPassword: z.string().trim().min(1, {
        message: "Please confirm your new password",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!code) {
      navigate("/forgot-password?email=");
      return;
    }
    const data = {
      password: values.password,
      verificationCode: code,
    };
    mutate(data, {
      onSuccess: () => {
        toast({
          title: "Password Updated",
          description: "Your password has been reset successfully. Please log in.",
        });
        navigate("/");
      },
      onError: (error) => {
        toast({
          title: "Reset Failed",
          description: error.message || "Failed to reset password. Link may have expired.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border/70 shadow-xl p-5 sm:p-6 backdrop-blur-sm">
        {isValid ? (
          <div>
            {/* Top Branding & Header */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">
                <Logo size="46px" fontSize="24px" url="/" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Set a new password
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Choose a strong password to protect your PesaFlow account.
              </p>
            </div>

            {/* Form */}
            <div className="mt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••••••"
                              className="pl-10 pr-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm shadow-xs"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Confirm New Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••••••"
                              className="pl-10 pr-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm shadow-xs"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  <Button
                    disabled={isPending}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    type="submit"
                  >
                    {isPending ? (
                      <>
                        <MacSpinner size="sm" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Link Expired or Invalid
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              This password reset link is invalid or has expired for security reasons.
            </p>

            <Link to="/forgot-password" className="w-full mt-6">
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Request New Reset Link</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
  );
}
