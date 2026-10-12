/**
 * Utilities for phonebook contact matching and Tanzanian phone/account normalization
 */

export function buildContactIdentifiers(
  phoneNumber?: string,
  accountNumber?: string
): string[] {
  const set = new Set<string>();

  if (phoneNumber) {
    const raw = phoneNumber.trim();
    const rawDigits = raw.replace(/\D/g, "");

    if (rawDigits) {
      set.add(rawDigits);

      // Tanzanian mobile variations:
      // Case 1: Local 10-digit format starting with 0 (e.g. 0755123456 or 0655123456)
      if (rawDigits.length === 10 && rawDigits.startsWith("0")) {
        const withoutZero = rawDigits.slice(1);
        set.add(withoutZero);
        set.add(`255${withoutZero}`);
        set.add(`+255${withoutZero}`);
      }
      // Case 2: International 12-digit format starting with 255 (e.g. 255755123456)
      else if (rawDigits.length === 12 && rawDigits.startsWith("255")) {
        const without255 = rawDigits.slice(3);
        set.add(without255);
        set.add(`0${without255}`);
        set.add(`+255${without255}`);
      }
      // Case 3: 9-digit format without leading 0 (e.g. 755123456 or 655123456)
      else if (
        rawDigits.length === 9 &&
        (rawDigits.startsWith("6") || rawDigits.startsWith("7"))
      ) {
        set.add(`0${rawDigits}`);
        set.add(`255${rawDigits}`);
        set.add(`+255${rawDigits}`);
      }
    }
  }

  if (accountNumber) {
    const cleanAcc = accountNumber.trim().replace(/\s+/g, "");
    if (cleanAcc) {
      set.add(cleanAcc);
      const accDigits = cleanAcc.replace(/\D/g, "");
      if (accDigits) {
        set.add(accDigits);
      }
    }
  }

  return Array.from(set);
}

/**
 * Checks if a string consists primarily of digits or phone/account representation
 */
export function isPlainNumberOrIdentifier(val: string | undefined): boolean {
  if (!val) return false;
  const s = val.trim();
  // Standard phone numbers or account numbers: 6 to 16 digits, optionally starting with + or 255
  if (/^(\+?255\d{9}|0\d{9}|\d{9,16})$/.test(s)) {
    return true;
  }
  // Formatted numbers like "+255 755 123 456"
  if (/^(\+?255[\s\-]?)?\d{3}[\s\-]?\d{3}[\s\-]?\d{3,4}$/.test(s)) {
    return true;
  }
  return false;
}
