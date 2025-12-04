// Configuration
export { getPool, closePool, loadDatabaseConfig } from './config/database';

// Models
export * from './models/entities';

// Errors
export * from './errors';

// Repositories
export { ContactRepository } from './repositories/contact.repository';
export { CompanyRepository } from './repositories/company.repository';
export { DealRepository } from './repositories/deal.repository';
export { TaskRepository } from './repositories/task.repository';
export { NoteRepository } from './repositories/note.repository';
export { CustomFieldDefinitionRepository } from './repositories/custom-field-definition.repository';
export { AuditLogRepository } from './repositories/audit-log.repository';

// Services
export { ContactService } from './services/contact.service';
export { CompanyService } from './services/company.service';
export { DealService } from './services/deal.service';
export { TaskService } from './services/task.service';
export { NoteService } from './services/note.service';
export { CustomFieldService } from './services/custom-field.service';

// Validation
export * from './validation/schemas';
export * from './validation/custom-fields';

// Utilities
export { TransactionManager, withTransaction } from './utils/transaction';
export { AuditHelper } from './utils/audit';
export * from './utils/error-handler';
