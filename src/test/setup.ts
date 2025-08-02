import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock IntersectionObserver
const intersectionObserverMock = () => ({
    observe: () => null,
    disconnect: () => null,
    unobserve: () => null,
});

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: intersectionObserverMock,
});

Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: intersectionObserverMock,
});

// Mock ResizeObserver
const resizeObserverMock = () => ({
    observe: () => null,
    disconnect: () => null,
    unobserve: () => null,
});

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: resizeObserverMock,
});

Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: resizeObserverMock,
});
