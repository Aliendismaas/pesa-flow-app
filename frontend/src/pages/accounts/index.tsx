import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccountMutationFn,
  deleteAccountMutationFn,
  getAccountsQueryFn,
  updateAccountMutationFn,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Landmark,
  Plus,
  UploadCloud,
  Trash2,
  Building,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { MacSpinner } from "@/components/ui/mac-spinner";
import { UploadStatementModal } from "@/components/finance/UploadStatementModal";
import { MonthlyCoverageCard } from "@/components/finance/MonthlyCoverageCard";
import { usePrivacy } from "@/context/privacy-provider";
import { Skeleton } from "@/components/ui/skeleton";

const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { formatCurrency } = usePrivacy();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadAccount, setSelectedUploadAccount] = useState<string>("");

  // Create form state
  const [bankName, setBankName] = useState<"NMB" | "CRDB" | "OTHER">("NMB");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [createLogoUrl, setCreateLogoUrl] = useState<string>("");
  const [initialBalance, setInitialBalance] = useState("0");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["financeAccounts"],
    queryFn: getAccountsQueryFn,
  });

  const createMutation = useMutation({
    mutationFn: createAccountMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      setIsCreateOpen(false);
      setAccountName("");
      setAccountNumber("");
      setCreateLogoUrl("");
      setInitialBalance("0");
      toast({ title: "Account created successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create account",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAccountMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      toast({ title: "Account logo updated successfully" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update logo",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccountMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      toast({ title: "Account deleted" });
    },
  });

  const handleCreateLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCreateLogoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (accountId: string, file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        updateMutation.mutate({
          id: accountId,
          data: { logoUrl: base64 },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountNumber) return;
    createMutation.mutate({
      bankName,
      accountName,
      accountNumber,
      logoUrl: createLogoUrl || undefined,
      initialBalance: parseFloat(initialBalance) || 0,
    });
  };

  const handleOpenUpload = (accId: string) => {
    setSelectedUploadAccount(accId);
    setIsUploadOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-7 h-7 text-emerald-600" />
            Bank Accounts & Wallets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connected bank accounts, upload official logos, and analyze statements.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Bank Account
        </Button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border dark:border-slate-800 bg-card shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-40" />
              </div>
              <div className="flex gap-2 pt-2 border-t dark:border-slate-800">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))
        ) : (
          accounts.map((acc) => (
          <div
            key={acc._id}
            className="p-6 rounded-2xl border dark:border-slate-800 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Top Bar with Bank Logo / Avatar */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Account Logo with click-to-change overlay */}
                  <div className="relative group">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: acc.logoUrl
                          ? "#ffffff"
                          : acc.color || (acc.bankName === "CRDB" ? "#008850" : "#f58220"),
                      }}
                    >
                      {acc.logoUrl ? (
                        <img
                          src={acc.logoUrl}
                          alt={acc.bankName}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-white font-black text-xs tracking-wider">
                          {acc.bankName}
                        </span>
                      )}
                    </div>

                    {/* Change Logo Hover Button */}
                    <label
                      htmlFor={`logo-upload-${acc._id}`}
                      className="absolute inset-0 bg-black/60 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload or Change Logo"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                    <input
                      type="file"
                      id={`logo-upload-${acc._id}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleLogoUpload(acc._id, e.target.files[0]);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {acc.bankName}
                      </span>
                      <label
                        htmlFor={`logo-upload-${acc._id}`}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer font-medium hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        {acc.logoUrl ? "Change logo" : "Upload logo"}
                      </label>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {acc.accountNumber}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${acc.accountName}?`)) {
                      deleteMutation.mutate(acc._id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                {acc.accountName}
              </h3>

              <div className="mt-5 pt-4 border-t dark:border-slate-800">
                <div className="text-xs text-muted-foreground uppercase font-semibold">
                  Statement Balance
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(acc.currentBalance, acc.currency)}
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>{acc.transactionCount || 0} Transactions</span>
                {acc.lastStatementDate && (
                  <span>
                    Updated: {new Date(acc.lastStatementDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t dark:border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenUpload(acc._id)}
                className="w-full text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Upload Statement
              </Button>
            </div>
          </div>
        )))}

        {/* Empty state or Add Account card */}
        {accounts.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg">No Bank Accounts Added</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Add your NMB or CRDB account to start uploading and analyzing your
              statements.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Account Now
            </Button>
          </div>
        )}
      </div>

      {/* Monthly Statement Coverage & Reconciliation */}
      <MonthlyCoverageCard
        onUploadClick={() => {
          setSelectedUploadAccount("");
          setIsUploadOpen(true);
        }}
      />

      {/* Create Account Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Add New Bank Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Bank / Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["NMB", "CRDB", "OTHER"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBankName(b)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                      bankName === b
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Account Name / Label
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. NMB Chap Chap Account"
                required
                className="w-full text-xs h-9 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 24510060282"
                required
                className="w-full text-xs h-9 px-3 rounded-lg border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Bank Logo Upload */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Bank Logo (Optional)
              </label>
              <div className="flex items-center gap-3">
                {createLogoUrl ? (
                  <div className="relative w-12 h-12 rounded-xl border bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={createLogoUrl}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateLogoUrl("")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs hover:bg-rose-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground shrink-0 bg-slate-50 dark:bg-slate-900">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <label
                    htmlFor="create-account-logo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {createLogoUrl ? "Change Logo Image" : "Upload Logo Image"}
                  </label>
                  <input
                    type="file"
                    id="create-account-logo"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCreateLogoChange}
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG, SVG, or JPG (max 2MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreateLogoUrl("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {createMutation.isPending ? (
                  <>
                    <MacSpinner size="xs" className="mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={isUploadOpen}
        setIsOpen={setIsUploadOpen}
        accounts={accounts}
        selectedAccountId={selectedUploadAccount}
      />
    </div>
  );
};

export default AccountsPage;
