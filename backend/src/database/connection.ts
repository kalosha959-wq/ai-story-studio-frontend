import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * Database Connection Manager
 * 
 * Handles PostgreSQL connection pooling, migrations,
 * and database health monitoring
 */

// Create connection pool using URL
const sql = postgres(config.database.url, {
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    max: config.database.maxConnections,
    idle_timeout: config.database.idleTimeout / 1000, // Convert to seconds
    connect_timeout: config.database.connectionTimeout / 1000, // Convert to seconds
    prepare: false, // Disable prepared statements for better compatibility
});

// Initialize Drizzle ORM
export const db = drizzle(sql);

/**
 * Initialize database connection and run migrations
 */
export async function initializeDatabase(): Promise<void> {
    try {
        logger.info('Initializing database connection...');

        // Test connection
        await sql`SELECT 1 as test`;
        logger.info('Database connection established successfully');

        // Run migrations
        logger.info('Running database migrations...');
        await migrate(db, { migrationsFolder: './src/database/migrations' });
        logger.info('Database migrations completed successfully');

    } catch (error) {
        logger.error('Failed to initialize database:', error);
        throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    connections: number;
    details?: string;
}> {
    const startTime = Date.now();

    try {
        // Test query
        const result = await sql`
      SELECT 
        current_database() as database,
        version() as version,
        current_timestamp as timestamp
    `;

        // Get connection info
        const connectionInfo = await sql`
      SELECT 
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections,
        count(*) filter (where state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

        const latency = Date.now() - startTime;

        return {
            status: 'healthy',
            latency,
            connections: parseInt(connectionInfo[0]?.total_connections || '0'),
            details: `Connected to ${result[0]?.database} - ${result[0]?.version}`,
        };

    } catch (error) {
        const latency = Date.now() - startTime;

        return {
            status: 'unhealthy',
            latency,
            connections: 0,
            details: error instanceof Error ? error.message : 'Unknown database error',
        };
    }
}

/**
 * Gracefully close database connections
 */
export async function closeDatabaseConnection(): Promise<void> {
    try {
        logger.info('Closing database connections...');
        await sql.end();
        logger.info('Database connections closed successfully');
    } catch (error) {
        logger.error('Error closing database connections:', error);
        throw error;
    }
}

/**
 * Execute raw SQL query with logging
 */
export async function executeRawQuery<T = any>(
    query: string,
    params: any[] = []
): Promise<T[]> {
    const startTime = Date.now();

    try {
        logger.debug('Executing SQL query', {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            paramsCount: params.length,
        });

        const result = await sql.unsafe(query, params);
        const duration = Date.now() - startTime;

        logger.debug('SQL query completed', {
            duration,
            rowCount: Array.isArray(result) ? result.length : 0,
        });

        return result as unknown as T[];

    } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('SQL query failed', {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
    }
}

/**
 * Database transaction wrapper
 */
export async function withTransaction<T>(
    callback: (tx: typeof db) => Promise<T>
): Promise<T> {
    return await db.transaction(callback);
}

// Export the SQL instance for direct queries when needed
export { sql };

// Database health check interval (5 minutes)
setInterval(async () => {
    try {
        const health = await checkDatabaseHealth();

        if (health.status === 'unhealthy') {
            logger.warn('Database health check failed', health);
        } else {
            logger.debug('Database health check passed', {
                latency: health.latency,
                connections: health.connections,
            });
        }
    } catch (error) {
        logger.error('Database health check error:', error);
    }
}, 5 * 60 * 1000);
