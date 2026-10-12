import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../database/models/user.model";
import AccountModel from "../database/models/account.model";
import TransactionModel from "../database/models/transaction.model";
import StatementUploadModel from "../database/models/statement-upload.model";
import { FinanceService } from "../modules/finance/finance.service";

dotenv.config();

const financeService = new FinanceService();

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("Connected to MongoDB");

  const user = await UserModel.findOne({ email: "eliasdismass732@gmail.com" });
  if (!user) {
    console.error("User eliasdismass732@gmail.com not found!");
    process.exit(1);
  }
  const userId = (user as any)._id.toString();
  console.log(`Found user: ${user.name} (${userId})`);

  // Clear existing finance data for clean seed
  await TransactionModel.deleteMany({ userId });
  await StatementUploadModel.deleteMany({ userId });
  await AccountModel.deleteMany({ userId });
  console.log("Cleared existing finance records for clean seed.");

  // 1. Create CRDB Account
  const crdbAccount = await AccountModel.create({
    userId,
    bankName: "CRDB",
    accountName: "CRDB Primary",
    accountNumber: "0152431604700",
    currency: "TZS",
    color: "#008850",
    initialBalance: 0,
    currentBalance: 0,
  });
  const crdbAccountId = (crdbAccount as any)._id.toString();
  console.log("Created CRDB Account:", crdbAccountId);

  // 2. Create NMB Account
  const nmbAccount = await AccountModel.create({
    userId,
    bankName: "NMB",
    accountName: "NMB Salary",
    accountNumber: "22310046949",
    currency: "TZS",
    color: "#f58220",
    initialBalance: 0,
    currentBalance: 0,
  });
  const nmbAccountId = (nmbAccount as any)._id.toString();
  console.log("Created NMB Account:", nmbAccountId);

  // 3. Import CRDB Statement PDF
  const crdbPdfPath = path.resolve(__dirname, "../../../Bank_Statements/CRDB Statement.pdf");
  if (fs.existsSync(crdbPdfPath)) {
    console.log("Reading CRDB Statement PDF...");
    const crdbBuffer = fs.readFileSync(crdbPdfPath);
    const crdbRes = await financeService.commitStatement(
      userId,
      crdbAccountId,
      crdbBuffer,
      "CRDB Statement.pdf"
    );
    console.log(`CRDB Import: ${crdbRes.importedCount} transactions imported. Closing balance: ${crdbRes.closingBalance}`);
  }

  // 4. Import NMB Statement PDF
  const nmbPdfPath = path.resolve(__dirname, "../../../Bank_Statements/NMB Statement.pdf");
  if (fs.existsSync(nmbPdfPath)) {
    console.log("Reading NMB Statement PDF...");
    const nmbBuffer = fs.readFileSync(nmbPdfPath);
    const nmbRes = await financeService.commitStatement(
      userId,
      nmbAccountId,
      nmbBuffer,
      "NMB Statement.pdf"
    );
    console.log(`NMB Import: ${nmbRes.importedCount} transactions imported. Closing balance: ${nmbRes.closingBalance}`);
  }

  // 5. Query Dashboard Summary to verify
  const kpis = await financeService.getDashboardSummary(userId, {});
  const categories = await financeService.getCategoryBreakdown(userId, {});
  const trends = await financeService.getMonthlyTrends(userId, {});

  console.log("\n==========================================");
  console.log("     PESAFLOW FINANCIAL DASHBOARD READY   ");
  console.log("==========================================");
  console.log("Total Money In:", kpis.totalMoneyIn.toLocaleString(), "TZS");
  console.log("Salary Income:", kpis.salaryIncome.toLocaleString(), "TZS");
  console.log("Other Income:", kpis.otherIncome.toLocaleString(), "TZS");
  console.log("Total Money Out:", kpis.totalMoneyOut.toLocaleString(), "TZS");
  console.log("Net Cashflow:", kpis.netCashflow.toLocaleString(), "TZS");
  console.log("Combined Balance:", kpis.combinedBalance.toLocaleString(), "TZS");
  console.log("Total Bank Fees Paid:", kpis.costOfBanking.totalFees.toLocaleString(), "TZS");
  console.log("Cost of Banking Ratio:", kpis.costOfBanking.feePercentageOfOutflow.toFixed(2) + "%");
  console.log("Total Transactions Ingested:", kpis.totalTransactionsCount);
  console.log("Category Distribution Items:", categories.length);
  console.log("Monthly Trends Months Count:", trends.length);
  console.log("==========================================\n");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
