import API from "./axios-client";

type loginType = { email: string; password: string };

type registerType = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type verifyEmailType = { code: string };
type forgotPasswordType = { email: string };
type resetPasswordType = { password: string; verificationCode: string };
type verifyMFAType = { code: string; secretKey: string };
type mfaLoginType = { code: string; email: string };
type SessionType = {
  _id: string;
  userId: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type SessionResponseType = {
  message: string;
  sessions: SessionType[];
};

type mfaType = {
  message: string;
  secret: string;
  qrImageUrl: string;
};

export const loginMutationFn = async (data: loginType) =>
  await API.post(`/auth/login`, data);

export const registerMutationFn = async (data: registerType) =>
  await API.post(`/auth/register`, data);

export const verifyEmailMutationFn = async (data: verifyEmailType) =>
  await API.post(`/auth/verify/email`, data);

export const forgotPasswordMutationFn = async (data: forgotPasswordType) =>
  await API.post(`/auth/password/forgot`, data);

export const resetPasswordMutationFn = async (data: resetPasswordType) =>
  await API.post(`/auth/password/reset`, data);

export const verifyMFAMutationFn = async (data: verifyMFAType) =>
  await API.post(`/mfa/verify`, data);

export const verifyMFALoginMutationFn = async (data: mfaLoginType) =>
  await API.post(`/mfa/verify-login`, data);

export const logoutMutationFn = async () => await API.post(`/auth/logout`);

export const mfaSetupQueryFn = async () => {
  const response = await API.get<mfaType>(`/mfa/setup`);
  return response.data;
};
export const revokeMFAMutationFn = async () => await API.put(`/mfa/revoke`, {});

export const getUserSessionQueryFn = async () => await API.get(`/session/`);

export const sessionsQueryFn = async () => {
  const response = await API.get<SessionResponseType>(`/session/all`);
  return response.data;
};

export const sessionDelMutationFn = async (id: string) =>
  await API.delete(`/session/${id}`);

// ==========================================
// PESAFLOW FINANCE API
// ==========================================

export interface AccountItem {
  _id: string;
  bankName: "NMB" | "CRDB" | "OTHER";
  accountName: string;
  accountNumber: string;
  currency: string;
  color: string;
  logoUrl?: string;
  currentBalance: number;
  initialBalance: number;
  transactionCount?: number;
  lastStatementDate?: string;
  createdAt: string;
}

export interface TransactionItem {
  _id: string;
  accountId: {
    _id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    color: string;
  };
  date: string;
  month: string;
  type: "IN" | "OUT";
  group: string;
  category: string;
  amount: number;
  fees: number;
  totalCost: number;
  treatedAs: string;
  referenceId?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  network?: string;
  userNote?: string;
  person?: string;
  rawNarration: string;
  isExcludedFromTotals: boolean;
  contact?: {
    _id: string;
    name: string;
    phoneNumber?: string;
    accountNumber?: string;
    category?: string;
    color?: string;
  };
}

export interface DashboardSummary {
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

export interface MonthlyTrend {
  month: string;
  monthName: string;
  moneyReceived: number;
  moneyOut: number;
  net: number;
  feesPaid: number;
  sentToPeople: number;
  cashWithdrawn: number;
  runningNet: number;
}

export interface CategoryBreakdown {
  group: string;
  category: string;
  amount: number;
  fees: number;
  totalCost: number;
  percentage: number;
  count: number;
}

export interface PersonSummary {
  personName: string;
  identifiers: string[];
  transfersCount: number;
  amountSent: number;
  feesPaid: number;
  totalCost: number;
  receivedBack: number;
  netCost: number;
}

export interface MerchantSummary {
  category: string;
  identifier: string;
  name: string;
  paymentsCount: number;
  amount: number;
  fees: number;
  totalCost: number;
}

// Accounts API
export const getAccountsQueryFn = async () => {
  const res = await API.get<{ accounts: AccountItem[] }>("/finance/accounts");
  return res.data.accounts;
};

export const createAccountMutationFn = async (data: {
  bankName: "NMB" | "CRDB" | "OTHER";
  accountName: string;
  accountNumber: string;
  currency?: string;
  color?: string;
  logoUrl?: string;
  initialBalance?: number;
}) => await API.post("/finance/accounts", data);

export const updateAccountMutationFn = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<AccountItem>;
}) => await API.put(`/finance/accounts/${id}`, data);

export const deleteAccountMutationFn = async (id: string) =>
  await API.delete(`/finance/accounts/${id}`);

