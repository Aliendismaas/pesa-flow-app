import { TransactionGroup, TreatedAsType } from "../../../database/models/transaction.model";

export interface CategorizationResult {
  group: TransactionGroup;
  category: string;
  treatedAs: TreatedAsType;
  counterpartyId?: string;
  counterpartyName?: string;
  network?: string;
  person?: string;
  userNote?: string;
  isExcludedFromTotals: boolean;
}

export class TransactionCategorizer {
  // Known own mobile wallet numbers
  private static ownMobileWallets = ["255627384328"];

  // Known employer signatures
  private static salaryKeywords = [
    "CAR GENERAL TRADING",
    "SALARY",
    "MKOPO KUTOKA CAR GENERAL",
    "PAYROLL",
  ];

  public static categorize(input: {
    type: "IN" | "OUT";
    narration: string;
    amount: number;
    referenceId?: string;
    ownBankAccounts?: string[]; // e.g. ["24510060282", "10389772114"]
  }): CategorizationResult {
    const { type, narration, amount, ownBankAccounts = [] } = input;
    const norm = narration.toUpperCase();

    // 0. Check for Reversed / Refunded transactions
    if (
      norm.includes("[REFUNDED") ||
      norm.includes("REVERSAL") ||
      norm.includes("REVERSED")
    ) {
      return {
        group: "Shopping & bills",
        category: "Reversed / Refunded",
        treatedAs: "External",
        isExcludedFromTotals: true,
        rawNote: "Reversed / refunded transaction",
      } as any;
    }

    // 1. INFLOWS (IN)
    if (type === "IN") {
      // 1.1 Salary
      if (this.salaryKeywords.some((k) => norm.includes(k))) {
        return {
          group: "Income",
          category: "Salary",
          treatedAs: "External",
          counterpartyId: "CAR GENERAL TRADING LIMITED",
          counterpartyName: "CAR GENERAL TRADING LIMITED",
          person: "CAR GENERAL TRADING LIMITED",
          isExcludedFromTotals: false,
        };
      }

      // 1.2 Own transfer between banks (credit side)
      if (
        ownBankAccounts.some(
          (acc) => norm.includes(acc) && acc !== input.referenceId
        ) ||
        (norm.includes("NMB") && norm.includes("CRDB")) ||
        norm.includes("ELIAS DISMAS MAFUNDA TO ELIAS DISMAS MAFUNDA")
      ) {
        return {
          group: "Between my banks",
          category: "Own transfer (between my banks)",
          treatedAs: "Between my banks",
          counterpartyId: "Own Bank Transfer",
          counterpartyName: "My other bank account",
          person: "My other bank account",
          isExcludedFromTotals: false,
        };
      }

      // 1.3 Agent Deposit
      if (norm.includes("AGENCY") || norm.includes("AGENT") || norm.includes("TER ID")) {
        const descMatch = narration.match(/Description\s+([A-Za-z\s]+)/i);
        const agentName = descMatch ? descMatch[1].trim() : "Agent deposit";
        return {
          group: "Income",
          category: "Received via agent deposit",
          treatedAs: "External",
          counterpartyId: "AGENT",
          counterpartyName: `Agent deposit - ${agentName}`,
          person: `Agent deposit - ${agentName}`,
          isExcludedFromTotals: false,
        };
      }

      // 1.4 Initial Deposit
      if (norm.includes("CHAP_CHAP DEPOSIT") || norm.includes("OPENING") || norm.includes("INITIAL DEPOSIT")) {
        return {
          group: "Income",
          category: "Initial deposit",
          treatedAs: "External",
          counterpartyId: "CHAP CHAP deposit",
          counterpartyName: "Initial opening deposit",
          isExcludedFromTotals: false,
        };
      }

      // 1.5 Received from Person (P2P transfer)
      let sender = "Person";
      const fromMatch = narration.match(/From\s+([A-Za-z\s]+?)(?:=>|\s*TO|\s*null|$)/i);
      if (fromMatch && !fromMatch[1].toUpperCase().includes("ELIAS DISMAS")) {
        sender = fromMatch[1].trim();
      }

      return {
        group: "Income",
        category: "Received from person",
        treatedAs: "External",
        counterpartyId: sender,
        counterpartyName: sender,
        person: sender,
        isExcludedFromTotals: false,
      };
    }

    // 2. OUTFLOWS (OUT)

    // 2.1 Own Bank Transfer (debit side)
    if (
      ownBankAccounts.some((acc) => norm.includes(acc)) ||
      norm.includes("ELIAS DISMAS MAFUNDA TO ELIAS DISMAS MAFUNDA") ||
      (norm.includes("10389772114") && norm.includes("CRDB")) ||
      (norm.includes("24510060282") && norm.includes("NMB"))
    ) {
      return {
        group: "Between my banks",
        category: "Own transfer (between my banks)",
        treatedAs: "Between my banks",
        counterpartyId: "Own Bank Transfer",
        counterpartyName: "My bank account",
        person: "My bank account",
        isExcludedFromTotals: false,
      };
    }

    // 2.2 Own Mobile Wallet (e.g. 255627384328)
    const hasOwnWallet = this.ownMobileWallets.some((num) => norm.includes(num));
    if (
      hasOwnWallet &&
      (norm.includes("HALOTELB2C") ||
        norm.includes("FT TOHALOPESA") ||
        norm.includes("RECEIVERID 255627384328") ||
        norm.includes("IDDA PHILIPO"))
    ) {
      return {
        group: "Moved to my own wallet / card",
        category: "Moved to my own mobile wallet",
        treatedAs: "Own wallet",
        counterpartyId: "255627384328",
        counterpartyName: "My own Halotel wallet",
        network: "Halotel (Halopesa)",
        person: "My own Halotel wallet",
        isExcludedFromTotals: false,
      };
    }

    // 2.3 Virtual Card Top-up
    if (
      norm.includes("VRCT") ||
      norm.includes("CARD TOP VIA") ||
      norm.includes("VIRTUAL CARD")
    ) {
      return {
        group: "Moved to my own wallet / card",
        category: "Virtual card top-up",
        treatedAs: "Virtual card",
        counterpartyId: "VIRTUAL CARD",
        counterpartyName: "My virtual card (online spending)",
        person: "My virtual card (online spending)",
        isExcludedFromTotals: false,
      };
    }

    // 2.4 Cash Withdrawal (ATM, Branch, Agent Cashless)
    if (
      norm.includes("ATM") ||
      norm.includes("BRANCH CASH") ||
      norm.includes("CARDLESS WITHDRAW") ||
      norm.includes("KUTOA")
    ) {
      let place = "ATM / branch cash";
      if (norm.includes("CARDLESS WITHDRAW") || norm.includes("AGENCY") || norm.includes("AGENT")) {
        place = "Agent cash (cardless)";
      }
      return {
        group: "Cash withdrawals",
        category: "Cash withdrawal",
        treatedAs: "External",
        counterpartyId: norm.includes("ATM") ? "ATM / BRANCH CASH" : "AGENT CASH",
        counterpartyName: place,
        person: place,
        isExcludedFromTotals: false,
      };
    }

    // 2.5 Electricity (LUKU)
    if (norm.includes("LUKU") || norm.includes("METER:") || norm.includes("METER ")) {
      const meterMatch = narration.match(/Meter:\s*(\d+)/i) || narration.match(/METER\s*(\d+)/i);
      const meterId = meterMatch ? `METER ${meterMatch[1]}` : "LUKU METER";
      return {
        group: "Shopping & bills",
        category: "Electricity (LUKU)",
        treatedAs: "External",
        counterpartyId: meterId,
        counterpartyName: "LUKU electricity tokens",
        network: "TANESCO",
        person: "LUKU electricity tokens",
        isExcludedFromTotals: false,
      };
    }

    // 2.6 Government Bills (GePG)
    if (norm.includes("GEPG") || norm.includes("UTLP")) {
      const nameMatch = narration.match(/GEPG_PAY\s+\d+\s+Phone Number\s+\d+\s+Name\s+([^|]+)/i);
      const gepgName = nameMatch ? nameMatch[1].trim() : "Government Payment (GePG)";
      return {
        group: "Shopping & bills",
        category: "Government / bill payment (GePG)",
        treatedAs: "External",
        counterpartyId: "GePG",
        counterpartyName: gepgName,
        person: gepgName,
        isExcludedFromTotals: false,
      };
    }

    // 2.7 Merchant / QR / Lipa Namba
    if (
      norm.includes("TANQR") ||
      norm.includes("QR MERCHANT") ||
      norm.includes("LIPA") ||
      norm.includes("TO MERCHANT")
    ) {
      const merchMatch =
        narration.match(/TO MERCHANT\s+(\d+)/i) ||
        narration.match(/QR MERCHANT PAYMENT\s+(\d+)/i) ||
        narration.match(/LIPA\s+([A-Za-z\s]+)/i);
      const merchId = merchMatch ? `MERCHANT ${merchMatch[1]}` : "QR MERCHANT";
      return {
        group: "Shopping & bills",
        category: "Merchant payment (QR / Lipa)",
        treatedAs: "External",
        counterpartyId: merchId,
        counterpartyName: merchId,
        network: "Lipa Namba",
        person: merchId,
        isExcludedFromTotals: false,
      };
    }

    // 2.8 Card purchase (POS / online)
    if (norm.includes("POS") || norm.includes("MCARD INTER POS") || norm.includes("BRANCH SALE")) {
      return {
        group: "Shopping & bills",
        category: "Card purchase (POS / online)",
        treatedAs: "External",
        counterpartyId: "CARD POS (international)",
        counterpartyName: "Card purchase",
        person: "Card purchase",
        isExcludedFromTotals: false,
      };
    }

    // 2.9 Sent to Person (Mobile Money)
    const phoneMatch = narration.match(/255\d{9}/);
    if (
      norm.includes("B2C") ||
      norm.includes("FT TOHALOPESA") ||
      norm.includes("FT TO M-PESA") ||
      norm.includes("FT TO AIRTEL") ||
      norm.includes("FT TO TIGO") ||
      norm.includes("MKONONI") ||
      phoneMatch
    ) {
      let phone = phoneMatch ? phoneMatch[0] : "Mobile Money";
      let network = "Mobile Money";
      if (norm.includes("HALOTEL") || norm.includes("HALOPESA")) network = "Halotel (Halopesa)";
      else if (norm.includes("VODACOM") || norm.includes("M-PESA")) network = "Vodacom (M-Pesa)";
      else if (norm.includes("AIRTEL")) network = "Airtel Money";
      else if (norm.includes("TIGO") || norm.includes("TIGOPESA")) network = "Tigo Pesa";

      let recipientName = "(name not shown on statement)";
      // Check if statement provided a name
      const nameInDetails = narration.match(/\d{12}\s+([A-Z\s]{4,30})(?:\s+\d{4}|$)/);
      if (nameInDetails && !nameInDetails[1].includes("ELIAS DISMAS")) {
        recipientName = nameInDetails[1].trim();
      }

      return {
        group: "Sent to people",
        category: "Sent to person (mobile money)",
        treatedAs: "External",
        counterpartyId: phone,
        counterpartyName: recipientName,
        network,
        person: recipientName !== "(name not shown on statement)" ? recipientName : phone,
        isExcludedFromTotals: false,
      };
    }

    // 2.10 Sent to Person (Bank Transfer / P2P)
    if (norm.includes("FUND-TRANSFER") || norm.includes("FT FROM")) {
      let recipientName = "Bank Transfer Recipient";
      const toMatch = narration.match(/=>\s*([A-Za-z\s]+)/i) || narration.match(/TO\s+([A-Za-z\s]+)/i);
      if (toMatch && !toMatch[1].includes("ELIAS DISMAS")) {
        recipientName = toMatch[1].trim();
      }
      return {
        group: "Sent to people",
        category: "Sent to person (bank transfer)",
        treatedAs: "External",
        counterpartyId: `NMB:${recipientName}`,
        counterpartyName: recipientName,
        person: recipientName,
        isExcludedFromTotals: false,
      };
    }

    // 2.11 TIPS Transfer
    if (norm.includes("TIPS") || norm.includes("BOT TIPS CLEARING")) {
      return {
        group: "Sent to people",
        category: "TIPS transfer (recipient not shown)",
        treatedAs: "External",
        counterpartyId: "TIPS ?",
        counterpartyName: "Recipient not shown on NMB statement",
        network: "TIPS",
        person: "Recipient not shown on NMB statement",
        isExcludedFromTotals: false,
      };
    }

    // 2.12 Default: Standalone Bank Fees
    return {
      group: "Bank fees (stand-alone)",
      category: "Bank fees & charges",
      treatedAs: "External",
      counterpartyId: "BANK",
      counterpartyName: "Bank Fees & Charges",
      isExcludedFromTotals: false,
    };
  }
}
