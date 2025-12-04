import { Pool, PoolClient } from 'pg';
import { Task, CreateTaskInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class TaskRepository extends BaseRepository<Task> {
    constructor(pool: Pool) {
        super(pool, 'tasks');
    }

    async create(data: CreateTaskInput, userId: string, client?: PoolClient): Promise<Task> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO tasks (
          description, due_date, assigned_to, status, entity_type, entity_id, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

            const values = [
                data.description,
                data.dueDate,
                data.assignedTo,
                data.status,
                data.entityType,
                data.entityId,
                userId,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToTask(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<Task | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM tasks WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToTask(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<Task[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM tasks WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.entityType && filters?.entityId) {
                query += ` AND entity_type = $${paramCount} AND entity_id = $${paramCount + 1}`;
                values.push(filters.entityType, filters.entityId);
                paramCount += 2;
            }

            if (filters?.assignedTo) {
                query += ` AND assigned_to = $${paramCount}`;
                values.push(filters.assignedTo);
                paramCount++;
            }

            if (filters?.status) {
                query += ` AND status = $${paramCount}`;
                values.push(filters.status);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToTask(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findByEntity(entityType: string, entityId: string, client?: PoolClient): Promise<Task[]> {
        return this.findAll({ entityType, entityId }, undefined, client);
    }

    async update(
        id: string,
        data: Partial<CreateTaskInput>,
        userId: string,
        client?: PoolClient
    ): Promise<Task> {
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.description !== undefined) {
                updates.push(`description = $${paramCount}`);
                values.push(data.description);
                paramCount++;
            }

            if (data.dueDate !== undefined) {
                updates.push(`due_date = $${paramCount}`);
                values.push(data.dueDate);
                paramCount++;
            }

            if (data.assignedTo !== undefined) {
                updates.push(`assigned_to = $${paramCount}`);
                values.push(data.assignedTo);
                paramCount++;
            }

            if (data.status !== undefined) {
                updates.push(`status = $${paramCount}`);
                values.push(data.status);
                paramCount++;
            }

            if (updates.length === 0) {
                const existing = await this.findById(id, client);
                if (!existing) {
                    throw new NotFoundError('Task', id);
                }
                return existing;
            }

            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${paramCount}`);
            values.push(userId);
            paramCount++;

            values.push(id);

            const query = `
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('Task', id);
            }

            return this.mapRowToTask(result.rows[0]);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    async delete(id: string, userId: string, client?: PoolClient): Promise<void> {
        const db = this.getClient(client);

        try {
            const query = 'DELETE FROM tasks WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundError('Task', id);
            }
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToTask(row: any): Task {
        return {
            id: row.id,
            description: row.description,
            dueDate: row.due_date ? new Date(row.due_date) : null,
            assignedTo: row.assigned_to,
            status: row.status,
            entityType: row.entity_type,
            entityId: row.entity_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }

    private handleDatabaseError(error: any): Error {
        if (error.code === '23503') {
            return new ConstraintViolationError(
                'Foreign key constraint violation',
                error.constraint || 'unknown'
            );
        }

        if (error.code === '23505') {
            return new ConstraintViolationError(
                'Unique constraint violation',
                error.constraint || 'unknown'
            );
        }

        if (error.code === '23514') {
            return new ConstraintViolationError(
                'Check constraint violation',
                error.constraint || 'unknown'
            );
        }

        return new DatabaseError('Database operation failed', error);
    }
}
