import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";

const financeService = new FinanceService();
const financeController = new FinanceController(financeService);

export { financeService, financeController };
