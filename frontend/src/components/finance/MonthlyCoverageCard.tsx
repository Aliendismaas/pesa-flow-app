import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMonthlyCoverageQueryFn, MonthlyCoverageItem } from "@/lib/api";
import { CalendarCheck, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { usePrivacy } from "@/context/privacy-provider";

interface MonthlyCoverageCardProps {
  accountId?: string;
  onUploadClick?: () => void;
}

export const MonthlyCoverageCard: React.FC<MonthlyCoverageCardProps> = ({
  accountId,
  onUploadClick,
}) => {
  const { formatCurrency, isPrivacyMode } = usePrivacy();
  const { data: coverage = [], isLoading } = useQuery({
    queryKey: ["financeCoverage", accountId],
    queryFn: () => getMonthlyCoverageQueryFn({ accountId }),
  });

  return (
    <div className="rounded-2xl border dark:border-slate-800 bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b dark:border-slate-800">
        <div>
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Monthly Statement Coverage & Reconciled Records
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Month-by-month reconciliation summary from your uploaded banking statements.
          </p>
        </div>
        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto transition-colors"
          >
            + Upload Month
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Loading monthly coverage...
        </div>
      ) : coverage.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No statement records uploaded yet. Upload your first statement to begin tracking.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {coverage.map((item: MonthlyCoverageItem) => (
            <div
              key={item.month}
              className="p-3.5 rounded-xl border dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.monthName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {item.count} txs
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    Inflow:
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.inflow)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                    Outflow:
                  </span>
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(item.outflow)}
                  </span>
                </div>
                <div className="pt-1.5 mt-1 border-t dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Net Cashflow:</span>
                  <span
                    className={`font-mono font-bold ${
                      item.net >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPrivacyMode ? "•••••• TZS" : `${item.net >= 0 ? "+" : ""}${item.net.toLocaleString()} TZS`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
