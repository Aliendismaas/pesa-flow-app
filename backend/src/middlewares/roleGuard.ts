import { Request, Response, NextFunction } from "express";
import { UserRole } from "../database/models/user.model";
import { ForbiddenException, UnauthorizedException } from "../common/utils/catch-errors";
import { ErrorCode } from "../common/enums/error-code.enum";

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedException(
        "Authentication required to perform this action",
        ErrorCode.ACCESS_UNAUTHORIZED
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
        ErrorCode.ACCESS_FORBIDDEN
      );
    }

    next();
  };
};
