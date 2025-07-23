/**
 * Payment Routes - Simplified Version
 * Basic payment processing endpoints for PayPal integration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { paypalService } from '../services/paypalService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const createPaymentSchema = z.object({
    amount: z.number().min(0.01, 'Amount must be at least $0.01'),
    currency: z.string().default('USD'),
    description: z.string().min(1, 'Description is required'),
    planSlug: z.string().optional(),
});

const executePaymentSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    payerId: z.string().min(1, 'Payer ID is required'),
});

const createSubscriptionSchema = z.object({
    planSlug: z.enum(['pro', 'pro_annual', 'team'], { required_error: 'Valid plan slug is required' }),
    userEmail: z.string().email('Valid email is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
});

/**
 * @route POST /api/v1/payments/create
 * @desc Create a one-time payment
 */
router.post('/create', async (req: Request, res: Response) => {
    try {
        const validatedData = createPaymentSchema.parse(req.body);
        const { amount, currency, description, planSlug } = validatedData;

        const userId = req.headers['x-user-id'] as string || 'demo-user';

        logger.info('Creating PayPal payment', { userId, amount, currency, description });

        const paymentResult = await paypalService.createPayment({
            amount,
            currency,
            description,
            returnUrl: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/v1/payments/execute`,
            cancelUrl: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/v1/payments/cancel`,
            userId,
            ...(planSlug && { planSlug }),
        });

        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                error: paymentResult.error || 'Failed to create payment',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            data: {
                paymentId: paymentResult.paymentId,
                approvalUrl: paymentResult.approvalUrl,
                amount,
                currency,
                description,
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

        logger.error('Payment creation failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Payment creation failed',
        });
    }
});

/**
 * @route POST /api/v1/payments/execute
 * @desc Execute a payment after user approval
 */
router.post('/execute', async (req: Request, res: Response) => {
    try {
        const validatedData = executePaymentSchema.parse(req.body);
        const { paymentId, payerId } = validatedData;

        logger.info('Executing PayPal payment', { paymentId, payerId });

        const paymentResult = await paypalService.executePayment(paymentId, payerId);

        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                error: paymentResult.error || 'Failed to execute payment',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment executed successfully',
            data: {
                paymentId: paymentResult.paymentId,
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

        logger.error('Payment execution failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Payment execution failed',
        });
    }
});

/**
 * @route POST /api/v1/payments/subscription/create
 * @desc Create a subscription
 */
router.post('/subscription/create', async (req: Request, res: Response) => {
    try {
        const validatedData = createSubscriptionSchema.parse(req.body);
        const { planSlug, userEmail, firstName, lastName } = validatedData;

        logger.info('Creating subscription', { planSlug, userEmail });

        // First create a billing plan
        const planResult = await paypalService.createBillingPlan({
            name: `${planSlug} Plan`,
            description: `AI Story Studio ${planSlug} subscription`,
            price: planSlug === 'pro' ? 19.99 : planSlug === 'pro_annual' ? 199.99 : 49.99,
            currency: 'USD',
            interval: planSlug === 'pro_annual' ? 'year' : 'month',
            trialDays: 7,
        });

        // Create billing agreement
        const agreementResult = await paypalService.createBillingAgreement({
            planId: planResult.id,
            name: `${firstName} ${lastName} - ${planSlug} Subscription`,
            description: `AI Story Studio ${planSlug} subscription with 7-day trial`,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            payerInfo: {
                email: userEmail,
                firstName,
                lastName,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscriptionId: agreementResult.id,
                approvalUrl: agreementResult.approvalUrl,
                planSlug,
                trialDays: 7,
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

        logger.error('Subscription creation failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Subscription creation failed',
        });
    }
});

/**
 * @route POST /api/v1/payments/webhook
 * @desc Handle PayPal webhooks
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const headers = req.headers as Record<string, string>;
        const body = JSON.stringify(req.body);

        // Verify webhook
        const isValid = paypalService.verifyWebhook(headers, body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook signature',
            });
        }

        const event = req.body;
        logger.info('PayPal webhook received', { eventType: event.event_type });

        // Process webhook events
        switch (event.event_type) {
            case 'PAYMENT.SALE.COMPLETED':
                logger.info('Payment completed', { paymentId: event.resource.id });
                break;
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                logger.info('Subscription activated', { subscriptionId: event.resource.id });
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                logger.info('Subscription cancelled', { subscriptionId: event.resource.id });
                break;
            default:
                logger.info('Unhandled webhook event', { eventType: event.event_type });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        logger.error('Webhook processing failed', { error });
        return res.status(500).json({
            success: false,
            error: 'Webhook processing failed',
        });
    }
});

export default router;
