/**
 * PayPal Payment Service Integration
 * Complete PayPal integration for subscriptions and one-time payments
 */

import * as paypal from 'paypal-rest-sdk';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

// PayPal configuration
paypal.configure({
  mode: config.paypal.mode || 'sandbox',
  client_id: config.paypal.clientId || '',
  client_secret: config.paypal.clientSecret || '',
});

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  userId: string;
  planSlug?: string;
}

export interface CreateSubscriptionRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName: { first: string; last: string };
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string | undefined;
  approvalUrl?: string | undefined;
  subscriptionId?: string | undefined;
  error?: string | undefined;
}

export class PayPalService {
  private static instance: PayPalService;

  public static getInstance(): PayPalService {
    if (!PayPalService.instance) {
      PayPalService.instance = new PayPalService();
    }
    return PayPalService.instance;
  }

  /**
   * Create a one-time payment
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const payment = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: paymentData.returnUrl,
          cancel_url: paymentData.cancelUrl,
        },
        transactions: [
          {
            amount: {
              currency: paymentData.currency,
              total: paymentData.amount.toString(),
            },
            description: paymentData.description,
            custom: JSON.stringify({
              userId: paymentData.userId,
              planSlug: paymentData.planSlug,
            }),
          },
        ],
      };

      paypal.payment.create(payment, (error: any, payment: any) => {
        if (error) {
          logger.error('PayPal payment creation failed', { error, paymentData });
          resolve({
            success: false,
            error: 'Failed to create PayPal payment',
          });
        } else {
          const approvalUrl = payment.links?.find((link: any) => link.rel === 'approval_url')?.href;

          logger.info('PayPal payment created', {
            paymentId: payment.id,
            userId: paymentData.userId,
            amount: paymentData.amount,
          });

          resolve({
            success: true,
            paymentId: payment.id || undefined,
            approvalUrl: approvalUrl || undefined,
          });
        }
      });
    });
  }

  /**
   * Execute a payment after user approval
   */
  async executePayment(paymentId: string, payerId: string): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const executePaymentJson = {
        payer_id: payerId,
      };

