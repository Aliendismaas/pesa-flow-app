import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMerchantsSummaryQueryFn } from "@/lib/api";
import { Zap, Search } from "lucide-react";
import { usePrivacy } from "@/context/privacy-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatProperName } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableRowsSkeleton } from "@/components/ui/skeleton";

const BillsPage: React.FC = () => {
  const { formatCurrency } = usePrivacy();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ["financeMerchants"],
    queryFn: () => getMerchantsSummaryQueryFn(),
  });

  const categories = Array.from(new Set(merchants.map((m) => m.category)));

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.identifier.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const paginatedMerchants = filteredMerchants.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-emerald-600" />
            Bills, Utilities & Merchants
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track utility meter tokens (LUKU electricity), government GePG payments, Lipa Namba, and cash withdrawals.
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search meter number, merchant, or bill..."
            className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Filter - Modern Radix Select */}
        <div className="w-full sm:w-[220px]">
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full text-xs h-9">
              <SelectValue placeholder="All Bill Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bill Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Merchants & Bills Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-card shadow-sm w-full min-w-0 max-w-full">
        <div className="overflow-x-auto scrollbar-thin w-full max-w-full">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-muted-foreground border-b dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">Category</th>
                <th className="p-3.5 font-semibold">Merchant / Meter / Place</th>
                <th className="p-3.5 font-semibold">Name / Description</th>
                <th className="p-3.5 font-semibold text-center">Payments</th>
                <th className="p-3.5 font-semibold text-right">Amount</th>
                <th className="p-3.5 font-semibold text-right">Fees</th>
                <th className="p-3.5 font-semibold text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {isLoading ? (
                <TableRowsSkeleton rows={pageSize} columns={7} />
              ) : paginatedMerchants.map((m, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="p-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                      {m.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {m.identifier}
                  </td>
                  <td className="p-3.5 text-muted-foreground font-medium">
                    {formatProperName(m.name)}
                  </td>
                  <td className="p-3.5 text-center font-bold">
                    {m.paymentsCount}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold whitespace-nowrap">
                    {formatCurrency(m.amount)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                    {m.fees > 0 ? formatCurrency(m.fees) : "-"}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(m.totalCost)}
                  </td>
                </tr>
              ))}
              {!isLoading && filteredMerchants.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No utility bills or merchants found.
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
          totalItems={filteredMerchants.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="bills"
        />
      </div>
    </div>
  );
};

export default BillsPage;
