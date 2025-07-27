import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, CreditCard, Star, Zap } from 'lucide-react';
import './SubscriptionModal.css';

/**
 * Subscription Management Modal
 * Handles plan selection, upgrades, and billing
 */

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
  aiCredits: number;
  maxProjects: number;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started with AI story creation',
    features: [
      'Basic AI story generation',
      'Up to 3 projects',
      '50 AI requests per month',
      'Basic templates',
      'Community support'
    ],
    aiCredits: 50,
    maxProjects: 3,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    yearlyPrice: 199.99,
    interval: 'month',
    description: 'Advanced features for serious storytellers',
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
    recommended: true,
    aiCredits: 1000,
    maxProjects: -1,
  },
  {
    id: 'team',
    name: 'Team',
    price: 49.99,
    yearlyPrice: 499.99,
    interval: 'month',
    description: 'Collaboration features for creative teams',
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
    popular: true,
    aiCredits: 5000,
    maxProjects: -1,
  },
];

export const SubscriptionModal = () => {
  const {
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscription,
    isTrialUser,
    getDaysUntilTrialEnd,
  } = useAuthStore();

  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showSubscriptionModal) return null;

  const currentPlan = subscription?.plan || 'free';
  const isOnTrial = isTrialUser();
  const daysLeft = getDaysUntilTrialEnd();

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = async () => {
    if (selectedPlan === currentPlan) {
      setShowSubscriptionModal(false);
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement PayPal or Stripe payment integration
      console.log('Upgrading to plan:', selectedPlan, 'billing:', billingInterval);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription in store
      // This would normally come from the backend
      alert(`Successfully upgraded to ${selectedPlan} plan!`);
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free';
    
    if (billingInterval === 'yearly' && plan.yearlyPrice) {
      const monthlyEquivalent = plan.yearlyPrice / 12;
      return (
        <div className="plan-price">
          <span className="price-amount">${monthlyEquivalent.toFixed(2)}</span>
          <span className="price-interval">/month</span>
          <div className="yearly-note">Billed annually (${plan.yearlyPrice}/year)</div>
        </div>
      );
    }
    
    return (
      <div className="plan-price">
        <span className="price-amount">${plan.price}</span>
        <span className="price-interval">/month</span>
      </div>
    );
  };

  const getYearlySavings = (plan: Plan) => {
    if (!plan.yearlyPrice) return 0;
    const monthlyTotal = plan.price * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  return (
    <AnimatePresence>
      <div className="subscription-modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
        <motion.div
          className="subscription-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="subscription-modal-header">
            <h2>Choose Your Plan</h2>
            <p>Unlock the full power of AI-driven storytelling</p>
            
            {isOnTrial && daysLeft !== null && (
              <div className="trial-status">
                <Crown size={16} />
                <span>Pro trial: {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>
              </div>
            )}

            <div className="billing-toggle">
              <button
                className={billingInterval === 'monthly' ? 'active' : ''}
                onClick={() => setBillingInterval('monthly')}
              >
                Monthly
              </button>
              <button
                className={billingInterval === 'yearly' ? 'active' : ''}
                onClick={() => setBillingInterval('yearly')}
              >
                Yearly
                <span className="savings-badge">Save up to $200</span>
              </button>
            </div>
          </div>

          <div className="plans-grid">
            {PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${
                  plan.recommended ? 'recommended' : ''
                } ${currentPlan === plan.id ? 'current' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {plan.recommended && (
                  <div className="plan-badge recommended-badge">
                    <Star size={14} />
                    Recommended
                  </div>
                )}
                
                {plan.popular && (
                  <div className="plan-badge popular-badge">
                    <Zap size={14} />
                    Most Popular
                  </div>
                )}

                {currentPlan === plan.id && (
                  <div className="plan-badge current-badge">
                    Current Plan
                  </div>
                )}

                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  {getPlanPrice(plan)}
                  {billingInterval === 'yearly' && getYearlySavings(plan) > 0 && (
                    <div className="savings-text">
                      Save ${getYearlySavings(plan)} per year
                    </div>
                  )}
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-features">
                  <div className="feature-highlight">
                    <div className="feature-item">
                      <Zap size={16} />
                      <span>{plan.aiCredits === -1 ? 'Unlimited' : plan.aiCredits} AI credits</span>
                    </div>
                    <div className="feature-item">
                      <Crown size={16} />
                      <span>{plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects} projects</span>
                    </div>
                  </div>
                  
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <Check size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plan-footer">
                  {currentPlan === plan.id ? (
                    <button className="plan-btn current" disabled>
                      Current Plan
                    </button>
                  ) : plan.id === 'free' ? (
                    <button className="plan-btn downgrade">
                      Downgrade
                    </button>
                  ) : (
                    <button className="plan-btn upgrade">
                      {currentPlan === 'free' ? 'Start Trial' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="subscription-modal-footer">
            <div className="payment-security">
              <CreditCard size={16} />
              <span>Secure payment powered by PayPal</span>
            </div>
            
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowSubscriptionModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                className="upgrade-btn"
                onClick={handleUpgrade}
                disabled={isProcessing || selectedPlan === currentPlan}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner" />
                    Processing...
                  </>
                ) : selectedPlan === 'free' ? (
                  'Downgrade to Free'
                ) : currentPlan === 'free' ? (
                  'Start Free Trial'
                ) : (
                  'Upgrade Plan'
                )}
              </button>
            </div>
          </div>

          <button
            className="subscription-modal-close"
            onClick={() => setShowSubscriptionModal(false)}
            disabled={isProcessing}
            aria-label="Close subscription modal"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};