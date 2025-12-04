# Requirements Document

## Introduction

This specification defines the core data models and foundational architecture for a self-hostable CRM system. The system SHALL provide structured data entities for managing contacts, companies, deals, and tasks/notes, with support for custom fields and relationships. The foundation SHALL enable a PostgreSQL-backed system with TypeScript type safety, supporting both REST and GraphQL APIs for future integration needs.

## Glossary

- **CRM System**: The customer relationship management application being developed
- **Contact**: A person entity representing an individual in the CRM
- **Company**: An organization entity representing a business or group
- **Deal**: An opportunity or sales pipeline item associated with a Company
- **Task**: An actionable item with a due date and assigned user
- **Note**: A free-form text entry attached to any entity
- **Custom Field**: A user-defined field that can be added to core entities
- **Entity**: Any core data object (Contact, Company, Deal, Task, Note)
- **Repository**: A data access layer component that handles database operations for an entity
- **Schema**: The PostgreSQL database table structure and constraints
- **Audit Log**: A record of who created, updated, or deleted an entity and when

## Requirements

### Requirement 1: Contact Management

**User Story:** As a sales representative, I want to store and manage contact information for individuals, so that I can track my relationships and communications with people.

#### Acceptance Criteria

1. WHEN a user creates a Contact THEN the CRM System SHALL store first name, last name, email addresses, phone numbers, and creation timestamp
2. WHEN a user associates a Contact with a Company THEN the CRM System SHALL maintain the relationship and allow retrieval of all Contacts for that Company
3. WHEN a user updates a Contact THEN the CRM System SHALL record the modification timestamp and preserve data integrity
4. WHEN a user deletes a Contact THEN the CRM System SHALL remove the Contact and update any dependent relationships
5. WHEN a user retrieves a Contact THEN the CRM System SHALL return the Contact with all associated data within 200 milliseconds

### Requirement 2: Company Management

**User Story:** As a sales representative, I want to manage company information, so that I can organize contacts by their organizations and track business relationships.

#### Acceptance Criteria

1. WHEN a user creates a Company THEN the CRM System SHALL store company name, address, and creation timestamp
2. WHEN a user associates multiple Contacts with a Company THEN the CRM System SHALL maintain all relationships and allow retrieval of the contact list
3. WHEN a user updates a Company THEN the CRM System SHALL record the modification timestamp and preserve data integrity
4. WHEN a user deletes a Company THEN the CRM System SHALL handle dependent Contacts and Deals according to cascade rules
5. WHEN a user retrieves a Company with its Contacts THEN the CRM System SHALL return complete data within 200 milliseconds

### Requirement 3: Deal Management

**User Story:** As a sales representative, I want to track sales opportunities and deals, so that I can manage my pipeline and forecast revenue.

#### Acceptance Criteria

1. WHEN a user creates a Deal THEN the CRM System SHALL store title, associated Company, value, stage, probability, close date, and creation timestamp
2. WHEN a user associates a Deal with a Company THEN the CRM System SHALL maintain the relationship and allow retrieval of all Deals for that Company
3. WHEN a user optionally associates a Deal with a Contact THEN the CRM System SHALL maintain the relationship
4. WHEN a user updates a Deal stage THEN the CRM System SHALL record the stage change with timestamp
5. WHEN a user retrieves Deals for a Company THEN the CRM System SHALL return all associated Deals within 200 milliseconds

### Requirement 4: Task and Note Management

**User Story:** As a user, I want to attach tasks and notes to any entity, so that I can track action items and record important information.

#### Acceptance Criteria

1. WHEN a user creates a Task THEN the CRM System SHALL store description, due date, assigned user, status, and the entity it is attached to
2. WHEN a user creates a Note THEN the CRM System SHALL store free-form text content and the entity it is attached to
3. WHEN a user attaches a Task or Note to any entity THEN the CRM System SHALL maintain the polymorphic relationship
4. WHEN a user retrieves an entity THEN the CRM System SHALL include all associated Tasks and Notes
5. WHEN a user updates a Task status THEN the CRM System SHALL record the status change with timestamp

### Requirement 5: Custom Field Support

