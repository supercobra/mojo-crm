import { z } from 'zod';

// Address schema
export const addressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
}).nullable();

// Contact schemas
export const createContactSchema = z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    emails: z.array(z.string().email()).default([]),
    phones: z.array(z.string()).default([]),
    companyId: z.string().uuid().nullable().default(null),
    customFields: z.record(z.any()).default({})
});

export const updateContactSchema = createContactSchema.partial();

// Company schemas
export const createCompanySchema = z.object({
    name: z.string().min(1).max(255),
    address: addressSchema.default(null),
    customFields: z.record(z.any()).default({})
});

export const updateCompanySchema = createCompanySchema.partial();

// Deal schemas
export const createDealSchema = z.object({
    title: z.string().min(1).max(255),
    companyId: z.string().uuid(),
    contactId: z.string().uuid().nullable().default(null),
    value: z.number().nonnegative(),
    currency: z.string().length(3).default('USD'),
    stage: z.string().min(1).max(100),
    probability: z.number().int().min(0).max(100),
    closeDate: z.date().nullable().default(null),
    customFields: z.record(z.any()).default({})
});

export const updateDealSchema = createDealSchema.partial();

// Task schemas
export const createTaskSchema = z.object({
    description: z.string().min(1),
    dueDate: z.date().nullable().default(null),
    assignedTo: z.string().nullable().default(null),
    status: z.enum(['open', 'closed']),
    entityType: z.string().min(1).max(50),
    entityId: z.string().uuid()
});

export const updateTaskSchema = createTaskSchema.partial();

// Note schemas
export const createNoteSchema = z.object({
    content: z.string().min(1),
    entityType: z.string().min(1).max(50),
    entityId: z.string().uuid()
});

export const updateNoteSchema = createNoteSchema.partial();

// Custom field definition schemas
export const customFieldTypeSchema = z.enum(['text', 'number', 'date', 'enum', 'boolean']);

export const createCustomFieldDefinitionSchema = z.object({
    name: z.string().min(1).max(100),
    label: z.string().min(1).max(255),
    entityType: z.string().min(1).max(50),
    fieldType: customFieldTypeSchema,
    enumValues: z.array(z.string()).nullable().default(null),
    required: z.boolean().default(false)
}).refine(
    (data) => {
        // If fieldType is enum, enumValues must be provided
        if (data.fieldType === 'enum') {
            return data.enumValues !== null && data.enumValues.length > 0;
        }
        return true;
    },
    {
        message: 'enumValues must be provided for enum field type',
        path: ['enumValues']
    }
);

// Pagination schema
export const paginationSchema = z.object({
    limit: z.number().int().positive().max(1000).default(50),
    offset: z.number().int().nonnegative().default(0)
});

// Helper function to validate and parse data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

// Helper function to safely validate with error handling
export function safeValidateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(err.message);
    });

    return { success: false, errors };
}
