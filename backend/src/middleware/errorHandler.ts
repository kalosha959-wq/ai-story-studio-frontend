import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling with proper HTTP status codes,
 * error logging, and secure error responses
 */

interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    code?: string;
}

// Custom error classes
export class ValidationError extends Error {
    statusCode = 400;
    status = 'fail';
    isOperational = true;
    code = 'VALIDATION_ERROR';

    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ValidationError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class AuthenticationError extends Error {
    statusCode = 401;
    status = 'fail';
    isOperational = true;
    code = 'AUTHENTICATION_ERROR';

    constructor(message: string = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class AuthorizationError extends Error {
    statusCode = 403;
    status = 'fail';
    isOperational = true;
    code = 'AUTHORIZATION_ERROR';

    constructor(message: string = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends Error {
    statusCode = 404;
    status = 'fail';
    isOperational = true;
    code = 'NOT_FOUND';

    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ConflictError extends Error {
    statusCode = 409;
    status = 'fail';
    isOperational = true;
    code = 'CONFLICT';

    constructor(message: string = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class RateLimitError extends Error {
    statusCode = 429;
    status = 'fail';
    isOperational = true;
    code = 'RATE_LIMIT_EXCEEDED';

    constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
        super(message);
        this.name = 'RateLimitError';

        Error.captureStackTrace(this, this.constructor);
    }
}

export class InternalServerError extends Error {
    statusCode = 500;
    status = 'error';
    isOperational = true;
    code = 'INTERNAL_SERVER_ERROR';

    constructor(message: string = 'Internal server error') {
        super(message);
        this.name = 'InternalServerError';

        Error.captureStackTrace(this, this.constructor);
    }
}

// Development error response (includes stack trace)
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
    const errorResponse = {
        success: false,
        error: err.message,
        code: err.code || 'UNKNOWN_ERROR',
        status: err.status || 'error',
        stack: err.stack,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        details: (err as any).details || undefined,
    };

    res.status(err.statusCode || 500).json(errorResponse);
};

// Production error response (no sensitive information)
const sendErrorProd = (err: AppError, req: Request, res: Response) => {
    // Operational errors: send message to client
    if (err.isOperational) {
        const errorResponse = {
            success: false,
            error: err.message,
            code: err.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
        };

        // Add retry-after header for rate limit errors
        if (err instanceof RateLimitError && err.retryAfter) {
            res.setHeader('Retry-After', err.retryAfter);
        }

        res.status(err.statusCode || 500).json(errorResponse);
    } else {
        // Programming errors: don't leak error details
        const errorResponse = {
            success: false,
            error: 'Something went wrong',
            code: 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
        };

        res.status(500).json(errorResponse);
    }
};

// Handle specific error types
const handleCastErrorDB = (err: any): ValidationError => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err: any): ConflictError => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ConflictError(message);
};

const handleValidationErrorDB = (err: any): ValidationError => {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ValidationError(message, { validationErrors: errors });
};

const handleJWTError = (): AuthenticationError =>
    new AuthenticationError('Invalid token. Please log in again!');

const handleJWTExpiredError = (): AuthenticationError =>
    new AuthenticationError('Your token has expired! Please log in again.');

// Main error handler middleware
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
    // Set default error properties
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error with correlation ID
    const errorContext = {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        code: err.code,
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    };

    // Log based on severity
    if (err.statusCode >= 500) {
        logger.error('Server error occurred', { ...errorContext, stack: err.stack });
    } else if (err.statusCode >= 400) {
        logger.warn('Client error occurred', errorContext);
    }

    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'MongoError' && (error as any).code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Send error response based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const error = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
    next(error);
};

export default errorHandler;
