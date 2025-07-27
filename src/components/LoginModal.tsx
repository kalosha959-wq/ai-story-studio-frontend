import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import './Auth.css';

/**
 * Login Component
 * Handles user authentication with email and password
 */
export const LoginModal = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    setShowRegisterModal,
    login,
    isLoading,
    error,
    setError,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // Modal will close automatically on successful login
      setFormData({ email: '', password: '', rememberMe: false });
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

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
    setFormData({ email: '', password: '', rememberMe: false });
    setFieldErrors({});
    setError(null);
  };

  if (!showLoginModal) return null;

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay" onClick={() => setShowLoginModal(false)}>
        <motion.div
          className="auth-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="auth-modal-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue your creative journey</p>
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
                  placeholder="Enter your password"
                  className={fieldErrors.password ? 'error' : ''}
                  disabled={isLoading}
                  autoComplete="current-password"
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

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-link-btn"
              onClick={switchToRegister}
              disabled={isLoading}
            >
              Don't have an account? <strong>Create one now</strong>
            </button>

            <button
              type="button"
              className="auth-link-btn forgot-password"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </form>

          <button
            className="auth-modal-close"
            onClick={() => setShowLoginModal(false)}
            disabled={isLoading}
            aria-label="Close login modal"
          >
            ×
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};