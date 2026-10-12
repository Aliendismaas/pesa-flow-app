import { Router } from "express";
import multer from "multer";
import { financeController } from "./finance.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const financeRoutes = Router();

financeRoutes.use(authenticateJWT);

// Accounts
financeRoutes.get("/accounts", financeController.getAccounts);
financeRoutes.post("/accounts", financeController.createAccount);
financeRoutes.put("/accounts/:id", financeController.updateAccount);
financeRoutes.delete("/accounts/:id", financeController.deleteAccount);

// Contacts (Phonebook)
financeRoutes.get("/contacts", financeController.getContacts);
financeRoutes.post("/contacts", financeController.createContact);
financeRoutes.put("/contacts/:id", financeController.updateContact);
financeRoutes.delete("/contacts/:id", financeController.deleteContact);

// Statements Ingestion
financeRoutes.post(
  "/statements/preview",
  upload.single("file"),
  financeController.previewStatement
);
financeRoutes.post(
  "/statements/commit",
  upload.single("file"),
  financeController.commitStatement
);

// Transactions Ledger
financeRoutes.get("/transactions", financeController.getTransactions);
financeRoutes.put("/transactions/:id", financeController.updateTransaction);
financeRoutes.delete("/transactions/clear-all", financeController.clearAllTransactions);

// Analytics & Reports
financeRoutes.get("/coverage", financeController.getMonthlyCoverage);
financeRoutes.get("/analytics/dashboard", financeController.getDashboardSummary);
financeRoutes.get("/analytics/monthly", financeController.getMonthlyTrends);
financeRoutes.get("/analytics/categories", financeController.getCategoryBreakdown);
financeRoutes.get("/analytics/people", financeController.getPeopleSummary);
financeRoutes.get("/analytics/merchants", financeController.getMerchantsSummary);

export default financeRoutes;
