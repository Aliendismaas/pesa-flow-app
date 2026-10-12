import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats date values for tables to "10-July-2026" (dd-MMMM-yyyy)
 */
export function formatTableDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "-";
    return format(d, "dd-MMMM-yyyy");
  } catch {
    return "-";
  }
}

/**
 * Converts uppercase statement text or messy strings to clean, elegant Proper Case (Title Case).
 * Handles concatenated banking narrations (e.g., "FRANCISirudi badae N" -> "Francis Irudi Badae N"),
 * acronyms (NMB, CRDB, TIPS, TZS, GePG), and phone numbers (+255 ...).
 */
export function formatProperName(name: string | undefined | null): string {
  if (!name) return "Unknown";
  let str = name.trim();

  // If pure numbers (like 255627384328), format as clean mobile number
  if (/^\d{9,12}$/.test(str)) {
    if (str.startsWith("255") && str.length === 12) {
      return `+255 ${str.slice(3, 6)} ${str.slice(6, 9)} ${str.slice(9)}`;
    }
    if (str.startsWith("0") && str.length === 10) {
      return `${str.slice(0, 4)} ${str.slice(4, 7)} ${str.slice(7)}`;
    }
    return str;
  }

  // Handle concatenated uppercase + lowercase tokens from bank memos (e.g. "FRANCISirudi" -> "FRANCIS irudi")
  str = str.replace(/([A-Z]{2,})([a-z]+)/g, "$1 $2");

  // Replace underscores or excessive dashes
  str = str.replace(/[_\-]+/g, " ");

  const words = str.split(/\s+/);

  return words
    .filter(Boolean)
    .map((word) => {
      // Known financial abbreviations & acronyms
      if (/^(TZS|NMB|CRDB|P2P|ATM|TIPS|GePG|LUKU|TRA|BOT|TIGO|AIRTEL|VODACOM|HALOTEL|ID)$/i.test(word)) {
        return word.toUpperCase();
      }
      // Single letter initials like "N" or "M."
      if (/^[a-zA-Z]\.?$/.test(word)) {
        return word.toUpperCase();
      }
      // Minor prepositions in the middle of long phrases
      if (/^(not|on|and|for|to|of|via|by|with)$/i.test(word)) {
        return word.toLowerCase();
      }
      // Standard title case: First letter uppercase, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export const toProperCase = formatProperName;

/**
 * Checks if a string represents a raw phone number or account identifier
 */
export function isRawIdentifierOrPhone(name: string | undefined | null): boolean {
  if (!name) return false;
  const s = name.trim();
  const digitsOnly = s.replace(/[\s\-\+]/g, "");
  // Matches 9 to 16 digit phone or bank numbers
  return /^\d{9,16}$/.test(digitsOnly);
}
