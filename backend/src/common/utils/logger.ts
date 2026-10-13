import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import { config } from "../../config/app.config";

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const loggerTransports: any[] = [
  new transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    ),
  }),
];

// File logging is only enabled in non-serverless environments where local disk writes are permitted
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless && config.NODE_ENV !== "production") {
  const DailyRotateFile = (transports as any).DailyRotateFile;
  if (DailyRotateFile) {
    loggerTransports.push(
      new DailyRotateFile({
        dirname: "logs",
        filename: "%DATE%-app.log",
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
      })
    );
  }
}

// Create logger instance
export const logger = createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: loggerTransports,
});

