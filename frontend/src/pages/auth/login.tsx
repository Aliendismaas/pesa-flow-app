import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "@/hooks/use-toast";
import { loginMutationFn } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: loginMutationFn,
  });

  const formSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
    password: z.string().trim().min(1, {
      message: "Password is required",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: (response) => {
        if (response.data?.mfaRequired) {
          toast({
            title: "2FA Verification Required",
            description: "Please enter the code from your authenticator app.",
          });
          navigate(`/verify-mfa?email=${encodeURIComponent(values.email)}`);
          return;
        }
        toast({
          title: "Welcome Back",
          description: "Signed in successfully to PesaFlow.",
        });
        navigate("/home");
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        const errorCode = errorData?.errorCode;
        const errorMessage = errorData?.message || error?.message;

        if (errorCode === "AUTH_ACCOUNT_PENDING_APPROVAL") {
          toast({
            title: "Account Pending Approval",
            description:
              errorMessage ||
              "Your registration is currently awaiting Super Admin review. You will receive an email once approved.",
          });
        } else if (errorCode === "AUTH_ACCOUNT_SUSPENDED") {
          toast({
            title: "Account Suspended",
            description:
              errorMessage ||
              "Your account has been suspended by the administrator. Please contact support.",
            variant: "destructive",
          });
        } else if (errorCode === "AUTH_ACCOUNT_REJECTED") {
          toast({
            title: "Registration Declined",
            description:
              errorMessage ||
              "Your account application was declined by the administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign-In Failed",
            description:
              errorMessage || "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        }
      },
    });
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border/70 shadow-xl p-5 sm:p-6 backdrop-blur-sm">
      {/* Top Header & Branding */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">
          <Logo size="38px" fontSize="20px" url="/" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 mb-1.5 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Secure PesaFlow Login</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Welcome back
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs leading-normal">
          Sign in to manage your bank statements and finances.
        </p>
      </div>

      {/* Login Form */}
      <div className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Email Address */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm shadow-xs"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-500" />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </FormLabel>
                    <Link
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
                      to={`/forgot-password?email=${encodeURIComponent(
                        form.getValues().email
                      )}`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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
                  <FormMessage className="text-[11px] text-rose-500" />
                </FormItem>
              )}
            />

            {/* Sign In Button */}
            <Button
              disabled={isPending}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 text-sm"
              type="submit"
            >
              {isPending ? (
                <>
                  <MacSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Separator */}
      <div className="relative my-3.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-semibold text-[10px] tracking-wider">
            New to PesaFlow?
          </span>
        </div>
      </div>

      {/* Create Account Link */}
      <div>
        <Link
          to="/signup"
          className="w-full inline-flex items-center justify-center h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
        >
          Create a new account
        </Link>
      </div>
    </div>
  );
}
