import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { User, Settings, CreditCard, LogOut, Crown, Activity } from 'lucide-react';
import './UserProfile.css';

/**
 * User Profile Component
 * Shows user info, subscription status, and account actions
 */
export const UserProfile = () => {
  const {
    user,
    subscription,
    logout,
    isTrialUser,
    getDaysUntilTrialEnd,
    setShowSubscriptionModal,
  } = useAuthStore();

  if (!user || !subscription) return null;

  const isOnTrial = isTrialUser();
  const daysLeft = getDaysUntilTrialEnd();

  const getSubscriptionStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return '#10b981';
      case 'trial':
        return '#f59e0b';
      case 'cancelled':
      case 'expired':
        return '#ef4444';
      case 'past_due':
        return '#f97316';
      default:
        return '#6b7280';
    }
  };

  const getSubscriptionStatusText = () => {
    switch (subscription.status) {
      case 'active':
        return subscription.plan === 'free' ? 'Free Plan' : 'Active Subscription';
      case 'trial':
        return `Pro Trial (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`;
      case 'cancelled':
        return 'Subscription Cancelled';
      case 'expired':
        return 'Subscription Expired';
      case 'past_due':
        return 'Payment Past Due';
      default:
        return 'Unknown Status';
    }
  };

  const usagePercentage = {
    aiCredits: (subscription.usageStats.aiCreditsUsed / subscription.aiCredits) * 100,
    projects: subscription.maxProjects === -1 ? 0 : (subscription.usageStats.projectsCreated / subscription.maxProjects) * 100,
  };

  const handleUpgrade = () => {
    setShowSubscriptionModal(true);
  };

  return (
    <motion.div
      className="user-profile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={24} />
        </div>
        <div className="profile-info">
          <h3>{user.firstName} {user.lastName}</h3>
          <p>{user.email}</p>
          <div
            className="subscription-status"
            style={{ color: getSubscriptionStatusColor() }}
          >
            {subscription.plan !== 'free' && <Crown size={14} />}
            <span>{getSubscriptionStatusText()}</span>
          </div>
        </div>
      </div>

      {isOnTrial && daysLeft !== null && daysLeft <= 3 && (
        <motion.div
          className="trial-warning"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Crown size={16} />
          <div>
            <strong>Trial ending soon!</strong>
            <p>Upgrade now to keep your Pro features and projects.</p>
          </div>
          <button onClick={handleUpgrade} className="upgrade-btn">
            Upgrade Now
          </button>
        </motion.div>
      )}

      <div className="usage-section">
        <h4>
          <Activity size={16} />
          Usage This Month
        </h4>
        
        <div className="usage-item">
          <div className="usage-label">
            <span>AI Credits</span>
            <span>{subscription.usageStats.aiCreditsUsed} / {subscription.aiCredits}</span>
          </div>
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${Math.min(usagePercentage.aiCredits, 100)}%`,
                backgroundColor: usagePercentage.aiCredits > 90 ? '#ef4444' : '#2563eb',
              }}
            />
          </div>
        </div>

        {subscription.maxProjects !== -1 && (
          <div className="usage-item">
            <div className="usage-label">
              <span>Projects</span>
              <span>{subscription.usageStats.projectsCreated} / {subscription.maxProjects}</span>
            </div>
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{
                  width: `${Math.min(usagePercentage.projects, 100)}%`,
                  backgroundColor: usagePercentage.projects > 90 ? '#ef4444' : '#2563eb',
                }}
              />
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{subscription.usageStats.storiesGenerated}</span>
            <span className="stat-label">Stories</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{subscription.usageStats.imagesGenerated}</span>
            <span className="stat-label">Images</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{subscription.usageStats.audioGenerated}</span>
            <span className="stat-label">Audio</span>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-action-btn" onClick={handleUpgrade}>
          <CreditCard size={16} />
          Manage Subscription
        </button>
        
        <button className="profile-action-btn">
          <Settings size={16} />
          Account Settings
        </button>
        
        <button className="profile-action-btn logout-btn" onClick={logout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {subscription.plan !== 'free' && subscription.plan !== 'pro' && subscription.plan !== 'team' && (
        <div className="features-section">
          <h4>Your Features</h4>
          <div className="features-list">
            {subscription.features.map((feature, index) => (
              <div key={index} className="feature-item">
                <Crown size={12} />
                <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};