import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheckIcon,
  ShieldCheck,
  User,
  Clock,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { toast } from "@/hooks/use-toast";
import { registerMutationFn } from "@/lib/api";
import { Link } from "react-router-dom";

export default function SignUp() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  const formSchema = z
    .object({
      name: z.string().trim().min(1, {
        message: "Full name is required",
      }),
      email: z
        .string()
        .trim()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
      password: z.string().trim().min(6, {
        message: "Password must be at least 6 characters",
      }),
      confirmPassword: z.string().trim().min(1, {
        message: "Please confirm your password",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: (error) => {
        toast({
          title: "Registration Failed",
          description: error.message || "Unable to create account. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border/70 shadow-xl p-5 sm:p-6 backdrop-blur-sm">
      {!isSubmitted ? (
        <div>
          {/* Top Header & Branding */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-2">
              <Logo size="38px" fontSize="20px" url="/" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 mb-1.5 shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Create PesaFlow Account</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Get started with PesaFlow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs leading-normal">
              Take control of your bank statements and financial analytics.
            </p>
          </div>

          {/* Registration Form */}
          <div className="mt-3.5">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            placeholder="John Doe"
                            className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm shadow-xs"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px] text-rose-500" />
                    </FormItem>
                  )}
                />

                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            type="email"
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
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            type={showPassword ? "text" : "password"}
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

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            className="pl-10 pr-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm shadow-xs"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            title={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? (
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

                {/* Create Account Button */}
                <Button
                  disabled={isPending}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 text-sm"
                  type="submit"
                >
                  {isPending ? (
                    <>
                      <MacSpinner size="sm" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Separator */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold text-[10px] tracking-wider">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Back to sign in */}
          <div>
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              Sign in instead
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
            <Clock className="w-7 h-7" />
          </div>

          <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
            Pending Super Admin Review
          </span>

          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Registration Received!
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
            Thank you for registering,{" "}
            <strong className="text-slate-900 dark:text-white">
              {form.getValues().name}
            </strong>
            . Your application has been submitted to the Super Admin for review. You will receive an email at{" "}
            <strong className="text-slate-900 dark:text-white">
              {form.getValues().email}
            </strong>{" "}
            once your account is approved.
          </p>

          <Link to="/" className="w-full mt-5">
            <Button className="w-full h-10.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md gap-2 text-sm">
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
