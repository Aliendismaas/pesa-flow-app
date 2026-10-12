import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AccountItem,
  commitStatementMutationFn,
  previewStatementMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { usePrivacy } from "@/context/privacy-provider";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatTableDate } from "@/lib/utils";
import { MacSpinner } from "@/components/ui/mac-spinner";

interface UploadStatementModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  accounts: AccountItem[];
  selectedAccountId?: string;
}

export const UploadStatementModal: React.FC<UploadStatementModalProps> = ({
  isOpen,
  setIsOpen,
  accounts,
  selectedAccountId,
}) => {
  const queryClient = useQueryClient();
  const { formatCurrency } = usePrivacy();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState(
    selectedAccountId || accounts[0]?._id || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [step, setStep] = useState<"SELECT" | "PREVIEW" | "SUCCESS">("SELECT");
  const [uploadScope, setUploadScope] = useState<"AUTO" | "MONTH">("AUTO");
  const [targetMonth, setTargetMonth] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [tableFilter, setTableFilter] = useState<"ALL" | "NEW" | "SKIPPED">("NEW");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [commitResult, setCommitResult] = useState<any>(null);

  // Mutations
  const previewMutation = useMutation({
    mutationFn: previewStatementMutationFn,
    onSuccess: (data: any) => {
      setPreviewData(data.preview);
      setPage(1);
      if (data.preview.newCount === 0) {
        setTableFilter("ALL");
      } else {
        setTableFilter("NEW");
      }
      setStep("PREVIEW");
    },
    onError: (err: any) => {
      toast({
        title: "Error Parsing Statement",
        description:
          err.response?.data?.message || err.message || "Failed to parse PDF",
        variant: "destructive",
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: commitStatementMutationFn,
    onSuccess: (data: any) => {
      setCommitResult(data);
      queryClient.invalidateQueries({ queryKey: ["financeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["financeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeMonthly"] });
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
      queryClient.invalidateQueries({ queryKey: ["financePeople"] });
      queryClient.invalidateQueries({ queryKey: ["financeMerchants"] });
      queryClient.invalidateQueries({ queryKey: ["financeCoverage"] });
      setStep("SUCCESS");
      toast({
        title: data.importedCount > 0 ? "Statement Imported!" : "Records Up to Date!",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to Commit Statement",
        description:
          err.response?.data?.message || err.message || "Commit failed",
        variant: "destructive",
      });
    },
  });

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase().split(".").pop() || "";
    if (!["pdf", "xlsx", "xls", "csv"].includes(ext)) {
      toast({
        title: "Unsupported File Format",
        description: `"${selectedFile.name}" is not supported. Please upload a PDF or Excel statement (.pdf, .xlsx, .csv).`,
        variant: "destructive",
      });
      return false;
    }

    if (selectedFile.size > 30 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "The statement file exceeds 30MB limit. Please upload a smaller file.",
        variant: "destructive",
      });
      return false;
    }

    setFile(selectedFile);
    toast({
      title: "File Selected",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    });
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartParsing = () => {
    if (!accountId || !file) return;
    const formData = new FormData();
    formData.append("accountId", accountId);
    formData.append("file", file);
    if (uploadScope === "MONTH" && targetMonth) {
      formData.append("targetMonth", targetMonth);
    }
    previewMutation.mutate(formData);
  };

  const handleConfirmCommit = () => {
    if (!accountId || !file) return;
    const formData = new FormData();
    formData.append("accountId", accountId);
    formData.append("file", file);
    if (uploadScope === "MONTH" && targetMonth) {
      formData.append("targetMonth", targetMonth);
    }
    commitMutation.mutate(formData);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("SELECT");
      setFile(null);
      setPreviewData(null);
      setCommitResult(null);
      setUploadScope("AUTO");
      setTargetMonth("");
      setIsDragging(false);
    }, 200);
  };

  // Filtered transactions in table
  const displayedTransactions = previewData?.transactions.filter((tx: any) => {
    if (tableFilter === "NEW") return !tx.isExisting;
    if (tableFilter === "SKIPPED") return tx.isExisting;
    return true;
  }) || [];

  const paginatedTransactions = displayedTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl sm:max-w-2xl lg:max-w-[740px] max-h-[92vh] overflow-y-auto p-4 sm:p-5 scrollbar-thin">
        <DialogHeader className="pb-0.5">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            Upload Bank Statement
          </DialogTitle>
          <DialogDescription className="text-xs">
            Import your official statement from NMB or CRDB Bank with automated deduplication.
          </DialogDescription>
        </DialogHeader>

        {step === "SELECT" && (
          <div className="space-y-3 pt-0.5">
            {/* 1. Ingestion Mode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  1. Ingestion Mode
                </label>
                <span className="text-[11px] text-muted-foreground">Select import strategy</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadScope("AUTO")}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all relative ${
                    uploadScope === "AUTO"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                      <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      Rolling Statement
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Auto Delta
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Upload any multi-month statement. Only new transactions are imported; duplicates are skipped.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadScope("MONTH")}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all relative ${
                    uploadScope === "MONTH"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                      <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      Month-to-Month
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Isolated
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Target a specific calendar month or upload single monthly statements isolated month-by-month.
                  </p>
                </button>
              </div>

              {uploadScope === "MONTH" && (
                <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Filter statement transactions to target calendar month:</span>
                  </div>
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="h-7 px-2 rounded-lg border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              )}
            </div>

            {/* 2. Destination Account */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  2. Destination Account
                </label>
                <span className="text-[11px] text-muted-foreground">Linked bank ledger</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {accounts.map((acc) => {
                  const isSelected = accountId === acc._id;
                  return (
                    <button
                      key={acc._id}
                      type="button"
                      onClick={() => setAccountId(acc._id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/25 ring-1 ring-emerald-500/30 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 shadow-xs overflow-hidden border border-slate-200/50 dark:border-slate-700"
                        style={{
                          backgroundColor: acc.logoUrl ? "#ffffff" : (acc.color || "#059669"),
                        }}
                      >
                        {acc.logoUrl ? (
                          <img
                            src={acc.logoUrl}
                            alt={acc.bankName}
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          acc.bankName?.slice(0, 3).toUpperCase()
                        )}
                      </div>
                      <div className="overflow-hidden min-w-0 flex-1">
                        <div className="font-semibold text-xs truncate text-slate-900 dark:text-white">
                          {acc.accountName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {acc.accountNumber}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Drag & Drop Statement File Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  3. Statement File (PDF / Excel / CSV)
                </label>
                <span className="text-[11px] text-muted-foreground">Max 30MB</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                /* Selected File Card */
                <div className="border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      {file.name.toLowerCase().endsWith(".pdf") ? (
                        <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-md" title={file.name}>
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-mono">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Ready to analyze
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs px-2.5"
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Drag & Drop Dropzone */
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-3.5 sm:p-4 text-center transition-all cursor-pointer group select-none ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-4 ring-emerald-500/20 scale-[1.01]"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/70 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                        isDragging
                          ? "bg-emerald-500 text-white scale-110 animate-bounce"
                          : "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-200/80 dark:group-hover:bg-emerald-900/60"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {isDragging ? (
                      <div>
                        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          Drop your statement file here
                        </div>
                        <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                          Release to attach and scan
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          Drag & drop your statement here, or{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
                            browse files
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Supports NMB & CRDB mobile statements (PDF, Excel .xlsx/.xls, CSV)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SHA-256 fingerprint deduplication</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleClose} className="h-9 px-4 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleStartParsing}
                  disabled={!file || !accountId || previewMutation.isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[135px] h-9 text-xs font-semibold shadow-xs"
                >
                  {previewMutation.isPending ? (
                    <>
                      <MacSpinner size="xs" className="mr-1.5" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      Scan & Reconcile
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "PREVIEW" && previewData && (
          <div className="space-y-5 pt-2">
            {/* Reconciliation Delta Callout */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                previewData.newCount > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30"
                  : "bg-blue-50 dark:bg-blue-950/30 border-blue-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className={`w-6 h-6 shrink-0 mt-0.5 ${
                    previewData.newCount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {previewData.newCount > 0 ? (
                      <>
                        <span>{previewData.newCount} New Transactions Detected</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
                          Ready to Append
                        </span>
                      </>
                    ) : (
                      <>
                        <span>All Transactions Already Recorded</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                          100% Up to Date
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {previewData.newCount > 0
                      ? `Scanned ${previewData.totalScanned} transactions: ${previewData.skippedCount} duplicates skipped, ${previewData.newCount} new records will be added.`
                      : `All ${previewData.totalScanned} transactions from this file exist in your ledger. Zero duplicates will be added.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border shadow-xs">
                  {previewData.skippedCount} Skipped
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                  +{previewData.newCount} New
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                <div className="text-[11px] text-muted-foreground font-medium">
                  Bank / Account
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {previewData.bankName} • {previewData.accountNumber}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  New Money In
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +{formatCurrency(previewData.newInflow)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20">
                <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                  New Money Out
                </div>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  -{formatCurrency(previewData.newOutflow)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20">
                <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                  Statement Balance
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {formatCurrency(previewData.closingBalance)}
                </div>
              </div>
            </div>

            {/* Table Navigation & Filter Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Transactions Preview
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setTableFilter("NEW");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      tableFilter === "NEW"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    New Only ({previewData.newCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTableFilter("SKIPPED");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      tableFilter === "SKIPPED"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Skipped ({previewData.skippedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTableFilter("ALL");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      tableFilter === "ALL"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({previewData.transactions.length})
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-card shadow-xs">
                <div className="max-h-60 overflow-y-auto overflow-x-auto scrollbar-thin text-xs">
                  <table className="w-full text-left min-w-[620px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-muted-foreground sticky top-0 z-10">
                      <tr>
                        <th className="p-2 font-semibold whitespace-nowrap">Status</th>
                        <th className="p-2 font-semibold whitespace-nowrap">Date</th>
                        <th className="p-2 font-semibold whitespace-nowrap">Category</th>
                        <th className="p-2 font-semibold">Description</th>
                        <th className="p-2 font-semibold text-right whitespace-nowrap">Amount</th>
                        <th className="p-2 font-semibold text-right whitespace-nowrap">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {displayedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No transactions matching this filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions.map((tx: any, idx: number) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 ${
                              tx.isExisting ? "opacity-60 bg-slate-50/30 dark:bg-slate-950/20" : ""
                            }`}
                          >
                            <td className="p-2 whitespace-nowrap">
                              {tx.isExisting ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  SKIPPED
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  NEW
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-[11px] whitespace-nowrap">
                              {formatTableDate(tx.date)}
                            </td>
                            <td className="p-2 font-medium whitespace-nowrap">
                              {tx.category}
                            </td>
                            <td className="p-2 max-w-[200px] truncate text-muted-foreground">
                              {tx.person || tx.counterpartyName || tx.rawNarration}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold whitespace-nowrap">
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="p-2 text-right font-mono text-muted-foreground whitespace-nowrap">
                              {tx.fees > 0 ? formatCurrency(tx.fees) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Preview Table Pagination */}
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={displayedTransactions.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 25, 50]}
                  itemLabel="transactions"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t">
              <Button variant="ghost" onClick={() => setStep("SELECT")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {previewData.newCount > 0 ? (
                  <Button
                    onClick={handleConfirmCommit}
                    disabled={commitMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
                  >
                    {commitMutation.isPending ? (
                      <>
                        <MacSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Import {previewData.newCount} New
                        <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleClose}
                    className="bg-slate-800 hover:bg-slate-900 text-white min-w-[150px]"
                  >
                    Done (Up to date)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {commitResult?.importedCount > 0
                  ? "Import Completed Successfully!"
                  : "All Records Already In Sync!"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {commitResult?.importedCount > 0
                  ? `Added ${commitResult.importedCount} new transactions while skipping ${commitResult.skippedCount} duplicates. Your closing balance is updated.`
                  : "Zero duplicate transactions were added. Your existing records remain intact and accurate."}
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
