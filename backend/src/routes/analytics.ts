import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Analytics Routes
 * 
 * Provides insights and analytics for user activity,
 * story performance, and system metrics
 */

const router = Router();

// Analytics Data Types
interface UserActivity {
    userId: string;
    date: Date;
    projectsCreated: number;
    wordsWritten: number;
    aiRequestsUsed: number;
    sessionDuration: number;
    featuresUsed: string[];
}

interface ProjectAnalytics {
    projectId: string;
    title: string;
    wordCount: number;
    viewCount: number;
    collaboratorCount: number;
    aiGeneratedPercentage: number;
    completionStatus: number; // 0-100
    timeSpent: number; // minutes
    popularityScore: number;
}

interface SystemMetrics {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalWordsWritten: number;
    aiRequestsToday: number;
    serverUptime: number;
    responseTime: number;
    errorRate: number;
}

// Mock analytics data
const userActivities: UserActivity[] = [
    {
        userId: 'user_001',
        date: new Date('2024-01-20'),
        projectsCreated: 2,
        wordsWritten: 1543,
        aiRequestsUsed: 8,
        sessionDuration: 120,
        featuresUsed: ['ai-generation', 'character-creator', 'plot-generator'],
    },
    {
        userId: 'user_002',
        date: new Date('2024-01-20'),
        projectsCreated: 1,
        wordsWritten: 890,
        aiRequestsUsed: 5,
        sessionDuration: 85,
        featuresUsed: ['ai-generation', 'text-improvement'],
    },
];

const projectAnalytics: ProjectAnalytics[] = [
    {
        projectId: 'proj_001',
        title: 'The Digital Frontier',
        wordCount: 1250,
        viewCount: 45,
        collaboratorCount: 1,
        aiGeneratedPercentage: 35,
        completionStatus: 65,
        timeSpent: 180,
        popularityScore: 7.8,
    },
    {
        projectId: 'proj_002',
        title: 'Moonlight Sonata',
        wordCount: 890,
        viewCount: 23,
        collaboratorCount: 2,
        aiGeneratedPercentage: 20,
        completionStatus: 40,
        timeSpent: 95,
        popularityScore: 6.5,
    },
];

