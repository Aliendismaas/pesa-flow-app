export interface RawStatementLine {
  date: Date;
  valueDate?: Date;
  referenceId?: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  channel?: string;
  branch?: string;
}

export interface ParsedStatementResult {
  bankName: "NMB" | "CRDB" | "OTHER";
  accountNumber: string;
  accountName: string;
  currency: string;
  startDate: Date;
  endDate: Date;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  rawLinesCount: number;
  transactions: ParsedBundledTransaction[];
}

export interface StatementPreviewResponse extends ParsedStatementResult {
  totalScanned: number;
  newCount: number;
  skippedCount: number;
  newInflow: number;
  newOutflow: number;
  newFees: number;
  newDateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  duplicatesSummary?: {
    count: number;
    earliestDate?: Date;
    latestDate?: Date;
  };
  transactions: (ParsedBundledTransaction & { isExisting?: boolean })[];
}

export interface ParsedBundledTransaction {
  date: Date;
  month: Date;
  type: "IN" | "OUT";
  group:
    | "Income"
    | "Sent to people"
    | "Shopping & bills"
    | "Cash withdrawals"
    | "Moved to my own wallet / card"
    | "Between my banks"
    | "Bank fees (stand-alone)";
  category: string;
  amount: number;
  fees: number;
  totalCost: number;
  treatedAs: "External" | "Own wallet" | "Virtual card" | "Between my banks";
  referenceId?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  network?: string;
  userNote?: string;
  person?: string;
  rawNarration: string;
  fingerprint?: string;
  isExcludedFromTotals: boolean;
}

export interface DashboardKPISummary {
  totalMoneyIn: number;
  salaryIncome: number;
  otherIncome: number;
  totalMoneyOut: number;
  netCashflow: number;
  combinedBalance: number;
  costOfBanking: {
    totalFees: number;
    feePercentageOfOutflow: number;
    cashWithdrawalFees: number;
    p2pTransferFees: number;
    standaloneBankFees: number;
  };
  totalTransactionsCount: number;
}

export interface MonthlyTrendItem {
  month: string; // YYYY-MM
  monthName: string; // e.g. "Jan 2026"
  moneyReceived: number;
  moneyOut: number;
  net: number;
  feesPaid: number;
  sentToPeople: number;
  cashWithdrawn: number;
  runningNet: number;
}

export interface CategoryBreakdownItem {
  group: string;
  category: string;
  amount: number;
  fees: number;
  totalCost: number;
  percentage: number;
  count: number;
}

export interface PersonSummaryItem {
  personName: string;
  identifiers: string[];
  transfersCount: number;
  amountSent: number;
  feesPaid: number;
  totalCost: number;
  receivedBack: number;
  netCost: number;
}

export interface MerchantBillSummaryItem {
  category: string;
  identifier: string; // e.g. "METER 37269495356"
  name: string;
  paymentsCount: number;
  amount: number;
  fees: number;
  totalCost: number;
}
