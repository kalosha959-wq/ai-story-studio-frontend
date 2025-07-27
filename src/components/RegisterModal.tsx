import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, AlertCircle, Loader2, Check } from 'lucide-react';
import './Auth.css';

/**
 * Register Component
 * Handles user registration with 7-day Pro trial
 */
export const RegisterModal = () => {
  const {
    showRegisterModal,
    setShowRegisterModal,
    setShowLoginModal,
    register,
    isLoading,
    error,
    setError,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    marketingOptIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        agreeToTerms: formData.agreeToTerms,
        marketingOptIn: formData.marketingOptIn,
      });
      // Modal will close automatically on successful registration
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        marketingOptIn: false,
      });
      setFieldErrors({});
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      marketingOptIn: false,
    });
    setFieldErrors({});
    setError(null);
  };

  if (!showRegisterModal) return null;

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay" onClick={() => setShowRegisterModal(false)}>
        <motion.div
          className="auth-modal register-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="auth-modal-header">
            <h2>Start Your Creative Journey</h2>
            <p>Create your account and get <strong>7 days of Pro features free</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First name"
                    className={fieldErrors.firstName ? 'error' : ''}
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                </div>
                {fieldErrors.firstName && (
                  <span className="field-error">{fieldErrors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className={fieldErrors.lastName ? 'error' : ''}
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                </div>
                {fieldErrors.lastName && (
                  <span className="field-error">{fieldErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-group">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={fieldErrors.email ? 'error' : ''}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className={fieldErrors.password ? 'error' : ''}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={fieldErrors.confirmPassword ? 'error' : ''}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
              </label>
              {fieldErrors.agreeToTerms && (
                <span className="field-error">{fieldErrors.agreeToTerms}</span>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.marketingOptIn}
                  onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                Send me updates about new features and AI writing tips
              </label>
            </div>

            <div className="trial-benefits">
              <h4>Your 7-day Pro trial includes:</h4>
              <ul>
                <li><Check size={14} /> 1,000 AI requests</li>
                <li><Check size={14} /> Unlimited projects</li>
                <li><Check size={14} /> Advanced AI features</li>
                <li><Check size={14} /> Priority support</li>
              </ul>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Start Free Trial
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-link-btn"
              onClick={switchToLogin}
              disabled={isLoading}
            >
              Already have an account? <strong>Sign in</strong>
            </button>
          </form>

          <button
            className="auth-modal-close"
            onClick={() => setShowRegisterModal(false)}
            disabled={isLoading}
            aria-label="Close register modal"
          >
            ×
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};