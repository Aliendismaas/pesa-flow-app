import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../database/models/user.model";
import { FinanceService } from "../modules/finance/finance.service";

dotenv.config();
const financeService = new FinanceService();

async function checkCoverage() {
  await mongoose.connect(process.env.MONGO_URI!);
  const user = await UserModel.findOne({ email: "eliasdismass732@gmail.com" });
  const userId = (user as any)._id.toString();

  const coverage = await financeService.getMonthlyCoverage(userId);
  console.log("Monthly Statement Coverage (Top 12 Months):");
  console.table(coverage);

  await mongoose.disconnect();
}

checkCoverage().catch(console.error);
