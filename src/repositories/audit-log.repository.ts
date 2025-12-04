import { Pool, PoolClient } from 'pg';
import { AuditLog, AuditAction, Pagination } from '../models/entities';
import { DatabaseError } from '../errors';

export class AuditLogRepository {
    constructor(private pool: Pool) { }

    async createAuditLog(
        entityType: string,
        entityId: string,
        action: AuditAction,
        userId: string,
        changes: Record<string, any> | null = null,
        client?: PoolClient
    ): Promise<AuditLog> {
        const db = client || this.pool;

        try {
            const query = `
        INSERT INTO audit_logs (
          entity_type, entity_id, action, user_id, changes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

            const values = [
                entityType,
                entityId,
                action,
                userId,
                changes ? JSON.stringify(changes) : null
            ];

            const result = await db.query(query, values);
            return this.mapRowToAuditLog(result.rows[0]);
        } catch (error: any) {
            throw new DatabaseError('Failed to create audit log', error);
        }
    }

    async findByEntity(
        entityType: string,
        entityId: string,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<AuditLog[]> {
        const db = client || this.pool;

        try {
            let query = 'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY timestamp DESC';
            const values: any[] = [entityType, entityId];

            if (pagination) {
                query += ' LIMIT $3 OFFSET $4';
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToAuditLog(row));
        } catch (error: any) {
            throw new DatabaseError('Failed to query audit logs', error);
        }
    }

    async findByUser(
        userId: string,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<AuditLog[]> {
        const db = client || this.pool;

        try {
            let query = 'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC';
            const values: any[] = [userId];

            if (pagination) {
                query += ' LIMIT $2 OFFSET $3';
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToAuditLog(row));
        } catch (error: any) {
            throw new DatabaseError('Failed to query audit logs', error);
        }
    }

    async findAll(
        filters?: Record<string, any>,
        pagination?: Pagination,
        client?: PoolClient
    ): Promise<AuditLog[]> {
        const db = client || this.pool;

        try {
            let query = 'SELECT * FROM audit_logs WHERE 1=1';
            const values: any[] = [];
            let paramCount = 1;

            if (filters?.entityType) {
                query += ` AND entity_type = $${paramCount}`;
                values.push(filters.entityType);
                paramCount++;
            }

            if (filters?.action) {
                query += ` AND action = $${paramCount}`;
                values.push(filters.action);
                paramCount++;
            }

            if (filters?.userId) {
                query += ` AND user_id = $${paramCount}`;
                values.push(filters.userId);
                paramCount++;
            }

            query += ' ORDER BY timestamp DESC';

            if (pagination) {
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                values.push(pagination.limit, pagination.offset);
            }

            const result = await db.query(query, values);
            return result.rows.map(row => this.mapRowToAuditLog(row));
        } catch (error: any) {
            throw new DatabaseError('Failed to query audit logs', error);
        }
    }

    private mapRowToAuditLog(row: any): AuditLog {
        return {
            id: row.id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            action: row.action,
            userId: row.user_id,
            changes: row.changes || null,
            timestamp: new Date(row.timestamp)
        };
    }
}
