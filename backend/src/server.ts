import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import { securityConfig } from './config/security.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/auth.js';
import { encryptionMiddleware } from './middleware/encryption.js';
import { firewallMiddleware } from './middleware/firewall.js';
import { urlProtectionMiddleware } from './middleware/urlProtection.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import aiRoutes from './routes/ai.js';
import mediaRoutes from './routes/media.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './routes/payments-basic.js';

/**
 * AI Story Studio Backend Server
 * 
 * Professional-grade Node.js API server with:
 * - Military-grade security and encryption
 * - AI integration for content generation
 * - Enterprise-level authentication
 * - Comprehensive logging and monitoring
 * - GDPR/CCPA compliance features
 */

const app = express();

// Trust proxy for accurate IP addresses
if (securityConfig.server.trustProxy) {
    app.set('trust proxy', 1);
}

// Apply firewall protection (first line of defense)
app.use(firewallMiddleware);

// Apply URL protection
app.use(urlProtectionMiddleware);

// Security middleware with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: securityConfig.csp.directives,
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: securityConfig.server.hidePoweredBy,
    hsts: securityConfig.headers.hsts,
    ieNoOpen: true,
    noSniff: securityConfig.headers.noSniff,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: securityConfig.headers.xssFilter,
}));

// CORS configuration with security settings
app.use(cors({
    origin: securityConfig.cors.origin,
    methods: securityConfig.cors.methods,
    allowedHeaders: securityConfig.cors.allowedHeaders,
    exposedHeaders: securityConfig.cors.exposedHeaders,
    credentials: securityConfig.cors.credentials,
    maxAge: securityConfig.cors.maxAge,
}));

// Compression and parsing middleware with security limits
app.use(compression());
app.use(express.json({
    limit: securityConfig.server.maxRequestSize,
    verify: (req, res, buf) => {
        // Store raw body for signature verification
        (req as any).rawBody = buf;
    }
}));
app.use(express.urlencoded({
    extended: true,
    limit: securityConfig.server.maxRequestSize
}));

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.general.windowMs,
    max: securityConfig.rateLimit.general.max,
    message: securityConfig.rateLimit.general.message,
    standardHeaders: securityConfig.rateLimit.general.standardHeaders,
    legacyHeaders: securityConfig.rateLimit.general.legacyHeaders,
});
app.use(generalLimiter);

// Authentication rate limiting (applied to auth routes)
const authLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.auth.windowMs,
    max: securityConfig.rateLimit.auth.max,
    message: securityConfig.rateLimit.auth.message,
    skipSuccessfulRequests: securityConfig.rateLimit.auth.skipSuccessfulRequests,
});

// AI endpoints rate limiting (applied to AI routes)
const aiLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.ai.windowMs,
    max: securityConfig.rateLimit.ai.max,
    message: securityConfig.rateLimit.ai.message,
});

// Custom middleware
app.use(requestLogger);
app.use(encryptionMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Story Studio API is running',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        environment: config.environment,
        uptime: process.uptime()
    });
});

// API version prefix
const API_PREFIX = '/api/v1';

// Public routes (no authentication required) - with auth rate limiting
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/payments`, authLimiter, paymentRoutes);

// Protected routes (authentication required)
app.use(`${API_PREFIX}/projects`, authMiddleware, projectRoutes);
app.use(`${API_PREFIX}/ai`, authMiddleware, aiLimiter, aiRoutes);
app.use(`${API_PREFIX}/media`, authMiddleware, mediaRoutes);
app.use(`${API_PREFIX}/analytics`, authMiddleware, analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(404).json({
        success: false,
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
    logger.info(`🎬 AI Story Studio API Server started`, {
        port: PORT,
        environment: config.environment,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
    } else {
        logger.error('Server error:', error);
    }
    process.exit(1);
});

export default app;
