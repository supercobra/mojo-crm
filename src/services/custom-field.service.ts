import { Pool } from 'pg';
import { CustomFieldDefinition, CreateCustomFieldDefinitionInput, Pagination } from '../models/entities';
import { CustomFieldDefinitionRepository } from '../repositories/custom-field-definition.repository';
import { validateData, createCustomFieldDefinitionSchema } from '../validation/schemas';
import { ValidationError } from '../errors';

export class CustomFieldService {
    private customFieldRepository: CustomFieldDefinitionRepository;

    constructor(pool: Pool) {
        this.customFieldRepository = new CustomFieldDefinitionRepository(pool);
    }

    async createCustomFieldDefinition(
        data: CreateCustomFieldDefinitionInput,
        userId: string
    ): Promise<CustomFieldDefinition> {
        const validatedData = validateData(createCustomFieldDefinitionSchema, data) as CreateCustomFieldDefinitionInput;
        return this.customFieldRepository.create(validatedData, userId);
    }

    async getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition> {
        const definition = await this.customFieldRepository.findById(id);

        if (!definition) {
            throw new ValidationError('Custom field definition not found', {
                id: ['Custom field definition does not exist']
            });
        }

        return definition;
    }

    async listCustomFieldDefinitions(
        filters?: Record<string, any>,
        pagination?: Pagination
    ): Promise<CustomFieldDefinition[]> {
        return this.customFieldRepository.findAll(filters, pagination);
    }

    async getCustomFieldDefinitionsByEntityType(entityType: string): Promise<CustomFieldDefinition[]> {
        return this.customFieldRepository.findByEntityType(entityType);
    }

    async updateCustomFieldDefinition(
        id: string,
        data: Partial<CreateCustomFieldDefinitionInput>,
        userId: string
    ): Promise<CustomFieldDefinition> {
        const existingDefinition = await this.customFieldRepository.findById(id);
        if (!existingDefinition) {
            throw new ValidationError('Custom field definition not found', {
                id: ['Custom field definition does not exist']
            });
        }

        return this.customFieldRepository.update(id, data, userId);
    }

    async deleteCustomFieldDefinition(id: string, userId: string): Promise<void> {
        const existingDefinition = await this.customFieldRepository.findById(id);
        if (!existingDefinition) {
            throw new ValidationError('Custom field definition not found', {
                id: ['Custom field definition does not exist']
            });
        }

        await this.customFieldRepository.delete(id, userId);

        // Note: Cleanup of custom field values from entities should be handled here
        // This would involve updating all entities of the target type to remove the field
        // For now, this is left as a future enhancement
    }
}
