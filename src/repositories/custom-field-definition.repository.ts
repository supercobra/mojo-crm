import { Pool, PoolClient } from 'pg';
import { CustomFieldDefinition, CreateCustomFieldDefinitionInput, Pagination } from '../models/entities';
import { BaseRepository } from './base';
import { NotFoundError, DatabaseError, ConstraintViolationError } from '../errors';

export class CustomFieldDefinitionRepository extends BaseRepository<CustomFieldDefinition> {
    constructor(pool: Pool) {
        super(pool, 'custom_field_definitions');
    }

    async create(data: CreateCustomFieldDefinitionInput, userId: string, client?: PoolClient): Promise<CustomFieldDefinition> {
        const db = this.getClient(client);

        try {
            const query = `
        INSERT INTO custom_field_definitions (
          name, label, entity_type, field_type, enum_values, required, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

            const values = [
                data.name,
                data.label,
                data.entityType,
                data.fieldType,
                data.enumValues,
                data.required,
                userId
            ];

            const result = await db.query(query, values);
            return this.mapRowToCustomFieldDefinition(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findById(id: string, client?: PoolClient): Promise<CustomFieldDefinition | null> {
        const db = this.getClient(client);

        try {
            const query = 'SELECT * FROM custom_field_definitions WHERE id = $1';
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToCustomFieldDefinition(result.rows[0]);
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<CustomFieldDefinition[]> {
        const db = this.getClient(client);

        try {
            let query = 'SELECT * FROM custom_field_definitions WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.entityType) {
                query += ` AND entity_type = $${paramCount}`;
                values.push(filters.entityType);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToCustomFieldDefinition(row));
        } catch (error: any) {
            throw this.handleDatabaseError(error);
        }
    }

    async findByEntityType(entityType: string, client?: PoolClient): Promise<CustomFieldDefinition[]> {
        return this.findAll({ entityType }, undefined, client);
    }

    async update(
        id: string,
        data: Partial<CreateCustomFieldDefinitionInput>,
        userId: string,
        client?: PoolClient
    ): Promise<CustomFieldDefinition> {
        // Custom field definitions are typically immutable after creation
        // Only label and required status can be updated
        const db = this.getClient(client);

        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.label !== undefined) {
                updates.push(`label = $${paramCount}`);
                values.push(data.label);
                paramCount++;
            }

            if (data.required !== undefined) {
                updates.push(`required = $${paramCount}`);
                values.push(data.required);
                paramCount++;
            }

            if (updates.length === 0) {
                const existing = await this.findById(id, client);
                if (!existing) {
                    throw new NotFoundError('CustomFieldDefinition', id);
                }
                return existing;
            }

            values.push(id);

            const query = `
        UPDATE custom_field_definitions
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new NotFoundError('CustomFieldDefinition', id);
            }

            return this.mapRowToCustomFieldDefinition(result.rows[0]);
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
            // First, get the field definition to know which entity type it belongs to
            const definition = await this.findById(id, client);
            if (!definition) {
                throw new NotFoundError('CustomFieldDefinition', id);
            }

            // Delete the definition
            const query = 'DELETE FROM custom_field_definitions WHERE id = $1';
            await db.query(query, [id]);

            // Note: Custom field values are stored in JSONB fields on entities
            // We need to remove the field from all entities of the target type
            // This is handled by the service layer or through a separate cleanup process
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw this.handleDatabaseError(error);
        }
    }

    private mapRowToCustomFieldDefinition(row: any): CustomFieldDefinition {
        return {
            id: row.id,
            name: row.name,
            label: row.label,
            entityType: row.entity_type,
            fieldType: row.field_type,
            enumValues: row.enum_values || null,
            required: row.required,
            createdAt: new Date(row.created_at),
            createdBy: row.created_by
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
                'Unique constraint violation - field name already exists for this entity type',
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
