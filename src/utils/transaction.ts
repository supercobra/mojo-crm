import { Pool, PoolClient } from 'pg';
import { DatabaseError } from '../errors';

export class TransactionManager {
    constructor(private pool: Pool) { }

    async executeInTransaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error: any) {
            await client.query('ROLLBACK');
            throw new DatabaseError('Transaction failed', error);
        } finally {
            client.release();
        }
    }

    async withTransaction<T>(
        operation: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        return this.executeInTransaction(operation);
    }
}

// Helper function for standalone transaction execution
export async function withTransaction<T>(
    pool: Pool,
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error: any) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Example usage helper for common multi-entity operations
export interface TransactionContext {
    client: PoolClient;
    committed: boolean;
}

export async function beginTransaction(pool: Pool): Promise<TransactionContext> {
    const client = await pool.connect();
    await client.query('BEGIN');
    return { client, committed: false };
}

export async function commitTransaction(context: TransactionContext): Promise<void> {
    if (!context.committed) {
        await context.client.query('COMMIT');
        context.committed = true;
        context.client.release();
    }
}

export async function rollbackTransaction(context: TransactionContext): Promise<void> {
    if (!context.committed) {
        await context.client.query('ROLLBACK');
        context.committed = true;
        context.client.release();
    }
}
