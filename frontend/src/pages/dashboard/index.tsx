import React, { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  clearAllTransactionsMutationFn,
  getAccountsQueryFn,
  getCategoryBreakdownQueryFn,
  getDashboardSummaryQueryFn,
  getMonthlyTrendsQueryFn,
  getTransactionsQueryFn,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { UploadStatementModal } from "@/components/finance/UploadStatementModal";
import { usePrivacy } from "@/context/privacy-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatProperName, formatTableDate } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { Skeleton, TableRowsSkeleton } from "@/components/ui/skeleton";
import { MacSpinner } from "@/components/ui/mac-spinner";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Landmark,
  Percent,
  Receipt,
  RotateCcw,
  Trash2,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Link } from "react-router-dom";

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#64748b", // slate
];

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { isPrivacyMode, togglePrivacyMode, formatCurrency } = usePrivacy();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

  const startDateStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDateStr = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;

  const clearMutation = useMutation({
    mutationFn: clearAllTransactionsMutationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["financeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMonthly"] });
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
      queryClient.invalidateQueries({ queryKey: ["financePeople"] });
      queryClient.invalidateQueries({ queryKey: ["financeMerchants"] });
      queryClient.invalidateQueries({ queryKey: ["financeCoverage"] });
      setIsClearModalOpen(false);
      toast({
        title: "Database Cleared",
        description: `Successfully removed ${data.deletedTransactionsCount} transactions and reset balances.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error Clearing Transactions",
        description:
          err.response?.data?.message || err.message || "Failed to clear transactions",
        variant: "destructive",
      });
    },
  });

  // Queries
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["financeAccounts"],
    queryFn: getAccountsQueryFn,
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["financeDashboard", selectedAccountId, startDateStr, endDateStr],
    queryFn: () =>
      getDashboardSummaryQueryFn({
        accountId: selectedAccountId,
        startDate: startDateStr,
        endDate: endDateStr,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: monthlyTrends = [], isLoading: isTrendsLoading } = useQuery({
    queryKey: ["financeMonthly", selectedAccountId],
    queryFn: () =>
      getMonthlyTrendsQueryFn({
        accountId: selectedAccountId,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["financeCategories", selectedAccountId, startDateStr, endDateStr],
    queryFn: () =>
      getCategoryBreakdownQueryFn({
        accountId: selectedAccountId,
        startDate: startDateStr,
        endDate: endDateStr,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: recentTxData, isLoading: isRecentTxLoading } = useQuery({
    queryKey: [
      "financeTransactions",
      selectedAccountId,
      startDateStr,
      endDateStr,
      txPage,
      txPageSize,
    ],
    queryFn: () =>
      getTransactionsQueryFn({
        accountId: selectedAccountId !== "all" ? selectedAccountId : undefined,
        startDate: startDateStr,
        endDate: endDateStr,
        page: txPage,
        limit: txPageSize,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full min-w-0 max-w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Financial Overview
            </h1>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              PesaFlow
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Reconciled bank intelligence for NMB & CRDB statements.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Account Filter - Modern Radix Select */}
          <Select
            value={selectedAccountId}
            onValueChange={(val) => {
              setSelectedAccountId(val);
              setTxPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] sm:w-[210px] h-9 text-xs">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Accounts ({accounts.length})
              </SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id}>
                  {acc.bankName} - {acc.accountNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setTxPage(1);
            }}
            placeholder="All Dates (Filter...)"
          />

          {/* Privacy Mode Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={togglePrivacyMode}
            className={`h-9 px-2.5 text-xs transition-colors ${
              isPrivacyMode
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isPrivacyMode ? "Show amounts" : "Hide amounts"}
          >
            {isPrivacyMode ? (
              <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>

          {/* Upload Button */}
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Statement
          </Button>

          {/* Clear All Transactions Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40"
            title="Clear all transactions from database"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear Data
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))
        ) : (
          <>
            {/* Total Money In */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total Money In
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(summary?.totalMoneyIn)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">
                  Salary: {formatCurrency(summary?.salaryIncome)}
                </span>
                <span>•</span>
                <span>Others: {formatCurrency(summary?.otherIncome)}</span>
              </div>
            </div>

            {/* Total Money Out */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Total Money Out
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(summary?.totalMoneyOut)}
              </div>
              <div className="mt-2 text-xs text-rose-600 font-medium">
                Incl. {formatCurrency(summary?.costOfBanking.totalFees)} in fees
              </div>
            </div>

            {/* Net Cashflow */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Net Savings / Flow
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-black tracking-tight ${
                  (summary?.netCashflow || 0) >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-rose-600"
                }`}
              >
                {formatCurrency(summary?.netCashflow)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Received minus expenditures
              </div>
            </div>

            {/* Bank Balance Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                  Bank Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(
                  selectedAccountId === "all"
                    ? summary?.combinedBalance
                    : accounts.find((a) => a._id === selectedAccountId)?.currentBalance
                )}
              </div>
              <div className="mt-2 text-xs text-purple-600 font-medium truncate">
                {selectedAccountId === "all"
                  ? `Across ${accounts.length} connected accounts`
                  : `${accounts.find((a) => a._id === selectedAccountId)?.bankName} • ${accounts.find((a) => a._id === selectedAccountId)?.accountName || accounts.find((a) => a._id === selectedAccountId)?.accountNumber}`}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cost of Banking Spotlight Card */}
      {isSummaryLoading ? (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-52 bg-slate-800/80" />
              <Skeleton className="h-9 w-44 bg-slate-800/80" />
              <Skeleton className="h-3.5 w-72 bg-slate-800/80" />
            </div>
            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-slate-800/80" />
                  <Skeleton className="h-5 w-24 bg-slate-800/80" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                  Cost of Banking & Transfer Levies
                </h3>
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {formatCurrency(summary?.costOfBanking.totalFees)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Transfer fees, ATM charges & telecom levies represent{" "}
                <span className="text-emerald-400 font-bold">
                  {summary?.costOfBanking.feePercentageOfOutflow.toFixed(2)}%
                </span>{" "}
                of your total spending.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
              <div>
                <div className="text-[11px] text-slate-400">P2P Sending Fees</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(summary?.costOfBanking.p2pTransferFees)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">ATM / Agent Fees</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(summary?.costOfBanking.cashWithdrawalFees)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Account Fees</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(summary?.costOfBanking.standaloneBankFees)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border dark:border-slate-800 bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Monthly Cashflow Trends
              </h3>
              <p className="text-xs text-muted-foreground">
                Inflow (Green) vs Outflow (Red) across 2026
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {isTrendsLoading ? (
              <div className="h-full flex flex-col justify-end gap-2 pb-2">
                <div className="flex-1 flex items-end justify-around gap-2 px-4 pb-2 border-b dark:border-slate-800">
                  {[45, 75, 30, 60, 85, 40, 95, 50].map((h, i) => (
                    <div key={i} className="flex gap-1.5 items-end h-full">
                      <Skeleton
                        className="w-3.5 sm:w-5 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                      <Skeleton
                        className="w-3.5 sm:w-5 rounded-t bg-slate-300 dark:bg-slate-700"
                        style={{ height: `${Math.max(15, h - 25)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-around px-4">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m, i) => (
                    <Skeleton key={i} className="h-3 w-6 sm:w-8" />
                  ))}
                </div>
              </div>
            ) : monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <XAxis dataKey="monthName" stroke="#888888" fontSize={11} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickFormatter={(val) => (isPrivacyMode ? "••••" : `${(val / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip
                    formatter={(val: any) =>
                      isPrivacyMode ? "•••••• TZS" : `${Number(val).toLocaleString()} TZS`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="moneyReceived"
                    name="Money In"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="moneyOut"
                    name="Money Out"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No monthly data yet. Upload a statement to populate trends.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="p-5 rounded-2xl border dark:border-slate-800 bg-card shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Spending Distribution
            </h3>
            <p className="text-xs text-muted-foreground">
              By Group & Category
            </p>
          </div>

          <div className="h-[180px] w-full">
            {isCategoriesLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <div className="absolute w-16 h-16 rounded-full bg-card" />
                </div>
              </div>
            ) : categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.slice(0, 5)}
                    dataKey="totalCost"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categories.slice(0, 5).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) =>
                      isPrivacyMode ? "•••••• TZS" : `${Number(val).toLocaleString()} TZS`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No category data yet.
              </div>
            )}
          </div>

          {/* Top 4 Categories List */}
          <div className="space-y-2 mt-3 pt-3 border-t dark:border-slate-800 text-xs">
            {isCategoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))
            ) : (
              categories.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate max-w-[150px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate">{c.category}</span>
                  </div>
                  <div className="font-semibold font-mono">
                    {formatCurrency(c.totalCost)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Ledger Widget */}
      <div className="p-5 rounded-2xl border dark:border-slate-800 bg-card shadow-sm w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-muted-foreground">
              Extracted from your latest statement uploads
            </p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            View Full Ledger
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isRecentTxLoading ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin w-full max-w-full">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground border-b dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Bank</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Description / Person</th>
                    <th className="p-3 font-semibold text-right">Amount</th>
                    <th className="p-3 font-semibold text-right">Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  <TableRowsSkeleton rows={txPageSize} columns={7} />
                </tbody>
              </table>
            </div>
          </div>
        ) : recentTxData?.transactions && recentTxData.transactions.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin w-full max-w-full">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground border-b dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Bank</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Description / Person</th>
                    <th className="p-3 font-semibold text-right">Amount</th>
                    <th className="p-3 font-semibold text-right">Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {recentTxData.transactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                        {formatTableDate(tx.date)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                          style={{
                            backgroundColor:
                              tx.accountId?.color ||
                              (tx.accountId?.bankName === "CRDB"
                                ? "#008850"
                                : "#f58220"),
                          }}
                        >
                          {tx.accountId?.bankName || "BANK"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === "IN"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-medium whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="p-3 max-w-xs truncate text-muted-foreground">
                        {formatProperName(tx.person || tx.counterpartyName || tx.rawNarration)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {tx.fees > 0 ? formatCurrency(tx.fees) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {recentTxData.pagination && (
              <TablePagination
                page={txPage}
                pageSize={txPageSize}
                totalItems={recentTxData.pagination.total}
                onPageChange={setTxPage}
                onPageSizeChange={setTxPageSize}
                itemLabel="transactions"
              />
            )}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">No transactions imported yet</p>
            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Upload Statement
            </Button>
          </div>
        )}
      </div>

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={isUploadModalOpen}
        setIsOpen={setIsUploadModalOpen}
        accounts={accounts}
        selectedAccountId={selectedAccountId !== "all" ? selectedAccountId : undefined}
      />

      {/* Confirmation Modal to Clear All Data */}
      <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Clear All Financial Data?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              This will permanently delete all <strong>{summary?.totalTransactionsCount || 0}</strong> transactions and statement uploads from your database.
              <br /><br />
              Your bank accounts will remain saved and their balances will be reset to 0 so you can start fresh or re-import statements anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2.5 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsClearModalOpen(false)}
              disabled={clearMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white min-w-[130px]"
            >
              {clearMutation.isPending ? (
                <>
                  <MacSpinner size="sm" className="mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Yes, Clear All
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
