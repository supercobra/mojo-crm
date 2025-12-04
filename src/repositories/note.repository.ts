import { Pool, PoolClient } from 'pg';
import { Note, CreateNoteInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class NoteRepository extends BaseRepository<Note> {
    constructor(pool: Pool) {
        super(pool, 'notes');
    }

    async create(data: CreateNoteInput, userId: string, client?: PoolClient): Promise<Note> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO notes (
          content, entity_type, entity_id, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

            const values = [
                data.content,
                data.entityType,
                data.entityId,
                userId,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToNote(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<Note | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM notes WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToNote(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<Note[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM notes WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.entityType && filters?.entityId) {
                query += ` AND entity_type = $${paramCount} AND entity_id = $${paramCount + 1}`;
                values.push(filters.entityType, filters.entityId);
                paramCount += 2;
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToNote(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findByEntity(entityType: string, entityId: string, client?: PoolClient): Promise<Note[]> {
        return this.findAll({ entityType, entityId }, undefined, client);
    }

    async update(
        id: string,
        data: Partial<CreateNoteInput>,
        userId: string,
        client?: PoolClient
    ): Promise<Note> {
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.content !== undefined) {
                updates.push(`content = $${paramCount}`);
                values.push(data.content);
                paramCount++;
            }

            if (updates.length === 0) {
                const existing = await this.findById(id, client);
                if (!existing) {
                    throw new NotFoundError('Note', id);
                }
                return existing;
            }

            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${paramCount}`);
            values.push(userId);
            paramCount++;

            values.push(id);

            const query = `
        UPDATE notes
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('Note', id);
            }

            return this.mapRowToNote(result.rows[0]);
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
            const query = 'DELETE FROM notes WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundError('Note', id);
            }
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToNote(row: any): Note {
        return {
            id: row.id,
            content: row.content,
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
