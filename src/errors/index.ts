export class ValidationError extends Error {
    constructor(
        message: string,
        public fields: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class NotFoundError extends Error {
    constructor(
        public entityType: string,
        public entityId: string
    ) {
        super(`${entityType} with id ${entityId} not found`);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class DatabaseError extends Error {
    constructor(
        message: string,
        public originalError: Error
    ) {
        super(message);
        this.name = 'DatabaseError';
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

export class ConstraintViolationError extends Error {
    constructor(
        message: string,
        public constraint: string
    ) {
        super(message);
        this.name = 'ConstraintViolationError';
        Object.setPrototypeOf(this, ConstraintViolationError.prototype);
    }
}
