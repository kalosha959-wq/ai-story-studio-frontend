import { useAuthStore } from '../store/authStore';

/**
 * Feature Access Hook
 * Provides feature gating and subscription checking functionality
 */

export interface FeatureGate {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  creditsRequired?: boolean;
}

// Define available features and their requirements
export const FEATURES = {
  // Basic features (free tier)
  BASIC_AI: 'basic_ai',
  BASIC_EXPORT: 'basic_export',
  
  // Pro features
  ADVANCED_AI: 'advanced_ai',
  PREMIUM_EXPORT: 'premium_export',
  COLLABORATION: 'collaboration',
  PRIORITY_SUPPORT: 'priority_support',
  UNLIMITED_PROJECTS: 'unlimited_projects',
  
  // Team features
  TEAM_COLLABORATION: 'team_collaboration',
  ADMIN_DASHBOARD: 'admin_dashboard',
  CUSTOM_BRANDING: 'custom_branding',
  
  // Enterprise features
  ENTERPRISE_AI: 'enterprise_ai',
  DEDICATED_SUPPORT: 'dedicated_support',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export const useFeatureAccess = () => {
  const {
    isAuthenticated,
    user,
    subscription,
    checkFeatureAccess,
    hasCreditsRemaining,
    isTrialUser,
    getDaysUntilTrialEnd,
  } = useAuthStore();

  const checkFeature = (feature: FeatureKey): FeatureGate => {
    // Must be authenticated
    if (!isAuthenticated || !user || !subscription) {
      return {
        hasAccess: false,
        reason: 'Authentication required',
        upgradeRequired: true,
      };
    }

    // Check if subscription is active
    if (subscription.status === 'expired' || subscription.status === 'cancelled') {
      return {
        hasAccess: false,
        reason: 'Subscription expired',
        upgradeRequired: true,
      };
    }

    // Check feature access
    const hasFeatureAccess = checkFeatureAccess(feature);
    if (!hasFeatureAccess) {
      return {
        hasAccess: false,
        reason: 'Feature not included in current plan',
        upgradeRequired: true,
      };
    }

    // For AI features, check credits
    if (feature.includes('ai') && !hasCreditsRemaining()) {
      return {
        hasAccess: false,
        reason: 'AI credits exhausted',
        creditsRequired: true,
        upgradeRequired: subscription.plan === 'free',
      };
    }

    // Check project limits
    if (feature === FEATURES.UNLIMITED_PROJECTS) {
      if (subscription.maxProjects !== -1 && 
          subscription.usageStats.projectsCreated >= subscription.maxProjects) {
        return {
          hasAccess: false,
          reason: 'Project limit reached',
          upgradeRequired: true,
        };
      }
    }

    return { hasAccess: true };
  };

  const getSubscriptionInfo = () => {
    if (!subscription) return null;

    const isOnTrial = isTrialUser();
    const daysLeft = getDaysUntilTrialEnd();

    return {
      plan: subscription.plan,
      status: subscription.status,
      isOnTrial,
      daysLeft,
      aiCredits: {
        used: subscription.usageStats.aiCreditsUsed,
        total: subscription.aiCredits,
        remaining: subscription.aiCredits - subscription.usageStats.aiCreditsUsed,
        percentage: (subscription.usageStats.aiCreditsUsed / subscription.aiCredits) * 100,
      },
      projects: {
        created: subscription.usageStats.projectsCreated,
        limit: subscription.maxProjects,
        unlimited: subscription.maxProjects === -1,
        percentage: subscription.maxProjects === -1 ? 0 : 
                   (subscription.usageStats.projectsCreated / subscription.maxProjects) * 100,
      },
      features: subscription.features,
    };
  };

  const getUpgradeInfo = () => {
    if (!subscription) return null;

    const currentPlan = subscription.plan;
    
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: ['Basic AI', 'Up to 3 projects', '50 AI requests/month'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 19.99,
        features: ['Advanced AI', 'Unlimited projects', '1000 AI requests/month', 'Priority support'],
      },
      {
        id: 'team',
        name: 'Team',
        price: 49.99,
        features: ['All Pro features', 'Team collaboration', '5000 AI requests/month', 'Admin dashboard'],
      },
    ];

    const currentIndex = plans.findIndex(p => p.id === currentPlan);
    const upgradeOptions = plans.slice(currentIndex + 1);

    return {
      currentPlan: plans[currentIndex],
      upgradeOptions,
      canUpgrade: upgradeOptions.length > 0,
    };
  };

  return {
    checkFeature,
    getSubscriptionInfo,
    getUpgradeInfo,
    isAuthenticated,
    user,
    subscription,
  };
};

