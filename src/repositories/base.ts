import { Pool, PoolClient } from 'pg';

export interface Repository<T> {
    create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, userId: string, client?: PoolClient): Promise<T>;
    findById(id: string, client?: PoolClient): Promise<T | null>;
    findAll(filters?: Record<string, any>, pagination?: { limit: number; offset: number }, client?: PoolClient): Promise<T[]>;
    update(id: string, data: Partial<T>, userId: string, client?: PoolClient): Promise<T>;
    delete(id: string, userId: string, client?: PoolClient): Promise<void>;
}

export abstract class BaseRepository<T> implements Repository<T> {
    constructor(protected pool: Pool, protected tableName: string) { }

    protected getClient(client?: PoolClient): Pool | PoolClient {
        return client || this.pool;
    }

    abstract create(data: any, userId: string, client?: PoolClient): Promise<T>;
    abstract findById(id: string, client?: PoolClient): Promise<T | null>;
    abstract findAll(filters?: Record<string, any>, pagination?: { limit: number; offset: number }, client?: PoolClient): Promise<T[]>;
    abstract update(id: string, data: Partial<T>, userId: string, client?: PoolClient): Promise<T>;
    abstract delete(id: string, userId: string, client?: PoolClient): Promise<void>;
}
