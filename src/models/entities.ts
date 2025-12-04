// Core entity interfaces

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    emails: string[];
    phones: string[];
    companyId: string | null;
    customFields: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface Company {
    id: string;
    name: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    customFields: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface Deal {
    id: string;
    title: string;
    companyId: string;
    contactId: string | null;
    value: number;
    currency: string;
    stage: string;
    probability: number;
    closeDate: Date | null;
    customFields: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface Task {
    id: string;
    description: string;
    dueDate: Date | null;
    assignedTo: string | null;
    status: 'open' | 'closed';
    entityType: string;
    entityId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface Note {
    id: string;
    content: string;
    entityType: string;
    entityId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'enum' | 'boolean';

export interface CustomFieldDefinition {
    id: string;
    name: string;
    label: string;
    entityType: string;
    fieldType: CustomFieldType;
    enumValues: string[] | null;
    required: boolean;
    createdAt: Date;
    createdBy: string;
}

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    userId: string;
    changes: Record<string, any> | null;
    timestamp: Date;
}

// Input types for creating entities (omit generated fields)
export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateContactInput = Partial<CreateContactInput>;

export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export type CreateDealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateDealInput = Partial<CreateDealInput>;

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateTaskInput = Partial<CreateTaskInput>;

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateNoteInput = Partial<CreateNoteInput>;

export type CreateCustomFieldDefinitionInput = Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'createdBy'>;

export interface Pagination {
    limit: number;
    offset: number;
}
