import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { config } from './index';
import { logger } from '../utils/logger';

const poolConfig: PoolConfig = {
    connectionString: config.database.url,
    min: config.database.pool.min,
    max: config.database.pool.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
};

export const pool = new Pool(poolConfig);

// Connection event handlers
pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error:', err);
});

pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
});

// Query helper with logging
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
        const result = await pool.query<T>(text, params);
        const duration = Date.now() - start;
        logger.debug(`Query executed in ${duration}ms`, {
            query: text.substring(0, 100),
            rows: result.rowCount
        });
        return result;
    } catch (error) {
        logger.error('Database query error:', { query: text, error });
        throw error;
    }
}

// Transaction helper
export async function withTransaction<T>(
    callback: (client: Pool) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client as unknown as Pool);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (error) {
        logger.error('Database health check failed:', error);
        return false;
    }
}

// Graceful shutdown
export async function closeDatabasePool(): Promise<void> {
    logger.info('Closing database pool...');
    await pool.end();
    logger.info('Database pool closed');
}
