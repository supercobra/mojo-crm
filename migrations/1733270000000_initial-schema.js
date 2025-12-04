/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Create companies table first (no dependencies)
    pgm.createTable('companies', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        name: {
            type: 'varchar(255)',
            notNull: true
        },
        address: {
            type: 'jsonb',
            default: null
        },
        custom_fields: {
            type: 'jsonb',
            default: pgm.func("'{}'::jsonb")
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        },
        updated_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.createIndex('companies', 'name');
    pgm.createIndex('companies', 'created_at');

    // Create contacts table (depends on companies)
    pgm.createTable('contacts', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        first_name: {
            type: 'varchar(255)',
            notNull: true
        },
        last_name: {
            type: 'varchar(255)',
            notNull: true
        },
        emails: {
            type: 'text[]',
            notNull: true,
            default: pgm.func("'{}'::text[]")
        },
        phones: {
            type: 'text[]',
            notNull: true,
            default: pgm.func("'{}'::text[]")
        },
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'SET NULL',
            default: null
        },
        custom_fields: {
            type: 'jsonb',
            default: pgm.func("'{}'::jsonb")
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        },
        updated_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.createIndex('contacts', 'company_id');
    pgm.createIndex('contacts', 'emails', { method: 'gin' });
    pgm.createIndex('contacts', 'created_at');

    // Create deals table (depends on companies and contacts)
    pgm.createTable('deals', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        title: {
            type: 'varchar(255)',
            notNull: true
        },
        company_id: {
            type: 'uuid',
            notNull: true,
            references: 'companies(id)',
            onDelete: 'CASCADE'
        },
        contact_id: {
            type: 'uuid',
            references: 'contacts(id)',
            onDelete: 'SET NULL',
            default: null
        },
        value: {
            type: 'decimal(15, 2)',
            notNull: true
        },
        currency: {
            type: 'varchar(3)',
            notNull: true,
            default: 'USD'
        },
        stage: {
            type: 'varchar(100)',
            notNull: true
        },
        probability: {
            type: 'integer',
            notNull: true,
            check: 'probability >= 0 AND probability <= 100'
        },
        close_date: {
            type: 'date',
            default: null
        },
        custom_fields: {
            type: 'jsonb',
            default: pgm.func("'{}'::jsonb")
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        },
        updated_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.createIndex('deals', 'company_id');
    pgm.createIndex('deals', 'contact_id');
    pgm.createIndex('deals', 'stage');
    pgm.createIndex('deals', 'close_date');

    // Create tasks table (polymorphic)
    pgm.createTable('tasks', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        description: {
            type: 'text',
            notNull: true
        },
        due_date: {
            type: 'date',
            default: null
        },
        assigned_to: {
            type: 'varchar(255)',
            default: null
        },
        status: {
            type: 'varchar(20)',
            notNull: true,
            check: "status IN ('open', 'closed')"
        },
        entity_type: {
            type: 'varchar(50)',
            notNull: true
        },
        entity_id: {
            type: 'uuid',
            notNull: true
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        },
        updated_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.createIndex('tasks', ['entity_type', 'entity_id']);
    pgm.createIndex('tasks', 'assigned_to');
    pgm.createIndex('tasks', 'due_date');
    pgm.createIndex('tasks', 'status');

    // Create notes table (polymorphic)
    pgm.createTable('notes', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        content: {
            type: 'text',
            notNull: true
        },
        entity_type: {
            type: 'varchar(50)',
            notNull: true
        },
        entity_id: {
            type: 'uuid',
            notNull: true
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        },
        updated_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.createIndex('notes', ['entity_type', 'entity_id']);
    pgm.createIndex('notes', 'created_at');

    // Create custom_field_definitions table
    pgm.createTable('custom_field_definitions', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        name: {
            type: 'varchar(100)',
            notNull: true
        },
        label: {
            type: 'varchar(255)',
            notNull: true
        },
        entity_type: {
            type: 'varchar(50)',
            notNull: true
        },
        field_type: {
            type: 'varchar(20)',
            notNull: true,
            check: "field_type IN ('text', 'number', 'date', 'enum', 'boolean')"
        },
        enum_values: {
            type: 'text[]',
            default: null
        },
        required: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        },
        created_by: {
            type: 'varchar(255)',
            notNull: true
        }
    });

    pgm.addConstraint('custom_field_definitions', 'unique_entity_field_name', {
        unique: ['entity_type', 'name']
    });
    pgm.createIndex('custom_field_definitions', 'entity_type');

    // Create audit_logs table
    pgm.createTable('audit_logs', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        entity_type: {
            type: 'varchar(50)',
            notNull: true
        },
        entity_id: {
            type: 'uuid',
            notNull: true
        },
        action: {
            type: 'varchar(20)',
            notNull: true,
            check: "action IN ('create', 'update', 'delete')"
        },
        user_id: {
            type: 'varchar(255)',
            notNull: true
        },
        changes: {
            type: 'jsonb',
            default: null
        },
        timestamp: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()')
        }
    });

    pgm.createIndex('audit_logs', ['entity_type', 'entity_id']);
    pgm.createIndex('audit_logs', 'user_id');
    pgm.createIndex('audit_logs', 'timestamp');
};

exports.down = (pgm) => {
    pgm.dropTable('audit_logs');
    pgm.dropTable('custom_field_definitions');
    pgm.dropTable('notes');
    pgm.dropTable('tasks');
    pgm.dropTable('deals');
    pgm.dropTable('contacts');
    pgm.dropTable('companies');
};
