import React, { createContext, useContext, useState } from "react";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (val: boolean) => void;
  formatCurrency: (amount: number | undefined | null, currency?: string) => string;
  maskText: (val: string | number | undefined | null) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const STORAGE_KEY = "pesaflow_privacy_mode_v2";

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === "true";
      }
      // Hidden by default!
      return true;
    } catch {
      return true;
    }
  });

  const setPrivacyMode = (val: boolean) => {
    setIsPrivacyModeState(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch (e) {
      console.error("Failed to save privacy mode setting to localStorage:", e);
    }
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!isPrivacyMode);
  };

  const formatCurrency = (amount: number | undefined | null, currency: string = "TZS"): string => {
    if (isPrivacyMode) {
      return `•••••• ${currency}`;
    }
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `0 ${currency}`;
    }
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  const maskText = (val: string | number | undefined | null): string => {
    if (!val && val !== 0) return "-";
    if (isPrivacyMode) return "••••••";
    return String(val);
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        setPrivacyMode,
        formatCurrency,
        maskText,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
};
