import mongoose from "mongoose";
import AccountModel from "../../database/models/account.model";
import StatementUploadModel from "../../database/models/statement-upload.model";
import TransactionModel from "../../database/models/transaction.model";
import ContactModel from "../../database/models/contact.model";
import {
  buildContactIdentifiers,
  isPlainNumberOrIdentifier,
} from "./utils/contact.util";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/utils/catch-errors";
import { CrdbStatementParser } from "./parsers/crdb.parser";
import { NmbStatementParser } from "./parsers/nmb.parser";
import { generateTransactionFingerprint } from "./utils/fingerprint.util";
import {
  CategoryBreakdownItem,
  DashboardKPISummary,
  MerchantBillSummaryItem,
  MonthlyTrendItem,
  ParsedBundledTransaction,
  ParsedStatementResult,
  PersonSummaryItem,
  StatementPreviewResponse,
} from "./finance.types";

export class FinanceService {
  // ==========================================
  // HELPERS
  // ==========================================
  private buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const dateFilter: Record<string, any> = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate.length === 10 ? `${startDate}T00:00:00.000Z` : startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate);
    }
    return dateFilter;
  }

  // ==========================================
  // ACCOUNTS
  // ==========================================
  public async getAccounts(userId: string) {
    const accounts = await AccountModel.find({
      userId,
      isArchived: false,
    }).sort({ createdAt: 1 });

    const accountsWithStats = await Promise.all(
      accounts.map(async (acc) => {
        const txCount = await TransactionModel.countDocuments({
          userId,
          accountId: acc._id,
        });
        return {
          ...acc.toObject(),
          transactionCount: txCount,
        };
      })
    );

    return accountsWithStats;
  }

  public async createAccount(
    userId: string,
    data: {
      bankName: "NMB" | "CRDB" | "OTHER";
      accountName: string;
      accountNumber: string;
      currency?: string;
      color?: string;
      logoUrl?: string;
      initialBalance?: number;
    }
  ) {
    const existing = await AccountModel.findOne({
      userId,
      accountNumber: data.accountNumber.trim(),
      isArchived: false,
    });

    if (existing) {
      throw new BadRequestException(
        `Account with number ${data.accountNumber} already exists`
      );
    }

    const defaultColors: Record<string, string> = {
      NMB: "#f58220",
      CRDB: "#008850",
      OTHER: "#2563eb",
    };

    const account = await AccountModel.create({
      userId,
      bankName: data.bankName,
      accountName: data.accountName.trim(),
      accountNumber: data.accountNumber.trim(),
      currency: data.currency || "TZS",
      color: data.color || defaultColors[data.bankName] || "#2563eb",
      logoUrl: data.logoUrl,
      initialBalance: data.initialBalance || 0,
      currentBalance: data.initialBalance || 0,
    });

    return account;
  }

  public async updateAccount(
    userId: string,
    accountId: string,
    data: Partial<{
      accountName: string;
      color: string;
      logoUrl: string;
      currentBalance: number;
    }>
  ) {
    const account = await AccountModel.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: data },
      { new: true }
    );

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    return account;
  }

  public async deleteAccount(userId: string, accountId: string) {
    const account = await AccountModel.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    return { message: "Account deleted successfully" };
  }

  // ==========================================
  // CONTACTS (PHONEBOOK)
  // ==========================================
  public async getContacts(userId: string) {
    const contacts = await ContactModel.find({ userId }).sort({ name: 1 }).lean();

    // Attach transaction counts and total sent
    const enriched = await Promise.all(
      contacts.map(async (c) => {
        const matchingTx = await TransactionModel.find({
          userId,
          isExcludedFromTotals: false,
          $or: [
            { counterpartyId: { $in: c.identifiers } },
            { person: c.name },
          ],
        })
          .select("amount type")
          .lean();

        const count = matchingTx.length;
        const totalSent = matchingTx
          .filter((t) => t.type === "OUT")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          ...c,
          transfersCount: count,
          totalAmountSent: totalSent,
        };
      })
    );

    return enriched;
  }

  public async createContact(
    userId: string,
    data: {
      name: string;
      phoneNumber?: string;
      accountNumber?: string;
      category?: string;
      color?: string;
      notes?: string;
    }
  ) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException("Contact name is required");
    }

    if (!data.phoneNumber?.trim() && !data.accountNumber?.trim()) {
      throw new BadRequestException("Please provide a phone number or account number");
    }

    const identifiers = buildContactIdentifiers(data.phoneNumber, data.accountNumber);

    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const contact = await ContactModel.create({
      userId,
      name: data.name.trim(),
      phoneNumber: data.phoneNumber?.trim(),
      accountNumber: data.accountNumber?.trim(),
      identifiers,
      category: data.category?.trim() || "General",
      color: data.color || randomColor,
      notes: data.notes?.trim(),
    });

    // Retroactively update matching transactions so they reflect this new contact name immediately
    await TransactionModel.updateMany(
      {
        userId,
        $or: [
          { counterpartyId: { $in: identifiers } },
          { person: { $in: identifiers } },
        ],
      },
      {
        $set: {
          person: contact.name,
          counterpartyName: contact.name,
        },
      }
    );

    return contact;
  }

  public async updateContact(
    userId: string,
    contactId: string,
    data: Partial<{
      name: string;
      phoneNumber?: string;
      accountNumber?: string;
      category?: string;
      color?: string;
      notes?: string;
    }>
  ) {
    const contact = await ContactModel.findOne({ _id: contactId, userId });
    if (!contact) {
      throw new NotFoundException("Contact not found");
    }

    const oldName = contact.name;
    if (data.name) contact.name = data.name.trim();
    if (data.phoneNumber !== undefined) contact.phoneNumber = data.phoneNumber.trim();
    if (data.accountNumber !== undefined) contact.accountNumber = data.accountNumber.trim();
    if (data.category !== undefined) contact.category = data.category.trim();
    if (data.color !== undefined) contact.color = data.color;
    if (data.notes !== undefined) contact.notes = data.notes.trim();

    contact.identifiers = buildContactIdentifiers(contact.phoneNumber, contact.accountNumber);
    await contact.save();

    // If name or identifiers changed, update matching transactions
    await TransactionModel.updateMany(
      {
        userId,
        $or: [
          { counterpartyId: { $in: contact.identifiers } },
          { person: { $in: [oldName, ...contact.identifiers] } },
        ],
      },
      {
        $set: {
          person: contact.name,
          counterpartyName: contact.name,
        },
      }
    );

    return contact;
  }

  public async deleteContact(userId: string, contactId: string) {
    const contact = await ContactModel.findOneAndDelete({ _id: contactId, userId });
    if (!contact) {
      throw new NotFoundException("Contact not found");
    }

    return { message: "Contact deleted from phonebook" };
  }

  // ==========================================
  // STATEMENT INGESTION (PARSER & COMMIT)
  // ==========================================
  public async previewStatement(
    userId: string,
    accountId: string,
    fileBuffer: Buffer,
    fileName: string,
    targetMonth?: string
  ): Promise<StatementPreviewResponse> {
    const account = await AccountModel.findOne({ _id: accountId, userId });
    if (!account) {
      throw new NotFoundException("Account not found");
    }

    // Fetch user's other accounts to recognize internal transfers
    const userAccounts = await AccountModel.find({ userId });
    const ownNumbers = userAccounts.map((a) => a.accountNumber);

    let parsedResult: ParsedStatementResult;
    if (account.bankName === "CRDB") {
      parsedResult = await CrdbStatementParser.parse(fileBuffer, ownNumbers);
    } else {
      parsedResult = await NmbStatementParser.parse(fileBuffer, ownNumbers);
    }

    // 1. Assign deterministic fingerprints to all extracted transactions
    for (const tx of parsedResult.transactions) {
      tx.fingerprint = generateTransactionFingerprint({
        accountId: (account as any)._id.toString(),
        date: tx.date,
        type: tx.type,
        amount: tx.amount,
        fees: tx.fees,
        referenceId: tx.referenceId,
        rawNarration: tx.rawNarration,
      });
    }

    // 2. Fetch existing fingerprints for this account
    const allFingerprints = parsedResult.transactions.map((t) => t.fingerprint!);
    const existingDocs = await TransactionModel.find(
      {
        accountId: (account as any)._id,
        fingerprint: { $in: allFingerprints },
      },
      { fingerprint: 1, date: 1 }
    ).lean();

    const existingFpSet = new Set(existingDocs.map((d) => d.fingerprint));

    // 3. Partition transactions into new vs skipped duplicates
    let newInflow = 0;
    let newOutflow = 0;
    let newFees = 0;
    const newTxList: ParsedBundledTransaction[] = [];
    const skippedTxList: ParsedBundledTransaction[] = [];

    const enrichedTransactions = parsedResult.transactions.map((tx) => {
      const isExisting = existingFpSet.has(tx.fingerprint!);
      if (isExisting) {
        skippedTxList.push(tx);
      } else {
        newTxList.push(tx);
        if (tx.type === "IN") {
          newInflow += tx.amount;
        } else {
          newOutflow += tx.amount;
        }
        newFees += tx.fees || 0;
      }
      return {
        ...tx,
        isExisting,
      };
    });

    // Optional targetMonth filter ("YYYY-MM")
    const filteredTransactions = targetMonth
      ? enrichedTransactions.filter(
          (t) => t.date.toISOString().slice(0, 7) === targetMonth
        )
      : enrichedTransactions;

    let newDateRange: { startDate?: Date; endDate?: Date } | undefined;
    if (newTxList.length > 0) {
      const sortedNew = [...newTxList].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      newDateRange = {
        startDate: sortedNew[0].date,
        endDate: sortedNew[sortedNew.length - 1].date,
      };
    }

    let duplicatesSummary:
      | { count: number; earliestDate?: Date; latestDate?: Date }
      | undefined;
    if (skippedTxList.length > 0) {
      const sortedSkipped = [...skippedTxList].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      duplicatesSummary = {
        count: skippedTxList.length,
        earliestDate: sortedSkipped[0].date,
        latestDate: sortedSkipped[sortedSkipped.length - 1].date,
      };
    }

    return {
      ...parsedResult,
      totalScanned: parsedResult.transactions.length,
      newCount: newTxList.length,
      skippedCount: skippedTxList.length,
      newInflow,
      newOutflow,
      newFees,
      newDateRange,
      duplicatesSummary,
      transactions: filteredTransactions,
    };
  }

  public async commitStatement(
    userId: string,
    accountId: string,
    fileBuffer: Buffer,
    fileName: string,
    targetMonth?: string
  ) {
    const account = await AccountModel.findOne({ _id: accountId, userId });
    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const preview = await this.previewStatement(
      userId,
      accountId,
      fileBuffer,
      fileName,
      targetMonth
    );

    // Filter strictly to non-existing transactions
    const newTransactions = preview.transactions.filter(
      (tx) => !(tx as any).isExisting
    );

    // Create Statement Upload log with audit metrics
    const uploadLog = await StatementUploadModel.create({
      userId,
      accountId: account._id,
      fileName,
      fileSize: fileBuffer.length,
      fileType: fileName.endsWith(".xlsx") ? "XLSX" : "PDF",
      statementPeriod: {
        startDate: preview.startDate,
        endDate: preview.endDate,
      },
      totalLinesParsed: preview.rawLinesCount,
      transactionsExtracted: preview.totalScanned,
      scannedCount: preview.totalScanned,
      importedCount: newTransactions.length,
      skippedCount: preview.skippedCount,
      totalDebits: preview.totalDebits,
      totalCredits: preview.totalCredits,
      closingBalance: preview.closingBalance,
      status: "COMMITTED",
    });

    if (newTransactions.length > 0) {
      const contacts = await ContactModel.find({ userId }).lean();
      const identifierToContactMap = new Map<string, any>();
      for (const c of contacts) {
        for (const id of c.identifiers) {
          identifierToContactMap.set(id, c);
        }
      }

      const txDocs = newTransactions.map((tx) => {
        let person = tx.person;
        let counterpartyName = tx.counterpartyName;

        if (tx.counterpartyId && identifierToContactMap.has(tx.counterpartyId)) {
          const c = identifierToContactMap.get(tx.counterpartyId);
          person = c.name;
          counterpartyName = c.name;
        } else if (tx.person && identifierToContactMap.has(tx.person)) {
          const c = identifierToContactMap.get(tx.person);
          person = c.name;
          counterpartyName = c.name;
        }

        return {
          userId,
          accountId: account._id,
          statementUploadId: uploadLog._id,
          ...tx,
          person,
          counterpartyName,
        };
      });

      await TransactionModel.insertMany(txDocs, { ordered: false });
    }

    // Update account closing balance and last statement date if this statement is up to date
    if (!account.lastStatementDate || preview.endDate >= account.lastStatementDate) {
      account.currentBalance = preview.closingBalance;
      account.lastStatementDate = preview.endDate;
      await account.save();
    }

    return {
      message:
        newTransactions.length > 0
          ? `Successfully imported ${newTransactions.length} new transactions (${preview.skippedCount} duplicates skipped).`
          : `All ${preview.totalScanned} transactions are already in your records. Zero duplicates added.`,
      statementUpload: uploadLog,
      importedCount: newTransactions.length,
      skippedCount: preview.skippedCount,
      totalScanned: preview.totalScanned,
      closingBalance: preview.closingBalance,
    };
  }

  // Monthly statement coverage tracker
  public async getMonthlyCoverage(userId: string, accountId?: string) {
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
      isExcludedFromTotals: false,
    };
    if (accountId && accountId !== "all") {
      filter.accountId = new mongoose.Types.ObjectId(accountId);
    }

    const coverage = await TransactionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
          inflow: {
            $sum: {
              $cond: [{ $eq: ["$type", "IN"] }, "$amount", 0],
            },
          },
          outflow: {
            $sum: {
              $cond: [{ $eq: ["$type", "OUT"] }, "$amount", 0],
            },
          },
          fees: { $sum: "$fees" },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return coverage.map((c) => {
      const y = c._id.year;
      const m = c._id.month;
      const monthKey = `${y}-${String(m).padStart(2, "0")}`;
      const monthName = `${monthNames[m - 1]} ${y}`;
      return {
        month: monthKey,
        monthName,
        count: c.count,
        inflow: c.inflow,
        outflow: c.outflow,
        fees: c.fees,
        net: c.inflow - c.outflow,
      };
    });
  }

  // ==========================================
  // TRANSACTIONS LEDGER
  // ==========================================
  public async getTransactions(
    userId: string,
    query: {
      accountId?: string;
      startDate?: string;
      endDate?: string;
      type?: "IN" | "OUT";
      group?: string;
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const filter: Record<string, any> = { userId };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.group) {
      filter.group = query.group;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { counterpartyName: searchRegex },
        { counterpartyId: searchRegex },
        { person: searchRegex },
        { rawNarration: searchRegex },
        { userNote: searchRegex },
        { category: searchRegex },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 30));
    const skip = (page - 1) * limit;

    const [transactions, total, contacts] = await Promise.all([
      TransactionModel.find(filter)
        .populate("accountId", "bankName accountName accountNumber color")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransactionModel.countDocuments(filter),
      ContactModel.find({ userId }).lean(),
    ]);

    const identifierToContactMap = new Map<string, any>();
    const nameToContactMap = new Map<string, any>();
    for (const c of contacts) {
      if (c.name) nameToContactMap.set(c.name.toLowerCase().trim(), c);
      for (const id of c.identifiers) {
        identifierToContactMap.set(id, c);
      }
    }

    const enrichedTransactions = transactions.map((tx: any) => {
      let matchedContact = null;
      if (tx.counterpartyId && identifierToContactMap.has(tx.counterpartyId)) {
        matchedContact = identifierToContactMap.get(tx.counterpartyId);
      } else if (tx.person && identifierToContactMap.has(tx.person)) {
        matchedContact = identifierToContactMap.get(tx.person);
      } else if (tx.person && nameToContactMap.has(tx.person.toLowerCase().trim())) {
        matchedContact = nameToContactMap.get(tx.person.toLowerCase().trim());
      }

      if (matchedContact) {
        tx.contact = {
          _id: matchedContact._id,
          name: matchedContact.name,
          phoneNumber: matchedContact.phoneNumber,
          accountNumber: matchedContact.accountNumber,
          category: matchedContact.category,
          color: matchedContact.color,
        };
        if (!tx.person || isPlainNumberOrIdentifier(tx.person) || tx.person === "(name not shown on statement)") {
          tx.person = matchedContact.name;
        }
      }

      return tx;
    });

    return {
      transactions: enrichedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async updateTransaction(
    userId: string,
    transactionId: string,
    data: {
      category?: string;
      group?: string;
      userNote?: string;
      person?: string;
      isExcludedFromTotals?: boolean;
    }
  ) {
    const tx = await TransactionModel.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: data },
      { new: true }
    );

    if (!tx) {
      throw new NotFoundException("Transaction not found");
    }

    return tx;
  }

  public async clearAllTransactions(userId: string) {
    const [txResult, uploadResult] = await Promise.all([
      TransactionModel.deleteMany({ userId }),
      StatementUploadModel.deleteMany({ userId }),
    ]);

    // Reset account balances to initial balance and clear statement date
    const accounts = await AccountModel.find({ userId });
    for (const acc of accounts) {
      acc.currentBalance = acc.initialBalance || 0;
      acc.lastStatementDate = undefined;
      await acc.save();
    }

    return {
      message: "All transactions and statement upload records have been cleared successfully.",
      deletedTransactionsCount: txResult.deletedCount,
      deletedUploadsCount: uploadResult.deletedCount,
    };
  }

  // ==========================================
  // DASHBOARD & ANALYTICS CALCULATIONS
  // ==========================================
  public async getDashboardSummary(
    userId: string,
    query: {
      accountId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<DashboardKPISummary> {
    const filter: Record<string, any> = {
      userId,
      isExcludedFromTotals: false,
    };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    const allTx = await TransactionModel.find(filter)
      .select("type amount totalCost fees category group treatedAs")
      .lean();

    let totalMoneyIn = 0;
    let salaryIncome = 0;
    let otherIncome = 0;
    let totalMoneyOut = 0;
    let totalFees = 0;
    let cashWithdrawalFees = 0;
    let p2pTransferFees = 0;
    let standaloneBankFees = 0;

    for (const tx of allTx) {
      // Exclude internal transfers between user's own banks from gross inflow & outflow
      const isInternalBankTransfer = tx.treatedAs === "Between my banks";

      if (tx.type === "IN") {
        if (!isInternalBankTransfer) {
          totalMoneyIn += tx.amount;
          if (tx.category === "Salary") {
            salaryIncome += tx.amount;
          } else {
            otherIncome += tx.amount;
          }
        }
      } else {
        // Outflow
        if (!isInternalBankTransfer) {
          totalMoneyOut += tx.totalCost;
        } else {
          // Internal bank transfers only count the fee paid
          totalMoneyOut += tx.fees;
        }

        // Track fees
        totalFees += tx.fees;
        if (tx.group === "Cash withdrawals") {
          cashWithdrawalFees += tx.fees;
        } else if (tx.group === "Sent to people") {
          p2pTransferFees += tx.fees;
        } else if (tx.group === "Bank fees (stand-alone)") {
          standaloneBankFees += tx.fees;
        }
      }
    }

    // Get account balances (filtered if accountId specified, or combined across all)
    const accountFilter: Record<string, any> = { userId, isArchived: false };
    if (query.accountId && query.accountId !== "all") {
      accountFilter._id = query.accountId;
    }
    const accounts = await AccountModel.find(accountFilter).select("currentBalance").lean();
    const combinedBalance = accounts.reduce(
      (sum, a) => sum + (a.currentBalance || 0),
      0
    );

    const netCashflow = totalMoneyIn - totalMoneyOut;
    const feePercentageOfOutflow =
      totalMoneyOut > 0 ? (totalFees / totalMoneyOut) * 100 : 0;

    return {
      totalMoneyIn,
      salaryIncome,
      otherIncome,
      totalMoneyOut,
      netCashflow,
      combinedBalance,
      costOfBanking: {
        totalFees,
        feePercentageOfOutflow,
        cashWithdrawalFees,
        p2pTransferFees,
        standaloneBankFees,
      },
      totalTransactionsCount: allTx.length,
    };
  }

  public async getMonthlyTrends(
    userId: string,
    query: { accountId?: string; year?: number }
  ): Promise<MonthlyTrendItem[]> {
    const filter: Record<string, any> = {
      userId,
      isExcludedFromTotals: false,
    };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    const allTx = await TransactionModel.find(filter)
      .select("date month type totalCost fees group amount treatedAs")
      .sort({ date: 1 })
      .lean();

    const monthlyMap = new Map<string, {
      received: number;
      out: number;
      fees: number;
      sentToPeople: number;
      cashWithdrawn: number;
    }>();

    for (const tx of allTx) {
      const monthKey = tx.month.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          received: 0,
          out: 0,
          fees: 0,
          sentToPeople: 0,
          cashWithdrawn: 0,
        });
      }

      const m = monthlyMap.get(monthKey)!;
      const isInternal = tx.treatedAs === "Between my banks";

      if (tx.type === "IN") {
        if (!isInternal) m.received += tx.amount;
      } else {
        if (!isInternal) {
          m.out += tx.totalCost;
        } else {
          m.out += tx.fees;
        }
        m.fees += tx.fees;

        if (tx.group === "Sent to people") {
          m.sentToPeople += tx.amount;
        } else if (tx.group === "Cash withdrawals") {
          m.cashWithdrawn += tx.amount;
        }
      }
    }

    const months = Array.from(monthlyMap.keys()).sort();
    let runningNet = 0;

    const result: MonthlyTrendItem[] = months.map((mKey) => {
      const d = monthlyMap.get(mKey)!;
      const net = d.received - d.out;
      runningNet += net;

      const dateObj = new Date(`${mKey}-01`);
      const monthName = dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      return {
        month: mKey,
        monthName,
        moneyReceived: d.received,
        moneyOut: d.out,
        net,
        feesPaid: d.fees,
        sentToPeople: d.sentToPeople,
        cashWithdrawn: d.cashWithdrawn,
        runningNet,
      };
    });

    return result;
  }

  public async getCategoryBreakdown(
    userId: string,
    query: { accountId?: string; startDate?: string; endDate?: string }
  ): Promise<CategoryBreakdownItem[]> {
    const filter: Record<string, any> = {
      userId,
      type: "OUT",
      isExcludedFromTotals: false,
    };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    const txs = await TransactionModel.find(filter)
      .select("category group totalCost fees amount")
      .lean();

    const catMap = new Map<string, {
      group: string;
      category: string;
      amount: number;
      fees: number;
      totalCost: number;
      count: number;
    }>();

    let grandTotalOut = 0;

    for (const tx of txs) {
      const isInternal = tx.treatedAs === "Between my banks";
      const totalCost = isInternal ? tx.fees : tx.totalCost;
      const amount = isInternal ? 0 : tx.amount;

      grandTotalOut += totalCost;

      if (!catMap.has(tx.category)) {
        catMap.set(tx.category, {
          group: tx.group,
          category: tx.category,
          amount: 0,
          fees: 0,
          totalCost: 0,
          count: 0,
        });
      }

      const item = catMap.get(tx.category)!;
      item.amount += amount;
      item.fees += tx.fees;
      item.totalCost += totalCost;
      item.count += 1;
    }

    const items = Array.from(catMap.values()).map((c) => ({
      ...c,
      percentage: grandTotalOut > 0 ? (c.totalCost / grandTotalOut) * 100 : 0,
    }));

    return items.sort((a, b) => b.totalCost - a.totalCost);
  }

  public async getPeopleSummary(
    userId: string,
    query: { accountId?: string; startDate?: string; endDate?: string }
  ): Promise<PersonSummaryItem[]> {
    const filter: Record<string, any> = {
      userId,
      isExcludedFromTotals: false,
      group: { $in: ["Sent to people", "Income"] },
    };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    const [txs, contacts] = await Promise.all([
      TransactionModel.find(filter)
        .select("person counterpartyName counterpartyId rawNarration amount totalCost fees type")
        .lean(),
      ContactModel.find({ userId }).lean(),
    ]);

    const identifierToContactMap = new Map<string, any>();
    const nameToContactMap = new Map<string, any>();
    for (const c of contacts) {
      if (c.name) nameToContactMap.set(c.name.toLowerCase().trim(), c);
      for (const id of c.identifiers) {
        identifierToContactMap.set(id, c);
      }
    }

    const formatName = (str: string | undefined): string => {
      if (!str) return "Unknown";
      let s = str.trim();
      if (/^\d{9,12}$/.test(s)) {
        if (s.startsWith("255") && s.length === 12) {
          return `+255 ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
        }
        return s;
      }
      s = s.replace(/([A-Z]{2,})([a-z]+)/g, "$1 $2");
      s = s.replace(/[_\-]+/g, " ");
      return s
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          if (/^(TZS|NMB|CRDB|P2P|ATM|TIPS|GePG|LUKU|TRA|BOT|TIGO|AIRTEL|VODACOM|HALOTEL|ID)$/i.test(word)) {
            return word.toUpperCase();
          }
          if (/^[a-zA-Z]\.?$/.test(word)) {
            return word.toUpperCase();
          }
          if (/^(not|on|and|for|to|of|via|by|with)$/i.test(word)) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    };

    const peopleMap = new Map<string, {
      personName: string;
      identifiers: Set<string>;
      transfersCount: number;
      amountSent: number;
      feesPaid: number;
      receivedBack: number;
    }>();

    for (const tx of txs) {
      let rawName = tx.person || tx.counterpartyName || "Unknown";
      if (tx.counterpartyId && identifierToContactMap.has(tx.counterpartyId)) {
        rawName = identifierToContactMap.get(tx.counterpartyId).name;
      } else if (tx.person && identifierToContactMap.has(tx.person)) {
        rawName = identifierToContactMap.get(tx.person).name;
      } else if (tx.person && nameToContactMap.has(tx.person.toLowerCase().trim())) {
        rawName = nameToContactMap.get(tx.person.toLowerCase().trim()).name;
      }

      if (rawName.includes("CAR GENERAL") || rawName === "My own Halotel wallet") {
        continue;
      }

      const name = formatName(rawName);

      if (!peopleMap.has(name)) {
        peopleMap.set(name, {
          personName: name,
          identifiers: new Set(),
          transfersCount: 0,
          amountSent: 0,
          feesPaid: 0,
          receivedBack: 0,
        });
      }

      const p = peopleMap.get(name)!;
      if (tx.counterpartyId) p.identifiers.add(tx.counterpartyId);

      if (tx.type === "OUT") {
        p.transfersCount += 1;
        p.amountSent += tx.amount;
        p.feesPaid += tx.fees;
      } else {
        p.receivedBack += tx.amount;
      }
    }

    const result: PersonSummaryItem[] = Array.from(peopleMap.values())
      .filter((p) => p.transfersCount > 0 || p.receivedBack > 0)
      .map((p) => {
        const totalCost = p.amountSent + p.feesPaid;
        return {
          personName: p.personName,
          identifiers: Array.from(p.identifiers),
          transfersCount: p.transfersCount,
          amountSent: p.amountSent,
          feesPaid: p.feesPaid,
          totalCost,
          receivedBack: p.receivedBack,
          netCost: totalCost - p.receivedBack,
        };
      })
      .sort((a, b) => b.amountSent - a.amountSent);

    return result;
  }

  public async getMerchantsSummary(
    userId: string,
    query: { accountId?: string; startDate?: string; endDate?: string }
  ): Promise<MerchantBillSummaryItem[]> {
    const filter: Record<string, any> = {
      userId,
      type: "OUT",
      isExcludedFromTotals: false,
      group: { $in: ["Shopping & bills", "Cash withdrawals"] },
    };

    if (query.accountId && query.accountId !== "all") {
      filter.accountId = query.accountId;
    }

    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) {
      filter.date = dateFilter;
    }

    const txs = await TransactionModel.find(filter)
      .select("category counterpartyId counterpartyName rawNarration amount fees totalCost")
      .lean();

    const map = new Map<string, {
      category: string;
      identifier: string;
      name: string;
      count: number;
      amount: number;
      fees: number;
    }>();

    for (const tx of txs) {
      const id = tx.counterpartyId || tx.counterpartyName || "Other";
      const key = `${tx.category}_${id}`;

      if (!map.has(key)) {
        map.set(key, {
          category: tx.category,
          identifier: id,
          name: tx.counterpartyName || id,
          count: 0,
          amount: 0,
          fees: 0,
        });
      }

      const item = map.get(key)!;
      item.count += 1;
      item.amount += tx.amount;
      item.fees += tx.fees;
    }

    const result = Array.from(map.values())
      .map((m) => ({
        category: m.category,
        identifier: m.identifier,
        name: m.name,
        paymentsCount: m.count,
        amount: m.amount,
        fees: m.fees,
        totalCost: m.amount + m.fees,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return result;
  }
}
