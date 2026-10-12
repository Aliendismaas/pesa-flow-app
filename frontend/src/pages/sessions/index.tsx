import React from "react";
import Sessions from "@/components/Sessions";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";

const SessionPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-emerald-600" />
            <span>Active Sessions</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage active browsers, phones, and computers currently logged into your PesaFlow account.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Sessions />
    </div>
  );
};

export default SessionPage;
