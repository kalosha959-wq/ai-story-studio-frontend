import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * Request Logger Class
 */
class RequestLoggerClass {
    private correlationId: string;

    constructor(correlationId: string) {
        this.correlationId = correlationId;
    }

    info(message: string, meta: any = {}) {
        logger.info(message, { correlationId: this.correlationId, ...meta });
    }

    warn(message: string, meta: any = {}) {
        logger.warn(message, { correlationId: this.correlationId, ...meta });
    }

    error(message: string, meta: any = {}) {
        logger.error(message, { correlationId: this.correlationId, ...meta });
    }

    debug(message: string, meta: any = {}) {
        logger.debug(message, { correlationId: this.correlationId, ...meta });
    }
}

/**
 * Request Logging Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const correlationId = uuidv4();
    req.correlationId = correlationId;
    req.startTime = Date.now();
    req.requestLogger = new RequestLoggerClass(correlationId) as any;

    res.set('X-Correlation-ID', correlationId);

    const requestInfo = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    };

    (req.requestLogger as any).info('Incoming request', requestInfo);

    const originalEnd = res.end.bind(res);
    res.end = function (...args: any[]): Response {
        const duration = Date.now() - (req.startTime || Date.now());
        const statusCode = res.statusCode;

        const responseInfo = {
            statusCode,
            duration,
            method: req.method,
            url: req.originalUrl,
        };

        if (statusCode >= 500) {
            req.requestLogger?.error('Request completed with server error', responseInfo);
        } else if (statusCode >= 400) {
            req.requestLogger?.warn('Request completed with client error', responseInfo);
        } else {
            req.requestLogger?.info('Request completed successfully', responseInfo);
        }

        return originalEnd(...args);
    } as any;

    next();
}

/**
 * Security Logger
 */
export const securityLogger = {
    authAttempt: (req: Request, email: string, success: boolean, reason?: string) => {
        const logData = { email, success, reason, ip: req.ip };
        if (success) {
            req.requestLogger?.info('Authentication successful', logData);
        } else {
            req.requestLogger?.warn('Authentication failed', logData);
        }
    },

    authorizationFailure: (req: Request, userId: string | undefined, resource: string, action: string = 'access') => {
        req.requestLogger?.warn('Authorization failed', { userId: userId || 'anonymous', resource, action, ip: req.ip });
    },

    suspiciousActivity: (req: Request, activity: string, details?: any) => {
        req.requestLogger?.warn('Suspicious activity detected', { activity, details, ip: req.ip });
    },

    rateLimitExceeded: (req: Request, limit: number, windowMs: number) => {
        req.requestLogger?.warn('Rate limit exceeded', { limit, windowMs, ip: req.ip });
    },

    rateLimitViolation: (req: Request, limit: number, current: number) => {
        req.requestLogger?.warn('Rate limit violation detected', { limit, current, ip: req.ip });
    },
};
