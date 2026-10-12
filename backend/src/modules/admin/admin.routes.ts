import { Router } from "express";
import { adminController } from "./admin.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { requireRole } from "../../middlewares/roleGuard";

const adminRoutes = Router();

// Base authentication required for all admin endpoints
adminRoutes.use(authenticateJWT);

// Exit impersonation: Allowed for any active session that has an impersonation parent
adminRoutes.post("/impersonate/exit", adminController.exitImpersonation);

// All subsequent routes strictly require SUPER_ADMIN role
adminRoutes.use(requireRole(["SUPER_ADMIN"]));

adminRoutes.get("/stats", adminController.getStats);
adminRoutes.get("/users", adminController.getUsers);
adminRoutes.patch("/users/:id/approve", adminController.approveUser);
adminRoutes.patch("/users/:id/reject", adminController.rejectUser);
adminRoutes.patch("/users/:id/status", adminController.updateUserStatus);
adminRoutes.patch("/users/:id/role", adminController.updateUserRole);
adminRoutes.delete("/users/:id", adminController.deleteUser);
adminRoutes.post("/impersonate/:id", adminController.startImpersonation);

export default adminRoutes;
