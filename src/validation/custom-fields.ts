import { CustomFieldDefinition, CustomFieldType } from '../models/entities';
import { ValidationError } from '../errors';

export function validateCustomFieldValue(
    definition: CustomFieldDefinition,
    value: any
): { valid: boolean; error?: string } {
    if (value === null || value === undefined) {
        if (definition.required) {
            return { valid: false, error: `Field '${definition.label}' is required` };
        }
        return { valid: true };
    }

    switch (definition.fieldType) {
        case 'text':
            if (typeof value !== 'string') {
                return { valid: false, error: `Field '${definition.label}' must be a string` };
            }
            return { valid: true };

        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                return { valid: false, error: `Field '${definition.label}' must be a number` };
            }
            return { valid: true };

        case 'date':
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, error: `Field '${definition.label}' must be a valid date` };
            }
            return { valid: true };

        case 'boolean':
            if (typeof value !== 'boolean') {
                return { valid: false, error: `Field '${definition.label}' must be a boolean` };
            }
            return { valid: true };

        case 'enum':
            if (!definition.enumValues || !definition.enumValues.includes(value)) {
                return {
                    valid: false,
                    error: `Field '${definition.label}' must be one of: ${definition.enumValues?.join(', ')}`
                };
            }
            return { valid: true };

        default:
            return { valid: false, error: `Unknown field type: ${definition.fieldType}` };
    }
}

export function validateCustomFields(
    definitions: CustomFieldDefinition[],
    customFields: Record<string, any>
): void {
    const errors: Record<string, string[]> = {};

    // Validate each provided custom field
    for (const [fieldName, value] of Object.entries(customFields)) {
        const definition = definitions.find(d => d.name === fieldName);

        if (!definition) {
            if (!errors[fieldName]) {
                errors[fieldName] = [];
            }
            errors[fieldName].push(`Unknown custom field: ${fieldName}`);
            continue;
        }

        const validation = validateCustomFieldValue(definition, value);
        if (!validation.valid) {
            if (!errors[fieldName]) {
                errors[fieldName] = [];
            }
            errors[fieldName].push(validation.error!);
        }
    }

    // Check for required fields that are missing
    for (const definition of definitions) {
        if (definition.required && !(definition.name in customFields)) {
            if (!errors[definition.name]) {
                errors[definition.name] = [];
            }
            errors[definition.name].push(`Required field '${definition.label}' is missing`);
        }
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Custom field validation failed', errors);
    }
}

export function cleanCustomFieldValue(fieldType: CustomFieldType, value: any): any {
    if (value === null || value === undefined) {
        return null;
    }

    switch (fieldType) {
        case 'text':
            return String(value);
        case 'number':
            return Number(value);
        case 'date':
            return new Date(value).toISOString();
        case 'boolean':
            return Boolean(value);
        case 'enum':
            return String(value);
        default:
            return value;
    }
}
