import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  PORT: Number(process.env.PORT ?? 3000),
  PROVIDER: requireEnv("AI_PROVIDER"),

  // Database
  // DATABASE_URL: requireEnv("DATABASE_URL"),
  // DATABASE_NAME: requireEnv("DATABASE_NAME"),
  // DATABASE_USER: requireEnv("DATABASE_USER"),
  // DATABASE_PASSWORD: requireEnv("DATABASE_PASSWORD"),
  // DATABASE_HOST: requireEnv("DATABASE_HOST"),
  // DATABASE_PORT: requireEnv("DATABASE_PORT"),

  //CORS
  CORS_ORIGIN: requireEnv("CORS_ORIGIN"),

  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: requireEnv("JWT_REFRESH_EXPIRES_IN") as string,
  JWT_ACCESS_EXPIRES_IN: requireEnv("JWT_ACCESS_EXPIRES_IN") as string,

  // GYM_QR_SECRET: requireEnv("GYM_QR_SECRET"),
  // QR_EXPIRY_SECONDS: requireEnv("QR_EXPIRY_SECONDS"),

  RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
  EMAIL_FROM: requireEnv("EMAIL_FROM"),
  EMAIL_PROVIDER: requireEnv("EMAIL_PROVIDER"),

  // AWS S3
  AWS_ACCESS_KEY_ID: requireEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: requireEnv("AWS_SECRET_ACCESS_KEY"),
  AWS_S3_BUCKET: requireEnv("AWS_BUCKET_NAME"),

  // AI
  LMSTUDIO_BASE_URL: requireEnv("LMSTUDIO_BASE_URL") ?? "http://localhost:1234",
  GOOGLE_API_KEY: requireEnv("GOOGLE_API_KEY") ?? "",
};
