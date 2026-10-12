import React from "react";
import { LogOut, CheckCircle } from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { Button } from "@/components/ui/button";
import { parseSession } from "@/lib/parse-session";

interface SessionItemProps {
  loading?: boolean;
  userAgent: string;
  date: string;
  expiresAt?: string;
  isCurrent?: boolean;
  onRemove?: () => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  userAgent,
  loading,
  date,
  isCurrent = false,
  onRemove,
}) => {
  const { os, browser, deviceType, timeAgo, icon: Icon } = parseSession(
    userAgent,
    date
  );

  return (
    <div
      className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
        isCurrent
          ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
          : "border-slate-200/80 dark:border-slate-800 bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isCurrent
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {os}
            </h5>
            <span className="text-xs text-muted-foreground font-normal">
              • {browser}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCurrent ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Current Device (Active)
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Signed in: {timeAgo}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="capitalize">{deviceType}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        {isCurrent ? (
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>In Use</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={loading}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-xs font-semibold h-8 px-3 gap-1.5 transition-colors"
            title="Log out of this session"
          >
            {loading ? (
              <MacSpinner size="xs" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Sign Out</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionItem;
