import { pool, query, withTransaction, checkDatabaseHealth, closeDatabasePool } from '../config/database';
import { redis, connectRedis, closeRedis, checkRedisHealth, sessionStore, idempotencyStore } from '../config/redis';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
    logger.info('Running database migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');

    // Create migrations tracking table if not exists
    await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Get list of migration files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        // Check if migration already executed
        const result = await query(
            'SELECT id FROM schema_migrations WHERE filename = $1',
            [file]
        );

        if (result.rows.length > 0) {
            logger.debug(`Migration ${file} already executed, skipping`);
            continue;
        }

        // Read and execute migration
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
            await query(sql);
            await query(
                'INSERT INTO schema_migrations (filename) VALUES ($1)',
                [file]
            );
            logger.info(`Migration ${file} executed successfully`);
        } catch (error) {
            logger.error(`Migration ${file} failed:`, error);
            throw error;
        }
    }

    logger.info('All migrations completed');
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
    try {
        // Test connection
        const isHealthy = await checkDatabaseHealth();
        if (!isHealthy) {
            throw new Error('Database connection failed');
        }
        logger.info('Database connection established');

        // Run migrations in development/production
        if (process.env.NODE_ENV !== 'test') {
            await runMigrations();
        }
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
}

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<void> {
    try {
        await connectRedis();
        const isHealthy = await checkRedisHealth();
        if (!isHealthy) {
            throw new Error('Redis connection failed');
        }
        logger.info('Redis connection established');
    } catch (error) {
        logger.error('Redis initialization failed:', error);
        throw error;
    }
}

/**
 * Graceful shutdown
 */
export async function closeConnections(): Promise<void> {
    await closeDatabasePool();
    await closeRedis();
}

// Export all database utilities
export {
    pool,
    query,
    withTransaction,
    checkDatabaseHealth,
    redis,
    sessionStore,
    idempotencyStore,
};
