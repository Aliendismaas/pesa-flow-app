import mongoose from "mongoose";
import { config } from "../config/app.config";
import UserModel from "./models/user.model";

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to Mongo database");

    // Backfill any existing users without status or role
    await UserModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: "APPROVED", role: "USER" } }
    );

    // Ensure Super Admin privileges for designated email
    if (config.SUPER_ADMIN_EMAIL) {
      const superAdmin = await UserModel.findOneAndUpdate(
        { email: config.SUPER_ADMIN_EMAIL.toLowerCase().trim() },
        {
          $set: {
            role: "SUPER_ADMIN",
            status: "APPROVED",
            isEmailVerified: true,
            approvedAt: new Date(),
          },
        },
        { new: true }
      );
      if (superAdmin) {
        console.log(`Verified Super Admin account: ${superAdmin.email}`);
      }
    }
  } catch (error) {
    console.log("Error connecting to Mongo database", error);
    process.exit(1);
  }
};

export default connectDatabase;
