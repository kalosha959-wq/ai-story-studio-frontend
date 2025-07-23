/**
 * User Authentication and Subscription Routes
 * Complete authentication system with subscription trial activation
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';
import { UserDocument, SubscriptionDocument } from '../models/user.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'Must agree to terms'),
  marketingOptIn: z.boolean().default(false),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Mock storage (replace with real database)
const users: Map<string, UserDocument> = new Map();
const subscriptions: Map<string, SubscriptionDocument> = new Map();

// Helper functions
function generateToken(payload: object, expiresIn: string = '24h'): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, config.auth.jwtSecret as string, options);
}

function generateRandomToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
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

function createSubscription(userId: string, planSlug: string): SubscriptionDocument {
  const plans = {
    free: {
      plan: 'free',
      status: 'active' as const,
      aiCredits: 100,
      maxProjects: 3,
      features: ['basic_ai', 'basic_export'],
    },
    pro: {
      plan: 'pro',
      status: 'trial' as const,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      aiCredits: 1000,
      maxProjects: 50,
      features: ['advanced_ai', 'premium_export', 'collaboration', 'priority_support'],
    },
    pro_annual: {
      plan: 'pro_annual',
      status: 'trial' as const,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      aiCredits: 1000,
      maxProjects: 50,
      features: ['advanced_ai', 'premium_export', 'collaboration', 'priority_support'],
    },
    team: {
      plan: 'team',
      status: 'trial' as const,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      aiCredits: 5000,
      maxProjects: 200,
      features: ['enterprise_ai', 'team_collaboration', 'custom_export', 'dedicated_support'],
    },
  };

  const planConfig = plans[planSlug as keyof typeof plans] || plans.free;

  const subscription: SubscriptionDocument = {
    id: generateRandomToken(),
    userId,
    plan: planConfig.plan,
    status: planConfig.status,
    trialEndsAt: 'trialEndsAt' in planConfig ? planConfig.trialEndsAt : undefined,
    aiCredits: planConfig.aiCredits,
    maxProjects: planConfig.maxProjects,
    features: planConfig.features,
    usageStats: {
      aiCreditsUsed: 0,
      projectsCreated: 0,
      storiesGenerated: 0,
      imagesGenerated: 0,
      audioGenerated: 0,
    },
    billingHistory: [],
    paymentMethod: null,
    nextBillingDate: 'trialEndsAt' in planConfig ? planConfig.trialEndsAt : undefined,
    autoRenew: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  subscriptions.set(subscription.id, subscription);
  return subscription;
}

/**
 * @route POST /api/auth/register
 * @desc Register a new user with subscription trial
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName, dateOfBirth, agreeToTerms, marketingOptIn } = validatedData;

    logger.info('User registration attempt', { email, firstName, lastName });

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = generateRandomToken();
    const emailVerificationToken = generateRandomToken();

    const user: UserDocument = {
      id: userId,
      email,
      hashedPassword,
      firstName,
      lastName,
      dateOfBirth,
      agreeToTerms,
      marketingOptIn,
      emailVerified: false,
      emailVerificationToken,
      loginAttempts: 0,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          marketing: marketingOptIn,
        },
      },
      security: {
        mfaEnabled: false,
        lastPasswordChange: new Date(),
        suspiciousActivityDetected: false,
      },
      gdprConsent: {
        dataProcessing: true,
        marketing: marketingOptIn,
        analytics: true,
        consentDate: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(userId, user);

    // Create free subscription with 7-day pro trial
    const subscription = createSubscription(userId, 'pro');
    user.subscriptionId = subscription.id;

    // Generate JWT token
    const token = generateToken({ userId, email });

    logger.info('User registered successfully', {
      userId,
      email,
      subscriptionId: subscription.id,
      subscriptionPlan: subscription.plan,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You have been enrolled in a 7-day Pro trial.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          preferences: user.preferences,
        },
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          features: subscription.features,
          aiCredits: subscription.aiCredits,
          maxProjects: subscription.maxProjects,
        },
        token,
        emailVerificationRequired: true,
      },
    });

    // TODO: Send email verification email
    logger.info('Email verification needed', { email, token: emailVerificationToken });
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    logger.error('Registration failed', { error, email: req.body.email });
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password, rememberMe } = validatedData;

    logger.info('User login attempt', { email });

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to multiple failed login attempts',
        lockUntil: user.lockUntil,
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    if (!isValidPassword) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      user.updatedAt = new Date();

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    if (user.lockUntil) {
      delete user.lockUntil;
    }
    user.updatedAt = new Date();

    // Get user subscription
    const subscription = user.subscriptionId ? subscriptions.get(user.subscriptionId) : null;

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : '24h';
    const token = generateToken({ userId: user.id, email }, expiresIn);

    logger.info('User logged in successfully', {
      userId: user.id,
      email,
      subscriptionPlan: subscription?.plan || 'none',
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          preferences: user.preferences,
        },
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          features: subscription.features,
          aiCredits: subscription.aiCredits,
          maxProjects: subscription.maxProjects,
          usageStats: subscription.usageStats,
        } : null,
        token,
      },
    });
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    logger.error('Login failed', { error, email: req.body.email });
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { email } = validatedData;

    logger.info('Password reset requested', { email });

    const user = findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.updatedAt = new Date();

    logger.info('Password reset token generated', { email, token: resetToken });

    // TODO: Send password reset email

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    });
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    logger.error('Password reset request failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Password reset request failed',
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validatedData = updatePasswordSchema.parse(req.body);
    const { token, newPassword } = validatedData;

    logger.info('Password reset attempt', { token });

    // Find user by reset token
    let user: UserDocument | undefined;
    for (const u of users.values()) {
      if (u.passwordResetToken === token &&
        u.passwordResetExpires &&
        u.passwordResetExpires > new Date()) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    user.hashedPassword = hashedPassword;
    if (user.passwordResetToken) {
      delete user.passwordResetToken;
    }
    if (user.passwordResetExpires) {
      delete user.passwordResetExpires;
    }
    if (user.security) {
      user.security.lastPasswordChange = new Date();
    }
    user.updatedAt = new Date();

    logger.info('Password reset successful', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Password reset successful',
    });
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    logger.error('Password reset failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Password reset failed',
    });
  }
});

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email address
 */
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    logger.info('Email verification attempt', { token });

    // Find user by verification token
    let user: UserDocument | undefined;
    for (const u of users.values()) {
      if (u.emailVerificationToken === token) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token',
      });
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
      });
    }

    // Verify email
    user.emailVerified = true;
    if (user.emailVerificationToken) {
      delete user.emailVerificationToken;
    }
    user.updatedAt = new Date();

    logger.info('Email verified successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
    return;

  } catch (error) {
    logger.error('Email verification failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Email verification failed',
    });
  }
});

export { router as authRoutes };
