import mongoose from "mongoose";
import dotenv from "dotenv";
import TransactionModel from "../database/models/transaction.model";
import { generateTransactionFingerprint } from "../modules/finance/utils/fingerprint.util";

dotenv.config();

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("Connected to MongoDB for fingerprint backfill...");

  const allTx = await TransactionModel.find({});
  console.log(`Found ${allTx.length} total transactions to inspect.`);

  let updatedCount = 0;
  for (const tx of allTx) {
    const fp = generateTransactionFingerprint({
      accountId: tx.accountId.toString(),
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      fees: tx.fees || 0,
      referenceId: tx.referenceId,
      rawNarration: tx.rawNarration,
    });

    if (tx.fingerprint !== fp) {
      tx.fingerprint = fp;
      await tx.save();
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled fingerprints for ${updatedCount} transactions.`);

  // Ensure unique compound index is built
  try {
    await TransactionModel.collection.createIndex(
      { accountId: 1, fingerprint: 1 },
      { unique: true, name: "uniq_account_fingerprint" }
    );
    console.log("Successfully verified unique index: uniq_account_fingerprint");
  } catch (indexErr: any) {
    console.warn("Index build note:", indexErr.message);
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
