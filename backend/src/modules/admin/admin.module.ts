import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

const adminService = new AdminService();
const adminController = new AdminController(adminService);

export { adminService, adminController };
