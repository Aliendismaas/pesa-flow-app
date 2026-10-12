import crypto from "crypto";

export interface TransactionFingerprintInput {
  accountId: string;
  date: Date | string;
  type: "IN" | "OUT";
  amount: number;
  fees?: number;
  referenceId?: string;
  rawNarration: string;
}

/**
 * Normalizes a transaction narration to prevent whitespace or transient character differences
 * from altering the fingerprint across repeated statement exports.
 */
export function normalizeNarration(narration: string): string {
  if (!narration) return "";
  return narration
    .toLowerCase()
    .replace(/page \d+ : \d+/gi, "")
    .replace(/sn trans date details/gi, "")
    .replace(/[^\w\s]/gi, " ") // replace punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates a deterministic SHA-256 fingerprint for a transaction.
 * Identical transactions across multiple statement uploads (e.g. 12-month rolling exports)
 * will produce the exact same fingerprint.
 */
export function generateTransactionFingerprint(input: TransactionFingerprintInput): string {
  const dateStr =
    typeof input.date === "string"
      ? input.date.slice(0, 10)
      : input.date.toISOString().slice(0, 10);

  const normalizedAmt = Number(input.amount || 0).toFixed(2);
  const normalizedFees = Number(input.fees || 0).toFixed(2);
  const ref = (input.referenceId || "").trim().toLowerCase();
  const cleanNarration = normalizeNarration(input.rawNarration);

  // Core canonical signature
  const canonical = [
    input.accountId.toString(),
    dateStr,
    input.type,
    normalizedAmt,
    normalizedFees,
    ref,
    cleanNarration,
  ].join("|");

  return crypto.createHash("sha256").update(canonical).digest("hex");
}
