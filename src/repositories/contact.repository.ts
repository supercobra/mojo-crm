import { Pool, PoolClient } from 'pg';
import { Contact, CreateContactInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class ContactRepository extends BaseRepository<Contact> {
    constructor(pool: Pool) {
        super(pool, 'contacts');
    }

    async create(data: CreateContactInput, userId: string, client?: PoolClient): Promise<Contact> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO contacts (
          first_name, last_name, emails, phones, company_id, custom_fields, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

            const values = [
                data.firstName,
                data.lastName,
                data.emails || [],
                data.phones || [],
                data.companyId,
                JSON.stringify(data.customFields || {}),
                userId,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToContact(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<Contact | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM contacts WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToContact(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<Contact[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM contacts WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.companyId !== undefined) {
                if (filters.companyId === null) {
                    query += ' AND company_id IS NULL';
                } else {
                    query += ` AND company_id = $${paramCount}`;
                    values.push(filters.companyId);
                    paramCount++;
                }
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToContact(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findByCompany(companyId: string, client?: PoolClient): Promise<Contact[]> {
        return this.findAll({ companyId }, undefined, client);
    }

    async update(
        id: string,
        data: Partial<CreateContactInput>,
        userId: string,
        client?: PoolClient
    ): Promise<Contact> {
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.firstName !== undefined) {
                updates.push(`first_name = $${paramCount}`);
                values.push(data.firstName);
                paramCount++;
            }

            if (data.lastName !== undefined) {
                updates.push(`last_name = $${paramCount}`);
                values.push(data.lastName);
                paramCount++;
            }

            if (data.emails !== undefined) {
                updates.push(`emails = $${paramCount}`);
                values.push(data.emails);
                paramCount++;
            }

            if (data.phones !== undefined) {
                updates.push(`phones = $${paramCount}`);
                values.push(data.phones);
                paramCount++;
            }

            if (data.companyId !== undefined) {
                updates.push(`company_id = $${paramCount}`);
                values.push(data.companyId);
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
                    throw new NotFoundError('Contact', id);
                }
                return existing;
            }

            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${paramCount}`);
            values.push(userId);
            paramCount++;

            values.push(id);

            const query = `
        UPDATE contacts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('Contact', id);
            }

            return this.mapRowToContact(result.rows[0]);
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
            const query = 'DELETE FROM contacts WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundError('Contact', id);
            }
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToContact(row: any): Contact {
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            emails: row.emails || [],
            phones: row.phones || [],
            companyId: row.company_id,
            customFields: row.custom_fields || {},
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }

    private handleDatabaseError(error: any): Error {
        // PostgreSQL error codes
        if (error.code === '23503') {
            // Foreign key violation
            return new ConstraintViolationError(
                'Foreign key constraint violation',
                error.constraint || 'unknown'
            );
        }

        if (error.code === '23505') {
            // Unique violation
            return new ConstraintViolationError(
                'Unique constraint violation',
                error.constraint || 'unknown'
            );
        }

        if (error.code === '23514') {
            // Check constraint violation
            return new ConstraintViolationError(
                'Check constraint violation',
                error.constraint || 'unknown'
            );
        }

        return new DatabaseError('Database operation failed', error);
    }
}
