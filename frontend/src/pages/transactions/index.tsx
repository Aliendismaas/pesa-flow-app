import React, { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAccountsQueryFn,
  getTransactionsQueryFn,
  updateTransactionMutationFn,
  getContactsQueryFn,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  BookUser,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Search,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { usePrivacy } from "@/context/privacy-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatProperName,
  isRawIdentifierOrPhone,
  formatTableDate,
} from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PhonebookModal } from "@/components/finance/PhonebookModal";

const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isPrivacyMode, togglePrivacyMode, formatCurrency } = usePrivacy();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [selectedType, setSelectedType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Phonebook modal state
  const [isPhonebookOpen, setIsPhonebookOpen] = useState(false);
  const [quickContactData, setQuickContactData] = useState<{
    phone?: string;
    account?: string;
    name?: string;
  } | null>(null);

  const startDateStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDateStr = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;

  // Edit modal
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["financeAccounts"],
    queryFn: getAccountsQueryFn,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["financeContacts"],
    queryFn: getContactsQueryFn,
  });

  const handleQuickAddContact = (tx: any) => {
    const raw = tx.counterpartyId || tx.person || tx.counterpartyName || "";
    const digitsOnly = String(raw).replace(/\D/g, "");
    const isPhone = digitsOnly.length >= 9 && digitsOnly.length <= 13;

    setQuickContactData({
      phone: isPhone ? String(raw).trim() : undefined,
      account: !isPhone ? String(raw).trim() : undefined,
      name: "",
    });
    setIsPhonebookOpen(true);
  };

  const { data: txData, isLoading } = useQuery({
    queryKey: [
      "financeTransactions",
      selectedAccountId,
      selectedType,
      selectedGroup,
      search,
      startDateStr,
      endDateStr,
      page,
      pageSize,
    ],
    queryFn: () =>
      getTransactionsQueryFn({
        accountId: selectedAccountId !== "all" ? selectedAccountId : undefined,
        type: selectedType || undefined,
        group: selectedGroup || undefined,
        search: search || undefined,
        startDate: startDateStr,
        endDate: endDateStr,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: updateTransactionMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
      setEditingTx(null);
      toast({ title: "Transaction updated" });
    },
  });

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx);
    setEditCategory(tx.category);
    setEditNote(tx.userNote || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    updateMutation.mutate({
      id: editingTx._id,
      data: {
        category: editCategory,
        userNote: editNote,
      },
    });
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const data = await getTransactionsQueryFn({
        accountId: selectedAccountId !== "all" ? selectedAccountId : undefined,
        type: selectedType || undefined,
        group: selectedGroup || undefined,
        search: search || undefined,
        startDate: startDateStr,
        endDate: endDateStr,
        page: 1,
        limit: 10000,
      });

      const transactions = data.transactions || [];
      if (transactions.length === 0) {
        toast({ title: "No transactions to export" });
        setIsExporting(false);
        return;
      }

      const headers = [
        "Date",
        "Bank",
        "Account Number",
        "Narration / Description",
        "Beneficiary / Reference",
        "Type",
        "Category",
        "Group",
        "Amount (TZS)",
        "Fee (TZS)",
        "Total (TZS)",
        "Treated As",
        "User Note"
      ];

      const csvRows = [headers.join(",")];

      transactions.forEach((tx: any) => {
        const row = [
          `"${formatTableDate(tx.date)}"`,
          `"${tx.accountId?.bankName || ""}"`,
          `"${tx.accountId?.accountNumber || ""}"`,
          `"${(tx.description || "").replace(/"/g, '""')}"`,
          `"${(tx.beneficiary || tx.reference || "").replace(/"/g, '""')}"`,
          `"${tx.type}"`,
          `"${tx.category}"`,
          `"${tx.group || ""}"`,
          tx.amount,
          tx.fee,
          tx.totalAmount,
          `"${tx.treatedAs || ""}"`,
          `"${(tx.userNote || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `PesaFlow_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Complete", description: `Exported ${transactions.length} transactions to CSV.` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-emerald-600" />
            Transactions Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete record of your payments, income, and bank charges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Privacy Toggle Button */}
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
              <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5" />
            ) : (
              <Eye className="w-4 h-4 mr-1.5" />
            )}
            {isPrivacyMode ? "Hidden" : "Visible"}
          </Button>

          {/* Phonebook Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuickContactData(null);
              setIsPhonebookOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 h-9 px-3"
            title="Manage Phonebook Contacts"
          >
            <BookUser className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Phonebook</span>
            {contacts.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                {contacts.length}
              </span>
            )}
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2 text-xs font-semibold border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 h-9"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export to Excel (CSV)"}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border dark:border-slate-800 bg-card">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search narration, person, meter..."
            className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Date Range Filter */}
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
          placeholder="All Dates (Filter...)"
          className="w-full"
        />

        {/* Account Filter - Modern Radix Select */}
        <Select
          value={selectedAccountId}
          onValueChange={(val) => {
            setSelectedAccountId(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full text-xs h-9">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts ({accounts.length})</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a._id} value={a._id}>
                {a.bankName} - {a.accountNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter - Modern Radix Select */}
        <Select
          value={selectedType || "ALL"}
          onValueChange={(val) => {
            setSelectedType(val === "ALL" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full text-xs h-9">
            <SelectValue placeholder="All Inflows & Outflows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Inflows & Outflows</SelectItem>
            <SelectItem value="IN">Money In (Income)</SelectItem>
            <SelectItem value="OUT">Money Out (Expenses)</SelectItem>
          </SelectContent>
        </Select>

        {/* Group Filter - Modern Radix Select */}
        <Select
          value={selectedGroup || "ALL"}
          onValueChange={(val) => {
            setSelectedGroup(val === "ALL" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full text-xs h-9">
            <SelectValue placeholder="All Categories & Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories & Groups</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Sent to people">Sent to people</SelectItem>
            <SelectItem value="Shopping & bills">Shopping & bills</SelectItem>
            <SelectItem value="Cash withdrawals">Cash withdrawals</SelectItem>
            <SelectItem value="Moved to my own wallet / card">Own wallet / card</SelectItem>
            <SelectItem value="Between my banks">Between my banks</SelectItem>
            <SelectItem value="Bank fees (stand-alone)">Bank fees & charges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-card shadow-sm w-full min-w-0 max-w-full">
        <div className="overflow-x-auto scrollbar-thin w-full max-w-full">
          <table className="w-full text-left text-xs min-w-[980px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground border-b dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold whitespace-nowrap">Date</th>
                <th className="p-3.5 font-semibold whitespace-nowrap">Bank</th>
                <th className="p-3.5 font-semibold whitespace-nowrap">Type</th>
                <th className="p-3.5 font-semibold whitespace-nowrap">Category</th>
                <th className="p-3.5 font-semibold">Counterparty / Details</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Amount</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Fees</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Total Cost</th>
                <th className="p-3.5 font-semibold text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {isLoading ? (
                <TableRowsSkeleton rows={pageSize} columns={9} />
              ) : txData?.transactions && txData.transactions.length > 0 ? (
                txData.transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                      {formatTableDate(tx.date)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
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
                    <td className="p-3.5 whitespace-nowrap">
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
                    <td className="p-3.5 font-semibold whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {tx.contact ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-2xs"
                            style={{ backgroundColor: tx.contact.color || "#10b981" }}
                            title={`${tx.contact.name} (${tx.contact.category || "Contact"})`}
                          >
                            {tx.contact.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {formatProperName(tx.contact.name)}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
                                {tx.contact.category || "Contact"}
                              </span>
                            </div>
                            {(tx.contact.phoneNumber || tx.counterpartyId) && (
                              <div className="text-[10px] text-muted-foreground font-mono truncate">
                                {formatProperName(tx.contact.phoneNumber || tx.counterpartyId)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : isRawIdentifierOrPhone(tx.person || tx.counterpartyId || tx.counterpartyName) ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 truncate">
                            <div className="font-mono text-slate-900 dark:text-white font-medium truncate">
                              {formatProperName(
                                tx.person ||
                                  tx.counterpartyId ||
                                  tx.counterpartyName ||
                                  tx.rawNarration
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Unsaved Number</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickAddContact(tx)}
                            className="h-6 px-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-500/30 rounded-md shrink-0 flex items-center gap-1 cursor-pointer"
                            title="Add to Phonebook"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add Name</span>
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {formatProperName(tx.person || tx.counterpartyName || tx.rawNarration)}
                          </div>
                          {tx.counterpartyId && !isRawIdentifierOrPhone(tx.counterpartyId) && (
                            <div className="text-[10px] text-muted-foreground font-mono truncate">
                              {tx.counterpartyId}
                            </div>
                          )}
                        </div>
                      )}
                      {tx.userNote && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 italic mt-0.5">
                          "{tx.userNote}"
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {tx.fees > 0 ? formatCurrency(tx.fees) : "-"}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold whitespace-nowrap text-slate-900 dark:text-white">
                      {formatCurrency(tx.totalCost)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                        onClick={() => handleOpenEdit(tx)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No transactions match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {txData?.pagination && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={txData.pagination.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="transactions"
          />
        )}
      </div>

      {/* Edit Transaction Modal */}
      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Edit Transaction Details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Category
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Personal Note / Purpose Remark
              </label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="e.g. napunguza deni, electricity for shop, lunch..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {isRawIdentifierOrPhone(editingTx?.person || editingTx?.counterpartyId) && (
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Unsaved Number
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatProperName(editingTx?.person || editingTx?.counterpartyId)}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const txToSave = editingTx;
                    setEditingTx(null);
                    handleQuickAddContact(txToSave);
                  }}
                  className="h-7 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Save to Phonebook
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTx(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Phonebook Modal */}
      <PhonebookModal
        isOpen={isPhonebookOpen}
        setIsOpen={setIsPhonebookOpen}
        initialPhoneNumber={quickContactData?.phone}
        initialAccountNumber={quickContactData?.account}
        initialName={quickContactData?.name}
        startInAddMode={Boolean(quickContactData?.phone || quickContactData?.account)}
      />
    </div>
  );
};

export default TransactionsPage;
