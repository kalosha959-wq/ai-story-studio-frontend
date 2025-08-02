import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserStore } from '../userStore';

describe('UserStore', () => {
    beforeEach(() => {
        // Reset the store before each test
        useUserStore.getState().logout();
    });

    it('should initialize with no user', () => {
        const { result } = renderHook(() => useUserStore());

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.showAuthModal).toBe(false);
    });

    it('should open and close auth modal', () => {
        const { result } = renderHook(() => useUserStore());

        act(() => {
            result.current.openAuthModal();
        });

        expect(result.current.showAuthModal).toBe(true);

        act(() => {
            result.current.closeAuthModal();
        });

        expect(result.current.showAuthModal).toBe(false);
    });

    it('should set user and mark as authenticated', () => {
        const { result } = renderHook(() => useUserStore());

        const mockUser = {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            subscription: {
                plan: 'pro' as const,
                status: 'active' as const
            }
        };

        act(() => {
            result.current.setUser(mockUser);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.showAuthModal).toBe(false);
    });

    it('should logout and clear user data', () => {
        const { result } = renderHook(() => useUserStore());

        const mockUser = {
            id: '1',
            name: 'Test User',
            email: 'test@example.com'
        };

        act(() => {
            result.current.setUser(mockUser);
        });

        expect(result.current.isAuthenticated).toBe(true);

        act(() => {
            result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.showAuthModal).toBe(false);
    });

    it('should update user profile', () => {
        const { result } = renderHook(() => useUserStore());

        const mockUser = {
            id: '1',
            name: 'Test User',
            email: 'test@example.com'
        };

        act(() => {
            result.current.setUser(mockUser);
        });

        act(() => {
            result.current.updateUserProfile({
                name: 'Updated User',
                preferences: {
                    theme: 'dark'
                }
            });
        });

        expect(result.current.user?.name).toBe('Updated User');
        expect(result.current.user?.preferences?.theme).toBe('dark');
        expect(result.current.user?.email).toBe('test@example.com'); // Should remain unchanged
    });
});
