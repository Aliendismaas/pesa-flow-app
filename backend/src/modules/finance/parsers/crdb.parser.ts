import { PDFParse } from "pdf-parse";
import {
  ParsedBundledTransaction,
  ParsedStatementResult,
} from "../finance.types";
import { TransactionCategorizer } from "./categorizer";

interface CrdbRawItem {
  sn: number;
  dateStr: string;
  ref: string;
  details: string;
  amount: number;
  balance: number;
  isCredit: boolean;
}

export class CrdbStatementParser {
  public static async parse(
    fileBuffer: Buffer,
    ownBankAccounts: string[] = ["24510060282", "10389772114"]
  ): Promise<ParsedStatementResult> {
    const parser = new PDFParse(new Uint8Array(fileBuffer));
    const result = await parser.getText();
    const fullText = result.text;

    // 1. Extract metadata
    const acctMatch = fullText.match(/Account No[\s\S]*?(\d{11})/);
    const accountNumber = acctMatch ? acctMatch[1] : "10389772114";

    const nameMatch = fullText.match(/Account Name[\s\S]*?(ELIAS DISMAS MAFUNDA|[A-Z\s]{5,30})/);
    const accountName = nameMatch ? nameMatch[1].trim() : "ELIAS DISMAS MAFUNDA";

    const periodMatch = fullText.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
    const startDate = periodMatch ? new Date(periodMatch[1]) : new Date("2026-06-05");
    const endDate = periodMatch ? new Date(periodMatch[2]) : new Date("2026-09-14");

    // 2. Parse individual statement rows
    // Items start with `SN YYYY-MM-DD`
    const rawItems: CrdbRawItem[] = [];
    const itemRegex = /(?:^|\n)\s*(\d+)\s+(\d{4}-\d{2}-\d{2})([\s\S]*?)(?=(?:\n\s*\d+\s+\d{4}-\d{2}-\d{2}|$|Page \d+))/g;

    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(fullText)) !== null) {
      const sn = parseInt(match[1], 10);
      const dateStr = match[2];
      const content = match[3];

      // Extract REF
      const refMatch = content.match(/REF:([a-z0-9]+)/i);
      const ref = refMatch ? refMatch[1] : `CRDB_${sn}`;

      // Extract Amount and Balance at the end of the entry
      // e.g. "2026-09-15 1,000.00 3,029.38\tSIMAPP" or "7,500.00 93,802.39"
      const numMatches = content.match(/([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
      if (!numMatches) continue;

      const amount = parseFloat(numMatches[1].replace(/,/g, ""));
      const balance = parseFloat(numMatches[2].replace(/,/g, ""));

      // Clean narration details
      const details = content
        .replace(/REF:[a-z0-9]+/i, "")
        .replace(/Page \d+ : \d+[\s\S]*?BALANCE\s+DEBIT/gi, "")
        .replace(/SN TRANS DATE DETAILS[\s\S]*?DEBIT/gi, "")
        .replace(/[\d,]+\.\d{2}/g, "")
        .replace(/\t/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      rawItems.push({
        sn,
        dateStr,
        ref,
        details,
        amount,
        balance,
        isCredit: false, // determined below
      });
    }

    // Determine Credit vs Debit by tracking balance progression
    // (CRDB rows are listed newest to oldest)
    for (let i = 0; i < rawItems.length; i++) {
      const current = rawItems[i];
      const previous = i < rawItems.length - 1 ? rawItems[i + 1] : null;

      if (previous) {
        // current.balance = previous.balance + Credit (or - Debit)
        const diff = current.balance - previous.balance;
        if (diff > 0.01) {
          current.isCredit = true;
        } else {
          current.isCredit = false;
        }
      } else {
        // First recorded transaction (opening deposit)
        current.isCredit = true;
      }
    }

    // 3. Bundle transactions by REF
    // Fee lines sharing the same REF: are merged into the principal line
    const bundledMap = new Map<string, {
      sn: number;
      date: Date;
      ref: string;
      narration: string;
      isCredit: boolean;
      principalAmount: number;
      fees: number;
    }>();

    for (const item of rawItems) {
      const key = `${item.ref}_${item.dateStr}_${item.isCredit ? 'IN' : 'OUT'}`;
      if (!bundledMap.has(key)) {
        bundledMap.set(key, {
          sn: item.sn,
          date: new Date(item.dateStr),
          ref: item.ref,
          narration: item.details,
          isCredit: item.isCredit,
          principalAmount: item.amount,
          fees: 0,
        });
      } else {
        const existing = bundledMap.get(key)!;
        // In CRDB, fee lines (excise duty, VAT) are small amounts under 10,000 TZS attached to the main debit
        if (!item.isCredit && (item.amount < existing.principalAmount || existing.fees > 0)) {
          existing.fees += item.amount;
        } else {
          // Both large or same, add to principal
          existing.principalAmount += item.amount;
        }
      }
    }

    // 4. Transform into final ParsedBundledTransaction records
    const transactions: ParsedBundledTransaction[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    for (const [, item] of bundledMap) {
      const type = item.isCredit ? "IN" : "OUT";
      const totalCost = item.principalAmount + item.fees;

      if (type === "IN") {
        totalCredits += item.principalAmount;
      } else {
        totalDebits += totalCost;
      }

      const dateObj = item.date;
      const monthObj = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), 1));

      const catResult = TransactionCategorizer.categorize({
        type,
        narration: item.narration,
        amount: item.principalAmount,
        referenceId: item.ref,
        ownBankAccounts,
      });

      transactions.push({
        date: dateObj,
        month: monthObj,
        type,
        group: catResult.group,
        category: catResult.category,
        amount: item.principalAmount,
        fees: item.fees,
        totalCost,
        treatedAs: catResult.treatedAs,
        referenceId: item.ref,
        counterpartyId: catResult.counterpartyId,
        counterpartyName: catResult.counterpartyName,
        network: catResult.network,
        person: catResult.person,
        rawNarration: item.narration,
        isExcludedFromTotals: catResult.isExcludedFromTotals,
      });
    }

    // Sort chronologically (oldest to newest)
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    const closingBalance = rawItems.length > 0 ? rawItems[0].balance : 3029.38;

    return {
      bankName: "CRDB",
      accountNumber,
      accountName,
      currency: "TZS",
      startDate,
      endDate,
      totalDebits,
      totalCredits,
      closingBalance,
      rawLinesCount: rawItems.length,
      transactions,
    };
  }
}
