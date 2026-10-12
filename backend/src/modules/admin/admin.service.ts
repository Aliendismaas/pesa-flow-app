import mongoose from "mongoose";
import UserModel, { UserDocument, UserRole, UserStatus } from "../../database/models/user.model";
import SessionModel from "../../database/models/session.model";
import AccountModel from "../../database/models/account.model";
import TransactionModel from "../../database/models/transaction.model";
import ContactModel from "../../database/models/contact.model";
import StatementUploadModel from "../../database/models/statement-upload.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import { config } from "../../config/app.config";
import { sendEmail } from "../../mailers/mailer";
import {
  userAccountApprovedTemplate,
  userAccountRejectedTemplate,
} from "../../mailers/templates/template";
import {
  refreshTokenSignOptions,
  signJwtToken,
} from "../../common/utils/jwt";
import { logger } from "../../common/utils/logger";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export class AdminService {
  /**
   * Get overall system metrics and user counts
   */
  public async getStats() {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      rejectedUsers,
      totalAccounts,
      totalTransactions,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: "PENDING_APPROVAL" }),
      UserModel.countDocuments({ status: "APPROVED" }),
      UserModel.countDocuments({ status: "SUSPENDED" }),
      UserModel.countDocuments({ status: "REJECTED" }),
      AccountModel.countDocuments(),
      TransactionModel.countDocuments(),
    ]);

    return {
      totalUsers,
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      rejectedUsers,
      totalAccounts,
      totalTransactions,
    };
  }

  /**
   * Get paginated users with optional search & filtering
   */
  public async getUsers(params: GetUsersParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (params.search && params.search.trim() !== "") {
      const searchRegex = new RegExp(params.search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (params.status && params.status !== "ALL") {
      query.status = params.status;
    }

    if (params.role && params.role !== "ALL") {
      query.role = params.role;
    }

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("approvedBy", "name email")
        .lean(),
      UserModel.countDocuments(query),
    ]);

    // Attach basic activity counts (accounts count)
    const userIds = users.map((u) => u._id);
    const accountCounts = await AccountModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const accountCountMap = new Map<string, number>();
    accountCounts.forEach((ac) => {
      accountCountMap.set(String(ac._id), ac.count);
    });

    const enrichedUsers = users.map((user) => ({
      ...user,
      accountCount: accountCountMap.get(String(user._id)) || 0,
    }));

    return {
      users: enrichedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve a pending user account
   */
  public async approveUser(userId: string, adminUser: UserDocument) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.status = "APPROVED";
    user.isEmailVerified = true;
    user.approvedAt = new Date();
    user.approvedBy = adminUser._id as mongoose.Types.ObjectId;
    user.rejectionReason = undefined;
    await user.save();

    // Send approval email to the user
    const loginUrl = `${config.APP_ORIGIN}/`;
    try {
      await sendEmail({
        to: user.email,
        ...userAccountApprovedTemplate({ name: user.name }, loginUrl),
      });
      logger.info(`Approval email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send approval email to ${user.email}`, error);
    }

    return {
      message: `Account for ${user.name} approved successfully`,
      user,
    };
  }

  /**
   * Reject a pending user account
   */
  public async rejectUser(
    userId: string,
    adminUser: UserDocument,
    reason?: string
  ) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot reject a Super Admin account");
    }

    user.status = "REJECTED";
    user.rejectionReason = reason || "Application did not meet requirements";
    await user.save();

    // Invalidate any existing sessions
    await SessionModel.deleteMany({ userId: user._id });

    // Send polite rejection email
    try {
      await sendEmail({
        to: user.email,
        ...userAccountRejectedTemplate({ name: user.name, reason }),
      });
      logger.info(`Rejection email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send rejection email to ${user.email}`, error);
    }

    return {
      message: `Account for ${user.name} was rejected`,
      user,
    };
  }

  /**
   * Update status (e.g. suspend or reactivate)
   */
  public async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminUser: UserDocument
  ) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (String(user._id) === String(adminUser._id)) {
      throw new BadRequestException("You cannot change your own status");
    }

    if (user.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot change status of a Super Admin");
    }

    user.status = status;
    if (status === "APPROVED") {
      user.isEmailVerified = true;
      user.approvedAt = new Date();
      user.approvedBy = adminUser._id as mongoose.Types.ObjectId;
    } else if (status === "SUSPENDED" || status === "REJECTED") {
      // Invalidate active sessions immediately
      await SessionModel.deleteMany({ userId: user._id });
    }

    await user.save();

    return {
      message: `User status changed to ${status}`,
      user,
    };
  }

  /**
   * Change a user's role
   */
  public async updateUserRole(
    userId: string,
    role: UserRole,
    adminUser: UserDocument
  ) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (String(user._id) === String(adminUser._id)) {
      throw new BadRequestException("You cannot change your own role");
    }

    user.role = role;
    await user.save();

    return {
      message: `User role updated to ${role}`,
      user,
    };
  }

  /**
   * Cascade delete a user and all their financial data
   */
  public async deleteUser(userId: string, adminUser: UserDocument) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (String(user._id) === String(adminUser._id)) {
      throw new BadRequestException("You cannot delete your own account");
    }

    if (user.role === "SUPER_ADMIN") {
      throw new BadRequestException("Cannot delete a Super Admin account");
    }

    // Cascade delete associated resources
    await Promise.all([
      AccountModel.deleteMany({ userId: user._id }),
      TransactionModel.deleteMany({ userId: user._id }),
      ContactModel.deleteMany({ userId: user._id }),
      StatementUploadModel.deleteMany({ userId: user._id }),
      SessionModel.deleteMany({ userId: user._id }),
      UserModel.findByIdAndDelete(user._id),
    ]);

    logger.info(`User ${user.email} and all financial records cascade deleted by Super Admin`);

    return {
      message: `User ${user.name} and all associated data have been permanently deleted`,
    };
  }

  /**
   * Initiate impersonation of a target user
   */
  public async startImpersonation(
    targetUserId: string,
    adminUser: UserDocument,
    currentSessionId?: string,
    userAgent?: string
  ) {
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    if (String(targetUser._id) === String(adminUser._id)) {
      throw new BadRequestException("You are already logged in as this user");
    }

    if (targetUser.status !== "APPROVED") {
      throw new BadRequestException(
        `Cannot impersonate an unapproved user (Status: ${targetUser.status})`
      );
    }

    // Create a new session for the target user, linked to the Super Admin
    const impersonationSession = await SessionModel.create({
      userId: targetUser._id,
      userAgent: `[Impersonation by ${adminUser.name}] ${userAgent || ""}`.trim(),
      impersonatedBy: adminUser._id,
      originalSessionId: currentSessionId
        ? new mongoose.Types.ObjectId(currentSessionId)
        : undefined,
    });

    const accessToken = signJwtToken({
      userId: targetUser._id,
      sessionId: impersonationSession._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: impersonationSession._id,
      },
      refreshTokenSignOptions
    );

    logger.info(
      `Super Admin ${adminUser.email} started impersonating ${targetUser.email} (Session: ${impersonationSession._id})`
    );

    return {
      accessToken,
      refreshToken,
      targetUser,
      originalSessionId: currentSessionId,
    };
  }

  /**
   * Exit active impersonation and restore Super Admin session
   */
  public async exitImpersonation(currentSessionId: string, userAgent?: string) {
    const currentSession = await SessionModel.findById(currentSessionId);
    if (!currentSession || !currentSession.impersonatedBy) {
      throw new BadRequestException("Active session is not an impersonation session");
    }

    const adminUser = await UserModel.findById(currentSession.impersonatedBy);
    if (!adminUser) {
      throw new NotFoundException("Super Admin user not found");
    }

    // Terminate the temporary impersonation session
    await SessionModel.findByIdAndDelete(currentSessionId);

    // Create or renew a session for the Super Admin
    const adminSession = await SessionModel.create({
      userId: adminUser._id,
      userAgent: userAgent || "Super Admin Restored Session",
    });

    const accessToken = signJwtToken({
      userId: adminUser._id,
      sessionId: adminSession._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: adminSession._id,
      },
      refreshTokenSignOptions
    );

    logger.info(
      `Exited impersonation. Super Admin ${adminUser.email} session restored.`
    );

    return {
      accessToken,
      refreshToken,
      adminUser,
    };
  }
}
