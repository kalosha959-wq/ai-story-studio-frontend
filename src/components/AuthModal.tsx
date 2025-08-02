import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { APIClient } from '../api/client';
import './AuthModal.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const apiClient = new APIClient();

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                email: '',
                password: '',
                name: '',
                confirmPassword: ''
            });
            setError('');
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen, authMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (authMode === 'register') {
            if (!formData.name.trim()) {
                setError('Name is required');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError('');

        try {
            let response;

            if (authMode === 'login') {
                response = await apiClient.authenticate(formData.email, formData.password);
            } else {
                response = await apiClient.register({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name
                });
            }

            if (response.success) {
                onAuthSuccess(response.data.user);
                onClose();
            } else {
                setError(response.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setError(authMode === 'login' ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="auth-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                onKeyDown={handleKeyPress}
                tabIndex={-1}
            >
                <motion.div
                    className="auth-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="auth-modal-title"
                >
                    <div className="auth-modal-header">
                        <h2 id="auth-modal-title">
                            {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="close-button"
                            aria-label="Close modal"
                            disabled={isLoading}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="auth-modal-content">
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                                onClick={() => setAuthMode('login')}
                                disabled={isLoading}
                            >
                                <LogIn size={16} />
                                Sign In
                            </button>
                            <button
                                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                                onClick={() => setAuthMode('register')}
                                disabled={isLoading}
                            >
                                <UserPlus size={16} />
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {authMode === 'register' && (
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">
                                        <User size={16} />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        disabled={isLoading}
                                        autoComplete="name"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    <Lock size={16} />
                                    Password
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {authMode === 'register' && (
                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label">
                                        <Lock size={16} />
                                        Confirm Password
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Confirm your password"
                                            disabled={isLoading}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isLoading}
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message" role="alert">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit-button"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="loading-spinner" />
                                        {authMode === 'login' ? 'Signing In...' : 'Creating Account...'}
                                    </>
                                ) : (
                                    <>
                                        {authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                                    </>
                                )}
                            </button>
                        </form>

                        {authMode === 'register' && (
                            <div className="auth-footer">
                                <p className="trial-info">
                                    🎉 <strong>7-day Pro trial</strong> included with your account!
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
