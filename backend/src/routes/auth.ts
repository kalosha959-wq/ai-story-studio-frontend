/**
 * User Authentication Routes
 * JWT-based authentication with registration and login
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    agreeToTerms: z.boolean().refine(val => val === true, 'Must agree to terms'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Interfaces
interface UserDocument {
    id: string;
    email: string;
    hashedPassword: string;
    firstName: string;
    lastName: string;
    agreeToTerms: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Mock storage (replace with real database)
const users: Map<string, UserDocument> = new Map();

// Helper functions
function generateToken(payload: any, expiresIn: string = '24h'): string {
    const secret = config.auth.jwtSecret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret, { expiresIn } as any);
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

function findUserByEmail(email: string): UserDocument | undefined {
    for (const user of users.values()) {
        if (user.email === email) {
            return user;
        }
    }
    return undefined;
}

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { email, password, firstName, lastName, agreeToTerms } = validatedData;

        // Check if user already exists
        if (findUserByEmail(email)) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        // Create new user
        const hashedPassword = await hashPassword(password);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const user: UserDocument = {
            id: userId,
            email,
            hashedPassword,
            firstName,
            lastName,
            agreeToTerms,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        users.set(userId, user);

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        logger.info('User registered successfully', {
            userId: user.id,
            email: user.email,
        });

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
                token,
            },
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }

        logger.error('Registration failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Registration failed',
        });
    }
});

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;

        // Find user
        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.hashedPassword);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email,
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
                token,
            },
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }

        logger.error('Login failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
});

/**
 * @route GET /api/v1/auth/profile
 * @desc Get user profile (protected route)
 */
router.get('/profile', async (req: Request, res: Response) => {
    try {
        // In a real app, you'd use authentication middleware to verify the token
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        const user = users.get(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                },
            },
        });

    } catch (error) {
        logger.error('Profile fetch failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Profile fetch failed',
        });
    }
});

export default router;
