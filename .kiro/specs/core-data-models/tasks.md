# Implementation Plan

- [x] 1. Set up project structure and database foundation

  - Initialize TypeScript Node.js project with proper tsconfig
  - Set up PostgreSQL connection with pg library and connection pooling
  - Create database configuration module with environment variable support
  - Set up migration framework (node-pg-migrate)
  - Create initial database schema migration for all core tables
  - _Requirements: 8.1, 8.4, 8.5_

- [ ]\* 1.1 Set up testing infrastructure

  - Configure Jest for unit and integration tests
  - Configure fast-check for property-based testing
  - Set up test database with cleanup utilities
  - Create test helpers for database seeding and teardown
  - _Requirements: 10.1_

- [x] 2. Implement core entity types and validation schemas

  - Define TypeScript interfaces for all entities (Contact, Company, Deal, Task, Note, CustomFieldDefinition, AuditLog)
  - Create Zod validation schemas for all entity types
  - Implement validation functions with structured error responses
  - Create error classes (ValidationError, NotFoundError, DatabaseError, ConstraintViolationError)
  - _Requirements: 10.1, 10.2, 10.3, 6.1, 6.2_

- [ ]\* 2.1 Write property test for input validation

  - **Property 36: Input validation against schemas**
  - **Validates: Requirements 10.2**

- [ ]\* 2.2 Write property test for validation error structure

  - **Property 37: Validation error structure**
  - **Validates: Requirements 10.3**

- [ ]\* 2.3 Write property test for invalid data rejection

  - **Property 23: Invalid data rejection**
  - **Validates: Requirements 6.1**

- [ ]\* 2.4 Write property test for required field validation

  - **Property 24: Required field validation**
  - **Validates: Requirements 6.2**

- [x] 3. Implement Contact repository

  - Create ContactRepository class with CRUD methods
  - Implement create() with UUID generation and timestamp handling
  - Implement findById() with proper error handling
  - Implement findAll() with filtering and pagination support
  - Implement update() with ttamp tracking
  - Implement delete() with relationship cleanup
  - Implement findByCompany() for company-contact relationships
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 9.3, 9.4_

- [ ]\* 3.1 Write property test for contact creation persistence

  - **Property 1: Contact creation persistence**
  - **Validates: Requirements 1.1**

- [ ]\* 3.2 Write property test for contact-company relationship

  - **Property 2: Contact-Company relationship integrity**
  - **Validates: Requirements 1.2**

- [ ]\* 3.3 Write property test for contact update timestamp

  - **Property 3: Contact update timestamp tracking**
  - **Validates: Requirements 1.3**

- [ ]\* 3.4 Write property test for contact deletion

  - **Property 4: Contact deletion cleanup**
  - **Validates: Requirements 1.4**

- [ ]\* 3.5 Write property test for repository create

  - **Property 31: Repository create returns entity with ID**
  - **Validates: Requirements 9.1**

- [ ]\* 3.6 Write property test for repository read

  - **Property 32: Repository read retrieves by ID**
  - **Validates: Requirements 9.2**

- [ ]\* 3.7 Write property test for repository update

  - **Property 33: Repository update returns updated entity**
  - **Validates: Requirements 9.3**

- [ ]\* 3.8 Write property test for repository delete

  - **Property 34: Repository delete removes entity**
  - **Validates: Requirements 9.4**

- [ ]\* 3.9 Write property test for repository error handling

  - **Property 35: Repository error handling**
  - **Validates: Requirements 9.5**

- [x] 4. Implement Company repository

  - Create CompanyRepository class with CRUD methods
  - Implement create() with UUID generation and timestamp handling
  - Implement findById() with proper error handling
  - Implement findAll() with filtering and pagination support
  - Implement update() with timestamp tracking
  - Implement delete() with cascade handling for contacts and deals
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4_

- [ ]\* 4.1 Write property test for company creation persistence

  - **Property 5: Company creation persistence**
  - **Validates: Requirements 2.1**

- [ ]\* 4.2 Write property test for company multi-contact relationships

  - **Property 6: Company multi-contact relationships**
  - **Validates: Requirements 2.2**

- [ ]\* 4.3 Write property test for company update timestamp

  - **Property 7: Company update timestamp tracking**
  - **Validates: Requirements 2.3**

- [ ]\* 4.4 Write property test for company cascade deletion

  - **Property 8: Company cascade deletion**
  - **Validates: Requirements 2.4**

- [ ]\* 4.5 Write property test for referential integrity

  - **Property 26: Referential integrity on deletion**
  - **Validates: Requirements 6.5**

- [x] 5. Implement Deal repository

  - Create DealRepository class with CRUD methods
  - Implement create() with company and optional contact relationships
  - Implement findById() with relationship loading
  - Implement findAll() with filtering by stage, company, date ranges
  - Implement update() with stage change tracking
  - Implement delete() with proper cleanup
  - Implement findByCompany() for company-deal relationships
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1, 9.2, 9.3, 9.4_

- [ ]\* 5.1 Write property test for deal creation persistence

  - **Property 9: Deal creation persistence**
  - **Validates: Requirements 3.1**

