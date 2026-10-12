"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { forgotPasswordMutationFn } from "@/lib/api";
import { ArrowLeft, ArrowRight, KeyRound, Mail, MailCheckIcon } from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { toast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";

export default function ForgotPassword() {
  const [param] = useSearchParams();
  const email = param.get("email");

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPasswordMutationFn,
  });

  const formSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: (error) => {
        toast({
          title: "Request Failed",
          description: error.message || "Unable to send reset instructions. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border/70 shadow-xl p-5 sm:p-6 backdrop-blur-sm">
        {!isSubmitted ? (
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
                Reset your password
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Enter your email address and we'll send you a secure link to reset your account credentials.
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
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
                        <FormMessage className="text-xs text-rose-500 mt-1" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isPending ? (
                      <>
                        <MacSpinner size="sm" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Instructions</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Back to sign in */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
              <MailCheckIcon className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Instructions sent
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              We dispatched password reset instructions to{" "}
              <strong className="text-slate-900 dark:text-white">
                {form.getValues().email}
              </strong>
              . Check your inbox and spam folder.
            </p>

            <Link to="/" className="w-full mt-6">
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md gap-2">
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
  );
};