**User Story:** As an administrator, I want to define custom fields for core entities, so that I can adapt the CRM to my specific business needs.

#### Acceptance Criteria

1. WHEN an administrator defines a custom field THEN the CRM System SHALL store the field definition with name, type, and target entity
2. WHEN a custom field type is text, number, date, enum, or boolean THEN the CRM System SHALL validate values according to the type
3. WHEN a user sets a custom field value on an entity THEN the CRM System SHALL store the value with proper type validation
4. WHEN a user retrieves an entity with custom fields THEN the CRM System SHALL return all custom field values
5. WHEN an administrator deletes a custom field definition THEN the CRM System SHALL remove all associated values

### Requirement 6: Data Validation and Integrity

**User Story:** As a system administrator, I want data validation and integrity constraints, so that the database maintains consistent and valid data.

#### Acceptance Criteria

1. WHEN a user provides invalid data for an entity THEN the CRM System SHALL reject the operation and return a descriptive error message
2. WHEN a required field is missing THEN the CRM System SHALL prevent entity creation and return a validation error
3. WHEN a user attempts to create duplicate email addresses for Contacts THEN the CRM System SHALL allow it but provide a warning mechanism
4. WHEN database constraints are violated THEN the CRM System SHALL handle the error gracefully and return appropriate error information
5. WHEN a user deletes an entity with dependent relationships THEN the CRM System SHALL enforce referential integrity according to cascade rules

### Requirement 7: Audit Logging

**User Story:** As a system administrator, I want to track who creates, updates, and deletes entities, so that I can maintain accountability and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a user creates an entity THEN the CRM System SHALL record the user identifier and creation timestamp
2. WHEN a user updates an entity THEN the CRM System SHALL record the user identifier and modification timestamp
3. WHEN a user deletes an entity THEN the CRM System SHALL record the user identifier and deletion timestamp in the audit log
4. WHEN an administrator queries audit logs THEN the CRM System SHALL return all recorded actions for a specified entity or user
5. WHEN audit log entries are created THEN the CRM System SHALL ensure they cannot be modified or deleted

### Requirement 8: Database Schema and Performance

**User Story:** As a developer, I want an efficient database schema with proper indexing, so that the system performs well with thousands of records.

#### Acceptance Criteria

1. WHEN the database schema is created THEN the CRM System SHALL define tables for all core entities with appropriate data types
2. WHEN queries filter or sort by common fields THEN the CRM System SHALL use indexes to optimize performance
3. WHEN the database contains 10,000 Contact records THEN the CRM System SHALL complete CRUD operations within 200 milliseconds
4. WHEN relationships are queried THEN the CRM System SHALL use foreign keys and indexes to maintain performance
5. WHEN the schema is modified THEN the CRM System SHALL support database migrations without data loss

### Requirement 9: Repository Pattern and Data Access

**User Story:** As a developer, I want a clean data access layer using the repository pattern, so that business logic is separated from database operations.

#### Acceptance Criteria

1. WHEN a repository performs a create operation THEN the CRM System SHALL insert the entity and return the created entity with generated identifier
2. WHEN a repository performs a read operation THEN the CRM System SHALL retrieve the entity by identifier or query criteria
3. WHEN a repository performs an update operation THEN the CRM System SHALL modify the entity and return the updated entity
4. WHEN a repository performs a delete operation THEN the CRM System SHALL remove the entity and return confirmation
5. WHEN a repository operation fails THEN the CRM System SHALL throw a typed error with descriptive information

### Requirement 10: Type Safety and Validation

**User Story:** As a developer, I want TypeScript types and runtime validation, so that I can catch errors early and maintain code quality.

#### Acceptance Criteria

1. WHEN entity interfaces are defined THEN the CRM System SHALL provide TypeScript types for all entities and their fields
2. WHEN data is received from external sources THEN the CRM System SHALL validate it against defined schemas before processing
3. WHEN validation fails THEN the CRM System SHALL return structured error information indicating which fields are invalid
4. WHEN entities are serialized THEN the CRM System SHALL ensure type consistency between database and application layers
5. WHEN custom fields are accessed THEN the CRM System SHALL provide type-safe access patterns
