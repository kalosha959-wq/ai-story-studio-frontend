import { z } from 'zod';

/**
 * Environment Configuration Schema
 * 
 * Validates and provides type-safe access to environment variables
 * with sensible defaults for development and production
 */

const environmentSchema = z.object({
    // Server Configuration
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3001'),
    HOST: z.string().default('localhost'),

    // Database Configuration
    DATABASE_URL: z.string().default('postgresql://user:password@localhost:5432/ai_story_studio'),
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT Configuration
    JWT_SECRET: z.string().min(32).default('ai-story-studio-jwt-secret-change-in-production'),
    JWT_REFRESH_SECRET: z.string().min(32).default('ai-story-studio-refresh-secret-change-in-production'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Encryption Configuration
    ENCRYPTION_KEY: z.string().min(32).default('ai-story-studio-encryption-key-change-in-production'),
    ENCRYPTION_ALGORITHM: z.string().default('aes-256-gcm'),

    // AI Service Configuration
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    STABILITY_AI_KEY: z.string().optional(),

    // AWS Configuration
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    AWS_S3_BUCKET: z.string().default('ai-story-studio-media'),

    // Email Configuration
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.string().transform(Number).default('587'),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    // PayPal Configuration
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_WEBHOOK_ID: z.string().optional(),
    PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

    // Stripe Configuration (alternative payment)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

    // CORS Configuration
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // File Upload Limits
    MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
    MAX_REQUEST_SIZE: z.string().transform(Number).default('52428800'), // 50MB

    // Security
    BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
    SESSION_SECRET: z.string().min(32).default('ai-story-studio-session-secret-change-in-production'),

    // Monitoring
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    SENTRY_DSN: z.string().optional(),

    // Feature Flags
    ENABLE_AI_GENERATION: z.string().transform(Boolean).default('true'),
    ENABLE_FILE_UPLOAD: z.string().transform(Boolean).default('true'),
    ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(Boolean).default('false'),
    ENABLE_ANALYTICS: z.string().transform(Boolean).default('true'),
});

type Environment = z.infer<typeof environmentSchema>;

// Validate environment variables
const parseResult = environmentSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('❌ Invalid environment configuration:');
    parseResult.error.errors.forEach((error) => {
        console.error(`  ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
}

const env: Environment = parseResult.data;

/**
 * Application Configuration
 * 
 * Centralized configuration object with validated environment variables
 * and derived configuration values
 */
export const config = {
    // Environment
    environment: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    // Server
    port: env.PORT,
    host: env.HOST,

    // Database
    database: {
        url: env.DATABASE_URL,
        ssl: env.NODE_ENV === 'production',
        maxConnections: env.NODE_ENV === 'production' ? 20 : 10,
        idleTimeout: 30000,
        connectionTimeout: 5000,
    },

    // Redis
    redis: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
    },

    // Authentication
    auth: {
        jwtSecret: env.JWT_SECRET,
        jwtRefreshSecret: env.JWT_REFRESH_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
        jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
        bcryptRounds: env.BCRYPT_ROUNDS,
        sessionSecret: env.SESSION_SECRET,
    },

    // Encryption
    encryption: {
        key: env.ENCRYPTION_KEY,
        algorithm: env.ENCRYPTION_ALGORITHM,
    },

    // AI Services
    ai: {
        openai: {
            apiKey: env.OPENAI_API_KEY,
            model: 'gpt-4-turbo-preview',
            maxTokens: 4096,
            temperature: 0.7,
        },
        anthropic: {
            apiKey: env.ANTHROPIC_API_KEY,
            model: 'claude-3-sonnet-20240229',
            maxTokens: 4096,
        },
        stability: {
            apiKey: env.STABILITY_AI_KEY,
            model: 'stable-diffusion-xl-1024-v1-0',
        },
    },

    // AWS
    aws: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION,
        s3Bucket: env.AWS_S3_BUCKET,
    },

    // Email
    email: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        secure: env.SMTP_PORT === 465,
        from: env.SMTP_USER || 'noreply@ai-story-studio.com',
    },

    // PayPal Payment Configuration
    paypal: {
        clientId: env.PAYPAL_CLIENT_ID,
        clientSecret: env.PAYPAL_CLIENT_SECRET,
        webhookId: env.PAYPAL_WEBHOOK_ID,
        mode: env.PAYPAL_MODE,
        isSandbox: env.PAYPAL_MODE === 'sandbox',
    },

    // Stripe Payment Configuration
    stripe: {
        secretKey: env.STRIPE_SECRET_KEY,
        webhookSecret: env.STRIPE_WEBHOOK_SECRET,
        publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    },

    // Rate Limiting
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    // CORS
    cors: {
        allowedOrigins: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    },

    // File Upload
    upload: {
        maxFileSize: env.MAX_FILE_SIZE,
        maxRequestSize: env.MAX_REQUEST_SIZE,
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav',
            'application/pdf',
            'text/plain',
        ],
        tempDir: './temp',
        uploadDir: './uploads',
    },

    // Logging
    logging: {
        level: env.LOG_LEVEL,
        sentryDsn: env.SENTRY_DSN,
        enableConsole: env.NODE_ENV === 'development',
        enableFile: env.NODE_ENV === 'production',
        logDir: './logs',
    },

    // Feature Flags
    features: {
        aiGeneration: env.ENABLE_AI_GENERATION,
        fileUpload: env.ENABLE_FILE_UPLOAD,
        emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
        analytics: env.ENABLE_ANALYTICS,
    },

    // Security Headers
    security: {
        trustProxy: env.NODE_ENV === 'production',
        enableCSP: true,
        enableHSTS: env.NODE_ENV === 'production',
        frameguard: 'deny',
        contentTypeOptions: 'nosniff',
    },

    // API Configuration
    api: {
        version: 'v1',
        baseUrl: env.NODE_ENV === 'production'
            ? 'https://api.ai-story-studio.com'
            : `http://${env.HOST}:${env.PORT}`,
        timeout: 30000,
        retries: 3,
    },
} as const;

// Export individual configurations for easier imports
export const {
    environment,
    isDevelopment,
    isProduction,
    isTest,
    port,
    host,
} = config;

export default config;
