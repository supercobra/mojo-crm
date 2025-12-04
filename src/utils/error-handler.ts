import { DatabaseError, ConstraintViolationError, ValidationError, NotFoundError } from '../errors';

export interface ErrorResponse {
    error: string;
    message: string;
    details?: any;
}

export function handleDatabaseError(error: any): Error {
    // PostgreSQL error codes
    if (error.code === '23503') {
        // Foreign key violation
        const detail = error.detail || '';
        let message = 'Foreign key constraint violation';

        if (detail.includes('company_id')) {
            message = 'Referenced company does not exist';
        } else if (detail.includes('contact_id')) {
            message = 'Referenced contact does not exist';
        }

        return new ConstraintViolationError(message, error.constraint || 'unknown');
    }

    if (error.code === '23505') {
        // Unique violation
        const detail = error.detail || '';
        let message = 'Unique constraint violation';

        if (detail.includes('email')) {
            message = 'Email address already exists';
        } else if (detail.includes('name')) {
            message = 'Name already exists';
        }

        return new ConstraintViolationError(message, error.constraint || 'unknown');
    }

    if (error.code === '23514') {
        // Check constraint violation
        const constraint = error.constraint || '';
        let message = 'Check constraint violation';

        if (constraint.includes('probability')) {
            message = 'Probability must be between 0 and 100';
        } else if (constraint.includes('status')) {
            message = 'Invalid status value';
        }

        return new ConstraintViolationError(message, error.constraint || 'unknown');
    }

    if (error.code === '23502') {
        // Not null violation
        const column = error.column || 'unknown';
        return new ConstraintViolationError(
            `Required field '${column}' cannot be null`,
            'not_null'
        );
    }

    if (error.code === '22P02') {
        // Invalid text representation (e.g., invalid UUID)
        return new ValidationError('Invalid data format', {
            format: ['Invalid UUID or data type format']
        });
    }

    return new DatabaseError('Database operation failed', error);
}

export function formatErrorResponse(error: Error): ErrorResponse {
    if (error instanceof ValidationError) {
        return {
            error: 'ValidationError',
            message: error.message,
            details: error.fields
        };
    }

    if (error instanceof NotFoundError) {
        return {
            error: 'NotFoundError',
            message: error.message,
            details: {
                entityType: error.entityType,
                entityId: error.entityId
            }
        };
    }

    if (error instanceof ConstraintViolationError) {
        return {
            error: 'ConstraintViolationError',
            message: error.message,
            details: {
                constraint: error.constraint
            }
        };
    }

    if (error instanceof DatabaseError) {
        return {
            error: 'DatabaseError',
            message: error.message,
            details: {
                originalError: error.originalError.message
            }
        };
    }

    // Unknown error
    return {
        error: 'UnknownError',
        message: error.message || 'An unexpected error occurred'
    };
}

export function logError(error: Error, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        name: error.name,
        message: error.message,
        stack: error.stack,
        context
    };

    // In production, this would send to a logging service
    console.error('Error occurred:', JSON.stringify(errorInfo, null, 2));
}
