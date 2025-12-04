import { PoolClient } from 'pg';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditAction } from '../models/entities';

export class AuditHelper {
    constructor(private auditLogRepository: AuditLogRepository) { }

    async logCreate(
        entityType: string,
        entityId: string,
        userId: string,
        entityData: any,
        client?: PoolClient
    ): Promise<void> {
        await this.auditLogRepository.createAuditLog(
            entityType,
            entityId,
            'create',
            userId,
            { created: entityData },
            client
        );
    }

    async logUpdate(
        entityType: string,
        entityId: string,
        userId: string,
        before: any,
        after: any,
        client?: PoolClient
    ): Promise<void> {
        const changes = this.calculateChanges(before, after);

        if (Object.keys(changes).length > 0) {
            await this.auditLogRepository.createAuditLog(
                entityType,
                entityId,
                'update',
                userId,
                changes,
                client
            );
        }
    }

    async logDelete(
        entityType: string,
        entityId: string,
        userId: string,
        entityData: any,
        client?: PoolClient
    ): Promise<void> {
        await this.auditLogRepository.createAuditLog(
            entityType,
            entityId,
            'delete',
            userId,
            { deleted: entityData },
            client
        );
    }

    private calculateChanges(before: any, after: any): Record<string, { before: any; after: any }> {
        const changes: Record<string, { before: any; after: any }> = {};

        // Get all keys from both objects
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

        for (const key of allKeys) {
            // Skip metadata fields
            if (['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].includes(key)) {
                continue;
            }

            const beforeValue = before[key];
            const afterValue = after[key];

            // Check if values are different
            if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
                changes[key] = {
                    before: beforeValue,
                    after: afterValue
                };
            }
        }

        return changes;
    }
}