- [ ]\* 5.2 Write property test for deal-company relationship

  - **Property 10: Deal-Company relationship integrity**
  - **Validates: Requirements 3.2**

- [ ]\* 5.3 Write property test for deal-contact optional relationship

  - **Property 11: Deal-Contact optional relationship**
  - **Validates: Requirements 3.3**

- [ ]\* 5.4 Write property test for deal stage update

  - **Property 12: Deal stage update tracking**
  - **Validates: Requirements 3.4**

- [x] 6. Implement Task and Note repositories

  - Create TaskRepository class with polymorphic entity attachment
  - Create NoteRepository class with polymorphic entity attachment
  - Implement create() for both with entity_type and entity_id handling
  - Implement findByEntity() to retrieve all tasks/notes for an entity
  - Implement update() for task status changes with timestamp tracking
  - Implement delete() for both repositories
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 6.1 Write property test for task creation with polymorphic attachment

  - **Property 13: Task creation with polymorphic attachment**
  - **Validates: Requirements 4.1**

- [ ]\* 6.2 Write property test for note creation with polymorphic attachment

  - **Property 14: Note creation with polymorphic attachment**
  - **Validates: Requirements 4.2**

- [ ]\* 6.3 Write property test for polymorphic relationship integrity

  - **Property 15: Polymorphic relationship integrity**
  - **Validates: Requirements 4.3**

- [ ]\* 6.4 Write property test for entity retrieval includes attachments

  - **Property 16: Entity retrieval includes attachments**
  - **Validates: Requirements 4.4**

- [ ]\* 6.5 Write property test for task status update

  - **Property 17: Task status update tracking**
  - **Validates: Requirements 4.5**

- [x] 7. Implement custom fields system

  - Create CustomFieldDefinitionRepository for field definitions
  - Implement create() for custom field definitions with uniqueness constraints
  - Implement validation logic for custom field types (text, number, date, enum, boolean)
  - Add custom field value handling in entity repositories (JSONB storage)
  - Implement custom field value validation based on field type
  - Implement delete() with cascade removal of all field values
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 7.1 Write property test for custom field definition persistence

  - **Property 18: Custom field definition persistence**
  - **Validates: Requirements 5.1**

- [ ]\* 7.2 Write property test for custom field type validation

  - **Property 19: Custom field type validation**
  - **Validates: Requirements 5.2**

- [ ]\* 7.3 Write property test for custom field value persistence

  - **Property 20: Custom field value persistence**
  - **Validates: Requirements 5.3**

- [ ]\* 7.4 Write property test for custom field retrieval

  - **Property 21: Custom field retrieval completeness**
  - **Validates: Requirements 5.4**

- [ ]\* 7.5 Write property test for custom field deletion cascade

  - **Property 22: Custom field definition deletion cascade**
  - **Validates: Requirements 5.5**

- [x] 8. Implement audit logging system

  - Create AuditLogRepository with immutable insert-only operations
  - Implement createAuditLog() for create, update, delete actions
  - Integrate audit logging into all entity repositories
  - Implement findByEntity() to query logs by entity type and ID
  - Implement findByUser() to query logs by user ID
  - Add change tracking for update operations (store before/after values)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]\* 8.1 Write property test for audit log creation tracking

  - **Property 27: Audit log creation tracking**
  - **Validates: Requirements 7.1**

- [ ]\* 8.2 Write property test for audit log update tracking

  - **Property 28: Audit log update tracking**
  - **Validates: Requirements 7.2**

- [ ]\* 8.3 Write property test for audit log deletion tracking

  - **Property 29: Audit log deletion tracking**
  - **Validates: Requirements 7.3**

- [ ]\* 8.4 Write property test for audit log query completeness

  - **Property 30: Audit log query completeness**
  - **Validates: Requirements 7.4**

- [x] 9. Implement error handling and constraint violations

  - Add database error detection and wrapping in all repositories
  - Implement constraint violation detection (foreign key, unique, check)
  - Convert database errors to typed application errors
  - Add error logging with context information
  - Implement graceful error responses with descriptive messages
  - _Requirements: 6.4, 9.5_

- [ ]\* 9.1 Write property test for constraint violation handling

  - **Property 25: Constraint violation error handling**
  - **Validates: Requirements 6.4**

- [x] 10. Implement transaction support

  - Add transaction support to repository methods (accept optional client parameter)
  - Create transaction helper utilities (begin, commit, rollback)
  - Implement multi-entity operations with transaction support
  - Add transaction error handling and rollback logic
  - _Requirements: 6.5_

- [ ]\* 10.1 Write property test for serialization consistency

  - **Property 38: Serialization type consistency**
  - **Validates: Requirements 10.4**

- [x] 11. Create service layer

  - Create ContactService with business logic and validation
  - Create CompanyService with business logic and validation
  - Create DealService with business logic and validation
  - Create TaskService and NoteService with business logic
  - Create CustomFieldService for field definition management
  - Integrate validation, repositories, and audit logging in services
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 11.1 Write integration tests for service layer

  - Test service methods with real database
  - Test validation integration
  - Test audit logging integration
  - Test transaction handling
  - _Requirements: All_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
