# Design Document: Core Data Models

## Overview

The core data models form the foundation of the CRM system, providing structured entities for Contacts, Companies, Deals, Tasks, and Notes. The architecture follows a layered approach with clear separation between data access (repositories), business logic (services), and API layers. The system uses PostgreSQL for persistence, TypeScript for type safety, and supports extensibility through custom fields stored as JSONB.

The design prioritizes:

- Clean separation of concerns using repository pa
- Type safety throughout the stack
- Performance with proper indexing for 10,000+ records
- Extensibility through custom fields
- Audit logging for accountability

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         API Layer (Future)          │
│     (REST + GraphQL endpoints)      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Service Layer               │
│   (Business logic & validation)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Repository Layer              │
│    (Data access & persistence)      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│   (Tables, indexes, constraints)    │
└─────────────────────────────────────┘
```

### Technology Stack

- **Language**: TypeScript (Node.js runtime)
- **Database**: PostgreSQL 14+
- **ORM/Query Builder**: node-postgres (pg) with custom repository layer
- **Validation**: Zod for runtime schema validation
- **Testing**: Jest for unit tests, fast-check for property-based testing

### Database Connection

- Connection pooling using pg.Pool
- Environment-based configuration
- Graceful connection handling with retry logic
- Transaction support for multi-step operations

## Components and Interfaces

### Entity Models

#### Contact

```typescript
interface Contact {
  id: string; // UUID primary key
  firstName: string; // Required
  lastName: string; // Required
  emails: string[]; // Array of email addresses
  phones: string[]; // Array of phone numbers
  companyId: string | null; // Foreign key to Company
  customFields: Record<string, any>; // JSONB for custom fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  updatedBy: string; // User ID
}
```

#### Company

```typescript
interface Company {
  id: string; // UUID primary key
  name: string; // Required, indexed
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  customFields: Record<string, any>; // JSONB for custom fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### Deal

```typescript
interface Deal {
  id: string; // UUID primary key
  title: string; // Required
  companyId: string; // Foreign key to Company (required)
  contactId: string | null; // Foreign key to Contact (optional)
  value: number; // Decimal for currency
  currency: string; // ISO currency code (default: USD)
  stage: string; // Pipeline stage
  probability: number; // 0-100
  closeDate: Date | null; // Expected close date
  customFields: Record<string, any>; // JSONB for custom fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### Task

```typescript
interface Task {
  id: string; // UUID primary key
  description: string; // Required
  dueDate: Date | null;
  assignedTo: string | null; // User ID
  status: "open" | "closed";
  entityType: string; // 'contact', 'company', 'deal', etc.
  entityId: string; // ID of the entity this task is attached to
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### Note

```typescript
interface Note {
  id: string; // UUID primary key
  content: string; // Free-form text
  entityType: string; // 'contact', 'company', 'deal', etc.
  entityId: string; // ID of the entity this note is attached to
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### CustomFieldDefinition

```typescript
interface CustomFieldDefinition {
  id: string; // UUID primary key
  name: string; // Field name (e.g., "industry")
  label: string; // Display label
  entityType: string; // Target entity type
  fieldType: "text" | "number" | "date" | "enum" | "boolean";
  enumValues: string[] | null; // For enum type
  required: boolean;
  createdAt: Date;
  createdBy: string;
}
```

#### AuditLog

```typescript
interface AuditLog {
  id: string; // UUID primary key
  entityType: string; // Type of entity
  entityId: string; // ID of entity
  action: "create" | "update" | "delete";
  userId: string; // Who performed the action
  changes: Record<string, any> | null; // JSON of what changed
  timestamp: Date;
}
```

### Repository Interfaces

```typescript
interface Repository<T> {
  create(
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>, pagination?: Pagination): Promise<T[]>;
  update(id: string, data: Partial<T>, userId: string): Promise<T>;
  delete(id: string, userId: string): Promise<void>;
}

interface Pagination {
  limit: number;
  offset: number;
}
```

### Service Layer Interfaces

Services encapsulate business logic and validation:

```typescript
interface ContactService {
  createContact(data: CreateContactInput, userId: string): Promise<Contact>;
  getContact(id: string): Promise<Contact>;
  updateContact(
    id: string,
    data: UpdateContactInput,
    userId: string
  ): Promise<Contact>;
  deleteContact(id: string, userId: string): Promise<void>;
  getContactsByCompany(companyId: string): Promise<Contact[]>;
}
```

Similar interfaces exist for CompanyService, DealService, TaskService, and NoteService.

## Data Models

### Database Schema

#### contacts table

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  emails TEXT[] NOT NULL DEFAULT '{}',
  phones TEXT[] NOT NULL DEFAULT '{}',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_emails ON contacts USING GIN(emails);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
```

#### companies table

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address JSONB,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_created_at ON companies(created_at);
```

#### deals table

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  value DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  stage VARCHAR(100) NOT NULL,
  probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
  close_date DATE,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_close_date ON deals(close_date);
```

#### tasks table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  due_date DATE,
  assigned_to VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

#### notes table

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);
```

#### custom_field_definitions table

```sql
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'enum', 'boolean')),
  enum_values TEXT[],
  required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  UNIQUE(entity_type, name)
);

