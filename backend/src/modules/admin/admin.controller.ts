import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { AdminService } from "./admin.service";
import { HTTPSTATUS } from "../../config/http.config";
import { setAuthenticationCookies } from "../../common/utils/cookie";
import { BadRequestException } from "../../common/utils/catch-errors";

export class AdminController {
  private adminService: AdminService;

  constructor(adminService: AdminService) {
    this.adminService = adminService;
  }

  public getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.adminService.getStats();
    return res.status(HTTPSTATUS.OK).json({
      message: "Admin statistics retrieved successfully",
      stats,
    });
  });

  public getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, status, role } = req.query;
    const result = await this.adminService.getUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      role: role ? String(role) : undefined,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Users retrieved successfully",
      ...result,
    });
  });

  public approveUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = req.user!;
    const result = await this.adminService.approveUser(id, adminUser);

    return res.status(HTTPSTATUS.OK).json(result);
  });

  public rejectUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUser = req.user!;
    const result = await this.adminService.rejectUser(id, adminUser, reason);

    return res.status(HTTPSTATUS.OK).json(result);
  });

  public updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.user!;

    if (!["APPROVED", "SUSPENDED"].includes(status)) {
      throw new BadRequestException("Invalid status provided");
    }

    const result = await this.adminService.updateUserStatus(id, status, adminUser);
    return res.status(HTTPSTATUS.OK).json(result);
  });

  public updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminUser = req.user!;

    if (!["SUPER_ADMIN", "USER"].includes(role)) {
      throw new BadRequestException("Invalid role provided");
    }

    const result = await this.adminService.updateUserRole(id, role, adminUser);
    return res.status(HTTPSTATUS.OK).json(result);
  });

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = req.user!;
    const result = await this.adminService.deleteUser(id, adminUser);

    return res.status(HTTPSTATUS.OK).json(result);
  });

  public startImpersonation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = req.user!;
    const currentSessionId = req.sessionId;
    const userAgent = req.headers["user-agent"];

    const { accessToken, refreshToken, targetUser } =
      await this.adminService.startImpersonation(
        id,
        adminUser,
        currentSessionId,
        userAgent
      );

    setAuthenticationCookies({
      res,
      accessToken,
      refreshToken,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: `Now impersonating ${targetUser.name}`,
      targetUser,
      isImpersonated: true,
    });
  });

  public exitImpersonation = asyncHandler(async (req: Request, res: Response) => {
    const currentSessionId = req.sessionId;
    const userAgent = req.headers["user-agent"];

    if (!currentSessionId) {
      throw new BadRequestException("Session ID missing");
    }

    const { accessToken, refreshToken, adminUser } =
      await this.adminService.exitImpersonation(currentSessionId, userAgent);

    setAuthenticationCookies({
      res,
      accessToken,
      refreshToken,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Exited impersonation mode. Super Admin privileges restored.",
      adminUser,
      isImpersonated: false,
    });
  });
}
