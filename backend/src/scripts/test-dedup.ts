import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../database/models/user.model";
import AccountModel from "../database/models/account.model";
import TransactionModel from "../database/models/transaction.model";
import { FinanceService } from "../modules/finance/finance.service";

dotenv.config();
const financeService = new FinanceService();

async function testReupload() {
  await mongoose.connect(process.env.MONGO_URI!);
  const user = await UserModel.findOne({ email: "eliasdismass732@gmail.com" });
  const userId = (user as any)._id.toString();

  const crdbAccount = await AccountModel.findOne({ userId, bankName: "CRDB" });
  const crdbAccountId = (crdbAccount as any)._id.toString();

  const crdbPdfPath = path.resolve(__dirname, "../../../Bank_Statements/CRDB Statement.pdf");
  const crdbBuffer = fs.readFileSync(crdbPdfPath);

  const initialTxCount = await TransactionModel.countDocuments({ userId, accountId: crdbAccountId });
  console.log(`Current CRDB transactions in DB: ${initialTxCount}`);

  console.log("Attempting to re-upload the same CRDB Statement...");
  const result = await financeService.commitStatement(
    userId,
    crdbAccountId,
    crdbBuffer,
    "CRDB Statement.pdf"
  );

  console.log("Re-upload result message:", result.message);
  console.log("Imported Count:", result.importedCount);
  console.log("Skipped Count:", result.skippedCount);
  console.log("Total Scanned:", result.totalScanned);

  const finalTxCount = await TransactionModel.countDocuments({ userId, accountId: crdbAccountId });
  console.log(`Final CRDB transactions in DB: ${finalTxCount}`);

  if (initialTxCount === finalTxCount && result.importedCount === 0 && result.skippedCount === 59) {
    console.log("SUCCESS: 100% duplicate protection confirmed! Zero duplicate transactions inserted.");
  } else {
    console.error("FAILURE: Duplicate transactions were inserted!");
  }

  await mongoose.disconnect();
}

testReupload().catch(console.error);