CREATE INDEX idx_custom_fields_entity_type ON custom_field_definitions(entity_type);
```

#### audit_logs table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  user_id VARCHAR(255) NOT NULL,
  changes JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### Relationships

- Contact → Company (many-to-one, optional)
- Deal → Company (many-to-one, required)
- Deal → Contact (many-to-one, optional)
- Task → Entity (polymorphic via entity_type + entity_id)
- Note → Entity (polymorphic via entity_type + entity_id)
- CustomFieldDefinition → Entity Type (one-to-many via entity_type)

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Contact creation persistence

_For any_ valid contact data (first name, last name, emails, phones), creating a contact should result in a stored entity with all provided fields retrievable and a generated ID.
**Validates: Requirements 1.1**

### Property 2: Contact-Company relationship integrity

_For any_ company and set of contacts, associating contacts with that company should allow retrieval of all those contacts when querying by company ID.
**Validates: Requirements 1.2**

### Property 3: Contact update timestamp tracking

_For any_ existing contact, updating any field should result in the updated_at timestamp being later than the original timestamp and all other fields remaining consistent.
**Validates: Requirements 1.3**

### Property 4: Contact deletion cleanup

_For any_ contact with relationships, deleting the contact should result in the contact no longer being retrievable and dependent relationships being updated appropriately.
**Vates: Requirements 1.4**

### Property 5: Company creation persistence

_For any_ valid company data (name, address), creating a company should result in a stored entity with all provided fields retrievable and a generated ID.
**Validates: Requirements 2.1**

### Property 6: Company multi-contact relationships

_For any_ company and multiple contacts, associating all contacts with that company should allow retrieval of the complete contact list when querying by company ID.
**Validates: Requirements 2.2**

### Property 7: Company update timestamp tracking

_For any_ existing company, updating any field should result in the updated_at timestamp being later than the original timestamp and all other fields remaining consistent.
**Validates: Requirements 2.3**

### Property 8: Company cascade deletion

_For any_ company with dependent contacts and deals, deleting the company should cascade to deals (delete) and set contact company_id to null according to cascade rules.
**Validates: Requirements 2.4**

### Property 9: Deal creation persistence

_For any_ valid deal data (title, company, value, stage, probability, close date), creating a deal should result in a stored entity with all provided fields retrievable and a generated ID.
**Validates: Requirements 3.1**

### Property 10: Deal-Company relationship integrity

_For any_ company and set of deals, associating deals with that company should allow retrieval of all those deals when querying by company ID.
**Validates: Requirements 3.2**

### Property 11: Deal-Contact optional relationship

_For any_ deal, creating it with or without an associated contact should both succeed, and the contact relationship should be retrievable when present and null when absent.
**Validates: Requirements 3.3**

### Property 12: Deal stage update tracking

_For any_ existing deal, updating the stage should result in the updated_at timestamp being later than the original timestamp and the new stage being persisted.
**Validates: Requirements 3.4**

### Property 13: Task creation with polymorphic attachment

_For any_ valid task data and any entity (contact, company, deal), creating a task attached to that entity should result in a stored task retrievable by entity type and ID.
**Validates: Requirements 4.1**

### Property 14: Note creation with polymorphic attachment

_For any_ valid note content and any entity (contact, company, deal), creating a note attached to that entity should result in a stored note retrievable by entity type and ID.
**Validates: Requirements 4.2**

### Property 15: Polymorphic relationship integrity

_For any_ entity and set of tasks/notes, attaching them to that entity should allow retrieval of all tasks/notes when querying by entity type and ID.
**Validates: Requirements 4.3**

### Property 16: Entity retrieval includes attachments

_For any_ entity with associated tasks and notes, retrieving the entity should include all attached tasks and notes in the response.
**Validates: Requirements 4.4**

### Property 17: Task status update tracking

_For any_ existing task, updating the status should result in the updated_at timestamp being later than the original timestamp and the new status being persisted.
**Validates: Requirements 4.5**

### Property 18: Custom field definition persistence

_For any_ valid custom field definition (name, type, entity type), creating the definition should result in a stored definition retrievable by entity type.
**Validates: Requirements 5.1**

### Property 19: Custom field type validation

_For any_ custom field of a specific type (text, number, date, enum, boolean), setting a value should succeed for valid types and fail for invalid types with appropriate error messages.
**Validates: Requirements 5.2**

### Property 20: Custom field value persistence

_For any_ entity and custom field definition, setting a valid custom field value should result in the value being stored and retrievable with the entity.
**Validates: Requirements 5.3**

### Property 21: Custom field retrieval completeness

_For any_ entity with custom field values, retrieving the entity should include all custom field values in the customFields object.
**Validates: Requirements 5.4**

### Property 22: Custom field definition deletion cascade

_For any_ custom field definition with values set on entities, deleting the definition should result in all associated values being removed from entities.
**Validates: Requirements 5.5**

### Property 23: Invalid data rejection

_For any_ entity type and invalid data (wrong types, malformed values), attempting to create or update should fail with a descriptive error message indicating the validation failure.
**Validates: Requirements 6.1**

### Property 24: Required field validation

_For any_ entity type, attempting to create an entity without required fields should fail with a validation error specifying which fields are missing.
**Validates: Requirements 6.2**

### Property 25: Constraint violation error handling

_For any_ database constraint (foreign key, check constraint), violating it should result in a graceful error with appropriate error information rather than an unhandled exception.
**Validates: Requirements 6.4**

### Property 26: Referential integrity on deletion

_For any_ entity with dependent relationships, deleting the entity should enforce referential integrity according to cascade rules (CASCADE, SET NULL, or RESTRICT).
**Validates: Requirements 6.5**

### Property 27: Audit log creation tracking

_For any_ entity creation, an audit log entry should be created with the correct user ID, entity type, entity ID, action='create', and timestamp.
**Validates: Requirements 7.1**

### Property 28: Audit log update tracking

_For any_ entity update, an audit log entry should be created with the correct user ID, entity type, entity ID, action='update', changes, and timestamp.
**Validates: Requirements 7.2**

### Property 29: Audit log deletion tracking

_For any_ entity deletion, an audit log entry should be created with the correct user ID, entity type, entity ID, action='delete', and timestamp.
**Validates: Requirements 7.3**

### Property 30: Audit log query completeness

_For any_ entity or user, querying audit logs should return all recorded actions for that entity or user in chronological order.
**Validates: Requirements 7.4**

### Property 31: Repository create returns entity with ID

_For any_ valid entity data, calling repository.create() should return the created entity with a generated UUID identifier.
**Validates: Requirements 9.1**

### Property 32: Repository read retrieves by ID

_For any_ created entity, calling repository.findById() with that entity's ID should return the same entity with all fields intact.
**Validates: Requirements 9.2**

### Property 33: Repository update returns updated entity

_For any_ existing entity and valid update data, calling repository.update() should return the updated entity with modified fields and unchanged ID.
**Validates: Requirements 9.3**

### Property 34: Repository delete removes entity

_For any_ existing entity, calling repository.delete() should result in subsequent findById() calls returning null.
**Validates: Requirements 9.4**

### Property 35: Repository error handling

_For any_ repository operation that fails (database error, constraint violation), the operation should throw a typed error with descriptive information about the failure.
**Validates: Requirements 9.5**

### Property 36: Input validation against schemas

_For any_ data received from external sources, validating it against the defined schema should reject invalid data and accept valid data.
**Validates: Requirements 10.2**

### Property 37: Validation error structure

_For any_ validation failure, the error should contain structured information indicating which specific fields failed validation and why.
**Validates: Requirements 10.3**

### Property 38: Serialization type consistency

_For any_ entity, serializing to the database and deserializing back should preserve all field values and types correctly.
**Validates: Requirements 10.4**

## Error Handling

### Error Types

The system defines specific error types for different failure scenarios:

```typescript
class ValidationError extends Error {
  constructor(message: string, public fields: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(public entityType: string, public entityId: string) {
    super(`${entityType} with id ${entityId} not found`);
    this.name = "NotFoundError";
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = "DatabaseError";
  }
}

class ConstraintViolationError extends Error {
  constructor(message: string, public constraint: string) {
    super(message);
    this.name = "ConstraintViolationError";
  }
}
```

### Error Handling Strategy

1. **Validation Errors**: Caught at the service layer before database operations, return structured error information
2. **Not Found Errors**: Thrown by repositories when entities don't exist, handled by services
3. **Database Errors**: Caught and wrapped with context, logged for debugging
4. **Constraint Violations**: Detected from database errors, converted to meaningful error messages
5. **Unexpected Errors**: Logged with full stack traces, return generic error to clients

### Transaction Handling

Operations that modify multiple entities use database transactions:

```typescript
async function createDealWithTasks(
  dealData: CreateDealInput,
  tasks: CreateTaskInput[],
  userId: string
): Promise<Deal> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deal = await dealRepository.create(dealData, userId, client);

