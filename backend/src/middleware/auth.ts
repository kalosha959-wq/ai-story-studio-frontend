import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';
import { securityLogger } from './requestLogger.js';

/**
 * Authentication and Authorization Middleware
 * 
 * JWT-based authentication with refresh token support,
 * role-based access control, and comprehensive security logging
 */

interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    iat: number;
    exp: number;
}

// Extend Request interface to include user information
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                permissions: string[];
            };
        }
    }
}

/**
 * Extract and verify JWT token from request
 */
const extractToken = (req: Request): string | null => {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookie (for web sessions)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    // Check query parameter (fallback, not recommended for production)
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }

    return null;
};

/**
 * Verify JWT token and extract user information
 */
const verifyToken = (token: string): Promise<JWTPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.auth.jwtSecret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded as JWTPayload);
            }
        });
    });
};

/**
 * Main authentication middleware
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract token from request
        const token = extractToken(req);

        if (!token) {
            securityLogger.authorizationFailure(req, undefined, 'valid_token');
            throw new AuthenticationError('Access token is required');
        }

        // Verify token
        const decoded = await verifyToken(token);

        // Check if token is expired
        if (decoded.exp < Date.now() / 1000) {
            securityLogger.authorizationFailure(req, decoded.userId, 'valid_token');
            throw new AuthenticationError('Token has expired');
        }

        // Add user information to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
        };

        // Log successful authentication
        req.requestLogger?.info('Authentication successful', {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role,
        });

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            securityLogger.authorizationFailure(req, undefined, 'valid_token');
            next(new AuthenticationError('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            securityLogger.authorizationFailure(req, undefined, 'valid_token');
            next(new AuthenticationError('Token has expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Optional authentication middleware (doesn't throw if no token)
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = await verifyToken(token);

            // Only set user if token is valid and not expired
            if (decoded.exp >= Date.now() / 1000) {
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    permissions: decoded.permissions || [],
                };
            }
        }

        next();
    } catch (error) {
        // Don't throw error for optional auth
        req.requestLogger?.debug('Optional authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next();
    }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            securityLogger.authorizationFailure(req, undefined, 'authentication');
            next(new AuthenticationError('Authentication required'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            securityLogger.authorizationFailure(req, req.user.id, `role:${allowedRoles.join('|')}`);
            next(new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
            return;
        }

        req.requestLogger?.info('Role authorization successful', {
            userId: req.user.id,
            userRole: req.user.role,
            requiredRoles: allowedRoles,
        });

        next();
    };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (...requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            securityLogger.authorizationFailure(req, undefined, 'authentication');
            next(new AuthenticationError('Authentication required'));
            return;
        }

        const hasPermission = requiredPermissions.every(permission =>
            req.user!.permissions.includes(permission)
        );

        if (!hasPermission) {
            securityLogger.authorizationFailure(req, req.user.id, `permissions:${requiredPermissions.join('|')}`);
            next(new AuthorizationError(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`));
            return;
        }

        req.requestLogger?.info('Permission authorization successful', {
            userId: req.user.id,
            userPermissions: req.user.permissions,
            requiredPermissions,
        });

        next();
    };
};

/**
 * Resource ownership authorization middleware
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            securityLogger.authorizationFailure(req, undefined, 'authentication');
            next(new AuthenticationError('Authentication required'));
            return;
        }

        const resourceId = req.params[resourceIdParam];
        const userId = req.user.id;

        // Admin users can access any resource
        if (req.user.role === 'admin' || req.user.permissions.includes('admin:all')) {
            req.requestLogger?.info('Admin access granted', {
                userId,
                resourceId,
                userRole: req.user.role,
            });
            next();
            return;
        }

        // Check if user owns the resource (this would typically involve a database check)
        // For now, we'll just check if the resource ID matches the user ID
        if (resourceId !== userId) {
            securityLogger.authorizationFailure(req, userId, `ownership:${resourceId}`);
            next(new AuthorizationError('Access denied. You can only access your own resources.'));
            return;
        }

        req.requestLogger?.info('Ownership authorization successful', {
            userId,
            resourceId,
        });

        next();
    };
};

/**
 * API key authentication middleware (for service-to-service communication)
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        securityLogger.authorizationFailure(req, undefined, 'api_key');
        next(new AuthenticationError('API key is required'));
        return;
    }

    // Validate API key (implement your validation logic)
    // This is a simple example - in production, validate against a database
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
        securityLogger.authorizationFailure(req, undefined, 'valid_api_key');
        next(new AuthenticationError('Invalid API key'));
        return;
    }

    req.requestLogger?.info('API key authentication successful', {
        apiKeyHash: apiKey.substring(0, 8) + '...',
    });

    next();
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
    const userRequests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next();
            return;
        }

        const userId = req.user.id;
        const now = Date.now();
        const userLimit = userRequests.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
            // Reset or initialize user limit
            userRequests.set(userId, {
                count: 1,
                resetTime: now + windowMs,
            });
            next();
            return;
        }

        if (userLimit.count >= maxRequests) {
            securityLogger.rateLimitViolation(req, maxRequests, userLimit.count);
            const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            next(new AuthenticationError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`));
            return;
        }

        // Increment request count
        userLimit.count++;
        userRequests.set(userId, userLimit);

        next();
    };
};

export default authMiddleware;
