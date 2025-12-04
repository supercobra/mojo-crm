import { Pool, PoolClient } from 'pg';
import { Deal, CreateDealInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class DealRepository extends BaseRepository<Deal> {
    constructor(pool: Pool) {
        super(pool, 'deals');
    }

    async create(data: CreateDealInput, userId: string, client?: PoolClient): Promise<Deal> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO deals (
          title, company_id, contact_id, value, currency, stage, probability, close_date, custom_fields, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

            const values = [
                data.title,
                data.companyId,
                data.contactId,
                data.value,
                data.currency || 'USD',
                data.stage,
                data.probability,
                data.closeDate,
                JSON.stringify(data.customFields || {}),
                userId,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToDeal(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<Deal | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM deals WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToDeal(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<Deal[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM deals WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.companyId) {
                query += ` AND company_id = $${paramCount}`;
                values.push(filters.companyId);
                paramCount++;
            }

            if (filters?.contactId !== undefined) {
                if (filters.contactId === null) {
                    query += ' AND contact_id IS NULL';
                } else {
                    query += ` AND contact_id = $${paramCount}`;
                    values.push(filters.contactId);
                    paramCount++;
                }
            }

            if (filters?.stage) {
                query += ` AND stage = $${paramCount}`;
                values.push(filters.stage);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToDeal(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findByCompany(companyId: string, client?: PoolClient): Promise<Deal[]> {
        return this.findAll({ companyId }, undefined, client);
    }

    async update(
        id: string,
        data: Partial<CreateDealInput>,
        userId: string,
        client?: PoolClient
    ): Promise<Deal> {
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.title !== undefined) {
                updates.push(`title = $${paramCount}`);
                values.push(data.title);
                paramCount++;
            }

            if (data.companyId !== undefined) {
                updates.push(`company_id = $${paramCount}`);
                values.push(data.companyId);
                paramCount++;
            }

            if (data.contactId !== undefined) {
                updates.push(`contact_id = $${paramCount}`);
                values.push(data.contactId);
                paramCount++;
            }

            if (data.value !== undefined) {
                updates.push(`value = $${paramCount}`);
                values.push(data.value);
                paramCount++;
            }

            if (data.currency !== undefined) {
                updates.push(`currency = $${paramCount}`);
                values.push(data.currency);
                paramCount++;
            }

            if (data.stage !== undefined) {
                updates.push(`stage = $${paramCount}`);
                values.push(data.stage);
                paramCount++;
            }

            if (data.probability !== undefined) {
                updates.push(`probability = $${paramCount}`);
                values.push(data.probability);
                paramCount++;
            }

            if (data.closeDate !== undefined) {
                updates.push(`close_date = $${paramCount}`);
                values.push(data.closeDate);
                paramCount++;
            }

            if (data.customFields !== undefined) {
                updates.push(`custom_fields = $${paramCount}`);
                values.push(JSON.stringify(data.customFields));
                paramCount++;
            }

            if (updates.length === 0) {
                const existing = await this.findById(id, client);
                if (!existing) {
                    throw new NotFoundError('Deal', id);
                }
                return existing;
            }

            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${paramCount}`);
            values.push(userId);
            paramCount++;

            values.push(id);

            const query = `
        UPDATE deals
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('Deal', id);
            }

            return this.mapRowToDeal(result.rows[0]);
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
            const query = 'DELETE FROM deals WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundError('Deal', id);
            }
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToDeal(row: any): Deal {
        return {
            id: row.id,
            title: row.title,
            companyId: row.company_id,
            contactId: row.contact_id,
            value: parseFloat(row.value),
            currency: row.currency,
            stage: row.stage,
            probability: row.probability,
            closeDate: row.close_date ? new Date(row.close_date) : null,
            customFields: row.custom_fields || {},
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
