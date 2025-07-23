import { EncryptionService } from '../utils/encryption';

/**
 * AI Story Studio API Client
 * 
 * Secure, encrypted communication with backend services
 * Handles authentication, rate limiting, and error recovery
 */

const API_BASE_URL = process.env.VITE_API_URL || 'https://api.ai-story-studio.com';
const API_VERSION = 'v1';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    requestId: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class APIClient {
    private baseURL: string;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private requestQueue: Map<string, Promise<any>> = new Map();

    constructor() {
        this.baseURL = `${API_BASE_URL}/${API_VERSION}`;
        this.loadTokensFromStorage();
    }

    /**
     * Load authentication tokens from secure storage
     */
    private loadTokensFromStorage(): void {
        try {
            const tokens = EncryptionService.getSecureItem<AuthTokens>('ai-story-tokens');
            if (tokens && tokens.expiresAt > Date.now()) {
                this.accessToken = tokens.accessToken;
                this.refreshToken = tokens.refreshToken;
            }
        } catch (error) {
            console.warn('Failed to load tokens from storage:', error);
        }
    }

    /**
     * Save authentication tokens to secure storage
     */
    private saveTokensToStorage(tokens: AuthTokens): void {
        try {
            EncryptionService.setSecureItem('ai-story-tokens', tokens);
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
        } catch (error) {
            console.error('Failed to save tokens to storage:', error);
        }
    }

    /**
     * Create request headers with authentication and security
     */
    private createHeaders(includeAuth: boolean = true): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Version': '1.1.0',
            'X-Platform': 'web',
            'X-Request-ID': crypto.randomUUID(),
            'X-Timestamp': Date.now().toString()
        };

        if (includeAuth && this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        return headers;
    }

    /**
     * Make authenticated API request with automatic retry and encryption
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        retryCount: number = 0
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const maxRetries = 3;

        // Check for duplicate requests and deduplicate
        const requestKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body)}`;
        if (this.requestQueue.has(requestKey)) {
            return this.requestQueue.get(requestKey);
        }

        const requestPromise = (async (): Promise<ApiResponse<T>> => {
            try {
                // Encrypt request body if present
                if (options.body && typeof options.body === 'string') {
                    const encryptedBody = EncryptionService.encrypt(options.body);
                    options.body = JSON.stringify({ encrypted: encryptedBody });
                }

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...this.createHeaders(),
                        ...options.headers
                    }
                });

                // Handle authentication errors
                if (response.status === 401 && this.refreshToken && retryCount === 0) {
                    await this.refreshAccessToken();
                    return this.makeRequest<T>(endpoint, options, retryCount + 1);
                }

                const responseData = await response.json();

                // Decrypt response data if encrypted
                if (responseData.encrypted) {
                    const decryptedData = EncryptionService.decrypt(responseData.encrypted);
                    responseData.data = JSON.parse(decryptedData);
                    delete responseData.encrypted;
                }

                if (!response.ok) {
                    throw new APIError(
                        responseData.message || 'Request failed',
                        response.status,
                        responseData.code || 'UNKNOWN_ERROR',
                        responseData.details
                    );
                }

                return responseData;
            } catch (error) {
                // Retry logic for network errors
                if (retryCount < maxRetries && error instanceof TypeError) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    return this.makeRequest<T>(endpoint, options, retryCount + 1);
                }
                throw error;
            } finally {
                this.requestQueue.delete(requestKey);
            }
        })();

        this.requestQueue.set(requestKey, requestPromise);
        return requestPromise;
    }

    /**
     * Refresh access token using refresh token
     */
    private async refreshAccessToken(): Promise<void> {
        if (!this.refreshToken) {
            throw new APIError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: this.createHeaders(false),
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (!response.ok) {
                throw new APIError('Token refresh failed', response.status, 'REFRESH_FAILED');
            }

            const data = await response.json();
            this.saveTokensToStorage(data.tokens);
        } catch (error) {
            // Clear invalid tokens
            this.clearAuthentication();
            throw error;
        }
    }

    /**
     * Clear authentication data
     */
    public clearAuthentication(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('ai-story-tokens');
    }

    /**
     * Authenticate user with email and password
     */
    public async authenticate(email: string, password: string): Promise<any> {
        const hashedPassword = EncryptionService.generateHash(password);

        const response = await this.makeRequest<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: hashedPassword })
        });

        if (response.success && response.data.tokens) {
            this.saveTokensToStorage(response.data.tokens);
        }

        return response;
    }

    /**
     * Register new user account
     */
    public async register(userData: {
        email: string;
        password: string;
        name: string;
        preferences?: any;
    }): Promise<any> {
        const hashedPassword = EncryptionService.generateHash(userData.password);

        return this.makeRequest<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                ...userData,
                password: hashedPassword
            })
        });
    }

    /**
     * Get user profile information
     */
    public async getUserProfile(): Promise<any> {
        return this.makeRequest<any>('/user/profile');
    }

    /**
     * Update user profile
     */
    public async updateUserProfile(profileData: any): Promise<any> {
        return this.makeRequest<any>('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    /**
     * Create new cinematic project
     */
    public async createProject(projectData: {
        title: string;
        genre: string;
        description?: string;
    }): Promise<any> {
        return this.makeRequest<any>('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    /**
     * Get all user projects
     */
    public async getProjects(): Promise<any> {
        return this.makeRequest<any>('/projects');
    }

    /**
     * Get specific project details
     */
    public async getProject(projectId: string): Promise<any> {
        return this.makeRequest<any>(`/projects/${projectId}`);
    }

    /**
     * Update project
     */
    public async updateProject(projectId: string, projectData: any): Promise<any> {
        return this.makeRequest<any>(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    /**
     * Delete project
     */
    public async deleteProject(projectId: string): Promise<any> {
        return this.makeRequest<any>(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Generate AI story content
     */
    public async generateStory(prompt: string, options?: {
        genre?: string;
        length?: 'short' | 'medium' | 'long';
        style?: string;
    }): Promise<any> {
        return this.makeRequest<any>('/ai/generate/story', {
            method: 'POST',
            body: JSON.stringify({ prompt, options })
        });
    }

    /**
     * Generate storyboard frames
     */
    public async generateStoryboard(sceneData: {
        description: string;
        style?: string;
        aspectRatio?: string;
        frameCount?: number;
    }): Promise<any> {
        return this.makeRequest<any>('/ai/generate/storyboard', {
            method: 'POST',
            body: JSON.stringify(sceneData)
        });
    }

    /**
     * Generate character designs
     */
    public async generateCharacter(characterData: {
        description: string;
        style?: string;
        variations?: number;
    }): Promise<any> {
        return this.makeRequest<any>('/ai/generate/character', {
            method: 'POST',
            body: JSON.stringify(characterData)
        });
    }

    /**
     * Generate video from storyboard
     */
    public async generateVideo(projectId: string, options?: {
        quality?: 'draft' | 'standard' | 'high';
        duration?: number;
    }): Promise<any> {
        return this.makeRequest<any>(`/ai/generate/video/${projectId}`, {
            method: 'POST',
            body: JSON.stringify(options)
        });
    }

    /**
     * Get generation status
     */
    public async getGenerationStatus(jobId: string): Promise<any> {
        return this.makeRequest<any>(`/ai/status/${jobId}`);
    }

    /**
     * Upload and process media files
     */
    public async uploadMedia(file: File, projectId?: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) {
            formData.append('projectId', projectId);
        }

        return this.makeRequest<any>('/media/upload', {
            method: 'POST',
            body: formData,
            headers: {
                ...this.createHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    /**
     * Get platform analytics (for admin users)
     */
    public async getAnalytics(dateRange?: {
        start: string;
        end: string;
    }): Promise<any> {
        const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
        return this.makeRequest<any>(`/analytics${params}`);
    }

    /**
     * Health check endpoint
     */
    public async healthCheck(): Promise<any> {
        return this.makeRequest<any>('/health');
    }
}

// Export singleton instance
export const apiClient = new APIClient();
