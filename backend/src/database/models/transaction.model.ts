import mongoose, { Document, Schema } from "mongoose";

export type TransactionGroup =
  | "Income"
  | "Sent to people"
  | "Shopping & bills"
  | "Cash withdrawals"
  | "Moved to my own wallet / card"
  | "Between my banks"
  | "Bank fees (stand-alone)";

export type TreatedAsType =
  | "External"
  | "Own wallet"
  | "Virtual card"
  | "Between my banks";

export interface TransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  statementUploadId?: mongoose.Types.ObjectId;
  date: Date;
  month: Date;
  type: "IN" | "OUT";
  group: TransactionGroup;
  category: string;
  amount: number;
  fees: number;
  totalCost: number;
  treatedAs: TreatedAsType;
  referenceId?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  network?: string;
  userNote?: string;
  person?: string;
  rawNarration: string;
  fingerprint: string;
  isExcludedFromTotals: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    statementUploadId: {
      type: Schema.Types.ObjectId,
      ref: "StatementUpload",
      required: false,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    month: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
      index: true,
    },
    group: {
      type: String,
      enum: [
        "Income",
        "Sent to people",
        "Shopping & bills",
        "Cash withdrawals",
        "Moved to my own wallet / card",
        "Between my banks",
        "Bank fees (stand-alone)",
      ],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    treatedAs: {
      type: String,
      enum: ["External", "Own wallet", "Virtual card", "Between my banks"],
      default: "External",
      index: true,
    },
    referenceId: {
      type: String,
      required: false,
      index: true,
    },
    counterpartyId: {
      type: String,
      required: false,
      index: true,
    },
    counterpartyName: {
      type: String,
      required: false,
      trim: true,
    },
    network: {
      type: String,
      required: false,
      trim: true,
    },
    userNote: {
      type: String,
      required: false,
    },
    person: {
      type: String,
      required: false,
      index: true,
    },
    rawNarration: {
      type: String,
      required: true,
    },
    fingerprint: {
      type: String,
      required: false,
      index: true,
    },
    isExcludedFromTotals: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ accountId: 1, fingerprint: 1 }, { unique: true, sparse: true });
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, group: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

const TransactionModel = mongoose.model<TransactionDocument>(
  "Transaction",
  transactionSchema
);
export default TransactionModel;
