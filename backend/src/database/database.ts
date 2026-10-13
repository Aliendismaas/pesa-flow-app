import mongoose from "mongoose";
import { config } from "../config/app.config";
import UserModel from "./models/user.model";

let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDatabase = async () => {
  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If connection is in progress, await the ongoing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    await connectionPromise;
    console.log("Connected to Mongo database");

    if (!isConnected) {
      isConnected = true;
      // Backfill any existing users without status or role
      try {
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
      } catch (initErr) {
        console.error("Initial data sync note:", initErr);
      }
    }

    return mongoose;
  } catch (error) {
    connectionPromise = null;
    console.error("Error connecting to Mongo database:", error);
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDatabase;
