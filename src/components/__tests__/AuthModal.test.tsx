import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../../components/AuthModal';

describe('AuthModal', () => {
    const mockOnClose = () => { };
    const mockOnAuthSuccess = () => { };

    it('should render login form by default', () => {
        render(
            <AuthModal
                isOpen={true}
                onClose={mockOnClose}
                onAuthSuccess={mockOnAuthSuccess}
            />
        );

        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should switch to register form when Sign Up tab is clicked', async () => {
        render(
            <AuthModal
                isOpen={true}
                onClose={mockOnClose}
                onAuthSuccess={mockOnAuthSuccess}
            />
        );

        const signUpTab = screen.getByRole('button', { name: /sign up/i });
        fireEvent.click(signUpTab);

        await waitFor(() => {
            expect(screen.getByText('Create Account')).toBeInTheDocument();
            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        });
    });

    it('should show validation error for invalid email', async () => {
        render(
            <AuthModal
                isOpen={true}
                onClose={mockOnClose}
                onAuthSuccess={mockOnAuthSuccess}
            />
        );

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /^sign in$/i });

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
    });

    it('should show password toggle functionality', () => {
        render(
            <AuthModal
                isOpen={true}
                onClose={mockOnClose}
                onAuthSuccess={mockOnAuthSuccess}
            />
        );

        const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
        const toggleButton = screen.getByRole('button', { name: /show password/i });

        expect(passwordInput.type).toBe('password');

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('password');
    });
});
