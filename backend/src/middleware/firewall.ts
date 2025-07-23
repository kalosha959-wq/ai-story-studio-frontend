/**
 * Advanced Firewall and IP Protection Middleware
 * Comprehensive IP filtering, DDoS protection, and traffic analysis
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { securityConfig } from '../config/security.js';

// IP whitelist/blacklist storage (in production, use Redis)
const blockedIPs = new Set<string>();
const whitelistedIPs = new Set<string>([
    '127.0.0.1',
    '::1',
    // Add your trusted IPs here
]);

// Rate limiting tracker
const requestTracker = new Map<string, {
    count: number;
    lastReset: number;
    blocked: boolean;
    suspiciousActivity: number;
}>();

// Suspicious patterns detection
const suspiciousPatterns = [
    // SQL Injection patterns
    /(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i,
    /(\bOR\s+1=1\b|\bAND\s+1=1\b)/i,
    /'(\s*(OR|AND)\s*'?\w)/i,

    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,

    // Path traversal
    /\.\.(\/|\\)/g,
    /\/(etc|proc|sys)\//g,

    // Command injection
    /[;&|`$]/g,
    /(curl|wget|nc|telnet|ssh)\s/gi,

    // Common attack strings
    /\b(eval|exec|system|shell_exec)\b/gi,
    /__proto__|constructor|prototype/gi,
];

/**
 * Get real client IP address
 */
function getRealClientIP(req: Request): string {
    // Check various headers for real IP (in order of trust)
    const possibleIPs = [
        req.headers['cf-connecting-ip'], // Cloudflare
        req.headers['x-real-ip'], // Nginx
        req.headers['x-forwarded-for'], // Load balancers
        req.connection.remoteAddress,
        req.socket.remoteAddress,
        req.ip,
    ];

    for (const ip of possibleIPs) {
        if (typeof ip === 'string' && ip) {
            // Handle x-forwarded-for which can contain multiple IPs
            const cleanIP = ip.split(',')[0]?.trim();
            if (cleanIP && isValidIP(cleanIP)) {
                return cleanIP;
            }
        }
    }

    return 'unknown';
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Check if IP is in private range
 */
function isPrivateIP(ip: string): boolean {
    const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^127\./,
        /^::1$/,
        /^fc00:/,
    ];

    return privateRanges.some(range => range.test(ip));
}

/**
 * Detect suspicious request patterns
 */
function detectSuspiciousPatterns(req: Request): string[] {
    const suspicious: string[] = [];
    const targets = [
        req.url,
        req.path,
        JSON.stringify(req.query),
        JSON.stringify(req.headers),
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
    ];

    for (const target of targets) {
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(target)) {
                suspicious.push(`Pattern: ${pattern.source} in ${target.substring(0, 100)}`);
            }
        }
    }

    return suspicious;
}

/**
 * Update request tracking for IP
 */
function updateRequestTracking(ip: string, suspicious: boolean = false): boolean {
    const now = Date.now();
    const windowMs = securityConfig.rateLimit.general.windowMs;

    let tracker = requestTracker.get(ip);

    if (!tracker || (now - tracker.lastReset) > windowMs) {
        tracker = {
            count: 0,
            lastReset: now,
            blocked: false,
            suspiciousActivity: 0,
        };
    }

    tracker.count++;
    if (suspicious) {
        tracker.suspiciousActivity++;
    }

    // Block if exceeded limits
    const maxRequests = securityConfig.rateLimit.general.max;
    const maxSuspicious = securityConfig.monitoring.alertThresholds.suspiciousRequests;

    if (tracker.count > maxRequests || tracker.suspiciousActivity > maxSuspicious) {
        tracker.blocked = true;
        blockedIPs.add(ip);

        logger.warn('IP blocked due to suspicious activity', {
            ip,
            requestCount: tracker.count,
            suspiciousActivity: tracker.suspiciousActivity,
            windowMs,
        });
    }

    requestTracker.set(ip, tracker);
    return tracker.blocked;
}

/**
 * Comprehensive Firewall Middleware
 */
