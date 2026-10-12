import mongoose, { Document, Schema } from "mongoose";

export interface ContactDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber?: string;
  accountNumber?: string;
  identifiers: string[];
  category?: string;
  color?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<ContactDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    identifiers: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    color: {
      type: String,
      default: "#10b981",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, identifiers: 1 });

const ContactModel = mongoose.model<ContactDocument>("Contact", contactSchema);
export default ContactModel;
