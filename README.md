# CRM Core Data Models

Core data models and repositories for the CRM system, providing structured entities for Contacts, Companies, Deals, Tasks, and Notes with PostgreSQL persistence.

## Features

- TypeScript type safety throughout
- PostgreSQL with connection pooling
- Repository pattern for data access
- Custom fields support (JSONB)
- Audit logging for all operations
- Zod validation schemas
- Property-based testing with fast-check

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### Option 1: Using Docker (Recommended)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL with Docker Compose:

```bash
docker-compose up -d
```

3. Copy environment configuration:

```bash
cp .env.example .env
```

4. Update `.env` with Docker database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm
DB_USER=crm_user
DB_PASSWORD=crm_password
```

5. Set DATABASE_URL for migrations:

```bash
export DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/crm"
```

6. Run migrations:

```bash
npm run migrate:up
```

### Option 2: Using Local PostgreSQL

1. Install dependencies:

```bash
npm install
```

2. Create PostgreSQL databases:

```bash
createdb crm
createdb crm_test
```

3. Copy and edit `.env`:

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Set DATABASE_URL and run migrations:

```bash
export DATABASE_URL="postgresql://your_user:your_password@localhost:5432/crm"
npm run migrate:up
```

## Development

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Watch mode for tests:

```bash
npm run test:watch
```

## Database Migrations

Create a new migration:

```bash
npm run migrate:create <migration-name>
```

Run migrations:

```bash
npm run migrate:up
```

Rollback migrations:

```bash
npm run migrate:down
```

## Project Structure

```
src/
├── config/          # Database configuration
├── models/          # TypeScript entity interfaces
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── validation/      # Zod schemas
└── errors/          # Custom error classes

migrations/          # Database migrations
```

## Testing

The project uses Jest for unit tests and fast-check for property-based testing. Property tests verify universal properties across randomly generated inputs.

Run all tests:

```bash
npm test
```

## License

MIT
