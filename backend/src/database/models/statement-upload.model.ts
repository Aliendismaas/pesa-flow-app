import mongoose, { Document, Schema } from "mongoose";

export interface StatementUploadDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  fileType: "PDF" | "XLSX";
  statementPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalLinesParsed: number;
  transactionsExtracted: number;
  scannedCount?: number;
  importedCount?: number;
  skippedCount?: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  status: "COMMITTED" | "PENDING" | "FAILED";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const statementUploadSchema = new Schema<StatementUploadDocument>(
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
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["PDF", "XLSX"],
      default: "PDF",
    },
    statementPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    totalLinesParsed: {
      type: Number,
      default: 0,
    },
    transactionsExtracted: {
      type: Number,
      default: 0,
    },
    scannedCount: {
      type: Number,
      default: 0,
    },
    importedCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    totalDebits: {
      type: Number,
      default: 0,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    closingBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["COMMITTED", "PENDING", "FAILED"],
      default: "COMMITTED",
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const StatementUploadModel = mongoose.model<StatementUploadDocument>(
  "StatementUpload",
  statementUploadSchema
);
export default StatementUploadModel;
