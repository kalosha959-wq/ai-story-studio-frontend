import { create } from 'zustand';

/**
 * Authentication Store
 * Manages user authentication state, subscription info, and feature access
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
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
}

export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due';
  trialEndsAt?: Date;
  features: string[];
  aiCredits: number;
  maxProjects: number;
  usageStats: {
    aiCreditsUsed: number;
    projectsCreated: number;
    storiesGenerated: number;
    imagesGenerated: number;
    audioGenerated: number;
  };
}

interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  showLoginModal: boolean;
  showRegisterModal: boolean;
  showSubscriptionModal: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    agreeToTerms: boolean;
    marketingOptIn: boolean;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setSubscription: (subscription: Subscription) => void;
  updateUsage: (type: keyof Subscription['usageStats'], increment?: number) => void;
  checkFeatureAccess: (feature: string) => boolean;
  hasCreditsRemaining: () => boolean;
  isTrialUser: () => boolean;
  getDaysUntilTrialEnd: () => number | null;
  
  // UI actions
  setShowLoginModal: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
  setShowSubscriptionModal: (show: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Initialization
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  subscription: null,
  token: null,
  isLoading: false,
  error: null,
  showLoginModal: false,
  showRegisterModal: false,
  showSubscriptionModal: false,

  // Authentication actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Import API client dynamically to avoid circular dependencies
      const { apiClient } = await import('../api/client');
      const response = await apiClient.authenticate(email, password);
      
      if (response.success && response.data) {
        const { user, subscription, token } = response.data;
        
        set({
          isAuthenticated: true,
          user,
          subscription,
          token,
          isLoading: false,
          showLoginModal: false,
        });

        // Store token in localStorage for persistence
        localStorage.setItem('ai-story-token', token);
        
        // Log authentication success
        console.log('User logged in successfully:', { userId: user.id, email: user.email });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { apiClient } = await import('../api/client');
      const response = await apiClient.register({
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`,
      });
      
      if (response.success && response.data) {
        const { user, subscription, token } = response.data;
        
        set({
          isAuthenticated: true,
          user,
          subscription,
          token,
          isLoading: false,
          showRegisterModal: false,
        });

        localStorage.setItem('ai-story-token', token);
        
        console.log('User registered successfully:', { userId: user.id, email: user.email });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('ai-story-token');
    
    // Import API client and clear authentication
    import('../api/client').then(({ apiClient }) => {
      apiClient.clearAuthentication();
    });
    
    set({
      isAuthenticated: false,
      user: null,
      subscription: null,
      token: null,
      error: null,
    });

    console.log('User logged out');
  },

  setUser: (user: User) => {
    set({ user });
  },

  setSubscription: (subscription: Subscription) => {
    set({ subscription });
  },

  updateUsage: (type: keyof Subscription['usageStats'], increment = 1) => {
    const { subscription } = get();
    if (!subscription) return;

    const updatedSubscription = {
      ...subscription,
      usageStats: {
        ...subscription.usageStats,
        [type]: subscription.usageStats[type] + increment,
      },
    };

    set({ subscription: updatedSubscription });

    // Log usage update
    console.log('Usage updated:', { type, increment, newValue: updatedSubscription.usageStats[type] });
  },

  checkFeatureAccess: (feature: string) => {
    const { subscription, isAuthenticated } = get();
    
    if (!isAuthenticated) return false;
    if (!subscription) return false;
    
    // Check if subscription includes the feature
    return subscription.features.includes(feature);
  },

  hasCreditsRemaining: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    return subscription.usageStats.aiCreditsUsed < subscription.aiCredits;
  },

  isTrialUser: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    return subscription.status === 'trial' && subscription.trialEndsAt ? new Date(subscription.trialEndsAt) > new Date() : false;
  },

  getDaysUntilTrialEnd: () => {
    const { subscription } = get();
    if (!subscription || subscription.status !== 'trial' || !subscription.trialEndsAt) {
      return null;
    }
    
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  },

  // UI actions
  setShowLoginModal: (show: boolean) => {
    set({ showLoginModal: show, error: null });
  },

  setShowRegisterModal: (show: boolean) => {
    set({ showRegisterModal: show, error: null });
  },

  setShowSubscriptionModal: (show: boolean) => {
    set({ showSubscriptionModal: show });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Initialize authentication from stored token
  initializeAuth: async () => {
    const token = localStorage.getItem('ai-story-token');
    if (!token) return;

    set({ isLoading: true });

    try {
      const { apiClient } = await import('../api/client');
      const response = await apiClient.getUserProfile();
      
      if (response.success && response.data) {
        const { user, subscription } = response.data;
        
        set({
          isAuthenticated: true,
          user,
          subscription,
          token,
          isLoading: false,
        });

        console.log('Authentication restored from token:', { userId: user.id });
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('ai-story-token');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('ai-story-token');
      set({ isLoading: false });
    }
  },
}));