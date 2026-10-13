import { getEnv } from "../common/utils/get-env";

const appConfig = () => {
  const mongoUri = getEnv("MONGO_URI", "");
  if (!mongoUri) {
    console.warn("⚠️ MONGO_URI environment variable is not defined!");
  }

  return {
    NODE_ENV: getEnv("NODE_ENV", "development"),
    APP_ORIGIN: getEnv("APP_ORIGIN", "localhost"),
    PORT: getEnv("PORT", "5000"),
    BASE_PATH: getEnv("BASE_PATH", "/api/v1"),
    MONGO_URI: mongoUri,
    JWT: {
      SECRET: getEnv("JWT_SECRET", "pesaflow_default_jwt_secret_key_change_in_prod"),
      EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),
      REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "pesaflow_default_refresh_secret_key_change_in_prod"),
      REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
    },
    MAILER_SENDER: getEnv("MAILER_SENDER", "onboarding@resend.dev"),
    RESEND_API_KEY: getEnv("RESEND_API_KEY", ""),
    SUPER_ADMIN_EMAIL: getEnv("SUPER_ADMIN_EMAIL", "eliasdismass732@gmail.com"),
  };
};

export const config = appConfig();
