import React from "react";
import EnableMfa from "@/components/EnableMfa";
import Sessions from "@/components/Sessions";
import { ShieldCheck, ShieldAlert, Laptop, Lock, CheckCircle2, Shield } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { sessionsQueryFn } from "@/lib/api";

const Home = () => {
  const { user } = useAuthContext();
  const is2FAEnabled = Boolean(user?.userPreferences?.enable2FA);

  const { data: sessionData } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsQueryFn,
    staleTime: 60 * 1000,
  });

  const sessionCount = sessionData?.sessions?.length || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-7 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            <span>Security & Authentication</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Safeguard your PesaFlow account with multi-factor authentication and monitor active device sessions.
          </p>
        </div>
      </div>

      {/* Security Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: 2FA Status */}
        <div className="p-5 rounded-2xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2FA Protection
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                is2FAEnabled
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {is2FAEnabled ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {is2FAEnabled ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Disabled</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {is2FAEnabled
                ? "TOTP authenticator app verification"
                : "Action recommended for full protection"}
            </p>
          </div>
        </div>

        {/* Card 2: Active Sessions */}
        <div className="p-5 rounded-2xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {sessionCount} {sessionCount === 1 ? "Device" : "Devices"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Signed in across browsers & mobile apps
            </p>
          </div>
        </div>

        {/* Card 3: Security Posture */}
        <div className="p-5 rounded-2xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Security Rating
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-xl font-black ${
                is2FAEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {is2FAEnabled ? "Strong Protection" : "Moderate Security"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {is2FAEnabled
                ? "Your financial records are well protected"
                : "Enable 2FA to upgrade to Strong"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-6">
        {/* Section 1: 2FA Management */}
        <div>
          <EnableMfa />
        </div>

        {/* Section 2: Active Sessions Management */}
        <div>
          <Sessions />
        </div>
      </div>
    </div>
  );
};

export default Home;
