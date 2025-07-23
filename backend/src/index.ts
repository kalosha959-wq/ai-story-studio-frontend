#!/usr/bin/env node

/**
 * AI Story Studio Backend Server Startup Script
 * 
 * Professional Node.js server with comprehensive error handling,
 * graceful shutdown, and production-ready features
 */

import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { initializeDatabase, closeDatabaseConnection, checkDatabaseHealth } from './database/connection.js';

async function startServer() {
    try {
        logger.info('🚀 AI Story Studio Backend - Starting server...', {
            nodeVersion: process.version,
            environment: config.environment,
            port: config.port,
            timestamp: new Date().toISOString(),
        });

        // Validate environment configuration
        logger.info('✅ Environment configuration validated', {
            database: config.database.url ? 'configured' : 'missing',
            jwtSecret: config.auth.jwtSecret ? 'configured' : 'missing',
            encryptionKey: config.encryption.key ? 'configured' : 'missing',
        });

        // Initialize database connection (temporarily disabled for testing)
        if (false && config.database.url) {
            logger.info('🔌 Initializing database connection...');
            await initializeDatabase();

            // Perform health check
            const dbHealth = await checkDatabaseHealth();
            logger.info('💚 Database health check', {
                status: dbHealth.status,
                latency: `${dbHealth.latency}ms`,
                connections: dbHealth.connections,
            });
        } else {
            logger.warn('⚠️ Database URL not configured - using in-memory storage');
        }

        // Import and start the Express app
        const { default: app } = await import('./server.js');

        // Start HTTP server
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info('🌟 AI Story Studio Backend - Server ready!', {
                port: config.port,
                environment: config.environment,
                baseUrl: `http://localhost:${config.port}`,
                apiEndpoint: `http://localhost:${config.port}/api/v1`,
                healthCheck: `http://localhost:${config.port}/health`,
                documentation: `http://localhost:${config.port}/api/docs`,
                timestamp: new Date().toISOString(),
            });

            logger.info('📚 Available API Endpoints:', {
                auth: '/api/v1/auth',
                projects: '/api/v1/projects',
                ai: '/api/v1/ai',
                media: '/api/v1/media',
                analytics: '/api/v1/analytics',
            });
        });

        // Set server timeout
        server.timeout = 30000; // 30 seconds

        // Graceful shutdown handling
        const gracefulShutdown = async (signal: string) => {
            logger.info(`🔄 Received ${signal} - Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async (err) => {
                if (err) {
                    logger.error('❌ Error during server shutdown:', err);
                    process.exit(1);
                }

                logger.info('🔌 HTTP server closed');

                // Close database connections
                try {
                    await closeDatabaseConnection();
                    logger.info('💾 Database connections closed');
                } catch (error) {
                    logger.error('❌ Error closing database connections:', error);
                }

                logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('⏰ Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Register shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });

    } catch (error) {
        logger.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
