import "./common/utils/polyfills";
import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config";
import connectDatabase from "./database/database";
import { errorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler";
import authRoutes from "./modules/auth/auth.routes";
import passport from "./middlewares/passport";
import sessionRoutes from "./modules/session/session.routes";
import { authenticateJWT } from "./common/strategies/jwt.strategy";
import mfaRoutes from "./modules/mfa/mfa.routes";
import financeRoutes from "./modules/finance/finance.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();
const BASE_PATH = config.BASE_PATH;

// Dynamic CORS enabling local dev, APP_ORIGIN, and any Vercel deployments
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === config.APP_ORIGIN ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Root health check endpoint (responds immediately so Vercel can verify function readiness)
app.get("/", (req: Request, res: Response) => {
  res.status(HTTPSTATUS.OK).json({
    message: "PesaFlow API is live & operational!",
    environment: config.NODE_ENV,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Ensure database connection before API route execution
app.use(BASE_PATH, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDatabase();
    next();
  } catch (error: any) {
    console.error("Database connection failure in request pipeline:", error);
    res.status(500).json({
      message: "Database connection failed. Please ensure MongoDB Atlas Network Access allows connections (0.0.0.0/0).",
      error: error?.message || "Unknown database error",
    });
  }
});

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes);
app.use(`${BASE_PATH}/finance`, financeRoutes);
app.use(`${BASE_PATH}/admin`, adminRoutes);

app.use(errorHandler);

// Only start standalone listener when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(config.PORT, async () => {
    console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
    await connectDatabase();
  });
}

export default app;
