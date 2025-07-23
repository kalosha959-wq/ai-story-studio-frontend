import { Logger } from 'winston';

declare global {
    namespace Express {
        interface Request {
            requestLogger?: Logger;
            correlationId?: string;
            startTime?: number;
            user?: {
                userId: string;
                email: string;
                role: string;
                permissions: string[];
            };
            encryptedData?: {
                decrypt: <T>(data: string) => T;
                encrypt: <T>(data: T) => string;
            };
        }

        interface Response {
            correlationId?: string;
        }
    }
}

export interface APIResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    timestamp: string;
    correlationId?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface APIError {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    iat?: number;
    exp?: number;
}

export interface EncryptionResult {
    encryptedData: string;
    iv: string;
    tag: string;
}

export interface SecurityContext {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}

export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

export interface LogContext {
    correlationId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
    [key: string]: any;
}
