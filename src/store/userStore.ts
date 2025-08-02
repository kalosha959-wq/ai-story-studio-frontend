import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    subscription?: {
        plan: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'canceled' | 'expired';
        expiresAt?: Date;
    };
    preferences?: {
        theme?: 'light' | 'dark' | 'auto';
        aiModel?: 'gpt-4' | 'claude-3' | 'gemini-pro';
        autoSave?: boolean;
    };
}

interface UserState {
    // User data
    user: User | null;
    isAuthenticated: boolean;

    // UI state
    showAuthModal: boolean;

    // Actions
    setUser: (user: User | null) => void;
    logout: () => void;
    updateUserProfile: (updates: Partial<User>) => void;

    // UI Actions
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            showAuthModal: false,

            // Actions
            setUser: (user) => {
                set({
                    user,
                    isAuthenticated: !!user,
                    showAuthModal: false // Close modal on successful auth
                });
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    showAuthModal: false
                });

                // Clear any stored tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            },

            updateUserProfile: (updates) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: {
                            ...currentUser,
                            ...updates
                        }
                    });
                }
            },

            // UI Actions
            openAuthModal: () => set({ showAuthModal: true }),
            closeAuthModal: () => set({ showAuthModal: false }),
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);
