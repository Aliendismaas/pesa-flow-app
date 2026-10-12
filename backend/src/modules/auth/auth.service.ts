import jwt from "jsonwebtoken";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import {
  LoginDto,
  RegisterDto,
  resetPasswordDto,
} from "../../common/interface/auth.interface";
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from "../../common/utils/date-time";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
import { config } from "../../config/app.config";
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../../common/utils/jwt";
import { sendEmail } from "../../mailers/mailer";
import {
  adminNewRegistrationNotificationTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "../../mailers/templates/template";
import { HTTPSTATUS } from "../../config/http.config";
import { hashValue } from "../../common/utils/bcrypt";
import { logger } from "../../common/utils/logger";

export class AuthService {
  public async register(registerData: RegisterDto) {
    const { name, email, password } = registerData;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await UserModel.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists with this email",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    const isSuperAdminEmail =
      config.SUPER_ADMIN_EMAIL &&
      normalizedEmail === config.SUPER_ADMIN_EMAIL.toLowerCase().trim();

    const newUser = await UserModel.create({
      name,
      email: normalizedEmail,
      password,
      role: isSuperAdminEmail ? "SUPER_ADMIN" : "USER",
      status: isSuperAdminEmail ? "APPROVED" : "PENDING_APPROVAL",
      isEmailVerified: isSuperAdminEmail ? true : false,
      approvedAt: isSuperAdminEmail ? new Date() : undefined,
    });

    if (isSuperAdminEmail) {
      logger.info(`Super Admin registered and auto-approved: ${normalizedEmail}`);
    } else {
      // Dispatch notification email to Super Admin
      const reviewUrl = `${config.APP_ORIGIN}/admin/users`;
      if (config.SUPER_ADMIN_EMAIL) {
        try {
          await sendEmail({
            to: config.SUPER_ADMIN_EMAIL,
            ...adminNewRegistrationNotificationTemplate(
              {
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
              },
              reviewUrl
            ),
          });
          logger.info(
            `Registration approval notification sent to Super Admin (${config.SUPER_ADMIN_EMAIL}) for new user ${newUser.email}`
          );
        } catch (mailError) {
          logger.error(
            "Failed to dispatch Super Admin notification email",
            mailError
          );
        }
      }
    }

    return {
      user: newUser,
      pendingApproval: !isSuperAdminEmail,
      message: isSuperAdminEmail
        ? "Account created successfully."
        : "Registration submitted successfully! Your account is pending Super Admin review.",
    };
  }

  public async login(loginData: LoginDto) {
    const { email, password, userAgent } = loginData;
    const normalizedEmail = email.toLowerCase().trim();

    logger.info(`Login attempt for email: ${normalizedEmail}`);
    const user = await UserModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      logger.warn(`Login failed: User with email ${normalizedEmail} not found`);
      throw new BadRequestException(
        "Invalid email or password provided",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for email: ${normalizedEmail}`);
      throw new BadRequestException(
        "Invalid email or password provided",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // Check Account Approval / Suspension Status
    if (user.status === "PENDING_APPROVAL") {
      logger.warn(`Login blocked: User ${normalizedEmail} is pending approval`);
      throw new ForbiddenException(
        "Your account registration is currently pending Super Admin review. You will receive an email once your account has been approved.",
        ErrorCode.AUTH_ACCOUNT_PENDING_APPROVAL
      );
    }

    if (user.status === "REJECTED") {
      logger.warn(`Login blocked: User ${normalizedEmail} was rejected`);
      throw new ForbiddenException(
        "Your account registration request was declined by the administrator.",
        ErrorCode.AUTH_ACCOUNT_REJECTED
      );
    }

    if (user.status === "SUSPENDED") {
      logger.warn(`Login blocked: User ${normalizedEmail} is suspended`);
      throw new ForbiddenException(
        "Your account has been suspended by the administrator. Please contact support.",
        ErrorCode.AUTH_ACCOUNT_SUSPENDED
      );
    }

    // Check if the user enable 2fa return user= null
    if (user.userPreferences.enable2FA) {
      logger.info(`2FA required for user ID: ${user._id}`);
      return {
        user: null,
        mfaRequired: true,
        accessToken: "",
        refreshToken: "",
      };
    }

    logger.info(`Creating session for user ID: ${user._id}`);
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    logger.info(`Signing tokens for user ID: ${user._id}`);
    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );

    logger.info(`Login successful for user ID: ${user._id}`);
    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async refreshToken(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException("Session does not exist");
    }

    if (session.expiredAt.getTime() <= now) {
      throw new UnauthorizedException("Session expired");
    }

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN
      );
      await session.save();
    }

    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session._id,
          },
          refreshTokenSignOptions
        )
      : undefined;

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  public async verifyEmail(code: string) {
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      validCode.userId,
      {
        isEmailVerified: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new BadRequestException(
        "Unable to verify email address",
        ErrorCode.VALIDATION_ERROR
      );
    }

    await validCode.deleteOne();
    return {
      user: updatedUser,
    };
  }

  public async forgotPassword(email: string) {
    const user = await UserModel.findOne({
      email: email,
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    //check mail rate limit is 2 emails per 3 or 10 min
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        "Too many request, try again later",
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      );
    }

    const expiresAt = anHourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`;

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`);
    }

    return {
      url: resetLink,
      emailId: data.id,
    };
  }

  public async resePassword({ password, verificationCode }: resetPasswordDto) {
    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      throw new NotFoundException("Invalid or expired verification code");
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new BadRequestException("Failed to reset password!");
    }

    await validCode.deleteOne();

    await SessionModel.deleteMany({
      userId: updatedUser._id,
    });

    return {
      user: updatedUser,
    };
  }

  public async logout(sessionId: string) {
    return await SessionModel.findByIdAndDelete(sessionId);
  }
}
