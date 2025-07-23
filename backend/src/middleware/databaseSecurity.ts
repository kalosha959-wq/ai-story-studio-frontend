/**
 * Database Security and User Protection Layer
 * Advanced database security with encryption, access control, and audit logging
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { securityConfig } from '../config/security.js';

// Field-level encryption key (in production, use HSM or key management service)
const FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || crypto.randomBytes(32);

/**
 * Encrypt sensitive database fields
 */
export function encryptField(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', FIELD_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive database fields
 */
export function decryptField(encryptedValue: string): string {
    try {
        const [ivHex, encrypted] = encryptedValue.split(':');
        if (!ivHex || !encrypted) {
            throw new Error('Invalid encrypted value format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', FIELD_ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        logger.error('Field decryption failed', { error });
        throw new Error('Decryption failed');
    }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = securityConfig.database.saltRounds;
    return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Secure User Model with comprehensive protection
 */
export interface SecureUser {
    id: string;
    email: string; // Stored encrypted
    emailHash: string; // For lookups without decryption
    passwordHash: string;
    firstName: string; // Stored encrypted
    lastName: string; // Stored encrypted
    role: 'user' | 'admin' | 'moderator';
    status: 'active' | 'suspended' | 'pending_verification' | 'deleted';

    // Security fields
    mfaEnabled: boolean;
    mfaSecret?: string; // Stored encrypted
    loginAttempts: number;
    lockedUntil?: Date;
    lastLogin?: Date;
    lastLoginIP?: string;

    // Audit fields
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;

    // Privacy settings
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    dataRetentionPeriod: number; // days
}

/**
 * Audit Log Entry for security events
 */
export interface AuditLogEntry {
    id: string;
    userId?: string;
    sessionId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

/**
 * Database Query Security Wrapper
 */
export class SecureQueryBuilder {
    private static readonly MAX_QUERY_RESULTS = securityConfig.database.maxQueryResults;
    private static readonly QUERY_TIMEOUT = securityConfig.database.queryTimeout;

    /**
     * Sanitize SQL input to prevent injection
     */
    static sanitizeInput(input: any): any {
        if (typeof input === 'string') {
            // Remove potentially dangerous SQL keywords and characters
            return input
                .replace(/['\";\\]/g, '') // Remove quotes and escape chars
                .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
                .trim();
        }
        return input;
    }

    /**
     * Validate query parameters
     */
    static validateQueryParams(params: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            // Validate parameter names (alphanumeric and underscore only)
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(`Invalid parameter name: ${key}`);
            }

            sanitized[key] = this.sanitizeInput(value);
        }

        return sanitized;
    }

    /**
     * Create secure WHERE clause with parameterized queries
     */
    static buildWhereClause(conditions: Record<string, any>): { clause: string; params: any[] } {
        const validatedConditions = this.validateQueryParams(conditions);
        const clauses: string[] = [];
        const params: any[] = [];

        for (const [column, value] of Object.entries(validatedConditions)) {
            clauses.push(`${column} = $${params.length + 1}`);
            params.push(value);
        }

        return {
            clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
            params,
        };
    }

    /**
     * Add pagination and limits to prevent large result sets
     */
    static addPagination(query: string, page: number = 1, limit: number = 50): string {
        const safeLimit = Math.min(limit, this.MAX_QUERY_RESULTS);
        const offset = (page - 1) * safeLimit;

        return `${query} LIMIT ${safeLimit} OFFSET ${offset}`;
    }
}

/**
 * User Security Operations
 */
export class UserSecurity {
    /**
     * Create secure user record
     */
    static async createSecureUser(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: string;
    }): Promise<Partial<SecureUser>> {
        // Validate input
        this.validateUserInput(userData);

        // Hash email for lookups
        const emailHash = crypto.createHash('sha256').update(userData.email.toLowerCase()).digest('hex');

        // Encrypt PII
        const encryptedEmail = encryptField(userData.email.toLowerCase());
        const encryptedFirstName = encryptField(userData.firstName);
        const encryptedLastName = encryptField(userData.lastName);

        // Hash password
        const passwordHash = await hashPassword(userData.password);

        const secureUser: Partial<SecureUser> = {
            id: crypto.randomUUID(),
            email: encryptedEmail,
            emailHash,
            passwordHash,
            firstName: encryptedFirstName,
            lastName: encryptedLastName,
            role: (userData.role as any) || 'user',
            status: 'pending_verification',
            mfaEnabled: false,
            loginAttempts: 0,
            dataProcessingConsent: false,
            marketingConsent: false,
            dataRetentionPeriod: 365, // 1 year default
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return secureUser;
    }

    /**
     * Validate user input for security
     */
    static validateUserInput(userData: any): void {
        const { email, password, firstName, lastName } = userData;

        // Email validation
        if (!email || typeof email !== 'string') {
            throw new Error('Valid email is required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        if (email.length > securityConfig.validation.maxFieldLengths.email) {
            throw new Error('Email too long');
        }

        // Password validation
        if (!password || typeof password !== 'string') {
            throw new Error('Password is required');
        }

        if (password.length < 8 || password.length > securityConfig.validation.maxFieldLengths.password) {
            throw new Error('Password must be between 8 and 128 characters');
        }

        // Password strength validation
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
            throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
        }

        // Name validation
        if (!firstName || !lastName) {
            throw new Error('First name and last name are required');
        }

        if (firstName.length > securityConfig.validation.maxFieldLengths.name ||
            lastName.length > securityConfig.validation.maxFieldLengths.name) {
            throw new Error('Name fields too long');
        }

        // Check for suspicious patterns in names
        const namePattern = /^[a-zA-Z\s\-'\.]+$/;
        if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
            throw new Error('Names contain invalid characters');
        }
    }

    /**
     * Handle login attempt with security checks
     */
    static async handleLoginAttempt(
        email: string,
        password: string,
        ipAddress: string,
        userAgent: string
    ): Promise<{ success: boolean; user?: Partial<SecureUser>; error?: string }> {
        try {
            // Create email hash for lookup
            const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

            // Log login attempt
            await this.logSecurityEvent({
                action: 'login_attempt',
                resource: 'user',
                ipAddress,
                userAgent,
                success: false, // Will update if successful
                metadata: { emailHash },
            });

            // In a real implementation, you would:
            // 1. Look up user by emailHash
            // 2. Check if account is locked
            // 3. Verify password
            // 4. Update login attempts
            // 5. Handle MFA if enabled

            // For now, return mock response
            return {
                success: false,
                error: 'Invalid credentials or account locked',
            };

        } catch (error) {
            logger.error('Login attempt failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ipAddress,
                userAgent,
            });

            return {
                success: false,
                error: 'Login failed due to security error',
            };
        }
    }

    /**
     * Lock user account due to suspicious activity
     */
    static async lockUserAccount(userId: string, reason: string, duration: number = 24): Promise<void> {
        const lockedUntil = new Date(Date.now() + duration * 60 * 60 * 1000); // hours to ms

        // In real implementation, update database
        // UPDATE users SET locked_until = $1, login_attempts = 0 WHERE id = $2

        await this.logSecurityEvent({
            action: 'account_locked',
            resource: 'user',
            resourceId: userId,
            ipAddress: 'system',
            userAgent: 'system',
            success: true,
            metadata: { reason, lockedUntil },
        });

        logger.warn('User account locked', { userId, reason, lockedUntil });
    }

    /**
     * Log security events for audit
     */
    static async logSecurityEvent(event: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
        const auditEntry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            ...event,
        };

        // In real implementation, save to audit_logs table
        logger.info('Security event logged', auditEntry);
    }

    /**
     * Data retention and GDPR compliance
     */
    static async handleDataRetention(userId: string): Promise<void> {
        // Check if user data should be deleted based on retention period
        // This would typically run as a scheduled job

        logger.info('Data retention check performed', { userId });
    }

    /**
     * Anonymize user data for GDPR compliance
     */
    static async anonymizeUserData(userId: string): Promise<void> {
        // Replace PII with anonymized data
        const anonymizedData = {
            email: encryptField(`anonymous_${crypto.randomUUID()}@deleted.local`),
            firstName: encryptField('Anonymous'),
            lastName: encryptField('User'),
            status: 'deleted' as const,
        };

        // In real implementation, update database
        logger.info('User data anonymized', { userId });
    }
}
