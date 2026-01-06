import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_VERSION: z.string().default('v1'),

    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_POOL_MIN: z.coerce.number().default(2),
    DATABASE_POOL_MAX: z.coerce.number().default(10),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // Encryption
    ENCRYPTION_KEY: z.string().length(32),

    // 2FA
    TOTP_ISSUER: z.string().default('DigiCoop'),

    // SMS
    SMS_API_KEY: z.string().optional(),
    SMS_SENDER_ID: z.string().default('DigiCoop'),

    // SmileID
    SMILE_ID_API_KEY: z.string().optional(),
    SMILE_ID_PARTNER_ID: z.string().optional(),
    SMILE_ID_BASE_URL: z.string().default('https://api.smileidentity.com'),

    // Flutterwave
    FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
    FLUTTERWAVE_SECRET_KEY: z.string().optional(),
    FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),

    // Paystack
    PAYSTACK_PUBLIC_KEY: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),

    // AWS S3
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_REGION: z.string().default('eu-west-1'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
            console.error('❌ Environment validation failed:');
            missingVars.forEach((v) => console.error(`   - ${v}`));
            process.exit(1);
        }
        throw error;
    }
};

const env = parseEnv();

export const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    apiVersion: env.API_VERSION,

    database: {
        url: env.DATABASE_URL,
        pool: {
            min: env.DATABASE_POOL_MIN,
            max: env.DATABASE_POOL_MAX,
        },
    },

    redis: {
        url: env.REDIS_URL,
    },

    jwt: {
        accessSecret: env.JWT_ACCESS_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET,
        accessExpiry: env.JWT_ACCESS_EXPIRY,
        refreshExpiry: env.JWT_REFRESH_EXPIRY,
    },

    encryption: {
        key: env.ENCRYPTION_KEY,
    },

    twoFactor: {
        issuer: env.TOTP_ISSUER,
    },

    sms: {
        apiKey: env.SMS_API_KEY,
        senderId: env.SMS_SENDER_ID,
    },

    smileId: {
        apiKey: env.SMILE_ID_API_KEY,
        partnerId: env.SMILE_ID_PARTNER_ID,
        baseUrl: env.SMILE_ID_BASE_URL,
    },

    flutterwave: {
        publicKey: env.FLUTTERWAVE_PUBLIC_KEY,
        secretKey: env.FLUTTERWAVE_SECRET_KEY,
        webhookSecret: env.FLUTTERWAVE_WEBHOOK_SECRET,
    },

    paystack: {
        publicKey: env.PAYSTACK_PUBLIC_KEY,
        secretKey: env.PAYSTACK_SECRET_KEY,
    },

    aws: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        s3Bucket: env.AWS_S3_BUCKET,
        region: env.AWS_REGION,
    },

    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    logging: {
        level: env.LOG_LEVEL,
    },

    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
} as const;

export type Config = typeof config;
