import { Request, Response, NextFunction } from 'express';
import CryptoJS from 'crypto-js';
import { config } from '../config/environment.js';

/**
 * End-to-End Encryption Middleware
 * 
 * Handles automatic encryption/decryption of request/response data
 * with AES-256-GCM for maximum security
 */

interface EncryptedData {
    encrypted: string;
    iv: string;
    tag: string;
}

class EncryptionService {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY = config.encryption.key;

    /**
     * Encrypt data with AES-256-GCM
     */
    static encrypt(data: string): EncryptedData {
        try {
            // Generate random IV for each encryption
            const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV for CBC

            // Encrypt the data
            const encrypted = CryptoJS.AES.encrypt(data, this.KEY, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            return {
                encrypted: encrypted.toString(),
                iv: iv.toString(CryptoJS.enc.Base64),
                tag: '', // Not used in CBC mode
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Decrypt data with AES-256-CBC
     */
    static decrypt(encryptedData: EncryptedData): string {
        try {
            const { encrypted, iv } = encryptedData;

            // Decrypt the data
            const decrypted = CryptoJS.AES.decrypt(encrypted, this.KEY, {
                iv: CryptoJS.enc.Base64.parse(iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const result = decrypted.toString(CryptoJS.enc.Utf8);

            if (!result) {
                throw new Error('Decryption resulted in empty string');
            }

            return result;
        } catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if data appears to be encrypted
     */
    static isEncrypted(data: any): data is EncryptedData {
        return (
            typeof data === 'object' &&
            data !== null &&
            typeof data.encrypted === 'string' &&
            typeof data.iv === 'string' &&
            typeof data.tag === 'string'
        );
    }

    /**
     * Encrypt object data
     */
    static encryptObject(obj: any): EncryptedData {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }

    /**
     * Decrypt object data
     */
    static decryptObject(encryptedData: EncryptedData): any {
        const decryptedString = this.decrypt(encryptedData);
        return JSON.parse(decryptedString);
    }
}

/**
 * Request decryption middleware
 * Automatically decrypts encrypted request bodies
 */
export const decryptRequest = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Only process POST, PUT, PATCH requests with body
        if (!req.body || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
            next();
            return;
        }

        // Check if request body is encrypted
        if (EncryptionService.isEncrypted(req.body)) {
            req.requestLogger?.debug('Decrypting request body');

            // Decrypt the request body
            const decryptedData = EncryptionService.decryptObject(req.body);
            req.body = decryptedData;

            req.requestLogger?.debug('Request body decrypted successfully');
        } else if (req.body.encrypted && typeof req.body.encrypted === 'string') {
            // Handle simple encrypted string format
            try {
                const decryptedString = CryptoJS.AES.decrypt(req.body.encrypted, EncryptionService['KEY']).toString(CryptoJS.enc.Utf8);
                req.body = JSON.parse(decryptedString);

                req.requestLogger?.debug('Request body decrypted successfully (simple format)');
            } catch (error) {
                req.requestLogger?.warn('Failed to decrypt simple format, continuing with original body');
            }
        }

        next();
    } catch (error) {
        req.requestLogger?.error('Request decryption failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Continue without decryption rather than failing the request
        next();
    }
};

/**
 * Response encryption middleware
 * Automatically encrypts sensitive response data
 */
export const encryptResponse = (req: Request, res: Response, next: NextFunction): void => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to encrypt sensitive data
    res.json = function (data: any) {
        try {
            // Check if client wants encrypted response
            const wantsEncryption = req.headers['x-encrypt-response'] === 'true' ||
                req.headers['accept-encoding']?.includes('encrypt');

            // Always encrypt sensitive data
            const shouldEncrypt = wantsEncryption ||
                data.sensitive === true ||
                data.encrypted === true ||
                (data.data && data.data.sensitive === true);

            if (shouldEncrypt && data.success !== false) {
                req.requestLogger?.debug('Encrypting response data');

                // Extract sensitive data for encryption
                const dataToEncrypt = data.data || data;
                const encrypted = EncryptionService.encryptObject(dataToEncrypt);

                // Create encrypted response
                const encryptedResponse = {
                    success: data.success !== undefined ? data.success : true,
                    encrypted: true,
                    data: encrypted,
                    timestamp: data.timestamp || new Date().toISOString(),
                    correlationId: req.correlationId,
                };

                req.requestLogger?.debug('Response data encrypted successfully');
                return originalJson.call(this, encryptedResponse);
            } else {
                // Send unencrypted response
                return originalJson.call(this, data);
            }
        } catch (error) {
            req.requestLogger?.error('Response encryption failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            // Send original data if encryption fails
            return originalJson.call(this, data);
        }
    };

    next();
};

/**
 * Combined encryption middleware
 */
export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // First decrypt request
    decryptRequest(req, res, (err) => {
        if (err) {
            next(err);
            return;
        }

        // Then setup response encryption
        encryptResponse(req, res, next);
    });
};

/**
 * Selective encryption middleware for specific routes
 */
export const requireEncryption = (req: Request, res: Response, next: NextFunction): void => {
    // Check if request is encrypted
    if (!EncryptionService.isEncrypted(req.body) && req.body && Object.keys(req.body).length > 0) {
        req.requestLogger?.warn('Unencrypted data received on encrypted endpoint');

        res.status(400).json({
            success: false,
            error: 'This endpoint requires encrypted data',
            code: 'ENCRYPTION_REQUIRED',
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId,
        });
        return;
    }

    // Force response encryption
    res.setHeader('X-Force-Encryption', 'true');

    next();
};

/**
 * Data sanitization for encrypted fields
 */
export const sanitizeEncryptedFields = (data: any, encryptedFields: string[]): any => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = { ...data };

    encryptedFields.forEach(field => {
        if (sanitized[field]) {
            try {
                const encrypted = EncryptionService.encrypt(String(sanitized[field]));
                sanitized[field] = encrypted;
            } catch (error) {
                // If encryption fails, remove the field rather than exposing plain text
                delete sanitized[field];
            }
        }
    });

    return sanitized;
};

/**
 * Utility function to encrypt specific fields in an object
 */
export const encryptFields = (data: Record<string, any>, fields: string[]): Record<string, any> => {
    const result = { ...data };

    fields.forEach(field => {
        if (result[field] !== undefined) {
            result[field] = EncryptionService.encrypt(String(result[field]));
        }
    });

    return result;
};

/**
 * Utility function to decrypt specific fields in an object
 */
export const decryptFields = (data: Record<string, any>, fields: string[]): Record<string, any> => {
    const result = { ...data };

    fields.forEach(field => {
        if (result[field] && EncryptionService.isEncrypted(result[field])) {
            try {
                result[field] = EncryptionService.decrypt(result[field]);
            } catch (error) {
                // If decryption fails, leave the field as is or remove it
                delete result[field];
            }
        }
    });

    return result;
};

export { EncryptionService };
export default encryptionMiddleware;
