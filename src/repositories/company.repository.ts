import { Pool, PoolClient } from 'pg';
import { Company, CreateCompanyInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class CompanyRepository extends BaseRepository<Company> {
    constructor(pool: Pool) {
        super(pool, 'companies');
    }

    async create(data: CreateCompanyInput, userId: string, client?: PoolClient): Promise<Company> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO companies (
          name, address, custom_fields, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

            const values = [
                data.name,
                data.address ? JSON.stringify(data.address) : null,
                JSON.stringify(data.customFields || {}),
                userId,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToCompany(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<Company | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM companies WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToCompany(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<Company[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM companies WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.name) {
                query += ` AND name ILIKE $${paramCount}`;
                values.push(`%${filters.name}%`);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToCompany(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async update(
        id: string,
        data: Partial<CreateCompanyInput>,
        userId: string,
        client?: PoolClient
    ): Promise<Company> {
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.name !== undefined) {
                updates.push(`name = $${paramCount}`);
                values.push(data.name);
                paramCount++;
            }

            if (data.address !== undefined) {
                updates.push(`address = $${paramCount}`);
                values.push(data.address ? JSON.stringify(data.address) : null);
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
                    throw new NotFoundError('Company', id);
                }
                return existing;
            }

            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${paramCount}`);
            values.push(userId);
            paramCount++;

            values.push(id);

            const query = `
        UPDATE companies
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('Company', id);
            }

            return this.mapRowToCompany(result.rows[0]);
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
            // Cascade deletion is handled by database constraints
            // Deals will be deleted (CASCADE)
            // Contacts will have company_id set to NULL (SET NULL)
            const query = 'DELETE FROM companies WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                throw new NotFoundError('Company', id);
            }
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToCompany(row: any): Company {
        return {
            id: row.id,
            name: row.name,
            address: row.address || null,
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