/**
 * Feature Guard Component
 * Conditionally renders content based on feature access
 */
interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onUpgradeClick,
}) => {
  const { checkFeature } = useFeatureAccess();
  const { setShowSubscriptionModal, setShowLoginModal, isAuthenticated } = useAuthStore();

  const featureCheck = checkFeature(feature);

  if (featureCheck.hasAccess) {
    return <>{children}</>;
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="feature-guard-prompt">
        <p>Please sign in to access this feature</p>
        <button onClick={() => setShowLoginModal(true)} className="upgrade-prompt-btn">
          Sign In
        </button>
      </div>
    );
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt && featureCheck.upgradeRequired) {
    return (
      <div className="feature-guard-prompt">
        <p>{featureCheck.reason}</p>
        <button 
          onClick={onUpgradeClick || (() => setShowSubscriptionModal(true))} 
          className="upgrade-prompt-btn"
        >
          {featureCheck.creditsRequired ? 'Get More Credits' : 'Upgrade Plan'}
        </button>
      </div>
    );
  }

  // Default: don't render anything
  return null;
};

/**
 * Usage Tracker Hook
 * Tracks user actions for analytics and usage limits
 */
export const useUsageTracker = () => {
  const { updateUsage, subscription } = useAuthStore();

  const trackAction = (action: string, metadata?: Record<string, any>) => {
    // Log to console for development
    console.log('User action tracked:', { action, metadata, timestamp: new Date().toISOString() });

    // Update subscription usage based on action
    switch (action) {
      case 'ai_story_generation':
      case 'ai_character_generation':
      case 'ai_scene_generation':
        updateUsage('aiCreditsUsed', 1);
        updateUsage('storiesGenerated', 1);
        break;
      
      case 'ai_image_generation':
        updateUsage('aiCreditsUsed', 2); // Images cost more credits
        updateUsage('imagesGenerated', 1);
        break;
      
      case 'ai_audio_generation':
        updateUsage('aiCreditsUsed', 3); // Audio costs most credits
        updateUsage('audioGenerated', 1);
        break;
      
      case 'project_creation':
        updateUsage('projectsCreated', 1);
        break;
      
      default:
        // General AI usage
        if (action.startsWith('ai_')) {
          updateUsage('aiCreditsUsed', 1);
        }
    }

    // TODO: Send to analytics backend
    // analyticsService.track(action, metadata);
  };

  const canPerformAction = (action: string): FeatureGate => {
    if (!subscription) {
      return { hasAccess: false, reason: 'No subscription found' };
    }

    // Check AI credit limits
    if (action.startsWith('ai_') && subscription.usageStats.aiCreditsUsed >= subscription.aiCredits) {
      return {
        hasAccess: false,
        reason: 'AI credits exhausted',
        creditsRequired: true,
        upgradeRequired: subscription.plan === 'free',
      };
    }

    // Check project limits
    if (action === 'project_creation' && 
        subscription.maxProjects !== -1 && 
        subscription.usageStats.projectsCreated >= subscription.maxProjects) {
      return {
        hasAccess: false,
        reason: 'Project limit reached',
        upgradeRequired: true,
      };
    }

    return { hasAccess: true };
  };

  return {
    trackAction,
    canPerformAction,
  };
};