import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPeopleSummaryQueryFn, getContactsQueryFn } from "@/lib/api";
import { Users, Search, BookUser, UserPlus } from "lucide-react";
import { usePrivacy } from "@/context/privacy-provider";
import { formatProperName, isRawIdentifierOrPhone } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { Skeleton, TableRowsSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PhonebookModal } from "@/components/finance/PhonebookModal";

const PeoplePage: React.FC = () => {
  const { formatCurrency } = usePrivacy();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPhonebookOpen, setIsPhonebookOpen] = useState(false);
  const [quickContactData, setQuickContactData] = useState<{
    phone?: string;
    account?: string;
    name?: string;
  } | null>(null);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["financePeople"],
    queryFn: () => getPeopleSummaryQueryFn(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["financeContacts"],
    queryFn: getContactsQueryFn,
  });

  const handleQuickAddContact = (p: any) => {
    const raw = p.identifiers?.[0] || p.personName || "";
    const digitsOnly = String(raw).replace(/\D/g, "");
    const isPhone = digitsOnly.length >= 9 && digitsOnly.length <= 13;

    setQuickContactData({
      phone: isPhone ? String(raw).trim() : undefined,
      account: !isPhone ? String(raw).trim() : undefined,
      name: !isRawIdentifierOrPhone(p.personName) ? p.personName : "",
    });
    setIsPhonebookOpen(true);
  };

  const filteredPeople = people.filter((p) => {
    const formatted = formatProperName(p.personName);
    return (
      formatted.toLowerCase().includes(search.toLowerCase()) ||
      p.personName.toLowerCase().includes(search.toLowerCase()) ||
      p.identifiers.some((id) => id.includes(search))
    );
  });

  const paginatedPeople = filteredPeople.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalSentAll = people.reduce((sum, p) => sum + p.amountSent, 0);
  const totalFeesAll = people.reduce((sum, p) => sum + p.feesPaid, 0);
  const totalReceivedAll = people.reduce((sum, p) => sum + p.receivedBack, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            People & Counterparties (P2P)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track money sent to individuals via mobile money, bank transfers, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                {contacts.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            Total Sent to People
          </div>
          {isLoading ? (
            <div className="space-y-1.5 mt-1.5">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(totalSentAll)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across {people.length} unique contacts
              </div>
            </>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            Transfer Fees Paid
          </div>
          {isLoading ? (
            <div className="space-y-1.5 mt-1.5">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalFeesAll)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Telco & bank sending charges
              </div>
            </>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-card border dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            Received Back from Contacts
          </div>
          {isLoading ? (
            <div className="space-y-1.5 mt-1.5">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalReceivedAll)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Incoming P2P transfers
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by contact name or phone number..."
          className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* People Directory Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-card shadow-sm w-full min-w-0 max-w-full">
        <div className="overflow-x-auto scrollbar-thin w-full max-w-full">
          <table className="w-full text-left text-xs min-w-[860px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground border-b dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold whitespace-nowrap">Contact Name</th>
                <th className="p-3.5 font-semibold whitespace-nowrap">Phone Numbers / IDs</th>
                <th className="p-3.5 font-semibold text-center whitespace-nowrap">Transfers</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Amount Sent</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Fees Paid</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Total Cost</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Received Back</th>
                <th className="p-3.5 font-semibold text-right whitespace-nowrap">Net Outflow</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {isLoading ? (
                <TableRowsSkeleton rows={pageSize} columns={8} />
              ) : paginatedPeople.map((p, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{formatProperName(p.personName)}</span>
                      {isRawIdentifierOrPhone(p.personName) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAddContact(p)}
                          className="h-6 px-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-500/30 rounded-md shrink-0 flex items-center gap-1 cursor-pointer"
                          title="Add to Phonebook"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add Name</span>
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {p.identifiers.join(", ") || "-"}
                  </td>
                  <td className="p-3.5 text-center font-semibold whitespace-nowrap">
                    {p.transfersCount}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                    {formatCurrency(p.amountSent)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                    {p.feesPaid > 0 ? formatCurrency(p.feesPaid) : "-"}
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold whitespace-nowrap">
                    {formatCurrency(p.totalCost)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                    {p.receivedBack > 0 ? formatCurrency(p.receivedBack) : "-"}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(p.netCost)}
                  </td>
                </tr>
              ))}
              {!isLoading && filteredPeople.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredPeople.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="contacts"
        />
      </div>

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

export default PeoplePage;
