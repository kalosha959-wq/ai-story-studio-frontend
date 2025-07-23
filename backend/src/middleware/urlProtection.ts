/**
 * URL Protection and Host Validation Middleware
 * Comprehensive URL security, host validation, and request sanitization
 */

import { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import { logger } from '../utils/logger.js';
import { securityConfig } from '../config/security.js';

// Allowed hosts and domains
const allowedHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    // Add your production domains
    process.env.ALLOWED_HOST || 'yourdomain.com',
    ...(process.env.ADDITIONAL_HOSTS?.split(',') || []),
]);

// Blocked user agents
const blockedUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /dirbuster/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /w3af/i,
    /acunetix/i,
    /nessus/i,
    /openvas/i,
    /metasploit/i,
];

// Dangerous file extensions
const dangerousExtensions = [
    '.php', '.jsp', '.asp', '.aspx', '.cgi', '.pl', '.py', '.rb',
    '.sh', '.bat', '.cmd', '.exe', '.msi', '.dmg', '.deb', '.rpm',
    '.sql', '.bak', '.config', '.ini', '.log', '.tmp',
];

// Dangerous path patterns
const dangerousPathPatterns = [
    // Directory traversal
    /\.\.(\/|\\|%2f|%5c)/gi,
    /\.(\/|\\|%2f|%5c)\.(\/|\\|%2f|%5c)/gi,

    // System paths
    /\/(etc|proc|sys|var|usr|bin|sbin|root|home)\//gi,
    /\\(windows|system32|syswow64|users|documents and settings)\\/gi,

    // Configuration files
    /\/(\.htaccess|\.htpasswd|web\.config|\.env|config\.(php|js|json))/gi,

    // Backup files
    /\.(bak|backup|old|orig|tmp|temp|~)$/gi,

    // Admin paths
    /\/(admin|administrator|wp-admin|phpmyadmin|cpanel|webmail)/gi,

    // API exploration
    /\/(api|v1|v2|v3|graphql|swagger|docs)\/(docs|explorer|playground)/gi,

    // Common exploits
    /\/(shell|backdoor|malware|virus|exploit)/gi,

    // File inclusion
    /(php:\/\/|file:\/\/|ftp:\/\/|jar:\/\/|dict:\/\/)/gi,
];

// Common SQL injection patterns in URLs
const sqlInjectionPatterns = [
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/gi,
    /(or\s+1=1|and\s+1=1|'=0|'=''|"=")/gi,
    /(\bexec\b|\bexecute\b|\bsp_\w+)/gi,
    /(@@version|@@servername|information_schema)/gi,
];

// XSS patterns in URLs
const xssPatterns = [
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
];

/**
 * Validate host header to prevent Host Header Injection
 */
function validateHost(req: Request): boolean {
    const host = req.headers.host;

    if (!host) {
        logger.warn('Request without host header', {
            ip: req.ip,
            url: req.url,
            userAgent: req.headers['user-agent'],
        });
        return false;
    }

    // Remove port from host for comparison
    const hostname = host.split(':')[0];

    if (!hostname || !allowedHosts.has(hostname)) {
        logger.warn('Request to unauthorized host', {
            host: hostname,
            ip: req.ip,
            url: req.url,
            userAgent: req.headers['user-agent'],
        });
        return false;
    }

    return true;
}

/**
 * Validate and sanitize URL
 */
function validateURL(req: Request): { valid: boolean; threats: string[] } {
    const threats: string[] = [];
    const url = req.url;
    const path = req.path;

    // Check for dangerous file extensions
    const ext = path.substring(path.lastIndexOf('.'));
    if (dangerousExtensions.includes(ext.toLowerCase())) {
        threats.push(`Dangerous file extension: ${ext}`);
    }

    // Check for dangerous path patterns
    for (const pattern of dangerousPathPatterns) {
        if (pattern.test(url)) {
            threats.push(`Dangerous path pattern: ${pattern.source}`);
        }
    }

    // Check for SQL injection patterns
    for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(url)) {
            threats.push(`SQL injection pattern: ${pattern.source}`);
        }
    }

    // Check for XSS patterns
    for (const pattern of xssPatterns) {
        if (pattern.test(url)) {
            threats.push(`XSS pattern: ${pattern.source}`);
        }
    }

    // Check URL length
    if (url.length > 2048) {
        threats.push('URL too long (potential buffer overflow)');
    }

    // Check for null bytes
    if (url.includes('\0') || url.includes('%00')) {
        threats.push('Null byte detected');
    }

    // Check for suspicious query parameter patterns
    const queryString = req.url.split('?')[1];
    if (queryString) {
        const suspiciousParams = [
            'cmd', 'command', 'exec', 'execute', 'system', 'shell',
            'eval', 'file', 'path', 'dir', 'directory', 'include',
            'require', 'load', 'import', 'open', 'read', 'write',
        ];

        for (const param of suspiciousParams) {
            if (queryString.toLowerCase().includes(param + '=')) {
                threats.push(`Suspicious parameter: ${param}`);
            }
        }
    }

    return {
        valid: threats.length === 0,
        threats,
    };
}

/**
 * Validate user agent
 */
