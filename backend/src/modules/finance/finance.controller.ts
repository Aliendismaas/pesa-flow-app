import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { FinanceService } from "./finance.service";
import { HTTPSTATUS } from "../../config/http.config";
import { BadRequestException } from "../../common/utils/catch-errors";

export class FinanceController {
  private financeService: FinanceService;

  constructor(financeService: FinanceService) {
    this.financeService = financeService;
  }

  // ACCOUNTS
  public getAccounts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const accounts = await this.financeService.getAccounts(userId);
    return res.status(HTTPSTATUS.OK).json({ accounts });
  });

  public createAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const account = await this.financeService.createAccount(userId, req.body);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Account created successfully",
      account,
    });
  });

  public updateAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const account = await this.financeService.updateAccount(
      userId,
      req.params.id,
      req.body
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Account updated successfully",
      account,
    });
  });

  public deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await this.financeService.deleteAccount(userId, req.params.id);
    return res.status(HTTPSTATUS.OK).json(result);
  });

  // STATEMENTS
  public previewStatement = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const accountId = req.body.accountId;
      const file = req.file;

      if (!accountId) {
        throw new BadRequestException("accountId is required");
      }
      if (!file) {
        throw new BadRequestException("Statement file is required");
      }

      const preview = await this.financeService.previewStatement(
        userId,
        accountId,
        file.buffer,
        file.originalname,
        req.body.targetMonth
      );

      return res.status(HTTPSTATUS.OK).json({
        message: "Statement parsed successfully",
        preview,
      });
    }
  );

  public commitStatement = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const accountId = req.body.accountId;
    const file = req.file;

    if (!accountId) {
      throw new BadRequestException("accountId is required");
    }
    if (!file) {
      throw new BadRequestException("Statement file is required");
    }

    const result = await this.financeService.commitStatement(
      userId,
      accountId,
      file.buffer,
      file.originalname,
      req.body.targetMonth
    );

    return res.status(HTTPSTATUS.OK).json(result);
  });

  public getMonthlyCoverage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const accountId = req.query.accountId as string;
    const coverage = await this.financeService.getMonthlyCoverage(userId, accountId);
    return res.status(HTTPSTATUS.OK).json({ coverage });
  });

  // TRANSACTIONS
  public getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await this.financeService.getTransactions(
      userId,
      req.query as any
    );
    return res.status(HTTPSTATUS.OK).json(result);
  });

  public updateTransaction = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const tx = await this.financeService.updateTransaction(
        userId,
        req.params.id,
        req.body
      );
      return res.status(HTTPSTATUS.OK).json({
        message: "Transaction updated successfully",
        transaction: tx,
      });
    }
  );

  public clearAllTransactions = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const result = await this.financeService.clearAllTransactions(userId);
      return res.status(HTTPSTATUS.OK).json(result);
    }
  );

  // DASHBOARD & ANALYTICS
  public getDashboardSummary = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const summary = await this.financeService.getDashboardSummary(
        userId,
        req.query as any
      );
      return res.status(HTTPSTATUS.OK).json({ summary });
    }
  );

  public getMonthlyTrends = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const trends = await this.financeService.getMonthlyTrends(
        userId,
        req.query as any
      );
      return res.status(HTTPSTATUS.OK).json({ trends });
    }
  );

  public getCategoryBreakdown = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const categories = await this.financeService.getCategoryBreakdown(
        userId,
        req.query as any
      );
      return res.status(HTTPSTATUS.OK).json({ categories });
    }
  );

  public getPeopleSummary = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const people = await this.financeService.getPeopleSummary(
        userId,
        req.query as any
      );
      return res.status(HTTPSTATUS.OK).json({ people });
    }
  );

  public getMerchantsSummary = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      const merchants = await this.financeService.getMerchantsSummary(
        userId,
        req.query as any
      );
      return res.status(HTTPSTATUS.OK).json({ merchants });
    }
  );

  // CONTACTS (PHONEBOOK)
  public getContacts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const contacts = await this.financeService.getContacts(userId);
    return res.status(HTTPSTATUS.OK).json({ contacts });
  });

  public createContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const contact = await this.financeService.createContact(userId, req.body);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Contact saved to phonebook successfully",
      contact,
    });
  });

  public updateContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const contact = await this.financeService.updateContact(
      userId,
      req.params.id,
      req.body
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Contact updated successfully",
      contact,
    });
  });

  public deleteContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await this.financeService.deleteContact(userId, req.params.id);
    return res.status(HTTPSTATUS.OK).json(result);
  });
}