/**
 * GET /api/v1/analytics/dashboard
 * Get dashboard analytics overview
 */
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Mock dashboard metrics
    const dashboardData = {
        summary: {
            totalProjects: 12,
            totalWords: 28450,
            aiRequestsUsed: 156,
            activeCollaborations: 4,
            completedProjects: 3,
        },
        trends: {
            wordsWritten: {
                current: 3450,
                previous: 2890,
                change: 19.4,
                trend: 'up',
            },
            projectsCreated: {
                current: 5,
                previous: 3,
                change: 66.7,
                trend: 'up',
            },
            aiUsage: {
                current: 42,
                previous: 38,
                change: 10.5,
                trend: 'up',
            },
            userEngagement: {
                current: 8.2,
                previous: 7.6,
                change: 7.9,
                trend: 'up',
            },
        },
        charts: {
            dailyActivity: Array.from({ length: daysBack }, (_, i) => ({
                date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                words: Math.floor(Math.random() * 500) + 200,
                projects: Math.floor(Math.random() * 3) + 1,
                aiRequests: Math.floor(Math.random() * 15) + 5,
            })),
            genreDistribution: [
                { genre: 'Science Fiction', count: 5, percentage: 25 },
                { genre: 'Fantasy', count: 4, percentage: 20 },
                { genre: 'Romance', count: 3, percentage: 15 },
                { genre: 'Mystery', count: 3, percentage: 15 },
                { genre: 'Horror', count: 2, percentage: 10 },
                { genre: 'Other', count: 3, percentage: 15 },
            ],
            featureUsage: [
                { feature: 'AI Generation', usage: 85, trend: 'up' },
                { feature: 'Character Creator', usage: 62, trend: 'stable' },
                { feature: 'Plot Generator', usage: 45, trend: 'up' },
                { feature: 'Text Improvement', usage: 38, trend: 'down' },
                { feature: 'Collaboration', usage: 28, trend: 'up' },
            ],
        },
        topProjects: projectAnalytics
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, 5)
            .map(project => ({
                id: project.projectId,
                title: project.title,
                wordCount: project.wordCount,
                completion: project.completionStatus,
                popularity: project.popularityScore,
            })),
    };

    req.requestLogger?.info('Dashboard analytics retrieved', {
        timeframe,
        totalProjects: dashboardData.summary.totalProjects,
        totalWords: dashboardData.summary.totalWords,
    });

    res.json({
        success: true,
        message: 'Dashboard analytics retrieved successfully',
        data: {
            timeframe,
            dashboard: dashboardData,
            generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/analytics/projects
 * Get project-specific analytics
 */
router.get('/projects', asyncHandler(async (req: Request, res: Response) => {
    const { projectId, metric = 'all' } = req.query;

    let analytics = projectAnalytics;

    // Filter by specific project if requested
    if (projectId && typeof projectId === 'string') {
        analytics = analytics.filter(p => p.projectId === projectId);
    }

    // Add detailed metrics
    const detailedAnalytics = analytics.map(project => ({
        ...project,
        metrics: {
            productivity: {
                wordsPerSession: Math.round(project.wordCount / (project.timeSpent / 60)),
                aiEfficiency: project.aiGeneratedPercentage,
                collaborationIndex: project.collaboratorCount * 2.5,
            },
            engagement: {
                viewsPerDay: Math.round(project.viewCount / 7),
                shareCount: Math.floor(project.viewCount * 0.1),
                bookmarkCount: Math.floor(project.viewCount * 0.05),
            },
            quality: {
                readabilityScore: 7.5 + Math.random() * 2,
                originality: 100 - project.aiGeneratedPercentage,
                structureScore: 8.2,
            },
            timeline: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                wordsAdded: Math.floor(Math.random() * 200) + 50,
                timeSpent: Math.floor(Math.random() * 60) + 15,
                aiRequests: Math.floor(Math.random() * 5),
            })),
        },
    }));

    req.requestLogger?.info('Project analytics retrieved', {
        projectCount: analytics.length,
        specificProject: !!projectId,
        metric,
    });

    res.json({
        success: true,
        message: 'Project analytics retrieved successfully',
        data: {
            projects: detailedAnalytics,
            summary: {
                totalProjects: analytics.length,
                averageWordCount: Math.round(analytics.reduce((sum, p) => sum + p.wordCount, 0) / analytics.length),
                averageCompletion: Math.round(analytics.reduce((sum, p) => sum + p.completionStatus, 0) / analytics.length),
                totalViews: analytics.reduce((sum, p) => sum + p.viewCount, 0),
            },
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/analytics/usage
 * Get AI usage analytics
 */
router.get('/usage', asyncHandler(async (req: Request, res: Response) => {
    const { period = 'week' } = req.query;

    // Generate mock usage data
    const usageData = {
        aiRequests: {
            total: 1247,
            byModel: {
                'gpt-4': { requests: 623, tokens: 156780, cost: 4.72 },
                'gpt-3.5-turbo': { requests: 389, tokens: 97250, cost: 0.19 },
                'claude-3': { requests: 235, tokens: 58750, cost: 0.88 },
            },
            byFeature: {
                'text-generation': 567,
                'completion': 342,
                'character-creation': 189,
                'plot-generation': 98,
                'text-improvement': 51,
            },
            timeline: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                requests: Math.floor(Math.random() * 50) + 100,
                tokens: Math.floor(Math.random() * 5000) + 10000,
                cost: (Math.random() * 2 + 0.5).toFixed(2),
            })),
        },
        performance: {
            averageResponseTime: 2.3,
            successRate: 98.7,
            popularHours: [
                { hour: 9, usage: 85 },
                { hour: 14, usage: 92 },
                { hour: 19, usage: 78 },
                { hour: 21, usage: 65 },
            ],
            errorBreakdown: {
                'rate_limit': 12,
                'timeout': 8,
                'invalid_request': 3,
                'server_error': 2,
            },
        },
        insights: [
            'GPT-4 is your most-used model, accounting for 50% of requests',
            'Text generation is the most popular feature at 45% of usage',
            'Peak usage occurs around 2 PM daily',
            'Success rate has improved by 2.3% this week',
            'Average response time is 15% faster than last month',
        ],
    };

    req.requestLogger?.info('AI usage analytics retrieved', {
        period,
        totalRequests: usageData.aiRequests.total,
        successRate: usageData.performance.successRate,
    });

    res.json({
        success: true,
        message: 'AI usage analytics retrieved successfully',
        data: {
            period,
            usage: usageData,
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/analytics/performance
 * Get system performance metrics
 */
router.get('/performance', asyncHandler(async (req: Request, res: Response) => {
    const performanceMetrics = {
        system: {
            uptime: 99.8,
            responseTime: {
                average: 145,
                p95: 290,
                p99: 450,
            },
            throughput: {
                requestsPerSecond: 23.5,
                requestsPerMinute: 1410,
                requestsPerHour: 84600,
            },
            errorRates: {
                '4xx': 2.1,
                '5xx': 0.3,
                total: 2.4,
            },
        },
        database: {
            connectionPool: {
                active: 8,
                idle: 12,
                total: 20,
            },
            queryPerformance: {
                averageTime: 23,
                slowQueries: 3,
                indexHitRatio: 98.2,
            },
        },
        cache: {
            hitRatio: 87.3,
            memoryUsage: 64.2,
            evictions: 145,
        },
        external: {
            aiServices: {
                openai: { latency: 1200, availability: 99.9 },
                anthropic: { latency: 950, availability: 99.7 },
                stability: { latency: 2300, availability: 98.9 },
            },
            storage: {
                availability: 99.99,
                latency: 45,
                bandwidth: '1.2 GB/s',
            },
        },
        alerts: [
            {
                level: 'warning',
                message: 'Database connection pool utilization above 80%',
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
            },
            {
                level: 'info',
                message: 'Cache hit ratio improved by 3% this hour',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
            },
        ],
    };

    req.requestLogger?.info('Performance metrics retrieved', {
        uptime: performanceMetrics.system.uptime,
        responseTime: performanceMetrics.system.responseTime.average,
        errorRate: performanceMetrics.system.errorRates.total,
    });

    res.json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: {
            performance: performanceMetrics,
            healthStatus: 'healthy',
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * GET /api/v1/analytics/users
 * Get user behavior analytics
 */
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
    const userAnalytics = {
        overview: {
            totalUsers: 1247,
            activeUsers: 892,
            newUsersThisWeek: 63,
            retentionRate: 78.5,
        },
        engagement: {
            averageSessionDuration: 42, // minutes
            averageProjectsPerUser: 3.2,
            averageWordsPerUser: 2840,
            featuresAdoptionRate: {
                'ai-generation': 95.2,
                'collaboration': 34.7,
                'media-upload': 67.8,
                'export': 45.3,
            },
        },
        activity: {
            peakHours: [
                { hour: 9, activeUsers: 234 },
                { hour: 14, activeUsers: 298 },
                { hour: 19, activeUsers: 267 },
                { hour: 21, activeUsers: 189 },
            ],
            weeklyPattern: [
                { day: 'Monday', activity: 85 },
                { day: 'Tuesday', activity: 92 },
                { day: 'Wednesday', activity: 88 },
                { day: 'Thursday', activity: 95 },
                { day: 'Friday', activity: 78 },
                { day: 'Saturday', activity: 45 },
                { day: 'Sunday', activity: 52 },
            ],
        },
        demographics: {
            experienceLevel: {
                'beginner': 38.2,
                'intermediate': 45.7,
                'advanced': 16.1,
            },
            primaryGoals: {
                'creative-writing': 67.8,
                'professional-content': 23.4,
                'educational': 8.8,
            },
        },
        cohortAnalysis: Array.from({ length: 8 }, (_, i) => ({
            week: i + 1,
            newUsers: Math.floor(Math.random() * 50) + 20,
            retained: Math.floor((Math.random() * 30 + 40) * (50 - i * 3) / 100),
            retentionRate: Math.round((40 - i * 2) + Math.random() * 10),
        })),
    };

    req.requestLogger?.info('User analytics retrieved', {
        totalUsers: userAnalytics.overview.totalUsers,
        activeUsers: userAnalytics.overview.activeUsers,
        retentionRate: userAnalytics.overview.retentionRate,
    });

    res.json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: {
            users: userAnalytics,
        },
        timestamp: new Date().toISOString(),
    });
}));

/**
 * POST /api/v1/analytics/track
 * Track custom analytics event
 */
router.post('/track', asyncHandler(async (req: Request, res: Response) => {
    const {
        event,
        properties = {},
        userId = 'anonymous',
        sessionId,
    } = req.body;

    if (!event) {
        throw new Error('Event name is required');
    }

    // In a real implementation, this would store the event in analytics database
    const trackedEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event,
        properties,
        userId,
        sessionId,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
    };

    req.requestLogger?.info('Analytics event tracked', {
        event: trackedEvent.event,
        userId: trackedEvent.userId,
        propertiesCount: Object.keys(properties).length,
    });

    res.json({
        success: true,
        message: 'Analytics event tracked successfully',
        data: {
            eventId: trackedEvent.id,
            event: trackedEvent.event,
            timestamp: trackedEvent.timestamp,
        },
        timestamp: new Date().toISOString(),
    });
}));

export default router;