function validateUserAgent(userAgent: string): { valid: boolean; reason?: string } {
    if (!userAgent || userAgent.trim() === '') {
        return { valid: false, reason: 'Empty user agent' };
    }

    // Check against blocked user agents
    for (const pattern of blockedUserAgents) {
        if (pattern.test(userAgent)) {
            return { valid: false, reason: `Blocked user agent pattern: ${pattern.source}` };
        }
    }

    // Check user agent length
    if (userAgent.length > 512) {
        return { valid: false, reason: 'User agent too long' };
    }

    // Check for suspicious patterns
    const suspiciousUAPatterns = [
        /\b(hack|crack|exploit|attack|inject|payload)\b/gi,
        /<script/gi,
        /javascript:/gi,
    ];

    for (const pattern of suspiciousUAPatterns) {
        if (pattern.test(userAgent)) {
            return { valid: false, reason: `Suspicious user agent pattern: ${pattern.source}` };
        }
    }

    return { valid: true };
}

/**
 * Sanitize request parameters
 */
function sanitizeParams(params: any): any {
    if (typeof params !== 'object' || params === null) {
        return params;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(params)) {
        // Validate parameter name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
            logger.warn('Invalid parameter name detected', { key });
            continue; // Skip invalid parameter names
        }

        // Sanitize parameter value
        if (typeof value === 'string') {
            sanitized[key] = value
                .replace(/[<>\"'&]/g, '') // Remove HTML/XML chars
                .replace(/[\x00-\x1f\x7f]/g, '') // Remove control chars
                .trim();
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string'
                    ? item.replace(/[<>\"'&]/g, '').replace(/[\x00-\x1f\x7f]/g, '').trim()
                    : item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * URL Protection Middleware
 */
export const urlProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const userAgent = req.headers['user-agent'] || '';

    try {
        // 1. Validate host header
        if (!validateHost(req)) {
            return res.status(400).json({
                error: 'Invalid host header',
                code: 'INVALID_HOST'
            });
        }

        // 2. Validate user agent
        const userAgentValidation = validateUserAgent(userAgent);
        if (!userAgentValidation.valid) {
            logger.warn('Blocked request due to invalid user agent', {
                userAgent,
                reason: userAgentValidation.reason,
                ip: req.ip,
                url: req.url,
            });

            return res.status(403).json({
                error: 'Access denied',
                code: 'INVALID_USER_AGENT'
            });
        }

        // 3. Validate URL
        const urlValidation = validateURL(req);
        if (!urlValidation.valid) {
            logger.warn('Blocked request due to URL threats', {
                url: req.url,
                threats: urlValidation.threats,
                ip: req.ip,
                userAgent,
            });

            return res.status(400).json({
                error: 'Invalid request URL',
                code: 'MALICIOUS_URL'
            });
        }

        // 4. Sanitize query parameters
        if (req.query && Object.keys(req.query).length > 0) {
            req.query = sanitizeParams(req.query);
        }

        // 5. Sanitize request body parameters
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeParams(req.body);
        }

        // 6. Check for suspicious headers
        const suspiciousHeaders = [
            'x-forwarded-host',
            'x-original-host',
            'x-rewrite-url',
            'x-forwarded-prefix',
        ];

        const foundSuspiciousHeaders = suspiciousHeaders.filter(header => req.headers[header]);
        if (foundSuspiciousHeaders.length > 0) {
            logger.warn('Suspicious headers detected', {
                headers: foundSuspiciousHeaders,
                ip: req.ip,
                url: req.url,
                userAgent,
            });
        }

        // 7. Validate referer header if present
        const referer = req.headers.referer || req.headers.referrer;
        if (referer) {
            try {
                const refererURL = new URL(referer);
                const refererHost = refererURL.hostname;

                // Check if referer is from allowed domains
                if (!allowedHosts.has(refererHost) && !refererHost.endsWith(process.env.ALLOWED_HOST || 'yourdomain.com')) {
                    logger.info('Request from external referer', {
                        referer: refererHost,
                        ip: req.ip,
                        url: req.url,
                    });
                }
            } catch (error) {
                logger.warn('Invalid referer header', {
                    referer,
                    ip: req.ip,
                    url: req.url,
                });
            }
        }

        // 8. Log successful URL validation
        const processingTime = Date.now() - startTime;
        if (processingTime > 100) { // Log slow validations
            logger.info('URL protection completed', {
                url: req.url,
                processingTime,
                ip: req.ip,
            });
        }

        return next();

    } catch (error) {
        logger.error('URL protection middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: req.url,
            ip: req.ip,
            userAgent,
        });

        return res.status(500).json({
            error: 'Security validation failed',
            code: 'SECURITY_ERROR'
        });
    }
};

/**
 * Host Management Functions
 */
export const hostManagement = {
    /**
     * Add allowed host
     */
    addAllowedHost(host: string): void {
        allowedHosts.add(host);
        logger.info('Host added to allowlist', { host });
    },

    /**
     * Remove allowed host
     */
    removeAllowedHost(host: string): void {
        allowedHosts.delete(host);
        logger.info('Host removed from allowlist', { host });
    },

    /**
     * Get allowed hosts
     */
    getAllowedHosts(): string[] {
        return Array.from(allowedHosts);
    },

    /**
     * Check if host is allowed
     */
    isHostAllowed(host: string): boolean {
        return allowedHosts.has(host);
    },
};

/**
 * URL sanitization utility
 */
export const urlSanitizer = {
    /**
     * Clean URL of dangerous characters
     */
    sanitizeURL(url: string): string {
        return url
            .replace(/[<>\"'&]/g, '') // Remove HTML/XML chars
            .replace(/[\x00-\x1f\x7f]/g, '') // Remove control chars
            .replace(/\.\.(\/|\\|%2f|%5c)/gi, '') // Remove directory traversal
            .trim();
    },

    /**
     * Validate URL format
     */
    isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Extract and validate domain from URL
     */
    extractDomain(url: string): string | null {
        try {
            const parsed = new URL(url);
            return parsed.hostname;
        } catch {
            return null;
        }
    },
};