export const firewallMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const clientIP = getRealClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers.referer || 'direct';

    // Create request context for logging
    const requestContext = {
        ip: clientIP,
        method: req.method,
        url: req.url,
        userAgent,
        referer,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
    };

    try {
        // 1. Check IP validity
        if (!isValidIP(clientIP) && clientIP !== 'unknown') {
            logger.warn('Invalid IP address detected', { ...requestContext });
            return res.status(400).json({ error: 'Invalid request source' });
        }

        // 2. Check IP whitelist (bypass all checks for whitelisted IPs)
        if (whitelistedIPs.has(clientIP)) {
            return next();
        }

        // 3. Check IP blacklist
        if (blockedIPs.has(clientIP)) {
            logger.warn('Blocked IP attempted access', { ...requestContext });
            return res.status(403).json({ error: 'Access denied' });
        }

        // 4. Detect suspicious patterns
        const suspiciousPatterns = detectSuspiciousPatterns(req);
        const isSuspicious = suspiciousPatterns.length > 0;

        if (isSuspicious) {
            logger.warn('Suspicious request patterns detected', {
                ...requestContext,
                patterns: suspiciousPatterns,
            });
        }

        // 5. Update rate limiting and blocking
        const isBlocked = updateRequestTracking(clientIP, isSuspicious);

        if (isBlocked) {
            logger.error('Request blocked by firewall', { ...requestContext });
            return res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil(securityConfig.rateLimit.general.windowMs / 1000),
            });
        }

        // 6. Check for bot/crawler patterns
        const botPatterns = [
            /bot|crawler|spider|scraper/i,
            /curl|wget|python-requests|postman/i,
        ];

        const isBot = botPatterns.some(pattern => pattern.test(userAgent));

        if (isBot && !isPrivateIP(clientIP)) {
            logger.info('Bot/crawler detected', { ...requestContext });
            // Could implement bot-specific rate limiting here
        }

        // 7. Validate request headers
        const requiredHeaders = ['user-agent', 'accept'];
        const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);

        if (missingHeaders.length > 0) {
            logger.warn('Request missing required headers', {
                ...requestContext,
                missingHeaders,
            });
        }

        // 8. Check for common attack headers
        const dangerousHeaders = [
            'x-forwarded-host',
            'x-original-host',
            'x-rewrite-url',
        ];

        const foundDangerousHeaders = dangerousHeaders.filter(header => req.headers[header]);

        if (foundDangerousHeaders.length > 0) {
            logger.warn('Potentially dangerous headers detected', {
                ...requestContext,
                dangerousHeaders: foundDangerousHeaders,
            });
        }

        // 9. Log successful firewall pass
        if (isSuspicious || isBot || missingHeaders.length > 0) {
            logger.info('Request passed firewall with warnings', {
                ...requestContext,
                processingTime: Date.now() - startTime,
            });
        }

        next();

    } catch (error) {
        logger.error('Firewall middleware error', {
            ...requestContext,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Fail securely - block the request
        res.status(500).json({ error: 'Security check failed' });
    }
};

/**
 * IP Management Functions
 */
export const ipManagement = {
    /**
     * Add IP to blocklist
     */
    blockIP(ip: string, reason?: string): void {
        blockedIPs.add(ip);
        logger.warn('IP manually blocked', { ip, reason });
    },

    /**
     * Remove IP from blocklist
     */
    unblockIP(ip: string): void {
        blockedIPs.delete(ip);
        requestTracker.delete(ip);
        logger.info('IP unblocked', { ip });
    },

    /**
     * Add IP to whitelist
     */
    whitelistIP(ip: string): void {
        whitelistedIPs.add(ip);
        blockedIPs.delete(ip);
        logger.info('IP whitelisted', { ip });
    },

    /**
     * Get current blocked IPs
     */
    getBlockedIPs(): string[] {
        return Array.from(blockedIPs);
    },

    /**
     * Get request statistics
     */
    getStats(): Record<string, any> {
        const stats = {
            totalTrackedIPs: requestTracker.size,
            blockedIPs: blockedIPs.size,
            whitelistedIPs: whitelistedIPs.size,
            activeConnections: 0,
            suspiciousActivity: 0,
        };

        for (const [ip, tracker] of requestTracker.entries()) {
            if (tracker.count > 0) stats.activeConnections++;
            if (tracker.suspiciousActivity > 0) stats.suspiciousActivity++;
        }

        return stats;
    },

    /**
     * Clean up old tracking data
     */
    cleanup(): void {
        const now = Date.now();
        const windowMs = securityConfig.rateLimit.general.windowMs;

        for (const [ip, tracker] of requestTracker.entries()) {
            if ((now - tracker.lastReset) > windowMs * 2) {
                requestTracker.delete(ip);
            }
        }
    },
};

// Cleanup old data every hour
setInterval(() => {
    ipManagement.cleanup();
}, 60 * 60 * 1000);