// Statements API
export const previewStatementMutationFn = async (formData: FormData) => {
  const res = await API.post("/finance/statements/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const commitStatementMutationFn = async (formData: FormData) => {
  const res = await API.post("/finance/statements/commit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Transactions API
export const getTransactionsQueryFn = async (params: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  group?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await API.get<{
    transactions: TransactionItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>("/finance/transactions", { params });
  return res.data;
};

export const updateTransactionMutationFn = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<TransactionItem>;
}) => await API.put(`/finance/transactions/${id}`, data);

export const clearAllTransactionsMutationFn = async () => {
  const res = await API.delete<{
    message: string;
    deletedTransactionsCount: number;
    deletedUploadsCount: number;
  }>("/finance/transactions/clear-all");
  return res.data;
};

// Analytics API
export const getDashboardSummaryQueryFn = async (params?: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await API.get<{ summary: DashboardSummary }>(
    "/finance/analytics/dashboard",
    { params }
  );
  return res.data.summary;
};

export const getMonthlyTrendsQueryFn = async (params?: {
  accountId?: string;
  year?: number;
}) => {
  const res = await API.get<{ trends: MonthlyTrend[] }>(
    "/finance/analytics/monthly",
    { params }
  );
  return res.data.trends;
};

export const getCategoryBreakdownQueryFn = async (params?: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await API.get<{ categories: CategoryBreakdown[] }>(
    "/finance/analytics/categories",
    { params }
  );
  return res.data.categories;
};

export const getPeopleSummaryQueryFn = async (params?: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await API.get<{ people: PersonSummary[] }>(
    "/finance/analytics/people",
    { params }
  );
  return res.data.people;
};

export const getMerchantsSummaryQueryFn = async (params?: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await API.get<{ merchants: MerchantSummary[] }>(
    "/finance/analytics/merchants",
    { params }
  );
  return res.data.merchants;
};

export interface MonthlyCoverageItem {
  month: string;
  monthName: string;
  count: number;
  inflow: number;
  outflow: number;
  fees: number;
  net: number;
}

export const getMonthlyCoverageQueryFn = async (params?: {
  accountId?: string;
}) => {
  const res = await API.get<{ coverage: MonthlyCoverageItem[] }>(
    "/finance/coverage",
    { params }
  );
  return res.data.coverage;
};

// ==========================================
// CONTACTS (PHONEBOOK) API
// ==========================================
export interface ContactItem {
  _id: string;
  name: string;
  phoneNumber?: string;
  accountNumber?: string;
  identifiers: string[];
  category?: string;
  color?: string;
  notes?: string;
  transfersCount?: number;
  totalAmountSent?: number;
  createdAt: string;
  updatedAt?: string;
}

export const getContactsQueryFn = async () => {
  const res = await API.get<{ contacts: ContactItem[] }>("/finance/contacts");
  return res.data.contacts;
};

export const createContactMutationFn = async (data: {
  name: string;
  phoneNumber?: string;
  accountNumber?: string;
  category?: string;
  color?: string;
  notes?: string;
}) => {
  const res = await API.post<{ message: string; contact: ContactItem }>(
    "/finance/contacts",
    data
  );
  return res.data;
};

export const updateContactMutationFn = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<ContactItem>;
}) => {
  const res = await API.put<{ message: string; contact: ContactItem }>(
    `/finance/contacts/${id}`,
    data
  );
  return res.data;
};

export const deleteContactMutationFn = async (id: string) => {
  const res = await API.delete<{ message: string }>(`/finance/contacts/${id}`);
  return res.data;
};

// ==========================================
// SUPER ADMIN & IMPERSONATION API
// ==========================================

export type UserRole = "SUPER_ADMIN" | "USER";
export type UserStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  accountCount: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  userPreferences?: {
    enable2FA: boolean;
  };
}

export interface AdminStatsResponse {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  suspendedUsers: number;
  rejectedUsers: number;
  totalAccounts: number;
  totalTransactions: number;
}

export interface AdminUsersResponse {
  message: string;
  users: AdminUserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAdminStatsQueryFn = async () => {
  const res = await API.get<{ message: string; stats: AdminStatsResponse }>("/admin/stats");
  return res.data;
};

export const getAdminUsersQueryFn = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}) => {
  const res = await API.get<AdminUsersResponse>("/admin/users", { params });
  return res.data;
};

export const approveUserMutationFn = async (id: string) =>
  await API.patch(`/admin/users/${id}/approve`);

export const rejectUserMutationFn = async ({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}) => await API.patch(`/admin/users/${id}/reject`, { reason });

export const updateUserStatusMutationFn = async ({
  id,
  status,
}: {
  id: string;
  status: "APPROVED" | "SUSPENDED";
}) => await API.patch(`/admin/users/${id}/status`, { status });

export const updateUserRoleMutationFn = async ({
  id,
  role,
}: {
  id: string;
  role: "SUPER_ADMIN" | "USER";
}) => await API.patch(`/admin/users/${id}/role`, { role });

export const deleteUserMutationFn = async (id: string) =>
  await API.delete(`/admin/users/${id}`);

export const impersonateUserMutationFn = async (id: string) =>
  await API.post(`/admin/impersonate/${id}`);

export const exitImpersonationMutationFn = async () =>
  await API.post(`/admin/impersonate/exit`);




