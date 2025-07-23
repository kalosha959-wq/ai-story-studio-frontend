/**
 * Comprehensive Security Configuration
 * Enterprise-grade security settings for production deployment
 */

export const securityConfig = {
    // Server Security
    server: {
        // Remove server fingerprinting
        hideServerHeader: true,
        // Disable X-Powered-By header
        hidePoweredBy: true,
        // Trust proxy settings for load balancers
        trustProxy: process.env.TRUST_PROXY === 'true',
        // Maximum request size (prevent DoS)
        maxRequestSize: '10mb',
        // Request timeout
        requestTimeout: 30000,
    },

    // CORS Security
    cors: {
        // Strict origin control
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Request-ID',
            'X-API-Key'
        ],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400, // 24 hours
    },

    // Rate Limiting
    rateLimit: {
        // General API rate limiting
        general: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP',
            standardHeaders: true,
            legacyHeaders: false,
        },

        // Authentication endpoints (stricter)
        auth: {
            windowMs: 15 * 60 * 1000,
            max: 5, // 5 attempts per 15 minutes
            message: 'Too many authentication attempts',
            skipSuccessfulRequests: true,
        },

        // AI endpoints (resource intensive)
        ai: {
            windowMs: 60 * 1000, // 1 minute
            max: 10, // 10 AI requests per minute
            message: 'AI rate limit exceeded',
        },
    },

    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },

    // Headers Security
    headers: {
        // Prevent MIME type sniffing
        noSniff: true,
        // XSS Protection
        xssFilter: true,
        // Prevent clickjacking
        frameguard: { action: 'deny' },
        // HSTS (HTTPS Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
        // Referrer Policy
        referrerPolicy: 'strict-origin-when-cross-origin',
        // Permissions Policy
        permissionsPolicy: {
            camera: [],
            microphone: [],
            geolocation: [],
            payment: [],
        },
    },

    // Input Validation & Sanitization
    validation: {
        // Maximum field lengths
        maxFieldLengths: {
            email: 254,
            password: 128,
            name: 100,
            title: 200,
            description: 2000,
            content: 50000,
        },

        // Allowed file types for uploads
        allowedFileTypes: {
            images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            documents: ['.pdf', '.txt', '.md'],
            audio: ['.mp3', '.wav', '.ogg'],
        },

        // Maximum file sizes (in bytes)
        maxFileSizes: {
            image: 5 * 1024 * 1024, // 5MB
            document: 10 * 1024 * 1024, // 10MB
            audio: 20 * 1024 * 1024, // 20MB
        },
    },

    // Database Security
    database: {
        // Connection security
        ssl: process.env.NODE_ENV === 'production',
        connectionTimeout: 5000,
        queryTimeout: 30000,

        // Query limits
        maxQueryResults: 1000,
        maxQueryDepth: 10,

        // Encryption settings
        encryptSensitiveFields: true,
        hashPasswords: true,
        saltRounds: 12,
    },

    // JWT Security
    jwt: {
        // Token settings
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        issuer: 'ai-story-studio',
        audience: 'ai-story-studio-users',
        algorithm: 'HS256',

        // Security options
        clockTolerance: 60, // 60 seconds
        ignoreExpiration: false,
        ignoreNotBefore: false,
    },

    // Session Security
    session: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict' as const,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        name: 'sessionId',
    },

    // API Security
    api: {
        // API versioning
        version: 'v1',

        // API key requirements
        requireApiKey: process.env.NODE_ENV === 'production',

        // Request logging
        logRequests: true,
        logSensitiveData: false,

        // Response security
        removeStackTrace: process.env.NODE_ENV === 'production',
        sanitizeErrors: true,
    },

    // Monitoring & Alerting
    monitoring: {
        // Security event monitoring
        enableSecurityAlerts: true,

        // Suspicious activity detection
        detectBruteForce: true,
        detectSQLInjection: true,
        detectXSSAttempts: true,

        // Alert thresholds
        alertThresholds: {
            failedLogins: 5,
            suspiciousRequests: 10,
            errorRate: 0.05, // 5%
        },
    },
};

export type SecurityConfig = typeof securityConfig;