      paypal.payment.execute(paymentId, executePaymentJson, (error: any, payment: any) => {
        if (error) {
          logger.error('PayPal payment execution failed', { error, paymentId, payerId });
          resolve({
            success: false,
            error: 'Failed to execute PayPal payment',
          });
        } else {
          logger.info('PayPal payment executed successfully', {
            paymentId,
            payerId,
            state: payment.state,
          });

          resolve({
            success: true,
            paymentId: payment.id || undefined,
          });
        }
      });
    });
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      paypal.payment.get(paymentId, (error: any, payment: any) => {
        if (error) {
          logger.error('Failed to get PayPal payment', { error, paymentId });
          reject(new Error('Failed to get PayPal payment'));
        } else {
          resolve(payment);
        }
      });
    });
  }

  /**
   * Create a billing plan for subscriptions
   */
  async createBillingPlan(planData: {
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    trialDays?: number;
  }): Promise<{ id: string }> {
    return new Promise((resolve, reject) => {
      const billingPlan: any = {
        name: planData.name,
        description: planData.description,
        merchant_preferences: {
          auto_bill_amount: 'yes',
          cancel_url: `${config.api.baseUrl}/subscription/cancel`,
          initial_fail_amount_action: 'continue',
          max_fail_attempts: '1',
          return_url: `${config.api.baseUrl}/subscription/success`,
          setup_fee: {
            currency: planData.currency,
            value: '0',
          },
        },
        payment_definitions: [],
        type: 'INFINITE',
      };

      // Add trial period if specified
      if (planData.trialDays && planData.trialDays > 0) {
        billingPlan.payment_definitions.push({
          amount: {
            currency: planData.currency,
            value: '0',
          },
          cycles: '1',
          frequency: 'DAY',
          frequency_interval: planData.trialDays.toString(),
          name: 'Trial Period',
          type: 'TRIAL',
        });
      }

      // Add regular payment definition
      billingPlan.payment_definitions.push({
        amount: {
          currency: planData.currency,
          value: planData.price.toString(),
        },
        cycles: '0', // 0 means infinite
        frequency: planData.interval === 'month' ? 'MONTH' : 'YEAR',
        frequency_interval: '1',
        name: 'Regular Payment',
        type: 'REGULAR',
      });

      paypal.billingPlan.create(billingPlan, (error: any, billingPlan: any) => {
        if (error) {
          logger.error('Failed to create PayPal billing plan', { error, planData });
          reject(new Error('Failed to create PayPal billing plan'));
        } else {
          // Activate the billing plan
          const billingPlanUpdateAttributes = [
            {
              op: 'replace',
              path: '/',
              value: {
                state: 'ACTIVE',
              },
            },
          ];

          paypal.billingPlan.update(
            billingPlan.id!,
            billingPlanUpdateAttributes,
            (error: any) => {
              if (error) {
                logger.error('Failed to activate PayPal billing plan', { error, planId: billingPlan.id });
                reject(new Error('Failed to activate PayPal billing plan'));
              } else {
                logger.info('PayPal billing plan created and activated', {
                  planId: billingPlan.id,
                  name: planData.name,
                });
                resolve({ id: billingPlan.id! });
              }
            }
          );
        }
      });
    });
  }

  /**
   * Create a billing agreement (subscription)
   */
  async createBillingAgreement(agreementData: {
    planId: string;
    name: string;
    description: string;
    startDate: Date;
    payerInfo: {
      email: string;
      firstName: string;
      lastName: string;
    };
  }): Promise<{ id: string; approvalUrl: string }> {
    return new Promise((resolve, reject) => {
      const billingAgreement = {
        name: agreementData.name,
        description: agreementData.description,
        start_date: agreementData.startDate.toISOString(),
        plan: {
          id: agreementData.planId,
        },
        payer: {
          payment_method: 'paypal',
          payer_info: {
            email: agreementData.payerInfo.email,
            first_name: agreementData.payerInfo.firstName,
            last_name: agreementData.payerInfo.lastName,
          },
        },
      };

      paypal.billingAgreement.create(billingAgreement, (error: any, billingAgreement: any) => {
        if (error) {
          logger.error('Failed to create PayPal billing agreement', { error, agreementData });
          reject(new Error('Failed to create PayPal billing agreement'));
        } else {
          const approvalUrl = billingAgreement.links?.find((link: any) => link.rel === 'approval_url')?.href;

          if (!approvalUrl) {
            reject(new Error('No approval URL returned from PayPal'));
            return;
          }

          logger.info('PayPal billing agreement created', {
            agreementId: billingAgreement.id,
            planId: agreementData.planId,
          });

          resolve({
            id: billingAgreement.id!,
            approvalUrl,
          });
        }
      });
    });
  }

  /**
   * Execute billing agreement after user approval
   */
  async executeBillingAgreement(token: string): Promise<{ id: string }> {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.execute(token, {}, (error: any, billingAgreement: any) => {
        if (error) {
          logger.error('Failed to execute PayPal billing agreement', { error, token });
          reject(new Error('Failed to execute PayPal billing agreement'));
        } else {
          logger.info('PayPal billing agreement executed', {
            agreementId: billingAgreement.id,
            state: billingAgreement.state,
          });

          resolve({
            id: billingAgreement.id!,
          });
        }
      });
    });
  }

  /**
   * Cancel a billing agreement (mock implementation)
   */
  async cancelBillingAgreement(agreementId: string, note: string): Promise<void> {
    try {
      logger.info('Canceling PayPal billing agreement (mock)', { agreementId, note });
      // Mock cancellation
    } catch (error) {
      logger.error('Failed to cancel PayPal billing agreement', { error, agreementId });
      throw new Error('Failed to cancel PayPal billing agreement');
    }
  }

  /**
   * Get billing agreement details
   */
  async getBillingAgreement(agreementId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.get(agreementId, (error: any, billingAgreement: any) => {
        if (error) {
          logger.error('Failed to get PayPal billing agreement', { error, agreementId });
          reject(new Error('Failed to get PayPal billing agreement'));
        } else {
          resolve(billingAgreement);
        }
      });
    });
  }

  /**
   * Verify webhook payload
   */
  verifyWebhook(headers: Record<string, string>, body: string): boolean {
    // Basic verification - in production, implement proper webhook signature verification
    const paypalHeaders = [
      'paypal-auth-algo',
      'paypal-transmission-id',
      'paypal-cert-id',
      'paypal-transmission-sig',
      'paypal-transmission-time',
    ];

    return paypalHeaders.every(header => headers[header]);
  }
}

export const paypalService = PayPalService.getInstance();
export default PayPalService;