    for (const taskData of tasks) {
      await taskRepository.create(
        {
          ...taskData,
          entityType: "deal",
          entityId: deal.id,
        },
        userId,
        client
      );
    }

    await client.query("COMMIT");
    return deal;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests verify individual components in isolation:

- **Repository tests**: Test CRUD operations, error handling, query building
- **Service tests**: Test business logic, validation, error handling
- **Validation tests**: Test schema validation for all entity types
- **Custom field tests**: Test custom field definition and value handling

Example unit test structure:

```typescript
describe("ContactRepository", () => {
  it("should create a contact with all fields", async () => {
    const contactData = {
      firstName: "John",
      lastName: "Doe",
      emails: ["john@example.com"],
      phones: ["+1234567890"],
      companyId: null,
      customFields: {},
    };

    const contact = await contactRepository.create(contactData, "user-123");

    expect(contact.id).toBeDefined();
    expect(contact.firstName).toBe("John");
    expect(contact.lastName).toBe("Doe");
    expect(contact.createdBy).toBe("user-123");
  });
});
```

### Property-Based Testing

Property-based tests verify universal properties across many randomly generated inputs using **fast-check** library. Each test runs a minimum of 100 iterations.

Each property-based test MUST:

- Run at least 100 iterations
- Be tagged with a comment referencing the design document property
- Use the format: `// Feature: core-data-models, Property {number}: {property_text}`

Example property test structure:

```typescript
import fc from "fast-check";

// Feature: core-data-models, Property 1: Contact creation persistence
it("should persist all contact fields for any valid contact data", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        firstName: fc.string({ minLength: 1, maxLength: 255 }),
        lastName: fc.string({ minLength: 1, maxLength: 255 }),
        emails: fc.array(fc.emailAddress(), { minLength: 0, maxLength: 5 }),
        phones: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
        companyId: fc.option(fc.uuid(), { nil: null }),
        customFields: fc.dictionary(fc.string(), fc.anything()),
      }),
      async (contactData) => {
        const contact = await contactRepository.create(contactData, "user-123");
        const retrieved = await contactRepository.findById(contact.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.firstName).toBe(contactData.firstName);
        expect(retrieved!.lastName).toBe(contactData.lastName);
        expect(retrieved!.emails).toEqual(contactData.emails);
        expect(retrieved!.phones).toEqual(contactData.phones);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests verify interactions between components:

- Database connection and query execution
- Repository operations with real database
- Service layer with repository layer
- Transaction handling and rollback
- Cascade deletion behavior

### Test Database Setup

Tests use a separate test database with:

- Schema migrations applied before tests
- Data cleanup between tests
- Transaction rollback for test isolation
- Seeded test data for consistent scenarios

## Performance Considerations

### Indexing Strategy

- Primary keys: UUID with default index
- Foreign keys: Indexed for join performance
- Common query fields: Indexed (emails, company name, deal stage, task status)
- Timestamps: Indexed for sorting and filtering
- JSONB fields: GIN indexes for custom fields when needed

### Query Optimization

- Use connection pooling to reduce connection overhead
- Batch operations when creating/updating multiple entities
- Eager loading for common relationships (e.g., company with contacts)
- Pagination for large result sets
- Prepared statements for repeated queries

### Caching Strategy (Future)

While not implemented in MVP, the architecture supports:

- Redis caching for frequently accessed entities
- Cache invalidation on updates
- Query result caching with TTL

## Deployment Considerations

### Database Migrations

- Use a migration tool (e.g., node-pg-migrate)
- Version-controlled migration files
- Up and down migrations for rollback capability
- Automated migration on deployment

### Environment Configuration

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}
```

Configuration loaded from environment variables with validation.

### Docker Setup

```dockerfile
# Database service
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: crm
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

### Backup Strategy

- Automated daily PostgreSQL dumps
- Point-in-time recovery capability
- Backup retention policy (30 days)
- Backup verification and restore testing

## Security Considerations

### Data Access Control

- All repository operations require userId parameter
- Audit logging tracks all data modifications
- Future: Row-level security policies in PostgreSQL

### Input Sanitization

- All inputs validated against Zod schemas
- SQL injection prevention through parameterized queries
- XSS prevention through output encoding (API layer)

### Sensitive Data

- No passwords stored in core data models (handled by auth system)
- Audit logs may contain sensitive data - access restricted
- Custom fields may contain sensitive data - encryption consideration for future

## Future Enhancements

### Soft Deletion

Add `deleted_at` timestamp to enable soft deletion:

- Entities marked as deleted rather than removed
- Filtered from normal queries
- Recoverable by administrators
- Permanent deletion after retention period

### Field-Level Audit History

Track individual field changes:

- Store before/after values for each field
- Enable field-level history viewing
- Support rollback to previous values

### Full-Text Search

Add full-text search capabilities:

- PostgreSQL full-text search on text fields
- Search across multiple entity types
- Relevance ranking
- Search result highlighting

### Optimistic Locking

Prevent concurrent update conflicts:

- Add version field to entities
- Check version on update
- Throw conflict error if version mismatch
- Client retry with latest version
