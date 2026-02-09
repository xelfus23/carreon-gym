// src/config/env.ts
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

    // Database
    // DATABASE_URL: requireEnv("DATABASE_URL"),
    CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
    // Auth
    JWT_SECRET: requireEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

    // AWS S3
    // AWS_REGION: requireEnv("AWS_REGION"),
    AWS_ACCESS_KEY_ID: requireEnv("AWS_ACCESS_KEY_ID"),
    AWS_SECRET_ACCESS_KEY: requireEnv("AWS_SECRET_ACCESS_KEY"),
    AWS_S3_BUCKET: requireEnv("AWS_BUCKET_NAME"),

    // AI
    LMSTUDIO_BASE_URL: process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
};
