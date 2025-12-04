import { Pool, PoolConfig } from 'pg';

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    poolSize: number;
}

export function loadDatabaseConfig(): DatabaseConfig {
    const isTest = process.env.NODE_ENV === 'test';

    return {
        host: process.env[isTest ? 'TEST_DB_HOST' : 'DB_HOST'] || 'localhost',
        port: parseInt(process.env[isTest ? 'TEST_DB_PORT' : 'DB_PORT'] || '5432'),
        database: process.env[isTest ? 'TEST_DB_NAME' : 'DB_NAME'] || (isTest ? 'crm_test' : 'crm'),
        user: process.env[isTest ? 'TEST_DB_USER' : 'DB_USER'] || 'crm_user',
        password: process.env[isTest ? 'TEST_DB_PASSWORD' : 'DB_PASSWORD'] || '',
        ssl: process.env[isTest ? 'TEST_DB_SSL' : 'DB_SSL'] === 'true',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
    };
}

export function createPool(config: DatabaseConfig): Pool {
    const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: config.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };

    return new Pool(poolConfig);
}

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        const config = loadDatabaseConfig();
        pool = createPool(config);
    }
    return pool;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
