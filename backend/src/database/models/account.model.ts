import mongoose, { Document, Schema } from "mongoose";

export interface AccountDocument extends Document {
  userId: mongoose.Types.ObjectId;
  bankName: "NMB" | "CRDB" | "OTHER";
  accountName: string;
  accountNumber: string;
  currency: string;
  color: string;
  logoUrl?: string;
  currentBalance: number;
  initialBalance: number;
  lastStatementDate?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<AccountDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bankName: {
      type: String,
      enum: ["NMB", "CRDB", "OTHER"],
      required: true,
      default: "NMB",
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      default: "TZS",
      trim: true,
    },
    color: {
      type: String,
      default: "#f58220",
    },
    logoUrl: {
      type: String,
      required: false,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    initialBalance: {
      type: Number,
      default: 0,
    },
    lastStatementDate: {
      type: Date,
      required: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

const AccountModel = mongoose.model<AccountDocument>("Account", accountSchema);
export default AccountModel;
