/**
 * User Authentication and Profile Models
 * Complete user management with authentication and profile data
 */

export interface User {
    id: string;
    email: string;
    emailHash: string; // For secure lookups
    passwordHash: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;

    // Authentication
    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;

    // Security
    mfaEnabled: boolean;
    mfaSecret?: string;
    backupCodes?: string[];
    loginAttempts: number;
    lockedUntil?: Date;
    lastLogin?: Date;
    lastLoginIP?: string;

    // Subscription
    subscriptionId?: string;
    currentPlan: string; // Plan slug
    trialEndsAt?: Date;
    subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

    // Profile
    role: 'user' | 'admin' | 'moderator';
    status: 'active' | 'suspended' | 'pending_verification' | 'deleted';
    timezone?: string;
    language: string;
    preferences: UserPreferences;

    // GDPR/Privacy
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    dataRetentionPeriod: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

// Document interfaces for database operations
export interface UserDocument {
    id: string;
    email: string;
    hashedPassword: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | undefined;
    agreeToTerms: boolean;
    marketingOptIn: boolean;
    emailVerified: boolean;
    emailVerificationToken?: string | undefined;
    passwordResetToken?: string | undefined;
    passwordResetExpires?: Date | undefined;
    loginAttempts: number;
    lockUntil?: Date | undefined;
    subscriptionId?: string;
    preferences?: {
        language?: string;
        timezone?: string;
        theme?: string;
        notifications?: {
            email?: boolean;
            push?: boolean;
            marketing?: boolean;
        };
    };
    security?: {
        mfaEnabled?: boolean;
        lastPasswordChange?: Date;
        suspiciousActivityDetected?: boolean;
    };
    gdprConsent?: {
        dataProcessing?: boolean;
        marketing?: boolean;
        analytics?: boolean;
        consentDate?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionDocument {
    id: string;
    userId: string;
    plan: string;
    status: 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due';
    trialEndsAt?: Date | undefined;
    aiCredits: number;
    maxProjects: number;
    features: string[];
    usageStats: {
        aiCreditsUsed: number;
        projectsCreated: number;
        storiesGenerated: number;
        imagesGenerated: number;
        audioGenerated: number;
    };
    billingHistory: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        invoiceUrl?: string;
        createdAt: Date;
    }>;
    paymentMethod: {
        type: 'paypal' | 'stripe' | 'bank_transfer';
        details: any;
        isDefault: boolean;
    } | null;
    nextBillingDate?: Date | undefined;
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
        email: boolean;
        browser: boolean;
        marketing: boolean;
        security: boolean;
        billing: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private';
        showOnlineStatus: boolean;
        allowCollaboration: boolean;
    };
    editor: {
        fontSize: number;
        fontFamily: string;
        lineHeight: number;
        showLineNumbers: boolean;
        wordWrap: boolean;
    };
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    planSlug?: string; // Optional: start with specific plan
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    timezone?: string;
    referralCode?: string;
}

export interface SigninRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
    mfaCode?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: Partial<User>;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    requiresMFA?: boolean;
    subscription?: {
        plan: string;
        status: string;
        trialEndsAt?: Date;
        currentPeriodEnd?: Date;
    };
    message?: string;
    error?: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface EmailVerificationRequest {
    token: string;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    timezone?: string;
    language?: string;
    preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface MFASetupRequest {
    password: string;
}

export interface MFAVerifyRequest {
    token: string;
    backupCode?: string;
}

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    theme: 'auto',
    notifications: {
        email: true,
        browser: true,
        marketing: false,
        security: true,
        billing: true,
    },
    privacy: {
        profileVisibility: 'private',
        showOnlineStatus: true,
        allowCollaboration: true,
    },
    editor: {
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, monospace',
        lineHeight: 1.5,
        showLineNumbers: true,
        wordWrap: true,
    },
};

// Validation schemas for requests
export const VALIDATION_RULES = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 254,
    },
    password: {
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, // At least one lowercase, uppercase, digit, and special char
    },
    name: {
        minLength: 1,
        maxLength: 50,
        pattern: /^[a-zA-Z\s\-'\.]+$/,
    },
    displayName: {
        minLength: 1,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
    },
};
