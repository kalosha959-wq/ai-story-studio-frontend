/**
 * Subscription and Payment Models
 * Comprehensive subscription system with free trials and payment tracking
 */

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: 'USD' | 'EUR' | 'GBP';
    interval: 'month' | 'year';
    intervalCount: number;
    trialDays: number;
    features: string[];
    limits: {
        projects: number;
        aiRequests: number;
        storage: number; // in MB
        collaborators: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart?: Date;
    trialEnd?: Date;
    canceledAt?: Date;
    cancelAtPeriodEnd: boolean;
    paymentMethodId?: string;
    subscriptionId?: string; // PayPal subscription ID
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentMethod {
    id: string;
    userId: string;
    type: 'paypal' | 'card' | 'bank_transfer';
    provider: 'paypal' | 'stripe' | 'square';
    providerId: string; // External payment method ID
    isDefault: boolean;
    metadata: {
        last4?: string;
        brand?: string;
        expiryMonth?: number;
        expiryYear?: number;
        email?: string; // For PayPal
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentTransaction {
    id: string;
    userId: string;
    subscriptionId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled';
    type: 'subscription' | 'one_time' | 'refund';
    providerTransactionId: string;
    providerResponse: Record<string, any>;
    failureReason?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Invoice {
    id: string;
    userId: string;
    subscriptionId: string;
    transactionId?: string;
    amount: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    dueDate: Date;
    paidDate?: Date;
    items: InvoiceItem[];
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    invoiceNumber: string;
    downloadUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    periodStart: Date;
    periodEnd: Date;
}

export interface UsageTracking {
    id: string;
    userId: string;
    subscriptionId: string;
    period: string; // YYYY-MM format
    usage: {
        projects: number;
        aiRequests: number;
        storageUsed: number; // in MB
        collaborators: number;
    };
    limits: {
        projects: number;
        aiRequests: number;
        storage: number;
        collaborators: number;
    };
    overageCharges: number;
    createdAt: Date;
    updatedAt: Date;
}

// Default subscription plans
export const SUBSCRIPTION_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Free',
        slug: 'free',
        description: 'Perfect for getting started with AI story creation',
        price: 0,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialDays: 0,
        features: [
            'Basic AI story generation',
            'Up to 3 projects',
            '50 AI requests per month',
            'Basic templates',
            'Community support'
        ],
        limits: {
            projects: 3,
            aiRequests: 50,
            storage: 100, // 100MB
            collaborators: 0,
        },
        isActive: true,
    },
    {
        name: 'Pro',
        slug: 'pro',
        description: 'Advanced features for serious storytellers',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialDays: 7,
        features: [
            'Advanced AI story generation',
            'Unlimited projects',
            '1000 AI requests per month',
            'Premium templates',
            'Character development tools',
            'Plot generation',
            'Export to multiple formats',
            'Priority support'
        ],
        limits: {
            projects: -1, // unlimited
            aiRequests: 1000,
            storage: 1000, // 1GB
            collaborators: 5,
        },
        isActive: true,
    },
    {
        name: 'Pro Annual',
        slug: 'pro-annual',
        description: 'Pro features with 2 months free (annual billing)',
        price: 199.99,
        currency: 'USD',
        interval: 'year',
        intervalCount: 1,
        trialDays: 7,
        features: [
            'All Pro features',
            '2 months free (vs monthly)',
            'Advanced AI story generation',
            'Unlimited projects',
            '12,000 AI requests per year',
            'Premium templates',
            'Character development tools',
            'Plot generation',
            'Export to multiple formats',
            'Priority support'
        ],
        limits: {
            projects: -1,
            aiRequests: 12000,
            storage: 1000,
            collaborators: 5,
        },
        isActive: true,
    },
    {
        name: 'Team',
        slug: 'team',
        description: 'Collaboration features for creative teams',
        price: 49.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        trialDays: 14,
        features: [
            'All Pro features',
            'Team collaboration',
            'Unlimited collaborators',
            '5000 AI requests per month',
            'Advanced permissions',
            'Team analytics',
            'Admin dashboard',
            'Custom branding',
            'Priority support'
        ],
        limits: {
            projects: -1,
            aiRequests: 5000,
            storage: 5000, // 5GB
            collaborators: -1, // unlimited
        },
        isActive: true,
    },
];

export type SubscriptionStatus = UserSubscription['status'];
export type PaymentMethodType = PaymentMethod['type'];
export type TransactionStatus = PaymentTransaction['status'];
export type InvoiceStatus = Invoice['status'];
